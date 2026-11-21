// SHADOW VAULT — the canvas renderer: floor, shadows, walls, crates,
// vision cones, guards, cameras, the player, HUD and screens. Drawing only;
// every rule lives in world.js.

import { CAMERA, FIELD, GUARD, PALETTE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_LEVEL = 'level';
export const SCREEN_WIN = 'win';

function conePath(ctx, x, y, angle, halfAngle, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, halfAngle, range, fill) {
  conePath(ctx, x, y, angle, halfAngle, range);
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawDocument(ctx, x, y, bob) {
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(-0.12);
  ctx.fillStyle = '#f5efdc';
  ctx.fillRect(-9, -12, 18, 24);
  ctx.strokeStyle = '#8a7f5c';
  ctx.lineWidth = 1;
  ctx.strokeRect(-9, -12, 18, 24);
  ctx.strokeStyle = '#5a6b8a';
  ctx.beginPath();
  ctx.moveTo(-5, -6);
  ctx.lineTo(5, -6);
  ctx.moveTo(-5, -1);
  ctx.lineTo(5, -1);
  ctx.moveTo(-5, 4);
  ctx.lineTo(2, 4);
  ctx.stroke();
  ctx.restore();
}

export function render(ctx, world, screen, best, time) {
  const level = world.level;
  const s = world.state;
  const W = FIELD.width;
  const H = FIELD.height;

  // --- floor ------------------------------------------------------------
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = PALETTE.floorAlt;
  const tile = 80;
  for (let y = 0; y < H / tile; y += 1) {
    for (let x = 0; x < W / tile; x += 1) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * tile, y * tile, tile, tile);
    }
  }

  // --- exit --------------------------------------------------------------
  const exit = level.exit;
  const exitOpen = s.intelGot === s.intel.length;
  ctx.save();
  ctx.fillStyle = exitOpen ? PALETTE.exitGlow : 'rgba(255, 90, 78, 0.14)';
  ctx.fillRect(exit.x - 14, exit.y - 14, exit.w + 28, exit.h + 28);
  ctx.fillStyle = exitOpen ? PALETTE.exit : '#7a3a36';
  roundRect(ctx, exit.x, exit.y, exit.w, exit.h, 6);
  ctx.fill();
  ctx.fillStyle = '#0e1512';
  ctx.font = 'bold 15px ' + 'system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(exitOpen ? 'EXIT OPEN' : `EXIT · ${s.intelGot}/${s.intel.length}`, exit.x + exit.w / 2, exit.y + exit.h / 2);
  ctx.restore();

  // --- shadow patches -----------------------------------------------------
  for (const sh of level.shadows) {
    ctx.fillStyle = PALETTE.shadow;
    roundRect(ctx, sh.x, sh.y, sh.w, sh.h, 10);
    ctx.fill();
  }

  // --- intel ---------------------------------------------------------------
  for (const item of s.intel) {
    if (item.taken) continue;
    const bob = Math.sin(time * 2.4 + item.x) * 3;
    ctx.save();
    ctx.shadowColor = PALETTE.intel;
    ctx.shadowBlur = 16;
    ctx.fillStyle = PALETTE.intel;
    ctx.beginPath();
    ctx.arc(item.x, item.y + bob, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawDocument(ctx, item.x, item.y, bob);
  }

  // --- vision cones (under the guards) --------------------------------------
  for (const c of s.cameras) {
    drawCone(ctx, c.x, c.y, c.angle, CAMERA.coneHalfAngle, CAMERA.range, 'rgba(255, 159, 67, 0.20)');
  }
  for (const g of s.guards) {
    const fill = g.mode === 'chase' ? PALETTE.coneAlarm : g.mode === 'investigate' ? PALETTE.coneSuspicious : PALETTE.coneCalm;
    drawCone(ctx, g.x, g.y, g.angle, GUARD.coneHalfAngle, GUARD.coneRange, fill);
  }

  // --- walls and crates -------------------------------------------------------
  for (const wall of level.walls) {
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(wall.x, wall.y + 4, wall.w, wall.h - 4);
  }
  for (const crate of level.crates) {
    ctx.fillStyle = PALETTE.crateTop;
    ctx.fillRect(crate.x, crate.y, crate.w, crate.h);
    ctx.fillStyle = PALETTE.crate;
    ctx.fillRect(crate.x + 4, crate.y + 4, crate.w - 8, crate.h - 8);
    ctx.strokeStyle = PALETTE.crateTop;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(crate.x, crate.y);
    ctx.lineTo(crate.x + crate.w, crate.y + crate.h);
    ctx.moveTo(crate.x + crate.w, crate.y);
    ctx.lineTo(crate.x, crate.y + crate.h);
    ctx.stroke();
  }

  // --- cameras ------------------------------------------------------------------
  for (const c of s.cameras) {
    ctx.save();
    ctx.fillStyle = '#2b2f3a';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.camera;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --- guards ---------------------------------------------------------------------
  for (const g of s.guards) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.fillStyle = g.mode === 'chase' ? '#ff2e22' : PALETTE.guardCalm;
    ctx.beginPath();
    ctx.arc(0, 0, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7d1f18';
    ctx.lineWidth = 2;
    ctx.stroke();
    // facing tick + visor
    ctx.rotate(g.angle);
    ctx.fillStyle = '#ffd6d2';
    ctx.beginPath();
    ctx.arc(6, 0, 5, -1.1, 1.1);
    ctx.fill();
    ctx.restore();
    if (g.mode !== 'patrol') {
      ctx.save();
      ctx.fillStyle = g.mode === 'chase' ? PALETTE.danger : '#ff9f43';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(g.mode === 'chase' ? '!' : '?', g.x, g.y - 22);
      ctx.restore();
    }
  }

  // --- player -----------------------------------------------------------------------
  const p = s.player;
  ctx.save();
  if (p.running) {
    ctx.strokeStyle = 'rgba(238, 241, 245, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 150, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.translate(p.x, p.y);
  ctx.fillStyle = p.sneaking ? PALETTE.playerSneak : PALETTE.player;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0d3a46';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.rotate(p.facing);
  // hood point + eyes
  ctx.fillStyle = '#0d3a46';
  ctx.beginPath();
  ctx.moveTo(13, 0);
  ctx.lineTo(4, -6);
  ctx.lineTo(4, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // detection "!" over the player
  if (s.detection >= 40 && !s.caught) {
    ctx.save();
    ctx.fillStyle = s.detection >= 100 ? PALETTE.danger : '#ffb02e';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', p.x, p.y - 24);
    ctx.restore();
  }

  drawHud(ctx, world, screen);

  if (screen === SCREEN_TITLE) drawTitle(ctx, world, best);
  if (screen === SCREEN_CAUGHT) drawCaught(ctx, world);
  if (screen === SCREEN_LEVEL) drawLevelDone(ctx, world);
  if (screen === SCREEN_WIN) drawWin(ctx, world, best);
}

function drawHud(ctx, world, screen) {
  const s = world.state;
  const W = FIELD.width;
  ctx.save();
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, 12, 12, W - 24, 46, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(world.level.name, 28, 35);
  ctx.textAlign = 'right';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText(`Intel ${s.intelGot}/${s.intel.length}   ·   ${formatTime(world.time)}   ·   Score ${s.score}`, W - 28, 35);
  // detection bar
  const bw = 180;
  const bx = W / 2 - bw / 2;
  const by = 66;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, bx - 2, by - 2, bw + 4, 14, 7);
  ctx.fill();
  ctx.fillStyle = s.detection >= 100 ? PALETTE.danger : s.detection >= 40 ? '#ffb02e' : '#3f7d5a';
  if (s.detection > 1) {
    roundRect(ctx, bx, by, (bw * s.detection) / 100, 10, 5);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(s.detection >= 100 ? 'SPOTTED!' : s.detection >= 40 ? 'SUSPICIOUS…' : 'UNSEEN', W / 2, by + 26);
  if (screen === SCREEN_PLAY) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('WASD / arrows move · Shift sneak · run is loud · click to walk · shadows hide you', 28, H_FOOTER_Y);
  }
  ctx.restore();
}

const H_FOOTER_Y = 706;

function formatTime(t) {
  const m = Math.floor(t / 60);
  const sec = Math.floor(t % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function overlay(ctx) {
  ctx.fillStyle = 'rgba(8, 10, 16, 0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function panel(ctx, w, h) {
  const x = (FIELD.width - w) / 2;
  const y = (FIELD.height - h) / 2;
  ctx.fillStyle = 'rgba(20, 24, 33, 0.96)';
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = '#3a4152';
  ctx.lineWidth = 2;
  ctx.stroke();
  return { x, y };
}

function drawTitle(ctx, world, best) {
  overlay(ctx);
  const { x, y } = panel(ctx, 640, 380);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText('SHADOW VAULT', FIELD.width / 2, y + 78);
  ctx.fillStyle = PALETTE.player;
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('A top-down stealth game — lift the files, dodge the cones, vanish.', FIELD.width / 2, y + 116);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('WASD / arrows to move · hold Shift to sneak · running is loud', FIELD.width / 2, y + 158);
  ctx.fillText('Shadows hide you · crates and walls block sight · grab all intel, then reach EXIT', FIELD.width / 2, y + 184);
  ctx.fillText('Guards patrol, investigate noises, and chase when they spot you.', FIELD.width / 2, y + 210);
  ctx.fillStyle = PALETTE.intel;
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText('Press Enter or click to begin', FIELD.width / 2, y + 268);
  if (best > 0) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`Best score: ${best}`, FIELD.width / 2, y + 306);
  }
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('3 levels · original game built for the make.fun stealth bounty', FIELD.width / 2, y + 340);
  ctx.restore();
}

function drawCaught(ctx, world) {
  overlay(ctx);
  const { x, y } = panel(ctx, 560, 300);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.danger;
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText('CAUGHT!', FIELD.width / 2, y + 82);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText(`A guard caught you on ${world.level.name}.`, FIELD.width / 2, y + 128);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Sneak through shadows. Never sprint across a lit floor.', FIELD.width / 2, y + 160);
  ctx.fillStyle = PALETTE.intel;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('Press R to retry the level', FIELD.width / 2, y + 216);
  ctx.restore();
}

function drawLevelDone(ctx, world) {
  overlay(ctx);
  const { x, y } = panel(ctx, 560, 300);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.ok;
  ctx.font = 'bold 38px system-ui, sans-serif';
  ctx.fillText('CLEAN GETAWAY', FIELD.width / 2, y + 80);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText(`${world.level.name} — all intel lifted.`, FIELD.width / 2, y + 124);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText(`Level score ${world.levelScore()}   ·   Total ${world.state.score}   ·   Alarms ${world.state.alarms}`, FIELD.width / 2, y + 156);
  ctx.fillStyle = PALETTE.intel;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('Press Enter for the next level', FIELD.width / 2, y + 214);
  ctx.restore();
}

function drawWin(ctx, world, best) {
  overlay(ctx);
  const { x, y } = panel(ctx, 640, 360);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.ok;
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText('THE VAULT IS YOURS', FIELD.width / 2, y + 80);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Every file lifted. Every guard left staring at shadows.', FIELD.width / 2, y + 124);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(`Final score ${world.state.score}   ·   Time ${formatTime(world.time)}   ·   Alarms ${world.state.alarms}`, FIELD.width / 2, y + 160);
  if (best > 0) {
    ctx.fillText(`Best score: ${best}`, FIELD.width / 2, y + 190);
  }
  ctx.fillStyle = PALETTE.intel;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('Press R to play again', FIELD.width / 2, y + 250);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('SHADOW VAULT — an original stealth game', FIELD.width / 2, y + 300);
  ctx.restore();
}
