// Screenshots of the game for the articles, taken from its offline build on a phone-sized screen.
//   in the game repo:  npm run build && npx vite preview --port 4173 --strictPort &
//   here:              node tools/game-shots.mjs [url]         (ONLY=army,worm takes just those)
// Online screens (the menu with transfer codes) need the game server too:
//   in the game repo:  npx tsx server/node.ts &                 then   API=http://localhost:8787 node tools/game-shots.mjs
// Writes public/img/dc/shots/<name>.webp (780 px wide). Needs Playwright with Chrome and Pillow's cwebp-free path: sharp is not
// used, the PNG goes through `convert` (ImageMagick).
import { createRequire } from 'node:module';
import { mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/npm-tools/node_modules/playwright'); }

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public/img/dc/shots');
mkdirSync(out, { recursive: true });
const url = process.argv[2] ?? 'http://localhost:4173/';
const api = process.env.API ?? '';
const only = (process.env.ONLY ?? '').split(',').filter(Boolean);
const want = (n) => !only.length || only.includes(n);

const browser = await pw.chromium.launch({ channel: 'chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function open(online) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([api]) => {
    localStorage.setItem('dune-of-clash/tutorial', 'done');
    if (api) localStorage.setItem('dune-of-clash/api', api);
  }, [online ? api : '']);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('[error]', String(e)));
  await page.goto(url);
  await page.waitForFunction(() => window.app?.game.scene.isActive('base') && !document.getElementById('loading'), null, { timeout: 120000 });
  return { ctx, page };
}

function tools(page) {
  const shot = async (name, wait = 900) => {
    if (!want(name)) return;
    await page.waitForTimeout(wait);
    const png = path.join(out, `${name}.png`);
    await page.screenshot({ path: png });
    execFileSync('convert', [png, '-quality', '82', '-define', 'webp:method=6', path.join(out, `${name}.webp`)]);
    rmSync(png);
    console.log('shot', name);
  };
  const tap = (act, arg) => page.locator(arg === undefined ? `[data-act=${act}]` : `[data-act=${act}][data-arg="${arg}"]`).first().tap();
  const look = (scene, zoom, x, y) => page.evaluate(([scene, zoom, x, y]) => { const s = window.app.game.scene.getScene(scene); s.control.setZoom(zoom); s.control.centerOn(x, y); }, [scene, zoom, x, y]);
  const step = (n) => page.evaluate((n) => { const s = window.app.game.scene.getScene('battle'); for (let i = 0; i < n && !s.sim.finished; i++) s.update(s.time.now, 100); return s.sim.finished; }, n);
  /** Screen position of a building of this type (the one nearest the middle), for a tap. */
  const where = (type) => page.evaluate((type) => {
    const st = window.app.ctx.state, s = window.app.game.scene.getScene('base'), defs = window.duneDebug.DEFS;
    const list = st.buildings.filter((b) => b.type === type).sort((a, b) => Math.hypot(a.x - 25, a.y - 25) - Math.hypot(b.x - 25, b.y - 25));
    const b = list[0];
    const half = defs.buildings[type].size / 2;
    const gx = b.x + half, gy = b.y + half;
    const cam = s.cameras.main;
    const dpr = window.app.game.scale.width / window.innerWidth;
    const wx = (gx - gy) * 32, wy = (gx + gy) * 16;
    return { x: ((wx - cam.worldView.x) * cam.zoom) / dpr, y: ((wy - cam.worldView.y) * cam.zoom) / dpr };
  }, type);
  return { shot, tap, look, step, where };
}

/** A base a few days in: Citadel 4, some things upgrading. */
const grow = (page, citadel, seed) => page.evaluate(([citadel, seed]) => {
  const { DEFS, generateOutpost } = window.duneDebug;
  const o = generateOutpost(DEFS, citadel, seed);
  const state = {
    version: 4, name: 'Sand Fox', resource: 48200, scrap: 31900, crystals: 85, nextId: o.buildings.length + 1, lastUpdate: Date.now(), stars: 37, trophies: 412,
    unitLevels: { infantry: 3, shooter: 2, breaker: 2 },
    buildings: o.buildings.map((b, i) => ({ ...b, id: i + 1, ...(b.type === 'collector' || b.type === 'salvage' ? { stored: 900 + i * 370 } : {}) })),
  };
  window.app.replace(state, true);
  window.app.ctx.bus.emit('state:structure');
  window.app.ctx.bus.emit('state:changed');
}, [citadel, seed]);

