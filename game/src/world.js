// SHADOW VAULT — the simulation: movement and collision, guard patrols,
// vision cones with line of sight, noise, detection and alarm, intel
// pickups, cameras, and the win / caught rules. Pure logic, no drawing.

import { CAMERA, DETECT, FIELD, GUARD, PLAYER, SCORE, STEP } from './config.js';
import { LEVELS } from './levels.js';
import { createRandom } from './random.js';

export const EVENT_PICKUP = 1;
export const EVENT_ALARM = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_LEVEL = 8;
export const EVENT_WIN = 16;
export const EVENT_SPOTTED = 32;

const TAU = Math.PI * 2;

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return d;
}

function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function circleHitsRect(x, y, radius, r) {
  const cx = clamp(x, r.x, r.x + r.w);
  const cy = clamp(y, r.y, r.y + r.h);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < radius * radius;
}

/** True when a wall or crate stands between the two points. */
export function sightBlocked(x1, y1, x2, y2, solids) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 7));
  for (let i = 1; i < steps; i += 1) {
    const x = x1 + (dx * i) / steps;
    const y = y1 + (dy * i) / steps;
    for (let s = 0; s < solids.length; s += 1) {
      if (pointInRect(x, y, solids[s])) return true;
    }
  }
  return false;
}

function inShadow(x, y, shadows) {
  for (let i = 0; i < shadows.length; i += 1) {
    if (pointInRect(x, y, shadows[i])) return true;
  }
  return false;
}

/** Move a circle through the solids, sliding along walls. Returns the new position. */
function moveCircle(x, y, radius, dx, dy, solids) {
  let nx = x + dx;
  for (let i = 0; i < solids.length; i += 1) {
    if (circleHitsRect(nx, y, radius, solids[i])) {
      nx = dx > 0 ? solids[i].x - radius : dx < 0 ? solids[i].x + solids[i].w + radius : nx;
      if (circleHitsRect(nx, y, radius, solids[i])) nx = x;
    }
  }
  let ny = y + dy;
  for (let i = 0; i < solids.length; i += 1) {
    if (circleHitsRect(nx, ny, radius, solids[i])) {
      ny = dy > 0 ? solids[i].y - radius : dy < 0 ? solids[i].y + solids[i].h + radius : ny;
      if (circleHitsRect(nx, ny, radius, solids[i])) ny = y;
    }
  }
  return { x: clamp(nx, radius, FIELD.width - radius), y: clamp(ny, radius, FIELD.height - radius) };
}

export class World {
  constructor(levelIndex, seed) {
    this.levelIndex = levelIndex;
    this.level = LEVELS[levelIndex];
    this.random = createRandom(seed);
    this.solids = [...this.level.walls, ...this.level.crates];
    this.reset();
  }

  reset() {
    const level = this.level;
    this.time = 0;
    this.state = {
      player: {
        x: level.playerStart.x,
        y: level.playerStart.y,
        facing: -Math.PI / 2,
        moving: false,
        sneaking: false,
        running: false,
        noiseRadius: 0,
      },
      guards: level.guards.map((g) => ({
        waypoints: g.waypoints,
        x: g.waypoints[0][0],
        y: g.waypoints[0][1],
        angle: g.facing,
        speed: g.speed,
        pause: g.pause,
        waypoint: 1,
        wait: 0,
        mode: 'patrol',
        investigateX: 0,
        investigateY: 0,
        lookTimer: 0,
        lostTimer: 0,
        noiseCooldown: 0,
      })),
      cameras: level.cameras.map((c) => ({
        x: c.x,
        y: c.y,
        baseAngle: c.baseAngle,
        arc: c.arc,
        phase: c.phase,
        angle: c.baseAngle,
      })),
      intel: level.intel.map((item) => ({ ...item, taken: false })),
      intelGot: 0,
      detection: 0,
      alarms: 0,
      alarmed: false,
      caught: false,
      levelDone: false,
      won: false,
      score: 0,
    };
  }

