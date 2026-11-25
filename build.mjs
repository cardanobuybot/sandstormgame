// Builds sandstormgame.xyz into dist/: plain html pages, one stylesheet, and the files search engines and
// AI assistants read (sitemap.xml, robots.txt, feed.xml, llms.txt, llms-full.txt, a Markdown copy of every guide).
//   node build.mjs            build
//   node build.mjs --serve    build and serve dist/ on http://localhost:4321
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, game, categories, disclaimer } from './site.config.mjs';
import { loadArticles } from './src/content.mjs';
import { page, abs, esc } from './src/html.mjs';
import { homePage, gamePage, blogIndex, articlePage, aboutPage, pressPage, privacyPage, notFoundPage } from './src/pages.mjs';
import * as G from './src/gamedata.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');
const today = new Date().toISOString().slice(0, 10);

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(path.join(root, 'public'), dist, { recursive: true });

// the stylesheet, named by its content so browsers can keep it forever
const cssText = readFileSync(path.join(root, 'src/styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '\n').trim();
const cssName = `/assets/site.${createHash('sha256').update(cssText).digest('hex').slice(0, 10)}.css`;
writeFileSync(path.join(dist, cssName), cssText);

const svgSize = (file) => {
  const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(readFileSync(path.join(root, 'public', file), 'utf8'));
  return { w: Math.round(Number(m[1])), h: Math.round(Number(m[2])) };
};
const logo = svgSize('brand/logo.svg');
// shown 52 pixels high in the header
const env = { css: cssName, year: today.slice(0, 4), logo: { w: Math.round((logo.w * 52) / logo.h), h: 52 } };

const articles = loadArticles();
const pages = [];
const write = (p, lastmod = today, priority = 0.6) => {
  const file = p.path.endsWith('/') ? path.join(dist, p.path, 'index.html') : path.join(dist, p.path);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, page(p, env));
  if (!p.noindex) pages.push({ path: p.path, lastmod, priority });
};

const newest = articles.reduce((d, a) => ((a.updated ?? a.date) > d ? (a.updated ?? a.date) : d), game.version.data);
write(homePage(articles, svgSize('brand/logo-stacked.svg')), newest, 1.0);
write(gamePage(articles), newest, 1.0);
write(blogIndex(articles), newest, 0.9);
write(aboutPage(), game.version.data, 0.5);
write(pressPage(), game.version.data, 0.5);
write(privacyPage(), game.version.data, 0.2);
write(notFoundPage(articles));
for (const a of articles) {
  write(articlePage(a, articles), a.updated ?? a.date, 0.8);
  // the same guide as plain text, for people and programs that prefer it
  writeFileSync(path.join(dist, 'blog', `${a.slug}.md`), `# ${a.title}\n\n${a.description}\n\nSource: ${abs(a.path)}\nPublished by ${site.name} on ${a.date}.\n\n${a.text}\n`);
  for (const f of [a.og, a.thumb]) if (!existsSync(path.join(dist, f))) console.warn(`  missing picture ${f} (run node tools/make-covers.mjs)`);
}

// which commit this build was made from: tools/indexnow.mjs waits for it to be live before it tells the search engines
writeFileSync(path.join(dist, 'build.txt'), `${process.env.VERCEL_GIT_COMMIT_SHA ?? 'local'}\n`);

// ---------- sitemap, robots, feed ----------

writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `<url><loc>${abs(p.path)}</loc><lastmod>${p.lastmod}</lastmod><priority>${p.priority.toFixed(1)}</priority></url>`).join('\n')}
</urlset>
`);

const AI_AGENTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended',
  'Applebot-Extended', 'Amazonbot', 'CCBot', 'meta-externalagent', 'DuckAssistBot', 'MistralAI-User', 'cohere-ai', 'YouBot', 'Bytespider'];
writeFileSync(path.join(dist, 'robots.txt'), `# ${site.url}
# Everything on this site is public. Search engines and AI assistants are welcome to read, index and quote it.
# A plain-text summary for language models is at ${site.url}/llms.txt

User-agent: *
Allow: /

# Named so that there is no doubt: AI crawlers and assistants may read this site.
${AI_AGENTS.map((a) => `User-agent: ${a}`).join('\n')}
Allow: /

Sitemap: ${site.url}/sitemap.xml
`);

const rfc822 = (iso) => new Date(`${iso}T09:00:00Z`).toUTCString();
const feedItems = [...articles].sort((a, b) => (b.updated ?? b.date).localeCompare(a.updated ?? a.date) || a.order - b.order);
writeFileSync(path.join(dist, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${site.name}: Dune Clash guides and news</title>
<link>${site.url}/blog/</link>
<atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
<description>Guides, stories and news about Dune Clash from the studio that makes it.</description>
<language>en</language>
<lastBuildDate>${rfc822(newest)}</lastBuildDate>
${feedItems.map((a) => `<item><title>${esc(a.title)}</title><link>${abs(a.path)}</link><guid isPermaLink="true">${abs(a.path)}</guid><pubDate>${rfc822(a.date)}</pubDate><category>${esc(a.section)}</category><description>${esc(a.description)}</description></item>`).join('\n')}
</channel>
</rss>
`);

writeFileSync(path.join(dist, 'site.webmanifest'), JSON.stringify({
  name: site.name, short_name: 'Sandstorm', start_url: '/', display: 'browser', background_color: '#fdefc9', theme_color: '#241810',
  icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
}, null, 1));

// ---------- for language models: a summary with links, and everything in one file ----------

