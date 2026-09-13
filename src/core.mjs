export const CS = 11; // cell size
export const P = 14; // cell pitch (size + gap)
export const PAD = 14;
export const ROWS = 7;
export const EPS = 0.02; // seconds used for "instant" keyframe changes

export const width = cols => PAD * 2 + cols * P - (P - CS);
export const n = v => +v.toFixed(2);

export const PALETTES = {
  'github-dark': {
    levels: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
    slot: '#10141b', ink: '#e6edf3', line: '#30363d', accent: '#58a6ff',
    cloud: '#161b22', shine: 'rgba(255,255,255,.14)', head: '#aff5b4',
  },
  'github-light': {
    levels: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    slot: '#f3f4f6', ink: '#1f2328', line: '#d0d7de', accent: '#0969da',
    cloud: '#eef1f4', shine: 'rgba(0,0,0,.08)', head: '#1a7f37',
  },
};

const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

/** Contribution grid as weeks[] of 7 levels (0-4). */
export async function fetchGrid(user, token) {
  if (!user) throw new Error('Missing GitHub user name');
  if (!token) throw new Error('Missing GitHub token (GITHUB_TOKEN)');
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'contrib-arcade' },
    body: JSON.stringify({
      query: 'query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{weeks{contributionDays{weekday contributionLevel}}}}}}',
      variables: { login: user },
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.errors || !json.data?.user) {
    throw new Error(`GitHub API error for "${user}": ${JSON.stringify(json.errors ?? json.message ?? res.status)}`);
  }
  return json.data.user.contributionsCollection.contributionCalendar.weeks.map(w => {
    const col = Array(ROWS).fill(0);
    for (const d of w.contributionDays) col[d.weekday] = LEVEL[d.contributionLevel] ?? 0;
    return col;
  });
}

export function rng(seed) {
  return () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Fake year of activity: quiet at first, busier towards the end. */
export function demoGrid(seed = 428) {
  const r = rng(seed);
  return Array.from({ length: 53 }, (_, c) => {
    const a = Math.pow(c / 52, 1.4);
    return Array.from({ length: ROWS }, () => r() < 0.1 + 0.75 * a ? Math.min(4, 1 + Math.floor(r() * 2.2 + a * r() * 2.5)) : 0);
  });
}

/** @keyframes from [[seconds, css]] stops over a loop of D seconds. */
export function keyframes(name, stops, D) {
  return `@keyframes ${name}{${stops.map(([t, css]) => `${n(Math.max(0, Math.min(t, D)) / D * 100)}%{${css}}`).join('')}}`;
}

export const cell = (x, y, fill, attrs = '') =>
  `<rect x="${n(x)}" y="${n(y)}" width="${CS}" height="${CS}" rx="2" fill="${fill}"${attrs}/>`;

/** Pixel-art rows ("..XX..") to a compact path for one character. */
export function pixels(rows, ch, s = 1, ox = 0, oy = 0) {
  let d = '';
  rows.forEach((row, y) => {
    for (const m of row.matchAll(new RegExp(`${ch}+`, 'g'))) {
      d += `M${n(ox + m.index * s)} ${n(oy + y * s)}h${n(m[0].length * s)}v${n(s)}h${n(-m[0].length * s)}z`;
    }
  });
  return d;
}

export const svg = (w, h, css, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><style>${css}</style>${body}</svg>`;

export const BLINK = '@keyframes la{0%{opacity:1}50%{opacity:0}}@keyframes lb{0%{opacity:0}50%{opacity:1}}';
