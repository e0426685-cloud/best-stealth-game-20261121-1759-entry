// SHADOW VAULT — the three levels. Each level is a top-down floor plan:
// walls and crates block movement and sight, shadow patches hide the
// player, guards patrol waypoints, cameras sweep fixed arcs, intel must be
// collected before the exit opens. Coordinates are in the 1280x720 field.

function borderWalls() {
  return [
    { x: 0, y: 0, w: 1280, h: 24 },
    { x: 0, y: 696, w: 1280, h: 24 },
    { x: 0, y: 0, w: 24, h: 720 },
    { x: 1256, y: 0, w: 24, h: 720 },
  ];
}

export const LEVELS = [
  {
    name: 'Level 1 — Gallery After Dark',
    brief: 'Lift 3 exhibition files, then slip out the skylight door. Stay out of the cones.',
    playerStart: { x: 80, y: 640 },
    exit: { x: 1150, y: 44, w: 86, h: 54 },
    walls: [
      ...borderWalls(),
      { x: 300, y: 24, w: 26, h: 220 },
      { x: 300, y: 340, w: 26, h: 200 },
      { x: 560, y: 180, w: 26, h: 260 },
      { x: 560, y: 540, w: 26, h: 156 },
      { x: 820, y: 24, w: 26, h: 200 },
      { x: 820, y: 330, w: 26, h: 180 },
      { x: 980, y: 480, w: 26, h: 216 },
      { x: 326, y: 440, w: 180, h: 26 },
      { x: 700, y: 180, w: 200, h: 26 },
    ],
    crates: [
      { x: 130, y: 300, w: 64, h: 64 },
      { x: 400, y: 560, w: 64, h: 64 },
      { x: 660, y: 90, w: 64, h: 64 },
      { x: 940, y: 300, w: 64, h: 64 },
      { x: 1080, y: 560, w: 64, h: 64 },
    ],
    shadows: [
      { x: 40, y: 420, w: 200, h: 120 },
      { x: 350, y: 60, w: 180, h: 110 },
      { x: 620, y: 470, w: 190, h: 130 },
      { x: 900, y: 90, w: 180, h: 120 },
      { x: 1040, y: 330, w: 180, h: 110 },
    ],
    intel: [
      { x: 150, y: 110, label: 'Guest list' },
      { x: 700, y: 620, label: 'Floor plans' },
      { x: 1150, y: 250, label: 'Safe code' },
    ],
    guards: [
      {
        waypoints: [[430, 130], [430, 620], [700, 620], [700, 130]],
        speed: 1,
        pause: 1.2,
        facing: Math.PI / 2,
      },
      {
        waypoints: [[950, 620], [950, 130], [1150, 130], [1150, 620]],
        speed: 1,
        pause: 0.8,
        facing: -Math.PI / 2,
      },
    ],
    cameras: [],
  },
  {
    name: 'Level 2 — The Office Floor',
    brief: 'Four memos, one patrolling floor, and a camera over the stairwell. Walk, don’t run.',
    playerStart: { x: 80, y: 90 },
    exit: { x: 1150, y: 620, w: 86, h: 54 },
    walls: [
      ...borderWalls(),
      { x: 240, y: 24, w: 26, h: 170 },
      { x: 240, y: 300, w: 26, h: 170 },
      { x: 240, y: 560, w: 26, h: 136 },
      { x: 520, y: 130, w: 26, h: 230 },
      { x: 520, y: 470, w: 26, h: 226 },
      { x: 800, y: 24, w: 26, h: 190 },
      { x: 800, y: 320, w: 26, h: 190 },
      { x: 1020, y: 180, w: 26, h: 240 },
      { x: 360, y: 360, w: 160, h: 26 },
      { x: 640, y: 560, w: 180, h: 26 },
      { x: 900, y: 130, w: 160, h: 26 },
    ],
    crates: [
      { x: 130, y: 480, w: 64, h: 64 },
      { x: 330, y: 90, w: 64, h: 64 },
      { x: 610, y: 300, w: 64, h: 64 },
      { x: 900, y: 480, w: 64, h: 64 },
      { x: 1100, y: 90, w: 64, h: 64 },
    ],
    shadows: [
      { x: 40, y: 300, w: 170, h: 130 },
      { x: 300, y: 480, w: 180, h: 120 },
      { x: 570, y: 60, w: 190, h: 110 },
      { x: 850, y: 300, w: 170, h: 120 },
      { x: 1060, y: 420, w: 170, h: 120 },
    ],
    intel: [
      { x: 120, y: 620, label: 'Memo A' },
      { x: 420, y: 130, label: 'Memo B' },
      { x: 690, y: 640, label: 'Memo C' },
      { x: 1150, y: 130, label: 'Memo D' },
    ],
    guards: [
      {
        waypoints: [[380, 250], [380, 640], [680, 640], [680, 250]],
        speed: 1,
        pause: 1.0,
        facing: 0,
      },
      {
        waypoints: [[940, 90], [940, 620], [1150, 620], [1150, 90]],
        speed: 1.05,
        pause: 0.9,
        facing: Math.PI,
      },
      {
        waypoints: [[140, 250], [700, 90], [1140, 250], [700, 430]],
        speed: 0.9,
        pause: 1.4,
        facing: Math.PI / 2,
      },
    ],
    cameras: [
      { x: 640, y: 40, baseAngle: Math.PI / 2, arc: 1.1, phase: 0 },
    ],
  },
  {
    name: 'Level 3 — The Vault',
    brief: 'The vault holds the last file. Two cameras, three guards, no room for a sprint.',
    playerStart: { x: 640, y: 640 },
    exit: { x: 597, y: 44, w: 86, h: 54 },
    walls: [
      ...borderWalls(),
      { x: 200, y: 24, w: 26, h: 180 },
      { x: 200, y: 320, w: 26, h: 200 },
      { x: 200, y: 620, w: 26, h: 76 },
      { x: 1054, y: 24, w: 26, h: 180 },
      { x: 1054, y: 320, w: 26, h: 200 },
      { x: 1054, y: 620, w: 26, h: 76 },
      { x: 420, y: 200, w: 26, h: 260 },
      { x: 834, y: 200, w: 26, h: 260 },
      { x: 420, y: 200, w: 440, h: 26 },
      { x: 500, y: 460, w: 280, h: 26 },
    ],
    crates: [
      { x: 90, y: 300, w: 64, h: 64 },
      { x: 1126, y: 300, w: 64, h: 64 },
      { x: 320, y: 560, w: 64, h: 64 },
      { x: 896, y: 560, w: 64, h: 64 },
      { x: 608, y: 300, w: 64, h: 64 },
    ],
    shadows: [
      { x: 40, y: 90, w: 140, h: 130 },
      { x: 1100, y: 90, w: 140, h: 130 },
      { x: 250, y: 250, w: 140, h: 120 },
      { x: 890, y: 250, w: 140, h: 120 },
      { x: 470, y: 520, w: 340, h: 110 },
    ],
    intel: [
      { x: 110, y: 90, label: 'Vault ledger' },
      { x: 1170, y: 90, label: 'Keycard' },
      { x: 640, y: 130, label: 'The file' },
      { x: 640, y: 330, label: 'Combo note' },
    ],
    guards: [
      {
        waypoints: [[320, 120], [320, 620], [960, 620], [960, 120]],
        speed: 1.1,
        pause: 0.8,
        facing: Math.PI / 2,
      },
      {
        waypoints: [[120, 250], [1160, 250], [1160, 560], [120, 560]],
        speed: 1,
        pause: 1.0,
        facing: 0,
      },
      {
        waypoints: [[640, 260], [500, 560], [780, 560], [640, 260]],
        speed: 0.95,
        pause: 1.2,
        facing: -Math.PI / 2,
      },
    ],
    cameras: [
      { x: 300, y: 40, baseAngle: Math.PI / 2, arc: 1.0, phase: 0 },
      { x: 980, y: 40, baseAngle: Math.PI / 2, arc: 1.0, phase: 1.6 },
    ],
  },
];
