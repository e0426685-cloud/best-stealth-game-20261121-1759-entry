// SHADOW VAULT — the screenshot scenes behind ?shot=title|play|hide|win.
// Each one plays the real rules forward from a fresh world for a fixed
// number of steps, so the frame is what a short game really looks like and
// the same seed always gives the same frame. With no ?shot the game starts
// fresh on level 1.

import { STEP } from './config.js';
import { World, EVENT_CAUGHT, EVENT_LEVEL, EVENT_WIN } from './world.js';
import { SCREEN_CAUGHT, SCREEN_LEVEL, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

/** Steer toward the nearest uncollected intel, waiting out of cones. */
function autopilot(world) {
  const s = world.state;
  const p = s.player;
  let target = null;
  let best = Infinity;
  for (const item of s.intel) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - p.x, item.y - p.y);
    if (d < best) {
      best = d;
      target = item;
    }
  }
  if (!target) {
    const exit = world.level.exit;
    target = { x: exit.x + exit.w / 2, y: exit.y + exit.h / 2 };
  }
  // Hold still (sneaking) while any guard's cone covers the next step.
  const dx = target.x - p.x;
  const dy = target.y - p.y;
  const d = Math.hypot(dx, dy);
  if (d < 4) return { x: 0, y: 0, sneak: true, run: false, clickX: null, clickY: null };
  const nx = p.x + (dx / d) * 30;
  const ny = p.y + (dy / d) * 30;
  for (const g of s.guards) {
    const gdx = nx - g.x;
    const gdy = ny - g.y;
    const gd = Math.hypot(gdx, gdy);
    if (gd < 250) {
      const angle = Math.atan2(gdy, gdx);
      let diff = angle - g.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) < 0.62) return { x: 0, y: 0, sneak: true, run: false, clickX: null, clickY: null };
    }
  }
  return { x: dx / d, y: dy / d, sneak: false, run: false, clickX: null, clickY: null };
}

function runSteps(world, seconds, pilot) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const events = world.step(STEP, pilot ? autopilot(world) : { x: 0, y: 0, sneak: false, run: false, clickX: null, clickY: null });
    if (events & (EVENT_CAUGHT | EVENT_LEVEL | EVENT_WIN)) return events;
  }
  return 0;
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Scenes: title (fresh level 1, title overlay), play (mid-hunt on level 1),
 * hide (player tucked in shadow while a guard sweeps past), win (the vault
 * cleared, win screen showing). Any other name is the title.
 */
export function stageShot(name, seed) {
  if (name === 'play') {
    const world = new World(0, seed);
    runSteps(world, 9, true);
    return { world, screen: SCREEN_PLAY };
  }
  if (name === 'hide') {
    const world = new World(1, seed);
    // Tuck the player into the big shadow at the bottom-left, mid-patrol.
    world.state.player.x = 120;
    world.state.player.y = 360;
    world.state.player.sneaking = true;
    world.state.player.facing = Math.PI / 4;
    runSteps(world, 5, false);
    world.state.player.sneaking = true;
    return { world, screen: SCREEN_PLAY };
  }
  if (name === 'win') {
    const world = new World(2, seed);
    for (const item of world.state.intel) item.taken = true;
    world.state.intelGot = world.state.intel.length;
    world.state.player.x = 640;
    world.state.player.y = 90;
    world.state.score = 3420;
    world.state.won = true;
    world.state.levelDone = true;
    world.time = 245;
    return { world, screen: SCREEN_WIN };
  }
  const world = new World(0, seed);
  runSteps(world, 4, false);
  return { world, screen: SCREEN_TITLE };
}
