// Puppy Care - a tiny 16-bit style top-down grooming game.
// Vanilla JS + Canvas, procedural pixel-art sprites, no external assets.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Logical (pixel-art) resolution scaled up for chunky pixels.
const W = 320;
const H = 200;
const SCALE = 3;
canvas.width = W * SCALE;
canvas.height = H * SCALE;
ctx.imageSmoothingEnabled = false;
ctx.scale(SCALE, SCALE);

// Palette
const C = {
  sky: '#8fd0ee',
  grass: '#5aa14a',
  grassDk: '#3f7a34',
  grassLt: '#78bd58',
  mud: '#5c3a1e',
  mudDk: '#3d2612',
  dirt: '#8a5a2e',
  wood: '#8a5a30',
  woodDk: '#5a3818',
  floor: '#e8c99a',
  floorDk: '#b48858',
  floorLine: '#a0724a',
  wall: '#c9b48e',
  wallDk: '#8a7454',
  fence: '#6b4423',
  fenceLt: '#8a5a30',
  water: '#6cc0ff',
  waterDk: '#3a86c9',
  foam: '#ffffff',
  tile: '#e8e0d0',
  black: '#1a1a20',
  outline: '#2a1b12',
  white: '#f8f8f8',
  gray: '#909090',
  puppy: '#d9a774',
  puppyDk: '#8a5f3f',
  puppySpot: '#5c3820',
  puppyNose: '#2a1810',
  tongue: '#e06070',
  collar: '#d03030',
  skin: '#f4c59c',
  hair: '#5c3820',
  shirt: '#3070c0',
  shirtDk: '#1e4a90',
  pants: '#404060',
  bootD: '#2a1b12',
  bathRim: '#c4c9d0',
  bathIn: '#8fb8d8',
  bowPink: '#ff69b4',
  bowPinkDk: '#c94a90',
  hatRed: '#c02020',
  hatRedDk: '#801515',
  bandana: '#4caf50',
  bandanaDk: '#2f7a34',
  hudBg: '#1a1a22',
  hudFg: '#f4f4f4',
  meterBg: '#333',
  meterFill: '#6ac06a',
  meterMid: '#e0c040',
  meterLow: '#d04040',
  dayBanner: '#f0d060',
};

// Draw a sprite from an ASCII grid using a palette map.
function drawSprite(rows, palette, x, y, flip) {
  x = Math.round(x);
  y = Math.round(y);
  const h = rows.length;
  for (let r = 0; r < h; r++) {
    const row = rows[r];
    const w = row.length;
    for (let c = 0; c < w; c++) {
      const ch = row[c];
      const color = palette[ch];
      if (!color) continue;
      const px = flip ? (w - 1 - c) : c;
      ctx.fillStyle = color;
      ctx.fillRect(x + px, y + r, 1, 1);
    }
  }
}

// --- Sprites -----------------------------------------------------------

const PUPPY_BASE = [
  '.............',
  '..OOO....OOO.',
  '.OBBBO..OBBBO',
  '.OBBBBOOBBBBO',
  'OBBWBBBBBWBBO',
  'OBBBNBBBBBBBO',
  'OBBBBBBBBBBBO',
  '.OBBBBBBBBBO.',
  '.O.OO.O.OO.O.',
  '.O.OO.O.OO.O.',
];

// Dirty variant: adds a few mud smudges
const PUPPY_DIRTY = [
  '.............',
  '..OOO....OOO.',
  '.OBBBO..OBBBO',
  '.OBBmBOOBBBBO',
  'OBBWBBBmBWBBO',
  'OBBBNBBBBBmBO',
  'OBmBBBBBBBBBO',
  '.OBBBBmBBBBO.',
  '.O.OO.O.OO.O.',
  '.O.OO.O.OO.O.',
];

const PUPPY_PAL_BASE = {
  O: C.outline,
  B: C.puppy,
  W: C.white,
  N: C.puppyNose,
  m: C.mud,
};

// Accessory overlay sprites (drawn on top of puppy, aligned to head area)
const ACC_BOW = [
  '.PpPpP.',
  'PpPPPpP',
  '.PpPpP.',
];
const ACC_BOW_PAL = { P: C.bowPink, p: C.bowPinkDk };

const ACC_HAT = [
  '..HHH..',
  '.HHHHH.',
  'HHHHHHH',
  'RRRRRRR',
];
const ACC_HAT_PAL = { H: C.hatRed, R: C.hatRedDk };

const ACC_BAND = [
  'GGGGGGGGGGG',
  'GgGgGgGgGgG',
  '.GgGgGgGgG.',
];
const ACC_BAND_PAL = { G: C.bandana, g: C.bandanaDk };

const ACCESSORIES = [
  { id: 'none', name: 'None' },
  { id: 'bow', name: 'Pink Bow' },
  { id: 'hat', name: 'Red Hat' },
  { id: 'bandana', name: 'Bandana' },
];

