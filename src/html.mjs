// Page chrome and the pieces pages share: head, header, footer, buttons, structured data.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { site, game, disclaimer } from '../site.config.mjs';

const stamps = new Map();
/** The address of a file in public/ with a fingerprint of its content in the query. Browsers keep logos and icons for
 *  a long time (a week for /brand/, and tab icons for as long as they like); a new drawing gets a new address. */
export const ver = (url) => {
  if (!stamps.has(url)) {
    const data = readFileSync(fileURLToPath(new URL(`../public${url}`, import.meta.url)));
    stamps.set(url, `${url}?v=${createHash('sha256').update(data).digest('hex').slice(0, 8)}`);
  }
  return stamps.get(url);
};

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const abs = (path) => (path.startsWith('http') ? path : site.url + path);
const ORG = `${site.url}/#org`;
const GAME = `${site.url}/dune-clash/#game`;

export const longDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// ---------- structured data (schema.org) ----------

export const orgLd = () => ({
  '@type': 'Organization', '@id': ORG, name: site.name, url: `${site.url}/`,
  logo: { '@type': 'ImageObject', url: abs('/brand/mark-512.png'), width: 512, height: 512 },
  description: 'Independent game studio, maker of the mobile strategy game Dune Clash.',
  email: site.email, foundingDate: site.founded,
  sameAs: [game.appStore.developer],
});

export const websiteLd = () => ({ '@type': 'WebSite', '@id': `${site.url}/#site`, url: `${site.url}/`, name: site.name, inLanguage: site.lang, publisher: { '@id': ORG } });

export const gameLd = () => ({
  '@type': ['VideoGame', 'MobileApplication'], '@id': GAME, name: game.name,
  description: game.short, url: abs('/dune-clash/'),
  image: [abs('/img/dc/icon-512.png'), abs('/og/dune-clash.jpg')],
  screenshot: [1, 2, 3, 4, 5].map((n) => abs(`/img/dc/screen-${n}.webp`)),
  genre: game.genre, applicationCategory: 'GameApplication', applicationSubCategory: 'Strategy',
  gamePlatform: ['iOS', 'Web browser', ...(game.googlePlay.status === 'live' ? ['Android'] : [])],
  operatingSystem: game.googlePlay.status === 'live' ? `${game.appStore.requires}; ${game.googlePlay.requires}` : game.appStore.requires,
  inLanguage: site.lang, datePublished: game.released, softwareVersion: game.version.ios,
  playMode: 'MultiPlayer', isAccessibleForFree: true, contentRating: `App Store ${game.rating.appStore}`,
  author: { '@id': ORG }, publisher: { '@id': ORG },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: game.appStore.url },
  installUrl: game.appStore.url,
  sameAs: [game.appStore.url, game.web.url],
});

export const crumbsLd = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
});

export const faqLd = (qas) => ({
  '@type': 'FAQPage',
  mainEntity: qas.map(({ q, text }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text } })),
});

export const articleLd = (a) => ({
  '@type': 'Article', '@id': `${abs(a.path)}#article`, headline: a.title, description: a.description,
  image: [abs(a.og)], datePublished: a.date, dateModified: a.updated ?? a.date,
  author: { '@type': 'Organization', '@id': ORG, name: site.author, url: `${site.url}/about/` },
  publisher: { '@id': ORG }, mainEntityOfPage: abs(a.path), inLanguage: site.lang,
  articleSection: a.section, wordCount: a.words, about: { '@id': GAME },
});

const ld = (items) => items.length
  ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': items }).replace(/</g, '\\u003c')}</script>`
  : '';

// ---------- shared pieces ----------

/** Where to get the game. The Android button turns into a link when site.config says the game is live on Google Play. */
export function storeButtons() {
  const android = game.googlePlay.status === 'live'
    ? `<a class="btn" href="${game.googlePlay.url}" rel="noopener">Get it for Android<small>Google Play, free</small></a>`
    : `<span class="btn btn-off">Android<small>Coming soon to Google Play</small></span>`;
  return `<div class="buttons">
<a class="btn btn-go" href="${game.appStore.url}" rel="noopener">Download for iPhone<small>App Store, free</small></a>
<a class="btn btn-sun" href="${game.web.url}" rel="noopener">Play in your browser<small>Nothing to install</small></a>
${android}
</div>`;
}

export function cta(heading = 'Play Dune Clash') {
  const where = game.googlePlay.status === 'live' ? 'Free on iPhone, Android and in your browser.' : 'Free on iPhone and in your browser. Android is on the way.';
  return `<aside class="cta" aria-label="Get Dune Clash">
<img src="/img/dc/icon-256.webp" alt="" width="72" height="72" loading="lazy" decoding="async">
<div><h2>${esc(heading)}</h2><p>${where} No ads.</p></div>
${storeButtons()}
</aside>`;
}

const NAV = [['/dune-clash/', 'Dune Clash'], ['/blog/', 'Guides'], ['/about/', 'About']];

