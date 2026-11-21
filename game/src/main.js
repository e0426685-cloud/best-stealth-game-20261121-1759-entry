// SHADOW VAULT — boot and the game loop. Fixed-step simulation at 60 Hz,
// canvas scaled to the window, screens for title / play / caught / level
// complete / win. With ?shot=<scene>&seed=<n> the game stages one frozen
// screenshot scene instead of playing (see shots.js).

import { BEST_KEY, FIELD, STEP } from './config.js';
import { createInput } from './input.js';
import { playAlarm, playCaught, playLevel, playPickup, playWin, unlockAudio } from './audio.js';
import { render, SCREEN_CAUGHT, SCREEN_LEVEL, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { EVENT_ALARM, EVENT_CAUGHT, EVENT_LEVEL, EVENT_PICKUP, EVENT_WIN, World } from './world.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

let best = 0;
try {
  best = Number(window.localStorage.getItem(BEST_KEY) || '0') || 0;
} catch {
  best = 0;
}

const input = createInput(canvas);

let world;
let screen;

if (shot) {
  // Screenshot mode: one frozen frame, no loop, no audio.
  const staged = stageShot(shot, seed);
  world = staged.world;
  screen = staged.screen;
  resize();
  render(ctx, world, screen, best, 0);
  document.title = `SHADOW VAULT — shot ${shot}`;
} else {
  world = new World(0, seed);
  screen = SCREEN_TITLE;
  let last = performance.now();
  let accumulator = 0;

  function frame(now) {
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    while (accumulator >= STEP) {
      accumulator -= STEP;
      tick();
    }
    resize();
    render(ctx, world, screen, best, world.time);
    requestAnimationFrame(frame);
  }

  function tick() {
    if (screen === SCREEN_TITLE) {
      if (input.pressedEnter) {
        input.pressedEnter = false;
        unlockAudio();
        screen = SCREEN_PLAY;
        announce('Playing. Collect all intel, then reach the exit unseen.');
      }
      return;
    }
    if (screen === SCREEN_CAUGHT) {
      if (input.pressedRetry) {
        input.pressedRetry = false;
        world = new World(world.levelIndex, seed + Math.floor(Math.random() * 1000));
        screen = SCREEN_PLAY;
      }
      return;
    }
    if (screen === SCREEN_LEVEL) {
      if (input.pressedEnter) {
        input.pressedEnter = false;
        world = new World(world.levelIndex + 1, seed);
        screen = SCREEN_PLAY;
        announce(`${world.level.name}. ${world.level.brief}`);
      }
      return;
    }
    if (screen === SCREEN_WIN) {
      if (input.pressedRetry) {
        input.pressedRetry = false;
        world = new World(0, seed);
        screen = SCREEN_TITLE;
      }
      return;
    }

    const events = world.step(STEP, input);
    if (events & EVENT_PICKUP) {
      playPickup();
      announce(`Intel ${world.state.intelGot} of ${world.state.intel.length} collected.`);
    }
    if (events & EVENT_ALARM) {
      playAlarm();
      announce('Spotted! Run for shadow — a guard is chasing you.');
    }
    if (events & EVENT_CAUGHT) {
      playCaught();
      screen = SCREEN_CAUGHT;
      announce('Caught! Press R to retry the level.');
    }
    if (events & EVENT_LEVEL) {
      playLevel();
      screen = SCREEN_LEVEL;
      announce('Level clear. Press Enter for the next level.');
    }
    if (events & EVENT_WIN) {
      playWin();
      screen = SCREEN_WIN;
      if (world.state.score > best) {
        best = world.state.score;
        try {
          window.localStorage.setItem(BEST_KEY, String(best));
        } catch {
          // Best score is a nicety; storage may be unavailable.
        }
      }
      announce(`You win! Final score ${world.state.score}. Press R to play again.`);
    }
  }

  function announce(text) {
    statusEl.textContent = text;
  }

  announce('SHADOW VAULT. Press Enter or click to begin.');
  requestAnimationFrame(frame);
}

function resize() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  const w = Math.floor(FIELD.width * scale);
  const h = Math.floor(FIELD.height * scale);
  if (canvas.style.width !== `${w}px`) {
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }
}

window.addEventListener('resize', resize);
resize();