// Player sprite (facing directions)
// 10 wide x 16 tall
const PLAYER_DOWN = [
  '...HHHH...',
  '..HHHHHH..',
  '..HKKKKH..',
  '..HKKKKH..',
  '..HKKKKH..',
  '.SSSSSSSS.',
  'SSSSSSSSSS',
  'SSSSSSSSSS',
  '.SSSSSSSS.',
  '.SSSSSSSS.',
  '.KKKKKKKK.',
  '.PPPP.PPPP',
  '.PPPP.PPPP',
  '.PPPP.PPPP',
  '.BBBB.BBBB',
  '.BBBB.BBBB',
];
const PLAYER_UP = [
  '...HHHH...',
  '..HHHHHH..',
  '..HHHHHH..',
  '..HHHHHH..',
  '..HHHHHH..',
  '.SSSSSSSS.',
  'SSSSSSSSSS',
  'SSSSSSSSSS',
  '.SSSSSSSS.',
  '.SSSSSSSS.',
  '.KKKKKKKK.',
  '.PPPP.PPPP',
  '.PPPP.PPPP',
  '.PPPP.PPPP',
  '.BBBB.BBBB',
  '.BBBB.BBBB',
];
const PLAYER_SIDE = [
  '...HHHH...',
  '..HHHHHH..',
  '..HKKHHH..',
  '..HKKKKH..',
  '..HHKKHH..',
  '..SSSSSS..',
  '.SSSSSSSS.',
  'SSSSSSSSSS',
  '.SSSSSSSS.',
  '.SSSSSSSS.',
  '..KKKKKK..',
  '..PPPPPP..',
  '..PPPPPP..',
  '..PPPPPP..',
  '..BBBBBB..',
  '..BBBBBB..',
];
const PLAYER_PAL = {
  H: C.hair,
  K: C.skin,
  S: C.shirt,
  P: C.pants,
  B: C.bootD,
};

// Bathtub sprite (24x14)
const TUB = [
  '........................',
  '..RRRRRRRRRRRRRRRRRRRR..',
  '.RRWWWWWWWWWWWWWWWWWWRR.',
  '.RWwwwwwwwwwwwwwwwwwwWR.',
  '.RWwWWwwwwWWwwwwWWwwwWR.',
  '.RWwwwWWwwwwwwWWwwwwwWR.',
  '.RWwwwwwwwWWwwwwwwwwWWR.',
  '.RWwwWWwwwwwwwWWwwwwwWR.',
  '.RWwwwwwwWWwwwwwwWWwwWR.',
  '.RWWWWWWWWWWWWWWWWWWWWR.',
  '.RRRRRRRRRRRRRRRRRRRRRR.',
  '..RRRRRRRRRRRRRRRRRRRR..',
  '.LL................LL...',
  '.LL................LL...',
];
const TUB_PAL = {
  R: C.bathRim,
  W: C.bathIn,
  w: C.waterDk,
  L: C.wallDk,
};

// Brush station (a small table with a brush) 20x14
const BRUSH = [
  '.....BBBB...........',
  '....BbbbbB..........',
  '....BbbbbB..........',
  '....BbbbbB..........',
  '....BbbbbB..........',
  '..HHHHHHHHHHHHHHHH..',
  '..HhhhhhhhhhhhhhhH..',
  '..HHHHHHHHHHHHHHHH..',
  '..W..............W..',
  '..W..............W..',
  '..W..............W..',
  '..W..............W..',
  '..W..............W..',
  '..W..............W..',
];
const BRUSH_PAL = {
  B: C.outline,
  b: C.hatRed,
  H: C.woodDk,
  h: C.wood,
  W: C.woodDk,
};

// Wardrobe (18x22)
const WARDROBE = [
  'OOOOOOOOOOOOOOOOOO',
  'OWWWWWWWWWWWWWWWWO',
  'OWwwwwwwwwwwwwwwWO',
  'OWwOOOOOOOOOOOwwWO',
  'OWwOPPPPPPPPPOwwWO',
  'OWwOPPPPPPPPPOwwWO',
  'OWwOPPHHHHHHHOwwWO',
  'OWwOPPHhhhhhHOwwWO',
  'OWwOPPHhBhhhHOwwWO',
  'OWwOPPHhhhhhHOwwWO',
  'OWwOPPPPPPPPPOwwWO',
  'OWwOPPPPPPPPPOwwWO',
  'OWwOOOOOOOOOOOwwWO',
  'OWwwwwwwwwwwwwwwWO',
  'OWwwwwwwwwwwwwwwWO',
  'OWwwwOOOOOOOwwwwWO',
  'OWwwwwwwwwwwwwwwWO',
  'OWwwwwwwwwwwwwwwWO',
  'OWWWWWWWWWWWWWWWWO',
  'OOOOOOOOOOOOOOOOOO',
  '.LL............LL.',
  '.LL............LL.',
];
const WARD_PAL = {
  O: C.outline,
  W: C.wood,
  w: C.woodDk,
  P: C.bathIn,
  H: C.hatRed,
  h: C.hatRedDk,
  B: C.white,
  L: C.wallDk,
};