function header(current, logo) {
  const nav = NAV.map(([href, label]) => `<a href="${href}"${current === href ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap bar">
<a class="brand" href="/" aria-label="Sandstorm Game, home"><img src="${ver('/brand/logo-small.svg')}" alt="Sandstorm Game" width="${logo.w}" height="${logo.h}"></a>
<nav aria-label="Main">${nav}</nav>
<a class="btn btn-go btn-small" href="/dune-clash/#get">Play</a>
</div></header>`;
}

function footer(year) {
  return `<svg class="dunes" viewBox="0 0 1200 110" preserveAspectRatio="none" aria-hidden="true" focusable="false">
<path d="M0 62 Q180 8 420 46 T820 30 T1200 52 V110 H0Z" fill="#f3c77c"/>
<path d="M0 84 Q240 34 520 70 T980 52 T1200 74 V110 H0Z" fill="#d99a4a"/>
<path d="M0 100 Q300 66 640 92 T1200 88 V110 H0Z" fill="#241810"/>
</svg>
<footer class="foot"><div class="wrap">
<div class="foot-grid">
<div><h2>${site.name}</h2><p>An independent, one-person game studio. Our first game, Dune Clash, is a desert build-and-raid strategy game for phones and browsers.</p>
<p>Say hello: <a href="mailto:${site.email}">${site.email}</a></p></div>
<div><h2>Dune Clash</h2><ul>
<li><a href="/dune-clash/">About the game</a></li>
<li><a href="${game.appStore.url}" rel="noopener">Download for iPhone</a></li>
<li><a href="${game.web.url}" rel="noopener">Play in your browser</a></li>
<li><a href="/blog/">Guides and stories</a></li>
<li><a href="${game.support}" rel="noopener">Player support</a></li>
</ul></div>
<div><h2>Studio</h2><ul>
<li><a href="/about/">About Sandstorm Game</a></li>
<li><a href="/press/">Press kit</a></li>
<li><a href="/privacy/">Privacy on this site</a></li>
<li><a href="/feed.xml">RSS feed</a></li>
</ul></div>
</div>
<p class="small">${esc(disclaimer)} App Store is a service mark of Apple Inc. Google Play is a trademark of Google LLC.</p>
<p class="small">© ${year} ${site.name}</p>
</div></footer>`;
}

/**
 * A whole page.
 * p: { path, title, description, body, current, image (path of the 1200×630 picture), type ('website' | 'article'),
 *      ld (schema.org items), head (extra head html), noindex, published, modified }
 * env: { css, logo, year }
 */
export function page(p, env) {
  const url = abs(p.path);
  const image = abs(p.image ?? '/og/default.jpg');
  // the studio's name follows the title only where there is room for it: search results cut a title at about 60 characters
  const withName = `${p.title} | ${site.name}`;
  const title = p.title.includes(site.name) || withName.length > 62 ? p.title : withName;
  return `<!doctype html>
<html lang="${site.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${p.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}">
<meta property="og:site_name" content="${site.name}">
<meta property="og:type" content="${p.type ?? 'website'}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_US">
${p.published ? `<meta property="article:published_time" content="${p.published}T09:00:00Z">\n<meta property="article:modified_time" content="${p.modified ?? p.published}T09:00:00Z">\n` : ''}<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(p.description)}">
<meta name="twitter:image" content="${image}">
<meta name="apple-itunes-app" content="app-id=${game.appStore.id}">
<meta name="theme-color" content="#241810">
<link rel="icon" href="${ver('/favicon.svg')}" type="image/svg+xml">
<link rel="icon" href="${ver('/favicon-96.png')}" type="image/png" sizes="96x96">
<link rel="apple-touch-icon" href="${ver('/apple-touch-icon.png')}">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/rss+xml" title="${site.name}: guides and news" href="/feed.xml">
<link rel="preload" href="/assets/fonts/rubik-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${env.css}">
${p.head ?? ''}${ld(p.ld ?? [])}
</head>
<body>
${header(p.current, env.logo)}
<main id="main">
${p.body}
</main>
${footer(env.year)}
</body>
</html>
`;
}

/** A table from src/gamedata.mjs as html. The first column names the row. */
export function tableHtml(t, cls = '') {
  const cell = (c) => (typeof c === 'object' ? c.html : esc(c));
  const text = (c) => (typeof c === 'object' ? c.text : c);
  const isNum = (c) => /^[+\-−×]?\d/.test(text(c)) && text(c).length < 18;
  const numeric = t.head.map((h, i) => i > 0 && t.rows.every((r) => isNum(r[i]) || r[i] === '' || r[i] === '–' || r[i] === 'free' || r[i] === 'none' || r[i] === 'instant'));
  const head = t.head.map((h, i) => `<th scope="col"${numeric[i] ? ' class="n"' : ''}>${esc(h)}</th>`).join('');
  // a column of sentences keeps wrapping even where the other cells of a many-column table stay on one line
  const wordy = t.head.map((h, i) => t.rows.some((r) => String(text(r[i])).length > 34));
  const rows = t.rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${cell(c)}</th>` : `<td${numeric[i] ? ' class="n"' : wordy[i] ? ' class="t"' : ''}>${cell(c)}</td>`)).join('')}</tr>`).join('\n');
  const wide = t.head.length > 4;
  // more than six columns do not fit the text column: on a wide screen such a table may use the whole page width
  if (t.head.length > 6) cls = 'wide';
  return `<div class="table ${wide ? '' : 'fit '}${cls}"><div class="plate"><p class="table-cap" aria-hidden="true">${esc(t.caption)}</p><div class="table-scroll" tabindex="0" role="region" aria-label="${esc(t.caption)}"><table>
<caption class="vh">${esc(t.caption)}</caption>
<thead><tr>${head}</tr></thead>
<tbody>
${rows}
</tbody></table></div></div>${wide ? '<p class="swipe">Swipe the table sideways to see every column.</p>' : ''}</div>`;
}

/** The same table as Markdown, for the plain-text copies of the guides. */
export function tableMd(t) {
  const text = (c) => String(typeof c === 'object' ? c.text : c).replace(/\|/g, '/');
  return `**${t.caption}**\n\n| ${t.head.join(' | ')} |\n|${t.head.map(() => ' --- ').join('|')}|\n${t.rows.map((r) => `| ${r.map(text).join(' | ')} |`).join('\n')}\n`;
}
