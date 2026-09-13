#!/usr/bin/env node
// Usage:
//   GITHUB_TOKEN=... node src/cli.mjs --user octocat --out "dist/platformer.svg?game=platformer&palette=github-dark"
//   node src/cli.mjs --demo --out dist/life.svg?game=life
// In the GitHub Action the same values come from INPUT_GITHUB_USER_NAME / INPUT_OUTPUTS.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { demoGrid, fetchGrid } from './core.mjs';
import { render } from './index.mjs';

const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const user = flag('--user') ?? process.env.INPUT_GITHUB_USER_NAME;
const outputs = [
  ...args.flatMap((a, i) => (a === '--out' ? [args[i + 1]] : [])),
  ...(process.env.INPUT_OUTPUTS ?? '').split('\n'),
].map(s => s?.trim()).filter(Boolean);

if (!outputs.length) throw new Error('No outputs given. Example: dist/platformer.svg?game=platformer&palette=github-dark');

const grid = args.includes('--demo') ? demoGrid() : await fetchGrid(user, process.env.GITHUB_TOKEN);

for (const spec of outputs) {
  const [file, query = ''] = spec.split('?');
  const q = new URLSearchParams(query);
  const game = q.get('game') ?? 'platformer', palette = q.get('palette') ?? 'github-dark';
  const out = render(grid, { game, palette });
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, out);
  console.log(`✔ ${file} (${game}, ${palette}, ${(out.length / 1024).toFixed(1)} KB)`);
}