const android = game.googlePlay.status === 'live' ? `Android (Google Play): ${game.googlePlay.url}` : 'Android: in closed testing on Google Play, not yet public';
const facts = `- Dune Clash is a free build-and-raid strategy game by ${site.name}, an independent one-person studio.
- Released on the App Store on ${game.released}. Current version: ${game.version.ios} (iPhone), ${game.version.android} (Android test build).
- Platforms: iPhone (${game.appStore.requires}): ${game.appStore.url} ; web browser, nothing to install: ${game.web.url} ; ${android}.
${game.appStore.note ? '- The App Store does not carry the game in European Union countries yet; the browser version works everywhere.\n' : ''}- Price: free, no ads; optional in-app purchases of crystals (from $0.99). Language: English. App Store age rating: ${game.rating.appStore}; made for ages ${game.ages}.
- In the game: ${G.N.buildingCount} buildings, ${G.N.unitCount} units, ${G.N.citadelMax} Citadel levels, two resources (oil and scrap), raids of ${G.N.battleMinutes} minutes after ${G.N.scoutSeconds} seconds of scouting.
- The Sandmaw, a neutral giant sand worm, appears in about ${G.N.wormChance}% of raids, attacks ground units of the attacker, ignores buildings and aircraft, and can be killed once it surfaces.
- Units cost nothing and have no training time: each raid the attacker may deploy any mix that fits the army space.
- Every raid is replayed on the server from the attacker's deployment orders, so results cannot be faked.
- There are no clans and no chat in the game yet. An internet connection is required.
- ${disclaimer}`;

const group = (key) => articles.filter((a) => a.category === key).sort((a, b) => a.order - b.order);
writeFileSync(path.join(dist, 'llms.txt'), `# ${site.name}

> ${site.name} is an independent game studio. Its first game, Dune Clash, is a free desert build-and-raid strategy game for iPhone and web browsers (Android coming soon), in which a giant sand worm hunts ground troops during raids. This site has the game's page, a press kit and ${articles.length} guides written by the studio with numbers generated from the game's balance data.

Key facts:

${facts}

## Main pages

- [Dune Clash](${site.url}/dune-clash/): what the game is, screenshots, where to get it, frequently asked questions
- [All guides and stories](${site.url}/blog/): index of every article
- [Press kit](${site.url}/press/): fact sheet, descriptions, logos, screenshots
- [About ${site.name}](${site.url}/about/): the studio and how the guides are written

${Object.entries(categories).map(([key, c]) => (group(key).length ? `## ${c.title}\n\n${group(key).map((a) => `- [${a.title}](${site.url}/blog/${a.slug}.md): ${a.description}`).join('\n')}\n` : '')).filter(Boolean).join('\n')}
## Optional

- [Everything in one file](${site.url}/llms-full.txt): the full text of all guides
- [RSS feed](${site.url}/feed.xml)
- [Privacy on this site](${site.url}/privacy/)
`);

writeFileSync(path.join(dist, 'llms-full.txt'), `# ${site.name}: Dune Clash, all guides in one file

Key facts:

${facts}

${articles.map((a) => `\n---\n\n# ${a.title}\n\nSource: ${abs(a.path)} (published ${a.date})\n\n${a.description}\n\n${a.text}\n`).join('')}`);

// ---------- checks: every link and picture on the site must lead somewhere ----------

const exists = (url) => {
  const clean = decodeURI(url.split('#')[0].split('?')[0]);
  if (clean === '/') return true;
  const f = path.join(dist, clean);
  return clean.endsWith('/') ? existsSync(path.join(f, 'index.html')) : existsSync(f);
};
let broken = 0;
const htmlFiles = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const f = path.join(dir, name);
    if (statSync(f).isDirectory()) walk(f);
    else if (name.endsWith('.html')) htmlFiles.push(f);
  }
})(dist);
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  const ids = new Set([...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    if (!exists(m[1])) { console.error(`BROKEN ${path.relative(dist, f)} -> ${m[1]}`); broken++; }
  }
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) for (const part of m[1].split(',')) {
    const u = part.trim().split(' ')[0];
    if (u.startsWith('/') && !exists(u)) { console.error(`BROKEN ${path.relative(dist, f)} -> ${u}`); broken++; }
  }
  for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!ids.has(m[1])) { console.error(`BROKEN anchor ${path.relative(dist, f)} -> #${m[1]}`); broken++; }
  // links into another page's section: the section must exist there
  for (const m of html.matchAll(/href="(\/[^"#]*)#([^"]+)"/g)) {
    const target = path.join(dist, m[1], 'index.html');
    if (existsSync(target) && !new RegExp(` id="${m[2]}"`).test(readFileSync(target, 'utf8'))) { console.error(`BROKEN anchor ${path.relative(dist, f)} -> ${m[1]}#${m[2]}`); broken++; }
  }
}
if (broken) { console.error(`${broken} broken links`); if (!process.env.DRAFT) process.exit(1); }

const words = articles.reduce((n, a) => n + a.words, 0);
console.log(`built ${pages.length} pages, ${articles.length} articles (${words.toLocaleString('en-US')} words), css ${cssText.length} bytes`);

if (process.argv.includes('--serve')) {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
  createServer((req, res) => {
    let p = decodeURI(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    let f = path.join(dist, p);
    if (!existsSync(f) || statSync(f).isDirectory()) { res.statusCode = 404; f = path.join(dist, '404.html'); }
    res.setHeader('content-type', types[path.extname(f)] ?? 'application/octet-stream');
    res.end(readFileSync(f));
  }).listen(4321, () => console.log('http://localhost:4321'));
}