  /** One fixed step. `input` is {x, y, sneak, run, clickX, clickY}. Returns an event bitmask. */
  step(dt, input) {
    const s = this.state;
    if (s.caught || s.levelDone) return 0;
    this.time += dt;
    let events = 0;

    // --- player movement -------------------------------------------------
    const p = s.player;
    let mx = input.x || 0;
    let my = input.y || 0;
    if (mx === 0 && my === 0 && input.clickX !== null && input.clickX !== undefined) {
      const dx = input.clickX - p.x;
      const dy = input.clickY - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 6) {
        mx = dx / d;
        my = dy / d;
      }
    }
    const mag = Math.hypot(mx, my);
    if (mag > 0.01) {
      if (mag > 1) {
        mx /= mag;
        my /= mag;
      }
      p.sneaking = !!input.sneak;
      p.running = !!input.run && !p.sneaking;
      const speed = p.sneaking ? PLAYER.sneakSpeed : p.running ? PLAYER.runSpeed : PLAYER.walkSpeed;
      const moved = moveCircle(p.x, p.y, PLAYER.radius, mx * speed * dt, my * speed * dt, this.solids);
      p.x = moved.x;
      p.y = moved.y;
      p.facing = Math.atan2(my, mx);
      p.moving = true;
      p.noiseRadius = p.running ? PLAYER.runNoise : PLAYER.walkNoise;
    } else {
      p.moving = false;
      p.sneaking = !!input.sneak;
      p.running = false;
      p.noiseRadius = 0;
    }

    const playerHidden = inShadow(p.x, p.y, this.level.shadows);

    // --- noise: running within earshot sends guards to investigate -------
    if (p.running) {
      for (const g of s.guards) {
        if (g.noiseCooldown > 0) continue;
        const d = Math.hypot(g.x - p.x, g.y - p.y);
        if (d < PLAYER.runNoise + 60 && g.mode === 'patrol') {
          g.mode = 'investigate';
          g.investigateX = p.x;
          g.investigateY = p.y;
          g.noiseCooldown = 4;
        }
      }
    }

    // --- watchers: guards and cameras ------------------------------------
    let seen = false;
    let seenBy = null;
    let bestFill = 0;
    for (const g of s.guards) {
      if (g.noiseCooldown > 0) g.noiseCooldown -= dt;
      const seenNow = this.guardSees(g, p, playerHidden);
      if (seenNow) {
        seen = true;
        seenBy = g;
        const d = Math.hypot(g.x - p.x, g.y - p.y);
        let rate = DETECT.fillPerSecond;
        rate *= d < 110 ? DETECT.closeBoost : d > 190 ? DETECT.farFactor : 1;
        rate *= p.running ? DETECT.runFactor : p.sneaking ? DETECT.sneakFactor : 1;
        if (playerHidden) rate *= GUARD.shadowFill;
        if (g.mode === 'chase') rate *= 1.4;
        if (rate > bestFill) bestFill = rate;
      }
      this.updateGuard(g, dt, p, seenNow);
    }
    for (const c of s.cameras) {
      c.angle = c.baseAngle + c.arc * Math.sin(this.time * CAMERA.sweepSpeed + c.phase);
      if (this.cameraSees(c, p, playerHidden)) {
        seen = true;
        if (!seenBy) seenBy = c;
        const rate = DETECT.fillPerSecond * 1.15 * (playerHidden ? GUARD.shadowFill : 1);
        if (rate > bestFill) bestFill = rate;
      }
    }

    if (seen) {
      const before = s.detection;
      s.detection = clamp(s.detection + bestFill * dt, 0, 100);
      if (before < DETECT.suspiciousAt && s.detection >= DETECT.suspiciousAt) events |= EVENT_SPOTTED;
      if (s.detection >= 100 && !s.alarmed) {
        s.alarmed = true;
        s.alarms += 1;
        events |= EVENT_ALARM;
        for (const g of s.guards) {
          if (g.mode !== 'chase') {
            g.mode = 'chase';
            g.lostTimer = 0;
          }
        }
      }
    } else {
      s.detection = clamp(s.detection - DETECT.decayPerSecond * dt, 0, 100);
      if (s.detection < DETECT.suspiciousAt && s.alarmed) {
        // Alarm stands until every guard gives up; chase downgrade handles it.
      }
    }

    // A guard that spots the player while suspicious investigates the spot.
    if (seen && seenBy && seenBy.mode === 'patrol' && s.detection >= DETECT.suspiciousAt && s.detection < 100) {
      seenBy.mode = 'investigate';
      seenBy.investigateX = p.x;
      seenBy.investigateY = p.y;
    }