// Ball toy for backyard
const BALL = [
  '..OOO..',
  '.OWRRWO',
  'OWRRWRO',
  'OWRWRRO',
  'OWRRWRO',
  '.OWRRWO',
  '..OOO..',
];
const BALL_PAL = { O: C.outline, R: C.hatRed, W: C.white };

// --- World -------------------------------------------------------------
// Two side-by-side rooms. Player walks between via a doorway in the wall.

const HOUSE = { x: 0, y: 20, w: 160, h: 180 };
const YARD = { x: 160, y: 20, w: 160, h: 180 };
const DOOR = { x: 156, y: 100, w: 8, h: 32 }; // gap in the dividing wall

// Grouped "furniture" / stations
const STATIONS = [
  { kind: 'tub',    x: 20,  y: 40,  w: 24, h: 14 },
  { kind: 'brush',  x: 60,  y: 40,  w: 20, h: 14 },
  { kind: 'wardrobe', x: 110, y: 32, w: 18, h: 22 },
];

// Mud patches in backyard (fixed spots)
const MUD_PATCHES = [
  { x: 200, y: 70,  r: 12 },
  { x: 250, y: 130, r: 14 },
  { x: 210, y: 160, r: 10 },
  { x: 280, y: 90,  r: 9 },
];

// Ball rests in yard
const BALL_POS = { x: 240, y: 105 };

// --- Game state --------------------------------------------------------

const state = {
  player: {
    x: 70, y: 130, dir: 'down',
    speed: 55,     // pixels/sec
    carrying: false,
    accIndex: 0,
  },
  puppy: {
    x: 90, y: 130,
    vx: 0, vy: 0,
    dir: 'down',
    targetX: 90, targetY: 130,
    thinkTimer: 0,
    accessory: 'none',
    heldOffsetY: -8,
    tailPhase: 0,
  },
  meters: {
    clean: 90,   // 0 dirty, 100 spotless
    shine: 90,   // fur condition
    happy: 80,
  },
  day: 1,
  dayTime: 0,      // seconds elapsed in current day
  dayLength: 75,   // seconds per day
  totalScore: 0,
  lastScore: 0,

  // Interaction state
  mode: 'play',     // 'play' | 'bathing' | 'brushing' | 'dayEnd' | 'title'
  actTimer: 0,
  actProgress: 0,
  toast: null,      // { text, timer }
};

// Ensure the game starts on a title/intro screen.
state.mode = 'title';

// --- Input -------------------------------------------------------------

const keys = new Set();
const pressed = new Set(); // one-shot presses
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
  if (!keys.has(k)) pressed.add(k);
  keys.add(k);
});
window.addEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase());
});

function consumePress(k) {
  if (pressed.has(k)) { pressed.delete(k); return true; }
  return false;
}

// --- Helpers -----------------------------------------------------------

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function dist2(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by; return dx*dx + dy*dy;
}
function rectContains(r, x, y) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}
function rectsOverlap(a, b) {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x ||
           a.y + a.h <= b.y || b.y + b.h <= a.y);
}

function playerRect() {
  return { x: state.player.x - 4, y: state.player.y - 6, w: 8, h: 12 };
}
function puppyRect() {
  return { x: state.puppy.x - 5, y: state.puppy.y - 3, w: 10, h: 8 };
}

