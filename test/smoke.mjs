// node test/smoke.mjs — renders every game/palette with demo and edge-case grids.
import assert from 'node:assert/strict';
import { PALETTES, demoGrid } from '../src/core.mjs';
import { GAMES, render } from '../src/index.mjs';

const grids = {
  demo: demoGrid(),
  empty: Array.from({ length: 53 }, () => Array(7).fill(0)),
  full: Array.from({ length: 53 }, () => Array(7).fill(4)),
  single: Array.from({ length: 53 }, (_, c) => Array(7).fill(0).map((_, r) => (c === 10 && r === 3 ? 2 : 0))),
};

for (const game of Object.keys(GAMES)) for (const palette of Object.keys(PALETTES)) for (const [name, grid] of Object.entries(grids)) {
  const out = render(grid, { game, palette });
  const label = `${game}/${palette}/${name}`;
  assert.ok(out.startsWith('<svg') && out.endsWith('</svg>'), `${label}: not an svg`);
  assert.ok(!/NaN|undefined|Infinity/.test(out), `${label}: bad number in output`);
  assert.ok(out.length < 400_000, `${label}: too big (${out.length} bytes)`);
  assert.equal(out, render(grid, { game, palette }), `${label}: not deterministic`);
}
assert.throws(() => render(grids.demo, { game: 'nope' }), /Unknown game/);
console.log('smoke ok');
