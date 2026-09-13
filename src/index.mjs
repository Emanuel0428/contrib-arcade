import { PALETTES, rng } from './core.mjs';
import platformer from './games/platformer.mjs';
import blocks from './games/blocks.mjs';
import invaders from './games/invaders.mjs';
import breakout from './games/breakout.mjs';
import life from './games/life.mjs';
import rain from './games/rain.mjs';

export const GAMES = { platformer, blocks, invaders, breakout, life, rain };

export function render(grid, { game = 'platformer', palette = 'github-dark' } = {}) {
  if (!GAMES[game]) throw new Error(`Unknown game "${game}". Use one of: ${Object.keys(GAMES).join(', ')}`);
  if (!PALETTES[palette]) throw new Error(`Unknown palette "${palette}". Use one of: ${Object.keys(PALETTES).join(', ')}`);
  return GAMES[game](grid, PALETTES[palette], rng(2026)); // fixed seed: same data, same animation
}
