// SHADOW VAULT — keyboard and mouse input. WASD or arrows move, Shift
// sneaks, running is the default walk's faster gear (hold nothing to walk,
// tap nothing to run: running is a separate key so it stays a choice).
// Clicking the floor sets a walk target. Enter / R are menu keys.

export function createInput(canvas) {
  const keys = new Set();
  const input = {
    x: 0,
    y: 0,
    sneak: false,
    run: false,
    clickX: null,
    clickY: null,
    pressedEnter: false,
    pressedRetry: false,
  };

  function recompute() {
    let x = 0;
    let y = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) x -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) x += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) y -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) y += 1;
    input.x = x;
    input.y = y;
    input.sneak = keys.has('ShiftLeft') || keys.has('ShiftRight');
    // Run while Space is held: loud, fast, and guards hear it.
    input.run = keys.has('Space');
    if (x !== 0 || y !== 0) {
      input.clickX = null;
      input.clickY = null;
    }
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === 'Enter') input.pressedEnter = true;
    if (event.code === 'KeyR') input.pressedRetry = true;
    keys.add(event.code);
    recompute();
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
    recompute();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    recompute();
  });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    // The canvas is the 1280x720 field scaled to the window; map back.
    const fx = (event.clientX - rect.left) * scaleX;
    const fy = (event.clientY - rect.top) * scaleY;
    input.clickX = fx;
    input.clickY = fy;
    input.pressedEnter = true;
  });

  return input;
}
