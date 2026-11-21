// SHADOW VAULT — tuning numbers and colours in one place.
// Top-down stealth: the playfield is a fixed 1280x720 logical area; the
// renderer scales it to the window, so no rule below depends on screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  walkSpeed: 165,
  sneakSpeed: 95,
  runSpeed: 250,
  /** Noise radius while running; sneaking is silent, walking is quiet. */
  walkNoise: 55,
  runNoise: 150,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 78,
  investigateSpeed: 115,
  chaseSpeed: 168,
  /** Vision cone: half-angle and range in the open. */
  coneHalfAngle: 0.62,
  coneRange: 250,
  /** Inside a shadow the guard's eyes are worse: shorter range, slower fill. */
  shadowRange: 150,
  shadowFill: 0.45,
  /** Seconds a guard stares at a spot while investigating. */
  lookAround: 2.2,
  /** Seconds of lost sight before a chase downgrades to investigate. */
  loseSight: 3.0,
  catchDistance: 26,
};

export const CAMERA = {
  range: 230,
  coneHalfAngle: 0.5,
  /** Degrees per second the camera sweeps. */
  sweepSpeed: 0.55,
};

export const DETECT = {
  /** Detection meter fills 0..100; 40 = suspicious, 100 = alarm. */
  fillPerSecond: 62,
  decayPerSecond: 26,
  suspiciousAt: 40,
  closeBoost: 1.35,
  farFactor: 0.55,
  runFactor: 1.6,
  sneakFactor: 0.5,
};

export const SCORE = {
  levelBase: 1000,
  intelBonus: 200,
  perSecond: 5,
  alarmPenalty: 150,
  minLevel: 100,
};

export const PALETTE = {
  floor: '#1a1d24',
  floorAlt: '#20242e',
  wall: '#3a4152',
  wallTop: '#4a5266',
  crate: '#5a4632',
  crateTop: '#7a6244',
  shadow: 'rgba(8, 10, 18, 0.55)',
  exit: '#2fd47a',
  exitGlow: 'rgba(47, 212, 122, 0.25)',
  intel: '#ffd34d',
  player: '#37c8e8',
  playerSneak: '#2a9db8',
  guard: '#e5534b',
  guardCalm: '#e5534b',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneSuspicious: 'rgba(255, 150, 50, 0.30)',
  coneAlarm: 'rgba(255, 60, 50, 0.34)',
  camera: '#ff9f43',
  text: '#eef1f5',
  muted: '#9aa3b2',
  panel: 'rgba(16, 19, 26, 0.82)',
  danger: '#ff5a4e',
  ok: '#2fd47a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'shadow-vault.best';