function nearestStation() {
  const px = state.player.x, py = state.player.y;
  let best = null, bestD = 30 * 30;
  for (const s of STATIONS) {
    const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
    const d = dist2(px, py, cx, cy);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

function puppyIsNear() {
  return dist2(state.player.x, state.player.y, state.puppy.x, state.puppy.y) < 22 * 22;
}

function inMud(x, y) {
  for (const m of MUD_PATCHES) {
    if (dist2(x, y, m.x, m.y) < m.r * m.r) return true;
  }
  return false;
}

// Solid rectangles the player and puppy shouldn't walk through.
function solids() {
  const out = [];
  for (const s of STATIONS) out.push({ x: s.x, y: s.y + 4, w: s.w, h: s.h - 4 });
  return out;
}

function collides(rect) {
  for (const s of solids()) if (rectsOverlap(rect, s)) return true;
  return false;
}

// Movement inside the world bounds and through the doorway
function withinRoom(x, y) {
  const padTop = 22, padBot = 6, padSide = 6;
  if (y < padTop || y > H - padBot) return false;
  const inHouse = x >= padSide && x <= HOUSE.x + HOUSE.w - 6;
  const inYard  = x >= YARD.x + 6 && x <= W - padSide;

  // Wall between house and yard is at x=160, with a doorway
  if (x > HOUSE.x + HOUSE.w - 6 && x < YARD.x + 6) {
    // in the wall zone: must be within the doorway y-range
    return y > DOOR.y + 2 && y < DOOR.y + DOOR.h - 2;
  }
  return inHouse || inYard;
}

function tryMove(entity, dx, dy, w, h) {
  const nx = entity.x + dx;
  const ny = entity.y + dy;
  // Try axis separately for smoother wall sliding
  const testX = { x: nx - w/2, y: entity.y - h/2, w, h };
  if (withinRoom(nx, entity.y) && !collides(testX)) entity.x = nx;
  const testY = { x: entity.x - w/2, y: ny - h/2, w, h };
  if (withinRoom(entity.x, ny) && !collides(testY)) entity.y = ny;
}

function toast(text, secs=2) {
  state.toast = { text, timer: secs };
}

// --- Update ------------------------------------------------------------

let last = performance.now();

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function update(dt) {
  if (state.mode === 'title') {
    if (consumePress(' ') || consumePress('enter')) {
      state.mode = 'play';
      toast(`Day ${state.day}: care for your puppy!`, 3);
    }
    return;
  }

  if (state.mode === 'dayEnd') {
    if (consumePress(' ') || consumePress('enter')) {
      state.day += 1;
      state.dayTime = 0;
      // Slight decay to give player something to fix each day
      state.meters.clean = clamp(state.meters.clean, 30, 100);
      state.meters.shine = clamp(state.meters.shine, 30, 100);
      state.meters.happy = clamp(state.meters.happy, 30, 100);
      state.mode = 'play';
      toast(`Day ${state.day} begins!`, 2.5);
    }
    return;
  }

  // Timers
  state.dayTime += dt;
  if (state.toast) {
    state.toast.timer -= dt;
    if (state.toast.timer <= 0) state.toast = null;
  }

  if (state.mode === 'bathing' || state.mode === 'brushing') {
    updateMiniGame(dt);
    return;
  }

  // Player movement
  updatePlayer(dt);

  // Puppy behavior
  updatePuppy(dt);

  // Passive meter drift
  driftMeters(dt);

  // Interaction inputs
  handleInteractions();

  // End of day
  if (state.dayTime >= state.dayLength) {
    endDay();
  }
}

function updatePlayer(dt) {
  let dx = 0, dy = 0;
  if (keys.has('arrowleft')  || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup')    || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown')  || keys.has('s')) dy += 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    if (Math.abs(dx) > Math.abs(dy)) state.player.dir = dx < 0 ? 'left' : 'right';
    else state.player.dir = dy < 0 ? 'up' : 'down';
    tryMove(state.player, dx * state.player.speed * dt, dy * state.player.speed * dt, 8, 12);
  }

  // Carried puppy follows player
  if (state.player.carrying) {
    state.puppy.x = state.player.x;
    state.puppy.y = state.player.y - 10;
  }
}

function updatePuppy(dt) {
  if (state.player.carrying) return;

  state.puppy.tailPhase = (state.puppy.tailPhase + dt * 6) % (Math.PI * 2);
  state.puppy.thinkTimer -= dt;

  if (state.puppy.thinkTimer <= 0) {
    pickNewTarget();
    state.puppy.thinkTimer = 1.5 + Math.random() * 2.5;
  }

  const dx = state.puppy.targetX - state.puppy.x;
  const dy = state.puppy.targetY - state.puppy.y;
  const d = Math.hypot(dx, dy);
  if (d > 2) {
    const nx = dx / d, ny = dy / d;
    if (Math.abs(nx) > Math.abs(ny)) state.puppy.dir = nx < 0 ? 'left' : 'right';
    else state.puppy.dir = ny < 0 ? 'up' : 'down';
    const spd = 30;
    tryMove(state.puppy, nx * spd * dt, ny * spd * dt, 10, 8);
  } else {
    state.puppy.thinkTimer = Math.min(state.puppy.thinkTimer, 0.5);
  }

  // Dirt from mud
  if (inMud(state.puppy.x, state.puppy.y)) {
    state.meters.clean = clamp(state.meters.clean - 12 * dt, 0, 100);
    state.meters.happy = clamp(state.meters.happy + 2 * dt, 0, 100); // puppy likes mud
  }
  // Playing near ball raises happiness
  if (dist2(state.puppy.x, state.puppy.y, BALL_POS.x, BALL_POS.y) < 20 * 20) {
    state.meters.happy = clamp(state.meters.happy + 3 * dt, 0, 100);
  }
}

function pickNewTarget() {
  // Puppy prefers the yard 60% of the time (chases ball / mud)
  const goYard = Math.random() < 0.6;
  if (goYard) {
    // Aim near ball or a mud patch or random yard spot
    const r = Math.random();
    if (r < 0.35) {
      state.puppy.targetX = BALL_POS.x + (Math.random()*20-10);
      state.puppy.targetY = BALL_POS.y + (Math.random()*20-10);
    } else if (r < 0.75) {
      const m = MUD_PATCHES[Math.floor(Math.random() * MUD_PATCHES.length)];
      state.puppy.targetX = m.x + (Math.random()*10-5);
      state.puppy.targetY = m.y + (Math.random()*10-5);
    } else {
      state.puppy.targetX = YARD.x + 15 + Math.random() * (YARD.w - 30);
      state.puppy.targetY = YARD.y + 15 + Math.random() * (YARD.h - 30);
    }
  } else {
    state.puppy.targetX = HOUSE.x + 15 + Math.random() * (HOUSE.w - 30);
    state.puppy.targetY = HOUSE.y + 30 + Math.random() * (HOUSE.h - 50);
  }
  state.puppy.targetX = clamp(state.puppy.targetX, 8, W - 8);
  state.puppy.targetY = clamp(state.puppy.targetY, 26, H - 8);
}

