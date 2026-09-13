import { CS, EPS, P, PAD, ROWS, cell, keyframes, n, svg, width } from '../core.mjs';

const SPEED = 480, R = 3.5, PW = 64, DT = 1 / 240, MAX_T = 90;

// Contributions are bricks; each hit lowers a day one level.
export default function breakout(grid, pal, rand) {
  const cols = grid.length, W = width(cols), H = 240, GY = 18, PY = H - 18;
  const hp = grid.map(c => c.slice());
  const hits = grid.map(c => c.map(() => []));
  let left = hp.flat().filter(v => v > 0).length;
  let t = 0.6, px = W / 2, nextPaddle = 0;
  const paddleStops = [];

  const launch = (b, i) => {
    const a = -Math.PI / 2 + (i - 1) * 0.5 + (rand() - 0.5) * 0.3;
    Object.assign(b, { x: px + (i - 1) * 14, y: PY - 8, vx: Math.cos(a) * SPEED, vy: Math.sin(a) * SPEED });
  };
  const balls = [0, 1, 2].map(i => { const b = { stops: [] }; launch(b, i); b.stops.push([0, b.x, b.y]); return b; });
  const hit = (x, y) => {
    const c = Math.floor((x - PAD) / P), r = Math.floor((y - GY) / P);
    if (c < 0 || c >= cols || r < 0 || r >= ROWS || hp[c][r] <= 0) return false;
    hits[c][r].push([t, --hp[c][r]]);
    if (!hp[c][r]) left--;
    return true;
  };

  while (left > 0 && t < MAX_T) {
    if (t >= nextPaddle) { paddleStops.push([t, px]); nextPaddle = t + 0.1; }
    const tgt = balls.filter(b => b.vy > 0).sort((a, b) => b.y - a.y)[0] ?? balls[0];
    px = Math.max(PW / 2, Math.min(W - PW / 2, px + Math.sign(tgt.x - px) * Math.min(Math.abs(tgt.x - px), 520 * DT)));
    balls.forEach((b, i) => {
      const before = [t, b.x, b.y], vx = b.vx, vy = b.vy;
      b.x += b.vx * DT;
      if (b.x < R || b.x > W - R) { b.vx *= -1; b.x = Math.max(R, Math.min(W - R, b.x)); }
      else if (hit(b.x + Math.sign(b.vx) * R, b.y)) { b.vx *= -1; b.x += b.vx * DT; }
      b.y += b.vy * DT;
      if (b.y < R) b.vy = Math.abs(b.vy);
      else if (hit(b.x, b.y + Math.sign(b.vy) * R)) { b.vy *= -1; b.y += b.vy * DT; }
      if (b.vy > 0 && b.y + R >= PY && b.y < PY + 6 && Math.abs(b.x - px) <= PW / 2 + R) {
        // aim at a random remaining brick so the last ones don't take minutes
        const remaining = hp.flatMap((col, c) => col.flatMap((v, r) => (v > 0 ? [[c, r]] : [])));
        const [tc, tr] = remaining[Math.floor(rand() * remaining.length)] ?? [cols / 2, 0];
        const aim = Math.atan2(GY + tr * P + CS / 2 - b.y, PAD + tc * P + CS / 2 - b.x) + Math.PI / 2;
        const a = -Math.PI / 2 + Math.max(-1.3, Math.min(1.3, aim)) + (rand() - 0.5) * 0.3;
        b.vx = Math.cos(a) * SPEED; b.vy = Math.sin(a) * SPEED; b.y = PY - R;
      }
      if (b.y > H + 10) { b.stops.push([t, b.x, b.y]); launch(b, 1); b.stops.push([t + EPS, b.x, b.y]); }
      else if (b.vx !== vx || b.vy !== vy) b.stops.push(before);
    });
    t += DT;
  }
  const D = t + 1.8;
  paddleStops.push([t, px], [D, px]);

  let css = `.paddle{animation:paddle ${n(D)}s linear infinite}`
    + keyframes('paddle', paddleStops.map(([s, x]) => [s, `transform:translateX(${n(x - PW / 2)}px)`]), D);
  let body = '';
  for (let c = 0; c < cols; c++) for (let r = 0; r < ROWS; r++) {
    if (!hits[c][r].length) { body += cell(PAD + c * P, GY + r * P, pal.levels[grid[c][r]]); continue; }
    const id = `h${c}_${r}`, stops = [[0, `fill:${pal.levels[grid[c][r]]}`]];
    for (const [s, v] of hits[c][r]) stops.push([s, `fill:${pal.ink}`], [s + 0.08, `fill:${pal.levels[v]}`]);
    stops.push([D, `fill:${pal.levels[hits[c][r].at(-1)[1]]}`]);
    body += cell(PAD + c * P, GY + r * P, pal.levels[grid[c][r]], ` class="${id}"`);
    css += `.${id}{animation:${id} ${n(D)}s step-end infinite}` + keyframes(id, stops, D);
  }
  balls.forEach((b, i) => {
    b.stops.push([t, b.x, b.y], [D, b.x, b.y]);
    body += `<circle class="ball${i}" r="${R}" fill="${pal.ink}"/>`;
    css += `.ball${i}{animation:ball${i} ${n(D)}s linear infinite}`
      + keyframes(`ball${i}`, b.stops.map(([s, x, y]) => [s, `transform:translate(${n(x)}px,${n(y)}px)`]), D);
  });
  body += `<rect class="paddle" y="${PY}" width="${PW}" height="6" rx="3" fill="${pal.ink}"/>`;
  return svg(W, H, css, body);
}
