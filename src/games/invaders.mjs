import { BLINK, CS, EPS, P, PAD, ROWS, keyframes, n, pixels, svg, width } from '../core.mjs';

const FRAMES = [
  ['..X.....X..', '...X...X...', '..XXXXXXX..', '.XX.XXX.XX.', 'XXXXXXXXXXX', 'X.XXXXXXX.X', 'X.X.....X.X', '...XX.XX...'],
  ['..X.....X..', 'X..X...X..X', 'X.XXXXXXX.X', 'XXX.XXX.XXX', 'XXXXXXXXXXX', '.XXXXXXXXX.', '..X.....X..', '.X.......X.'],
];
const SHIP = ['......X......', '.....XXX.....', '.....XXX.....', '.XXXXXXXXXXX.', 'XXXXXXXXXXXXX', 'XXXXXXXXXXXXX', 'XXXXXXXXXXXXX'];
const SWAY = 6, AMP = 12, DT = 1 / 60;

// Every contribution is an invader; the ship clears the fleet column by column.
export default function invaders(grid, pal) {
  const cols = grid.length, W = width(cols), H = 230, GY = 18, SY = H - 20;
  const alive = grid.map(c => c.slice());
  const killT = grid.map(c => c.map(() => null));
  const fx = s => -AMP * Math.cos(2 * Math.PI * s / SWAY);
  const bullets = [], shots = [], shipStops = [];
  let t = 0.5, shipX = W / 2, cool = 0, next = 0;

  while (t < 240) {
    const ox = fx(t);
    let best = -1, bd = Infinity;
    for (let c = 0; c < cols; c++) {
      if (!alive[c].some(v => v)) continue;
      const d = Math.abs(PAD + ox + c * P + CS / 2 - shipX);
      if (d < bd) { bd = d; best = c; }
    }
    if (best < 0 && !bullets.length) break;
    if (t >= next) { shipStops.push([t, shipX]); next = t + 0.2; }
    if (best >= 0) {
      const tx = PAD + ox + best * P + CS / 2;
      shipX += Math.sign(tx - shipX) * Math.min(Math.abs(tx - shipX), 380 * DT);
      cool -= DT;
      if (cool <= 0 && Math.abs(tx - shipX) < 2) { bullets.push({ x: shipX, y: SY - 8, t0: t }); cool = 0.16; }
    }
    for (const b of bullets) {
      b.y -= 640 * DT;
      const lx = b.x - PAD - ox, c = Math.floor(lx / P), r = Math.floor((b.y - GY) / P);
      if (c >= 0 && c < cols && r >= 0 && r < ROWS && alive[c][r] && lx - c * P <= CS) {
        alive[c][r] = 0; killT[c][r] = t; b.done = true;
      } else if (b.y < -10) b.done = true;
      if (b.done) shots.push({ ...b, t1: t });
    }
    for (let i = bullets.length - 1; i >= 0; i--) if (bullets[i].done) bullets.splice(i, 1);
    t += DT;
  }
  const D = Math.ceil((t + 2) / SWAY) * SWAY; // whole sway cycles so the fleet loops cleanly
  shipStops.push([t, shipX], [D, shipX]);

  const tf = `transform-box:fill-box;transform-origin:center`;
  let css = `${BLINK}.fleet{animation:sway ${SWAY}s ease-in-out infinite}@keyframes sway{0%,100%{transform:translateX(${-AMP}px)}50%{transform:translateX(${AMP}px)}}`
    + `.fa{animation:la .5s step-end infinite}.fb{animation:lb .5s step-end infinite}.fleet>g{${tf}}`
    + `.ship{animation:ship ${D}s linear infinite}` + keyframes('ship', shipStops.map(([s, x]) => [s, `transform:translateX(${n(x)}px)`]), D);
  let defs = '';
  for (let lv = 1; lv <= 4; lv++) FRAMES.forEach((rows, f) => { defs += `<path id="i${f}${lv}" fill="${pal.levels[lv]}" d="${pixels(rows, 'X')}"/>`; });

  let fleet = '';
  for (let c = 0; c < cols; c++) for (let r = 0; r < ROWS; r++) {
    const x = PAD + c * P, y = GY + r * P;
    fleet += `<rect x="${x + 4}" y="${y + 4}" width="3" height="3" fill="${pal.slot}"/>`;
    if (!grid[c][r]) continue;
    const k = killT[c][r], id = `k${c}_${r}`;
    fleet += `<g class="${id}"><use class="fa" href="#i0${grid[c][r]}" x="${x}" y="${y + 1.5}"/><use class="fb" href="#i1${grid[c][r]}" x="${x}" y="${y + 1.5}"/></g>`;
    css += `.${id}{animation:${id} ${D}s linear infinite}` + keyframes(id, [
      [0, 'opacity:1;transform:scale(1)'], [k, 'opacity:1;transform:scale(1)'],
      [k + 0.25, 'opacity:0;transform:scale(1.8)'], [D, 'opacity:0;transform:scale(1.8)'],
    ], D);
  }
  let shotsSvg = '';
  shots.forEach((s, i) => {
    shotsSvg += `<rect class="b${i}" x="${n(s.x - 1)}" y="${SY - 14}" width="2" height="6" fill="${pal.ink}" opacity="0"/>`;
    const up = `transform:translateY(${n(s.y - (SY - 8))}px)`;
    css += `.b${i}{animation:b${i} ${D}s linear infinite}` + keyframes(`b${i}`, [
      [0, 'opacity:0;transform:translateY(0)'], [s.t0 - EPS, 'opacity:0;transform:translateY(0)'], [s.t0, 'opacity:1;transform:translateY(0)'],
      [s.t1, `opacity:1;${up}`], [s.t1 + EPS, `opacity:0;${up}`], [D, `opacity:0;${up}`],
    ], D);
  });

  const body = `<defs>${defs}</defs><g class="fleet">${fleet}</g>${shotsSvg}`
    + `<rect x="0" y="${SY + 4}" width="${W}" height="1" fill="${pal.line}"/>`
    + `<path class="ship" fill="${pal.accent}" d="${pixels(SHIP, 'X', 1, -6.5, SY - 7)}"/>`;
  return svg(W, H, css, body);
}
