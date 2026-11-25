// Draws a picture for every article from the game's own art: /covers/<slug>.webp (800×420, no text: cards and the
// top of the article) and /og/blog/<slug>.jpg (1200×630 with the title: link previews). Also the site-wide share pictures.
//   node tools/make-covers.mjs [slug …]
// The picture is described by the article's "cover" line:
//   cover: keyart                        the key art
//   cover: sprites u-infantry b-turret-8 up to five pictures from public/img/dc/sprites, standing on a dune
//   cover: shot worm u-bulwark           a phone screenshot from public/img/dc/shots, with sprites beside it
//   cover: screen 3 b-citadel-8          the same with a store screenshot (public/img/dc/screen-N.webp)
// Needs Playwright with Chrome and ImageMagick's `convert`.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { loadArticles } from '../src/content.mjs';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/npm-tools/node_modules/playwright'); }

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = (p) => pathToFileURL(path.join(root, 'public', p)).href;
const sizes = JSON.parse(readFileSync(path.join(root, 'public/img/dc/sprites/sizes.json'), 'utf8'));
const only = process.argv.slice(2);
mkdirSync(path.join(root, 'public/covers'), { recursive: true });
mkdirSync(path.join(root, 'public/og/blog'), { recursive: true });

const CSS = `
@font-face { font-family: Rubik; src: url(${pub('assets/fonts/rubik-latin-wght-normal.woff2')}) format('woff2'); font-weight: 300 900; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; position: relative; font-family: Rubik, sans-serif; background: linear-gradient(#8fd6c6, #c9e2c4 46%, #f4e3b0 72%); }
.sun { position: absolute; border-radius: 50%; }
.dune { position: absolute; left: -40px; right: -40px; }
.art { position: absolute; left: 0; right: 0; bottom: 64px; display: flex; align-items: flex-end; justify-content: center; gap: 34px; padding: 0 60px; }
.art img { display: block; filter: drop-shadow(0 14px 0 rgba(42, 26, 18, 0.22)); }
.phone { position: absolute; width: 330px; border: 8px solid #2a1a12; border-radius: 38px; overflow: hidden; box-shadow: 0 12px 0 #2a1a12; background: #241810; }
.phone img { display: block; width: 100%; }
.key { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.shade { position: absolute; inset: 0; background: linear-gradient(rgba(36, 24, 16, 0) 30%, rgba(36, 24, 16, 0.5) 58%, rgba(36, 24, 16, 0.94) 86%); }
.title { position: absolute; left: 56px; right: 56px; bottom: 44px; color: #fff6dc; font-weight: 900; line-height: 1.04; letter-spacing: -0.01em; text-shadow: 0 4px 0 #2a1a12, 0 0 18px rgba(36, 24, 16, 0.6); }
.badge { position: absolute; left: 44px; top: 36px; display: flex; align-items: center; gap: 14px; background: #2a1a12; border: 3px solid #c9a063; border-radius: 18px; padding: 8px 20px 8px 8px; color: #fff3d6; font-weight: 800; font-size: 26px; }
.badge img { width: 54px; height: 54px; border-radius: 13px; display: block; }
.badge small { display: block; font-weight: 500; font-size: 17px; color: #ffd166; margin-top: -2px; }
`;

const scenery = `
<div class="sun" style="width:520px;height:520px;right:120px;top:40px;background:#ee7d1c"></div>
<div class="sun" style="width:410px;height:410px;right:175px;top:95px;background:#f9a12e"></div>
<div class="sun" style="width:290px;height:290px;right:235px;top:155px;background:#ffd166"></div>
<svg class="dune" style="bottom:0" width="1280" height="300" viewBox="0 0 1280 300" preserveAspectRatio="none">
<path d="M0 120 Q260 20 560 96 T1280 60 V300 H0Z" fill="#e7b869" stroke="#2a1a12" stroke-width="8"/>
<path d="M0 200 Q340 96 700 168 T1280 150 V300 H0Z" fill="#f3c77c" stroke="#2a1a12" stroke-width="8"/>
</svg>`;

function spriteImg(name, maxH, maxW = 420) {
  const size = sizes[name];
  if (!size) throw new Error(`No sprite "${name}"`);
  const k = Math.min(maxH / size[1], maxW / size[0]);
  return `<img src="${pub(`img/dc/sprites/${name}.webp`)}" width="${Math.round(size[0] * k)}" height="${Math.round(size[1] * k)}">`;
}

