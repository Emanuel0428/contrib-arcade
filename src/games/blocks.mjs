import { CS, EPS, P, PAD, ROWS, cell, keyframes, n, svg, width } from '../core.mjs';

const COLORS = ['#56d4dd', '#e3b341', '#bc8cff', '#f0883e', '#58a6ff', '#ff7b72', '#7ee787'];
const NEIGHBORS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const TICK = 0.04, SPAWN = 0.14, HOLD = 2.2;
const SLOW = 2; // playback stretch: same simulation, longer durations. Keyframe percentages are untouched.

// Falling pieces (groups of up to 4 touching days) stack up into the grid.
export default function blocks(grid, pal, rand) {
  const cols = grid.length, W = width(cols), GY = 6 * P, H = GY + ROWS * P + 4;
  const seen = grid.map(c => c.map(() => false)), groups = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < ROWS; r++) {
    if (!grid[c][r] || seen[c][r]) continue;
    const cells = [], q = [[c, r]];
    while (q.length && cells.length < 4) {
      const [x, y] = q.shift();
      if (seen[x][y]) continue;
      seen[x][y] = true;
      cells.push([x, y]);
      for (const [dx, dy] of NEIGHBORS) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < ROWS && grid[nx][ny] && !seen[nx][ny]) q.push([nx, ny]);
      }
    }
    const maxR = Math.max(...cells.map(p => p[1]));
    groups.push({ cells, maxR, color: COLORS[groups.length % COLORS.length], key: Math.floor(Math.min(...cells.map(p => p[0])) / 4) * 10 + (ROWS - maxR) });
  }
  groups.sort((a, b) => a.key - b.key);
  groups.forEach((g, i) => { g.spawn = 0.4 + i * SPAWN; g.land = g.spawn + (g.maxR + 7) * TICK; });
  const D = Math.max(0.4, ...groups.map(g => g.land)) + HOLD;
  const DUR = n(D * SLOW);

  let css = '', body = '';
  for (let c = 0; c < cols; c++) for (let r = 0; r < ROWS; r++) body += cell(PAD + c * P, GY + r * P, pal.levels[0]);

  groups.forEach((g, i) => {
    const K = g.maxR + 7;
    let dx = Math.round(rand() * 6 - 3);
    const fall = [[0, `transform:translate(${dx * P}px,${-K * P}px);opacity:1`]];
    for (let k = 1; k < K; k++) {
      if (dx && k % 2 === 0) dx -= Math.sign(dx);
      fall.push([g.spawn + k * TICK, `transform:translate(${dx * P}px,${(k - K) * P}px);opacity:1`]);
    }
    fall.push([g.land, 'transform:translate(0,0);opacity:0'], [D, 'transform:translate(0,0);opacity:0']);

    const at = (fill, attrs = '') => g.cells.map(([c, r]) => cell(PAD + c * P, GY + r * P, typeof fill === 'function' ? fill(c, r) : fill, attrs)).join('');
    body += `<g class="g${i}">${at((c, r) => pal.levels[grid[c][r]])}</g><g class="f${i}">${at(pal.ink)}</g><g class="p${i}">${at(g.color)}</g>`;
    css += `.p${i}{animation:p${i} ${DUR}s step-end infinite}.g${i}{animation:g${i} ${DUR}s linear infinite}.f${i}{animation:f${i} ${DUR}s linear infinite}`
      + keyframes(`p${i}`, fall, D)
      + keyframes(`g${i}`, [[0, 'opacity:0'], [g.land - EPS, 'opacity:0'], [g.land, 'opacity:1'], [D - 0.3, 'opacity:1'], [D, 'opacity:0']], D)
      + keyframes(`f${i}`, [[0, 'opacity:0'], [g.land - EPS, 'opacity:0'], [g.land, 'opacity:.85'], [g.land + 0.3, 'opacity:0'], [D, 'opacity:0']], D);
  });
  return svg(W, H, css, body);
}