function driftMeters(dt) {
  state.meters.shine = clamp(state.meters.shine - 1.8 * dt, 0, 100);
  state.meters.happy = clamp(state.meters.happy - 1.0 * dt, 0, 100);
  // Clean drifts down slightly even without mud (dust)
  state.meters.clean = clamp(state.meters.clean - 0.4 * dt, 0, 100);
}

function handleInteractions() {
  if (consumePress(' ')) {
    if (!state.player.carrying && puppyIsNear()) {
      state.player.carrying = true;
      toast('Picked up puppy');
    } else if (state.player.carrying) {
      state.player.carrying = false;
      // Set puppy down slightly in front of the player
      const off = state.player.dir;
      let ox = 0, oy = 12;
      if (off === 'up')    { ox = 0;  oy = -12; }
      if (off === 'down')  { ox = 0;  oy =  12; }
      if (off === 'left')  { ox = -12; oy = 0; }
      if (off === 'right') { ox =  12; oy = 0; }
      let nx = clamp(state.player.x + ox, 10, W - 10);
      let ny = clamp(state.player.y + oy, 26, H - 10);
      if (!withinRoom(nx, ny)) { nx = state.player.x; ny = state.player.y + 12; }
      state.puppy.x = nx;
      state.puppy.y = ny;
      state.puppy.targetX = nx;
      state.puppy.targetY = ny;
      state.puppy.thinkTimer = 1.0;
      toast('Set puppy down');
    }
  }

  if (consumePress('e')) {
    const st = nearestStation();
    if (!st) { toast('Nothing nearby'); return; }
    if (st.kind === 'wardrobe') {
      // Cycle accessory when at wardrobe with E
      cycleAccessory();
      return;
    }
    if (!state.player.carrying) {
      toast('Bring the puppy here first');
      return;
    }
    if (st.kind === 'tub') {
      state.mode = 'bathing';
      state.actTimer = 0;
      state.actProgress = 0;
      toast('Bathing... mash E!');
    } else if (st.kind === 'brush') {
      state.mode = 'brushing';
      state.actTimer = 0;
      state.actProgress = 0;
      toast('Brushing... mash E!');
    }
  }

  if (consumePress('q')) {
    // Q cycles accessory without needing wardrobe (quick swap)
    if (nearestStation()?.kind === 'wardrobe') cycleAccessory();
    else toast('Stand at the wardrobe to change accessories');
  }
}

function cycleAccessory() {
  state.player.accIndex = (state.player.accIndex + 1) % ACCESSORIES.length;
  state.puppy.accessory = ACCESSORIES[state.player.accIndex].id;
  state.meters.happy = clamp(state.meters.happy + 6, 0, 100);
  toast(`Accessory: ${ACCESSORIES[state.player.accIndex].name}`);
}

function updateMiniGame(dt) {
  state.actTimer += dt;
  if (consumePress('e')) {
    state.actProgress += 12;
  }
  // Gentle passive drain so mashing feels needed
  state.actProgress = clamp(state.actProgress - 5 * dt, 0, 100);

  if (state.actProgress >= 100 || state.actTimer > 8) {
    const success = state.actProgress >= 60;
    if (state.mode === 'bathing') {
      const amount = success ? 55 : 25;
      state.meters.clean = clamp(state.meters.clean + amount, 0, 100);
      state.meters.happy = clamp(state.meters.happy + (success ? 8 : 2), 0, 100);
      toast(success ? 'Sparkling clean!' : 'A quick rinse.');
    } else if (state.mode === 'brushing') {
      const amount = success ? 55 : 25;
      state.meters.shine = clamp(state.meters.shine + amount, 0, 100);
      state.meters.happy = clamp(state.meters.happy + (success ? 8 : 2), 0, 100);
      toast(success ? 'Coat is glossy!' : 'A few brush strokes.');
    }
    state.mode = 'play';
  }
}

function endDay() {
  const s = Math.round((state.meters.clean + state.meters.shine + state.meters.happy) / 3);
  state.lastScore = s;
  state.totalScore += s;
  state.mode = 'dayEnd';
}

// --- Render ------------------------------------------------------------

function render() {
  // Background
  ctx.fillStyle = C.hudBg;
  ctx.fillRect(0, 0, W, H);

  drawWorld();

  drawStations();
  drawBall();

  // Draw player + puppy in y-order for basic depth
  const entities = [
    { y: state.puppy.y, draw: drawPuppy },
    { y: state.player.y, draw: drawPlayer },
  ];
  entities.sort((a, b) => a.y - b.y);
  for (const e of entities) e.draw();

  drawHUD();

  if (state.mode === 'bathing' || state.mode === 'brushing') drawMiniGameOverlay();
  if (state.mode === 'dayEnd') drawDayEndOverlay();
  if (state.mode === 'title') drawTitleOverlay();

  drawToast();
}

