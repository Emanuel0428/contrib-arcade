import { CS, P, PAD, BLINK, cell, keyframes, n, pixels, svg, width } from '../core.mjs';

const HERO = { R: '#f85149', S: '#f0c8a0', B: '#4493f8', K: '#a0703c', E: '#1f2328' };
const BODY = ['..RRRR..', '.RRRRRRR', '.SSSES..', '.SSSSSSS', '..SSSS..', '.RRBBRR.', 'RRBBBBRR', 'S.BBBB.S', '..BBBB..'];
const BLANK = BODY.map(() => '........');
const LEGS_A = [...BLANK, '.BB..BB.', '.KK..KK.'];
const LEGS_B = [...BLANK, '..B..B..', '..K..K..'];

const sprite = rows => Object.entries(HERO)
  .map(([ch, fill]) => { const d = pixels(rows, ch, 1.8, -7.2, -19.8); return d ? `<path fill="${fill}" d="${d}"/>` : ''; })
  .join('');

// The real contribution grid is the level: every active day is a block in its
// own spot. The hero hops along the highest block of each week; empty weeks are pits.
export default function platformer(grid, pal) {
  const cols = grid.length, W = width(cols), GY = 48, H = GY + 7 * P + 4;
  const flat = grid.filter(c => c.some(v => v > 0)).length < 2; // no activity: walk on row 6
  const top = grid.map(c => (flat ? 6 : c.findIndex(v => v > 0)));
  const stands = top.map((r, c) => (r >= 0 ? c : -1)).filter(c => c >= 0);
  const cx = c => PAD + c * P + CS / 2;
  const fy = c => GY + top[c] * P;

  const track = [[0, cx(stands[0]), fy(stands[0])]];
  const arrive = {};
  let t = 0.6;
  for (let i = 0; i < stands.length - 1; i++) {
    const a = stands[i], b = stands[i + 1];
    const walk = b === a + 1 && top[a] === top[b];
    const dur = walk ? 0.2 : 0.32 + 0.08 * (b - a - 1);
    track.push([t, cx(a), fy(a)]);
    if (!walk) {
      const yA = fy(a), yB = fy(b), yC = 2 * (Math.min(yA, yB) - 24) - (yA + yB) / 2;
      for (let k = 1; k < 8; k++) {
        const u = k / 8;
        track.push([t + u * dur, cx(a) + (cx(b) - cx(a)) * u, (1 - u) ** 2 * yA + 2 * u * (1 - u) * yC + u * u * yB]);
      }
    }
    t += dur;
    arrive[b] = t;
  }
  const last = stands[stands.length - 1];
  const D = t + 1.8;
  track.push([t, cx(last), fy(last)], [D, cx(last), fy(last)]);

  let css = `${BLINK}#hero{animation:hero ${n(D)}s linear infinite}.la{animation:la .24s step-end infinite}.lb{animation:lb .24s step-end infinite}`
    + `.spin{transform-box:fill-box;transform-origin:center;animation:spin .8s ease-in-out infinite alternate}@keyframes spin{to{transform:scaleX(.25)}}`
    + `.cloud{animation:cloud 60s linear infinite}@keyframes cloud{from{transform:translateX(-60px)}to{transform:translateX(${W + 60}px)}}`
    + keyframes('hero', track.map(([s, x, y]) => [s, `transform:translate(${n(x)}px,${n(y)}px)`]), D);

  let body = '';
  for (const [x, y, delay] of [[0, 30, 0], [0, 14, -34]]) {
    body += `<path class="cloud" style="animation-delay:${delay}s" fill="${pal.cloud}" d="M${x} ${y}h36v8h-36zM${x + 8} ${y - 6}h18v6h-18z"/>`;
  }
  grid.forEach((col, c) => {
    col.forEach((v, r) => {
      const x = PAD + c * P, y = GY + r * P;
      if (v > 0 || (flat && r === 6)) body += cell(x, y, pal.levels[v]) + `<rect x="${x}" y="${y}" width="${CS}" height="2" fill="${pal.shine}"/>`;
      else body += `<rect x="${x}" y="${y}" width="${CS}" height="${CS}" fill="${pal.slot}"/>`;
    });
  });
  grid.forEach((col, c) => {
    if (!col.includes(4) || arrive[c] === undefined) return;
    const tc = arrive[c];
    body += `<g class="c${c}"><ellipse class="spin" cx="${cx(c)}" cy="${fy(c) - 18}" rx="4.5" ry="5" fill="#e3b341"/><rect x="${cx(c) - 0.5}" y="${fy(c) - 21}" width="1" height="6" fill="#f8e3a1"/></g>`;
    css += `.c${c}{animation:c${c} ${n(D)}s linear infinite}` + keyframes(`c${c}`, [
      [0, 'opacity:1;transform:translateY(0)'], [tc, 'opacity:1;transform:translateY(0)'],
      [tc + 0.35, 'opacity:0;transform:translateY(-14px)'], [D, 'opacity:0;transform:translateY(-14px)'],
    ], D);
  });
  body += `<rect x="${cx(last) + 3}" y="${fy(last) - 44}" width="2" height="44" fill="#6e7681"/>`
    + `<path fill="#39d353" d="M${cx(last) + 3} ${fy(last) - 44}L${cx(last) - 11} ${fy(last) - 38}L${cx(last) + 3} ${fy(last) - 32}z"/>`;
  body += `<g id="hero"><g>${sprite(BODY)}</g><g class="la">${sprite(LEGS_A)}</g><g class="lb">${sprite(LEGS_B)}</g></g>`;
  return svg(W, H, css, body);
}