// ---------- offline ----------
{
  const { ctx, page } = await open(false);
  const { shot, tap, look, step, where } = tools(page);

  // a brand-new base
  await look('base', 0.95, 0, 800);
  await shot('new-base', 1500);

  if (want('howto')) { await tap('menu'); await page.waitForTimeout(300); await tap('howto'); await shot('howto'); await tap('modalClose'); }

  // a base at Citadel 5
  await grow(page, 5, 77);
  await look('base', 0.72, 0, 800);
  await shot('base-citadel-5', 1500);

  if (want('upgrade')) {
    const p = await where(process.env.SELECT ?? 'turret');
    await page.touchscreen.tap(p.x, p.y);
    await shot('upgrade');
    if (want('info')) { await tap('info'); await shot('info'); await tap('modalClose'); }
    await tap('close').catch(() => {});
  }
  if (want('army')) { await tap('army'); await shot('army'); await tap('modalClose'); }
  if (want('crystals')) { await tap('crystals'); await shot('crystals'); await tap('modalClose'); }

  // scouting and the worm
  if (want('scout') || want('worm') || want('deploy')) {
    await page.evaluate(() => {
      const { DEFS, generateOutpost, generatedLoot } = window.duneDebug;
      const citadel = 5, o = generateOutpost(DEFS, citadel, 9);
      const lootMap = generatedLoot(DEFS, o.buildings, citadel, citadel).map((v) => v * 2);
      const scrapMap = generatedLoot(DEFS, o.buildings, citadel, citadel, undefined, 'scrap').map((v) => v * 2);
      const spec = { v: 4, seed: 99, layout: o.buildings, lootMap, scrapMap, housing: 150, units: ['infantry', 'shooter', 'breaker', 'scavenger', 'flyer', 'bulwark'], unitLevels: { infantry: 3, shooter: 2 } };
      window.app.startBattle({ spec, opponent: { name: 'DustDevil', citadel, trophies: 455, kind: 'player' }, loot: lootMap.reduce((a, b) => a + b, 0), worm: true, forceMonster: true });
    });
    await page.waitForFunction(() => window.app.game.scene.isActive('battle') && window.app.game.scene.getScene('battle').sim);
    await look('battle', 0.5, 0, 810);
    await shot('scout');
    await page.evaluate(() => {
      const s = window.app.game.scene.getScene('battle');
      const put = (type, n, gx0, gy0, dx, dy) => { s.selectedUnit = type; for (let i = 0; i < n; i++) { const gx = gx0 + dx * i, gy = gy0 + dy * i; s.tryDeploy((gx - gy) * 32, (gx + gy) * 16 + 4, false); } };
      put('bulwark', 3, 2, 18, 0, 4); put('breaker', 3, 3, 17, 0, 4); put('infantry', 40, 2, 10, 0, 0.7); put('shooter', 14, 1, 12, 0, 1.6);
    });
    await step(30);
    await page.evaluate(() => { const s = window.app.game.scene.getScene('battle'); const u = s.sim.units.find((q) => q.alive); s.control.setZoom(0.8); s.control.centerOn((u.x - u.y) * 32 + 120, (u.x + u.y) * 16 + 120); });
    await step(2);
    await shot('deploy');
  }
  await ctx.close();
}

// ---------- the Sandmaw above the sand ----------
if (want('worm')) {
  const { ctx, page } = await open(false);
  const { shot } = tools(page);
  await page.evaluate(() => {
    const { DEFS, generateOutpost, generatedLoot } = window.duneDebug;
    const citadel = 5, o = generateOutpost(DEFS, citadel, 9);
    const lootMap = generatedLoot(DEFS, o.buildings, citadel, citadel).map((v) => v * 2);
    const scrapMap = generatedLoot(DEFS, o.buildings, citadel, citadel, undefined, 'scrap').map((v) => v * 2);
    // seed 1: the worm sets out 20 seconds into the fight
    const spec = { v: 4, seed: 1, layout: o.buildings, lootMap, scrapMap, housing: 150, units: ['infantry', 'shooter', 'breaker', 'scavenger', 'flyer', 'bulwark'], unitLevels: { infantry: 4, shooter: 4, bulwark: 3 } };
    window.app.startBattle({ spec, opponent: { name: 'DustDevil', citadel, trophies: 455, kind: 'player' }, loot: lootMap.reduce((a, b) => a + b, 0), worm: true, forceMonster: true });
  });
  await page.waitForFunction(() => window.app.game.scene.isActive('battle') && window.app.game.scene.getScene('battle').sim);
  const up = await page.evaluate(() => {
    const s = window.app.game.scene.getScene('battle');
    const put = (type, n, gx0, gy0, dx, dy) => { s.selectedUnit = type; for (let i = 0; i < n; i++) { const gx = gx0 + dx * i, gy = gy0 + dy * i; s.tryDeploy((gx - gy) * 32, (gx + gy) * 16 + 4, false); } };
    let seen = 0;
    for (let i = 0; i < 1500 && !s.sim.finished; i++) {
      // the troops land in one corner shortly before the worm sets out, so it finds them together
      if (i === 150) { put('bulwark', 4, 2, 2, 1.5, 0); put('infantry', 46, 1, 3, 0.6, 0.6); put('shooter', 16, 3, 1, 0.9, 0.4); }
      s.update(s.time.now, 100);
      const m = s.sim.monster;
      if (m?.alive && s.sim.wormUp && ++seen >= Number(new URLSearchParams(location.search).get('seen') ?? 26)) {
        s.control.setZoom(1.2);
        s.control.centerOn((m.x - m.y) * 32, (m.x + m.y) * 16 + 20);
        document.querySelector('.toast')?.classList.remove('show');
        return true;
      }
    }
    return false;
  });
  console.log('worm up:', up);
  await page.evaluate(() => { const s = window.app.game.scene.getScene('battle'); s.update(s.time.now, 100); });
  await shot('worm', 500);
  await ctx.close();
}

// ---------- online: the menu and a transfer code ----------
if (api && (want('menu') || want('code') || want('ladder'))) {
  const { ctx, page } = await open(true);
  const { shot, tap } = tools(page);
  await page.waitForFunction(() => window.app.ctx.online?.connected, null, { timeout: 30000 });
  await tap('menu');
  await shot('menu');
  if (want('code')) { await tap('transferShow'); await shot('code', 1500); await tap('modalClose').catch(() => {}); }
  await ctx.close();
}

await browser.close();