function drawWorld() {
  // HUD strip at the top (drawn later on top too)
  // House floor
  drawFloor(HOUSE);
  // Yard grass
  drawGrass(YARD);

  // Mud patches
  for (const m of MUD_PATCHES) drawMud(m);

  // Interior walls (top strip)
  // House wall band
  ctx.fillStyle = C.wall;
  ctx.fillRect(HOUSE.x, HOUSE.y, HOUSE.w, 10);
  ctx.fillStyle = C.wallDk;
  ctx.fillRect(HOUSE.x, HOUSE.y + 10, HOUSE.w, 2);

  // Fence around yard top
  drawFence(YARD.x, YARD.y, YARD.w, 10);

  // Dividing wall/fence
  ctx.fillStyle = C.wall;
  ctx.fillRect(HOUSE.x + HOUSE.w - 4, HOUSE.y, 4, DOOR.y - HOUSE.y);
  ctx.fillRect(HOUSE.x + HOUSE.w - 4, DOOR.y + DOOR.h, 4, H - (DOOR.y + DOOR.h));
  ctx.fillStyle = C.wallDk;
  ctx.fillRect(HOUSE.x + HOUSE.w - 5, HOUSE.y, 1, DOOR.y - HOUSE.y);
  ctx.fillRect(HOUSE.x + HOUSE.w - 5, DOOR.y + DOOR.h, 1, H - (DOOR.y + DOOR.h));

  // Fence side of divider
  drawFenceVert(YARD.x, YARD.y, DOOR.y - YARD.y);
  drawFenceVert(YARD.x, DOOR.y + DOOR.h, H - (DOOR.y + DOOR.h));

  // Doorway rug
  ctx.fillStyle = C.wood;
  ctx.fillRect(DOOR.x, DOOR.y + 2, DOOR.w, DOOR.h - 4);
  ctx.fillStyle = C.woodDk;
  for (let y = DOOR.y + 4; y < DOOR.y + DOOR.h - 4; y += 4) {
    ctx.fillRect(DOOR.x, y, DOOR.w, 1);
  }
}

function drawFloor(r) {
  ctx.fillStyle = C.floor;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  // planks
  ctx.fillStyle = C.floorLine;
  for (let y = r.y + 8; y < r.y + r.h; y += 12) {
    ctx.fillRect(r.x, y, r.w, 1);
  }
  ctx.fillStyle = C.floorDk;
  for (let x = r.x + 24; x < r.x + r.w; x += 32) {
    for (let y = r.y + 8; y < r.y + r.h; y += 24) {
      ctx.fillRect(x, y + 4, 1, 6);
    }
  }
}

function drawGrass(r) {
  ctx.fillStyle = C.grass;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  // grass tufts
  ctx.fillStyle = C.grassDk;
  for (let i = 0; i < 60; i++) {
    const x = r.x + ((i * 37) % r.w);
    const y = r.y + 20 + ((i * 53) % (r.h - 24));
    ctx.fillRect(x, y, 2, 1);
    ctx.fillRect(x + 1, y - 1, 1, 1);
  }
  ctx.fillStyle = C.grassLt;
  for (let i = 0; i < 30; i++) {
    const x = r.x + ((i * 71 + 5) % r.w);
    const y = r.y + 24 + ((i * 41) % (r.h - 30));
    ctx.fillRect(x, y, 1, 1);
  }
}

function drawMud(m) {
  // Chunky circle-ish blob
  const cx = m.x, cy = m.y, r = m.r;
  ctx.fillStyle = C.mud;
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x*x + y*y <= r*r) ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
  ctx.fillStyle = C.mudDk;
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(cx + ((i * 5) % r) - r/2, cy + ((i * 3) % r) - r/2, 2, 1);
  }
}

function drawFence(x, y, w, h) {
  ctx.fillStyle = C.fence;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = C.fenceLt;
  for (let i = 0; i < w; i += 6) ctx.fillRect(x + i, y, 1, h);
  ctx.fillStyle = C.fence;
  ctx.fillRect(x, y + h - 2, w, 2);
}

function drawFenceVert(x, y, h) {
  ctx.fillStyle = C.fence;
  ctx.fillRect(x, y, 4, h);
  ctx.fillStyle = C.fenceLt;
  for (let i = 0; i < h; i += 6) ctx.fillRect(x, y + i, 4, 1);
}

function drawStations() {
  for (const s of STATIONS) {
    if (s.kind === 'tub')      drawSprite(TUB, TUB_PAL, s.x, s.y);
    if (s.kind === 'brush')    drawSprite(BRUSH, BRUSH_PAL, s.x, s.y);
    if (s.kind === 'wardrobe') drawSprite(WARDROBE, WARD_PAL, s.x, s.y);
  }
}

function drawBall() {
  drawSprite(BALL, BALL_PAL, BALL_POS.x - 3, BALL_POS.y - 3);
}