/** The inside of <body> for a cover line. titled: leave the lower third quieter, the title goes there. */
function scene(cover, titled) {
  const [kind, ...args] = cover.split(/\s+/);
  if (kind === 'keyart') return `<img class="key" src="${pub('img/dc/keyart-1920.webp')}" style="object-position:50% ${args[0] ?? 42}%">`;
  if (kind === 'sprites') {
    const n = args.length;
    const h = titled ? (n > 3 ? 230 : 280) : (n > 3 ? 260 : n > 1 ? 320 : 380);
    const w = Math.floor((1200 - 120 - 34 * (n - 1)) / n);
    return `${scenery}<div class="art" style="bottom:${titled ? 210 : 64}px">${args.map((a) => spriteImg(a, h, w)).join('')}</div>`;
  }
  if (kind === 'shot' || kind === 'screen') {
    const [name, ...sprites] = args;
    const src = kind === 'shot' ? pub(`img/dc/shots/${name}.webp`) : pub(`img/dc/screen-${name}.webp`);
    const h = titled ? 250 : 330;
    const art = sprites.length ? `<div class="art" style="justify-content:flex-start;left:40px;right:440px;bottom:${titled ? 210 : 64}px">${sprites.map((a) => spriteImg(a, h, Math.floor(600 / sprites.length))).join('')}</div>` : '';
    return `${scenery}${art}<div class="phone" style="right:${sprites.length ? 90 : 435}px;top:${titled ? 34 : 46}px;transform:rotate(${sprites.length ? 4 : 0}deg)"><img src="${src}"></div>`;
  }
  throw new Error(`Unknown cover "${cover}"`);
}

const html = (inner) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${inner}</body></html>`;
const badge = `<div class="badge"><img src="${pub('brand/mark-512.png')}"><div>Dune Clash<small>sandstormgame.xyz</small></div></div>`;
const titleSize = (t) => (t.length > 58 ? 50 : t.length > 44 ? 58 : t.length > 30 ? 66 : 76);

const browser = await pw.chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const tmp = path.join(root, '.cover.png');

async function render(inner, out, resize, quality) {
  const file = path.join(root, '.cover.html');
  writeFileSync(file, html(inner));
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
  await page.screenshot({ path: tmp });
  const args = [tmp];
  if (resize) args.push('-resize', resize);
  args.push('-quality', String(quality), ...(out.endsWith('.webp') ? ['-define', 'webp:method=6'] : ['-interlace', 'Plane', '-sampling-factor', '4:2:0']), out);
  execFileSync('convert', args);
  rmSync(file);
}

const titled = (cover, title) => `${scene(cover, true)}<div class="shade"></div>${badge}<div class="title" style="font-size:${titleSize(title)}px">${title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`;

let n = 0;
for (const a of loadArticles()) {
  if (only.length && !only.includes(a.slug)) continue;
  await render(scene(a.cover, false), path.join(root, 'public/covers', `${a.slug}.webp`), '800x420!', 80);
  await render(titled(a.cover, a.title), path.join(root, 'public/og/blog', `${a.slug}.jpg`), null, 84);
  n++;
}

if (!only.length) {
  // the site-wide pictures: the studio, the game, the list of guides
  const big = (src, w) => `<img src="${src}" style="position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);width:${w}px">`;
  await render(`${scenery.replace(/right:(\d+)px/g, (m, v) => `right:${Number(v) + 120}px`)}${big(pub('brand/logo-stacked.svg'), 640)}`, path.join(root, 'public/og/default.jpg'), null, 86);
  await render(`<img class="key" src="${pub('img/dc/keyart-1920.webp')}" style="object-position:50% 38%"><div class="shade"></div><img src="${pub('img/dc/logo-900.webp')}" style="position:absolute;left:36px;bottom:30px;width:520px;filter:drop-shadow(0 6px 0 rgba(42,26,18,.5))"><div class="title" style="left:auto;right:56px;bottom:56px;text-align:right;font-size:44px;width:520px">Build. Raid.<br>Dodge the worm.</div>`, path.join(root, 'public/og/dune-clash.jpg'), null, 86);
  await render(titled('sprites u-infantry b-citadel-8 worm u-bulwark', 'Dune Clash guides and stories'), path.join(root, 'public/og/blog.jpg'), null, 84);
}
rmSync(tmp, { force: true });
await browser.close();
console.log(`${n} covers`);
