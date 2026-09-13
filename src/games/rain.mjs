import { CS, EPS, P, PAD, ROWS, cell, keyframes, n, svg, width } from '../core.mjs';

const ROW_T = 0.085, FADE = 0.5, HOLD = 2.5;

// Digital rain: a drop falls down each week and reveals its days.
export default function rain(grid, pal, rand) {
  const cols = grid.length, W = width(cols), GY = 2 * P, H = GY + ROWS * P + 4;
  const starts = grid.map(() => 0.3 + rand() * 2.5);
  const D = Math.max(...starts) + (ROWS + 2) * ROW_T + FADE + HOLD;

  let css = '', body = '';
  grid.forEach((col, c) => {
    const s = starts[c], x = PAD + c * P;
    col.forEach((v, r) => {
      const tr = s + (r + 2) * ROW_T, id = `r${c}_${r}`;
      body += cell(x, GY + r * P, pal.levels[0], ` class="${id}"`);
      css += `.${id}{animation:${id} ${n(D)}s linear infinite}` + keyframes(id, [
        [0, `fill:${pal.levels[0]}`], [tr - EPS, `fill:${pal.levels[0]}`], [tr, `fill:${pal.head}`],
        [tr + FADE, `fill:${pal.levels[v]}`], [D - 0.5, `fill:${pal.levels[v]}`], [D, `fill:${pal.levels[0]}`],
      ], D);
    });
    const end = s + (ROWS + 2) * ROW_T, drop = `transform:translateY(${(ROWS + 2) * P}px)`;
    body += `<rect class="d${c}" x="${x}" y="0" width="${CS}" height="${CS}" rx="2" fill="${pal.head}" opacity="0"/>`;
    css += `.d${c}{animation:d${c} ${n(D)}s linear infinite}` + keyframes(`d${c}`, [
      [0, 'opacity:0;transform:translateY(0)'], [s, 'opacity:0;transform:translateY(0)'], [s + EPS, 'opacity:1;transform:translateY(0)'],
      [end, `opacity:1;${drop}`], [end + EPS, `opacity:0;${drop}`], [D, `opacity:0;${drop}`],
    ], D);
  });
  return svg(W, H, css, body);
}
