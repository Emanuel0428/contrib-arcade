import { P, PAD, ROWS, cell, keyframes, n, svg, width } from '../core.mjs';

const STEP = 0.4, MAX_GENS = 40, INTRO = 1.2, HOLD = 1.5;

// Conway's Game of Life seeded with the contribution grid.
export default function life(grid, pal) {
  const cols = grid.length, W = width(cols), GY = 12, H = GY * 2 + ROWS * P - 3;
  const gens = [grid.map(c => c.slice())];
  const seen = new Set([JSON.stringify(gens[0])]);
  while (gens.length <= MAX_GENS) {
    const cur = gens.at(-1);
    const next = cur.map((col, c) => col.map((v, r) => {
      let k = 0;
      for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
        if ((dc || dr) && cur[c + dc]?.[r + dr]) k++;
      }
      if (v) return k === 2 || k === 3 ? v : 0;
      return k === 3 ? 3 : 0; // newborn cells
    }));
    const key = JSON.stringify(next);
    gens.push(next);
    if (seen.has(key)) break; // extinct, still or looping
    seen.add(key);
  }
  const D = INTRO + (gens.length - 1) * STEP + HOLD;

  // cells with identical histories share one animation
  const classes = new Map();
  let css = '', body = '';
  for (let c = 0; c < cols; c++) for (let r = 0; r < ROWS; r++) {
    const history = gens.map(g => g[c][r]);
    const x = PAD + c * P, y = GY + r * P;
    if (history.every(v => v === history[0])) { body += cell(x, y, pal.levels[history[0]]); continue; }
    const sig = history.join('');
    if (!classes.has(sig)) {
      const id = `s${classes.size}`, stops = [[0, `fill:${pal.levels[history[0]]}`]];
      history.forEach((v, g) => { if (g && v !== history[g - 1]) stops.push([INTRO + g * STEP, `fill:${pal.levels[v]}`]); });
      stops.push([D, `fill:${pal.levels[history.at(-1)]}`]);
      classes.set(sig, id);
      css += `.${id}{animation:${id} ${n(D)}s step-end infinite}` + keyframes(id, stops, D);
    }
    body += cell(x, y, pal.levels[history[0]], ` class="${classes.get(sig)}"`);
  }
  return svg(W, H, css, body);
}