function drawPuppy() {
  const p = state.puppy;
  const dirty = state.meters.clean < 55;
  const sprite = dirty ? PUPPY_DIRTY : PUPPY_BASE;
  const flip = p.dir === 'left';
  const x = p.x - 6, y = p.y - 5;

  // little shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x + 1, y + 10, 11, 1);

  drawSprite(sprite, PUPPY_PAL_BASE, x, y, flip);

  // Tail wag: draw a tiny extra pixel that swings
  const tail = Math.sin(p.tailPhase) > 0 ? -1 : 0;
  ctx.fillStyle = C.puppyDk;
  ctx.fillRect(x + (flip ? 13 : -1), y + 4 + tail, 1, 2);

  // Accessory overlay
  if (p.accessory === 'bow') {
    drawSprite(ACC_BOW, ACC_BOW_PAL, x + (flip ? 6 : 0), y - 2, flip);
  } else if (p.accessory === 'hat') {
    drawSprite(ACC_HAT, ACC_HAT_PAL, x + (flip ? 6 : 0), y - 3, flip);
  } else if (p.accessory === 'bandana') {
    drawSprite(ACC_BAND, ACC_BAND_PAL, x + 1, y + 6, flip);
  }

  // Sparkle when very clean & shiny
  if (state.meters.clean > 85 && state.meters.shine > 85) {
    const t = Math.floor(performance.now() / 200) % 4;
    ctx.fillStyle = C.white;
    if (t === 0) ctx.fillRect(x + 2, y + 1, 1, 1);
    if (t === 1) ctx.fillRect(x + 10, y + 2, 1, 1);
    if (t === 2) ctx.fillRect(x + 6, y - 1, 1, 1);
  }
}

function drawPlayer() {
  const p = state.player;
  const rows = p.dir === 'up' ? PLAYER_UP :
               p.dir === 'down' ? PLAYER_DOWN :
               PLAYER_SIDE;
  const flip = p.dir === 'left';
  const x = p.x - 5, y = p.y - 12;

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x + 1, y + 16, 8, 1);

  drawSprite(rows, PLAYER_PAL, x, y, flip);

  // If carrying, draw a little "held" indicator dot
  if (p.carrying) {
    ctx.fillStyle = C.foam;
    ctx.fillRect(x + 4, y - 2, 2, 1);
  }
}

// Pixel font (tiny 3x5) --------------------------------------------------
const FONT = {
  A:[' # ','# #','###','# #','# #'],
  B:['## ','# #','## ','# #','## '],
  C:[' ##','#  ','#  ','#  ',' ##'],
  D:['## ','# #','# #','# #','## '],
  E:['###','#  ','## ','#  ','###'],
  F:['###','#  ','## ','#  ','#  '],
  G:[' ##','#  ','# #','# #',' ##'],
  H:['# #','# #','###','# #','# #'],
  I:['###',' # ',' # ',' # ','###'],
  J:['  #','  #','  #','# #',' # '],
  K:['# #','# #','## ','# #','# #'],
  L:['#  ','#  ','#  ','#  ','###'],
  M:['# #','###','###','# #','# #'],
  N:['# #','###','###','###','# #'],
  O:[' # ','# #','# #','# #',' # '],
  P:['## ','# #','## ','#  ','#  '],
  Q:[' # ','# #','# #','###',' ##'],
  R:['## ','# #','## ','# #','# #'],
  S:[' ##','#  ',' # ','  #','## '],
  T:['###',' # ',' # ',' # ',' # '],
  U:['# #','# #','# #','# #',' # '],
  V:['# #','# #','# #',' # ','   '.replace(' ',' ')],
  W:['# #','# #','###','###','# #'],
  X:['# #','# #',' # ','# #','# #'],
  Y:['# #','# #',' # ',' # ',' # '],
  Z:['###','  #',' # ','#  ','###'],
  '0':[' # ','# #','# #','# #',' # '],
  '1':[' # ','## ',' # ',' # ','###'],
  '2':['## ','  #',' # ','#  ','###'],
  '3':['## ','  #',' # ','  #','## '],
  '4':['# #','# #','###','  #','  #'],
  '5':['###','#  ','## ','  #','## '],
  '6':[' # ','#  ','## ','# #',' # '],
  '7':['###','  #',' # ',' # ',' # '],
  '8':[' # ','# #',' # ','# #',' # '],
  '9':[' # ','# #',' ##','  #',' # '],
  ':':['   ',' # ','   ',' # ','   '],
  '!':[' # ',' # ',' # ','   ',' # '],
  '?':['## ','  #',' # ','   ',' # '],
  '.':['   ','   ','   ','   ',' # '],
  ',':['   ','   ','   ',' # ','#  '],
  '-':['   ','   ','###','   ','   '],
  '/':['  #','  #',' # ','#  ','#  '],
  ' ':['   ','   ','   ','   ','   '],
};

function drawText(text, x, y, color, scale=1) {
  text = String(text).toUpperCase();
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of text) {
    const g = FONT[ch] || FONT[' '];
    for (let r = 0; r < g.length; r++) {
      const row = g[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] === '#') ctx.fillRect(cx + c*scale, y + r*scale, scale, scale);
      }
    }
    cx += 4 * scale;
  }
}