    // --- caught? -----------------------------------------------------------
    for (const g of s.guards) {
      if (Math.hypot(g.x - p.x, g.y - p.y) < GUARD.catchDistance) {
        s.caught = true;
        events |= EVENT_CAUGHT;
        return events;
      }
    }

    // --- intel pickups -----------------------------------------------------
    for (const item of s.intel) {
      if (!item.taken && Math.hypot(item.x - p.x, item.y - p.y) < 30) {
        item.taken = true;
        s.intelGot += 1;
        events |= EVENT_PICKUP;
      }
    }

    // --- exit --------------------------------------------------------------
    const exit = this.level.exit;
    if (
      s.intelGot === s.intel.length &&
      p.x > exit.x && p.x < exit.x + exit.w &&
      p.y > exit.y && p.y < exit.y + exit.h
    ) {
      s.levelDone = true;
      const levelScore = Math.max(
        SCORE.minLevel,
        SCORE.levelBase + SCORE.intelBonus * s.intel.length - Math.round(this.time * SCORE.perSecond) - SCORE.alarmPenalty * s.alarms,
      );
      s.score += levelScore;
      if (this.levelIndex >= LEVELS.length - 1) {
        s.won = true;
        events |= EVENT_WIN;
      } else {
        events |= EVENT_LEVEL;
      }
    }
    return events;
  }

  guardSees(g, p, playerHidden) {
    const dx = p.x - g.x;
    const dy = p.y - g.y;
    const d = Math.hypot(dx, dy);
    const range = playerHidden ? GUARD.shadowRange : GUARD.coneRange;
    if (d > range) return false;
    const angle = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(angle, g.angle)) > GUARD.coneHalfAngle) return false;
    return !sightBlocked(g.x, g.y, p.x, p.y, this.solids);
  }

  cameraSees(c, p, playerHidden) {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const d = Math.hypot(dx, dy);
    if (d > CAMERA.range) return false;
    const angle = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(angle, c.angle)) > CAMERA.coneHalfAngle) return false;
    return !sightBlocked(c.x, c.y, p.x, p.y, this.solids);
  }

  updateGuard(g, dt, p, seenNow) {
    // Guards walk a grid path (A*) so patrols never wedge on a wall.
    if (!g.path || g.pathTimer === undefined) {
      g.path = null;
      g.pathIndex = 0;
      g.pathTimer = 0;
      g.stuckTimer = 0;
      g.lastX = g.x;
      g.lastY = g.y;
    }
    g.pathTimer -= dt;
    const moved = Math.hypot(g.x - g.lastX, g.y - g.lastY);
    g.lastX = g.x;
    g.lastY = g.y;
    if (moved < 0.5 * dt * 60 * 0.016) {
      g.stuckTimer += dt;
    } else {
      g.stuckTimer = 0;
    }
    if (g.stuckTimer > 1) {
      g.path = null;
      g.stuckTimer = 0;
    }

    if (g.mode === 'patrol') {
      if (g.wait > 0) {
        g.wait -= dt;
        return;
      }
      const target = g.waypoints[g.waypoint];
      if (!g.path) {
        g.path = this.findPath(g.x, g.y, target[0], target[1]);
        g.pathIndex = 0;
      }
      if (this.followPath(g, GUARD.patrolSpeed * g.speed, dt)) {
        g.waypoint = (g.waypoint + 1) % g.waypoints.length;
        g.wait = g.pause;
        g.path = null;
      }
      return;
    }

    if (g.mode === 'investigate') {
      if (!g.path) {
        g.path = this.findPath(g.x, g.y, g.investigateX, g.investigateY);
        g.pathIndex = 0;
      }
      const arrived = this.followPath(g, GUARD.investigateSpeed * g.speed, dt);
      if (arrived || g.pathIndex >= (g.path ? g.path.length : 0)) {
        if (seenNow) {
          // Still looking at the player: keep the cone on them.
          g.angle = Math.atan2(p.y - g.y, p.x - g.x);
          g.lookTimer = 0;
        } else {
          g.lookTimer += dt;
          g.angle += dt * 1.4;
        }
        if (g.lookTimer > GUARD.lookAround) {
          g.mode = 'patrol';
          g.lookTimer = 0;
          g.path = null;
        }
      }
      return;
    }

    // chase
    if (seenNow) {
      g.lostTimer = 0;
      if (g.pathTimer <= 0) {
        g.path = this.findPath(g.x, g.y, p.x, p.y);
        g.pathIndex = 0;
        g.pathTimer = 0.4;
      }
      this.followPath(g, GUARD.chaseSpeed * g.speed, dt);
    } else {
      g.lostTimer += dt;
      if (g.lostTimer > GUARD.loseSight) {
        g.mode = 'investigate';
        g.investigateX = p.x;
        g.investigateY = p.y;
        g.lostTimer = 0;
        g.path = null;
      }
    }
  }

  /** Follow g.path; returns true when the last point is reached. */
  followPath(g, speed, dt) {
    if (!g.path || g.path.length === 0) return true;
    const target = g.path[g.pathIndex];
    const dx = target[0] - g.x;
    const dy = target[1] - g.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      g.pathIndex += 1;
      if (g.pathIndex >= g.path.length) return true;
      return false;
    }
    const stepLen = Math.min(d, speed * dt);
    const moved = moveCircle(g.x, g.y, GUARD.radius, (dx / d) * stepLen, (dy / d) * stepLen, this.solids);
    g.x = moved.x;
    g.y = moved.y;
    g.angle = Math.atan2(dy, dx);
    return false;
  }

  /** A* over a 40px grid; returns a list of [x, y] points, or null. */
  findPath(x1, y1, x2, y2) {
    const cell = 40;
    const cols = Math.ceil(FIELD.width / cell);
    const rows = Math.ceil(FIELD.height / cell);
    const blocked = (cx, cy) => {
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return true;
      const px = cx * cell + cell / 2;
      const py = cy * cell + cell / 2;
      for (const s of this.solids) {
        if (px > s.x - 14 && px < s.x + s.w + 14 && py > s.y - 14 && py < s.y + s.h + 14) return true;
      }
      return false;
    };
    const start = { x: clamp(Math.floor(x1 / cell), 0, cols - 1), y: clamp(Math.floor(y1 / cell), 0, rows - 1) };
    const goal = { x: clamp(Math.floor(x2 / cell), 0, cols - 1), y: clamp(Math.floor(y2 / cell), 0, rows - 1) };
    const nearestFree = (c) => {
      if (!blocked(c.x, c.y)) return c;
      for (let r = 1; r < 6; r += 1) {
        for (let dy = -r; dy <= r; dy += 1) {
          for (let dx = -r; dx <= r; dx += 1) {
            const n = { x: c.x + dx, y: c.y + dy };
            if (!blocked(n.x, n.y)) return n;
          }
        }
      }
      return c;
    };
    const s0 = nearestFree(start);
    const g0 = nearestFree(goal);
    const key = (c) => `${c.x},${c.y}`;
    const open = [{ ...s0, g: 0, f: 0, parent: null }];
    const came = new Map();
    const cost = new Map([[key(s0), 0]]);
    const closed = new Set();
    const heuristic = (c) => Math.abs(c.x - g0.x) + Math.abs(c.y - g0.y);
    while (open.length > 0) {
      let best = 0;
      for (let i = 1; i < open.length; i += 1) {
        if (open[i].f < open[best].f) best = i;
      }
      const current = open.splice(best, 1)[0];
      if (current.x === g0.x && current.y === g0.y) {
        const cells = [];
        let node = current;
        while (node) {
          cells.unshift([node.x * cell + cell / 2, node.y * cell + cell / 2]);
          node = came.get(key(node));
        }
        cells.push([x2, y2]);
        return cells;
      }
      closed.add(key(current));
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { x: current.x + dx, y: current.y + dy };
        if (blocked(n.x, n.y) || closed.has(key(n))) continue;
        const ng = cost.get(key(current)) + 1;
        if (ng < (cost.get(key(n)) ?? Infinity)) {
          cost.set(key(n), ng);
          came.set(key(n), current);
          open.push({ ...n, g: ng, f: ng + heuristic(n) });
        }
      }
    }
    return [[x2, y2]];
  }

  /** Score the run so far (used by the win screen). */
  levelScore() {
    return Math.max(
      SCORE.minLevel,
      SCORE.levelBase + SCORE.intelBonus * this.state.intel.length
        - Math.round(this.time * SCORE.perSecond) - SCORE.alarmPenalty * this.state.alarms,
    );
  }
}

export { STEP };