function textWidth(text, scale=1) {
  return String(text).length * 4 * scale;
}

function drawHUD() {
  // Top HUD bar
  ctx.fillStyle = C.hudBg;
  ctx.fillRect(0, 0, W, 20);
  ctx.fillStyle = C.wallDk;
  ctx.fillRect(0, 19, W, 1);

  // Meter labels + bars
  drawMeter(4,   4, 'CLEAN',  state.meters.clean);
  drawMeter(80,  4, 'SHINE',  state.meters.shine);
  drawMeter(156, 4, 'HAPPY',  state.meters.happy);

  // Day + timer + score
  const dayText = `DAY ${state.day}`;
  drawText(dayText, 232, 3, C.hudFg);
  const remaining = Math.max(0, Math.ceil(state.dayLength - state.dayTime));
  drawText(`${remaining}S`, 232, 11, C.dayBanner);
  drawText(`SCORE ${state.totalScore}`, 268, 3, C.hudFg);
  const acc = ACCESSORIES[state.player.accIndex].name;
  drawText(acc.slice(0, 10), 268, 11, C.bowPink);
}

function drawMeter(x, y, label, val) {
  drawText(label, x, y, C.hudFg);
  const bx = x + 24, by = y + 1, bw = 46, bh = 5;
  ctx.fillStyle = C.meterBg;
  ctx.fillRect(bx, by, bw, bh);
  const fill = Math.round((clamp(val, 0, 100) / 100) * (bw - 2));
  let color = C.meterFill;
  if (val < 60) color = C.meterMid;
  if (val < 30) color = C.meterLow;
  ctx.fillStyle = color;
  ctx.fillRect(bx + 1, by + 1, fill, bh - 2);
}

function drawToast() {
  if (!state.toast) return;
  const t = state.toast.text;
  const w = textWidth(t) + 8;
  const x = Math.round((W - w) / 2), y = H - 20;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x, y, w, 10);
  drawText(t, x + 4, y + 3, C.white);
}

function drawMiniGameOverlay() {
  const x = 60, y = 70, w = 200, h = 60;
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.white;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  const title = state.mode === 'bathing' ? 'BATH TIME!' : 'BRUSH TIME!';
  drawText(title, x + w/2 - textWidth(title)/2, y + 8, C.dayBanner);
  drawText('MASH E TO FILL THE BAR', x + w/2 - textWidth('MASH E TO FILL THE BAR')/2, y + 20, C.white);

  const bx = x + 20, by = y + 34, bw = w - 40, bh = 10;
  ctx.fillStyle = C.meterBg;
  ctx.fillRect(bx, by, bw, bh);
  const fill = Math.round((state.actProgress / 100) * (bw - 2));
  ctx.fillStyle = state.mode === 'bathing' ? C.bathIn : C.hatRed;
  ctx.fillRect(bx + 1, by + 1, fill, bh - 2);

  const timeLeft = Math.max(0, 8 - state.actTimer).toFixed(1);
  drawText(`TIME ${timeLeft}`, x + w/2 - textWidth(`TIME ${timeLeft}`)/2, y + 48, C.white);
}

function drawDayEndOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2;
  drawText('END OF DAY', cx - textWidth('END OF DAY', 2)/2, 60, C.dayBanner, 2);
  drawText(`DAY ${state.day} SCORE  ${state.lastScore}`, cx - textWidth(`DAY ${state.day} SCORE  ${state.lastScore}`)/2, 90, C.white);
  drawText(`TOTAL SCORE  ${state.totalScore}`, cx - textWidth(`TOTAL SCORE  ${state.totalScore}`)/2, 104, C.white);

  const rating =
    state.lastScore >= 90 ? 'BEST FRIEND!' :
    state.lastScore >= 75 ? 'GOOD DOG PARENT' :
    state.lastScore >= 50 ? 'ROOM TO IMPROVE' :
    'THE PUPPY IS SAD';
  drawText(rating, cx - textWidth(rating)/2, 124, C.bowPink);

  drawText('PRESS SPACE FOR NEXT DAY', cx - textWidth('PRESS SPACE FOR NEXT DAY')/2, 160, C.white);
}

function drawTitleOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2;
  drawText('PUPPY CARE', cx - textWidth('PUPPY CARE', 3)/2, 40, C.dayBanner, 3);
  drawText('KEEP YOUR PUPPY CLEAN,', cx - textWidth('KEEP YOUR PUPPY CLEAN,')/2, 90, C.white);
  drawText('SHINY, AND HAPPY.', cx - textWidth('SHINY, AND HAPPY.')/2, 100, C.white);
  drawText('PICK UP WITH SPACE,', cx - textWidth('PICK UP WITH SPACE,')/2, 120, C.white);
  drawText('USE STATIONS WITH E.', cx - textWidth('USE STATIONS WITH E.')/2, 130, C.white);
  drawText('PRESS SPACE TO START', cx - textWidth('PRESS SPACE TO START')/2, 165, C.bowPink);
}
