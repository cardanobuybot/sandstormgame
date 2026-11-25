// Articles: content/blog/<slug>.md with a few lines of front matter, Markdown, and {{shortcodes}} that pull
// tables and pictures from the game's data. Rendered to html for the site and to plain Markdown for the
// text copies (/blog/<slug>.md, llms-full.txt).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import MarkdownIt from 'markdown-it';
import * as G from './gamedata.mjs';
import { esc, tableHtml, tableMd, cta } from './html.mjs';
import { game, categories } from '../site.config.mjs';

const DIR = new URL('../content/blog/', import.meta.url);

const slugify = (s) => s.toLowerCase().replace(/&[a-z]+;/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ---------- Markdown ----------

const md = new MarkdownIt({ html: true, typographer: true });
md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  const t = tokens[idx];
  if (t.tag === 'h2' || t.tag === 'h3') {
    const text = tokens[idx + 1].children.filter((c) => c.type === 'text' || c.type === 'code_inline').map((c) => c.content).join('');
    let id = slugify(text), n = 2;
    while (env.ids.has(id)) id = `${slugify(text)}-${n++}`;
    env.ids.add(id);
    t.attrSet('id', id);
  }
  return self.renderToken(tokens, idx, options);
};
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet('href') ?? '';
  if (/^https?:/.test(href)) tokens[idx].attrSet('rel', 'noopener');
  return self.renderToken(tokens, idx, options);
};
md.renderer.rules.table_open = () => '<div class="table fit"><div class="plate"><div class="table-scroll" tabindex="0"><table>\n';
md.renderer.rules.table_close = () => '</table></div></div></div>\n';

// ---------- shortcodes ----------

const shotInfo = (name) => {
  if (!existsSync(new URL(`../public/img/dc/shots/${name}.webp`, import.meta.url))) throw new Error(`No screenshot "${name}"`);
  return `<img src="/img/dc/shots/${name}.webp" alt="ALT" width="390" height="844" loading="lazy" decoding="async">`;
};

function unitFacts(key) {
  const u = G.units[key];
  const from = { barracks: 'Barracks', motor: 'Motor Works', rotor: 'Rotor Pad' }[u.unlock.building];
  const goes = u.healRange ? 'stays with your vehicles' : { any: 'the nearest building', defense: 'defenses first', resource: 'oil and scrap buildings first' }[u.prefers];
  const facts = [
    ['Comes from', `${from}, from Citadel ${u.unlock.citadel}`],
    ['Army space', String(u.housing)],
    ['Moves', `${u.flying ? 'flies' : 'on the ground'}, ${G.dec(u.speed)} cells a second`],
    [u.healRange ? 'Repair reach' : 'Reach', `${G.dec(u.healRange ?? u.range)} ${(u.healRange ?? u.range) === 1 ? 'cell' : 'cells'}`],
    ['Goes for', goes],
  ];
  const bonus = G.unitBonus(key);
  if (bonus && !u.healRange) facts.push(['Special', bonus]);
  return facts;
}

function buildingFacts(key) {
  const b = G.buildings[key];
  const top = G.config.citadel[G.config.citadel.length - 1].limits[key];
  const facts = [
    ['Kind', G.CATEGORY[b.category]],
    ['Footprint', `${b.size}×${b.size} cells`],
    ['Paid with', G.paysWith(key)],
    ['Available from', key === 'citadel' ? 'the start' : `Citadel ${b.unlock}`],
    ['Levels', String(b.levels.length)],
  ];
  if (key !== 'citadel') facts.push(['How many', `up to ${top} at Citadel ${G.config.citadel.length}`]);
  if (b.targets) facts.push(['Hits', { ground: 'ground units', air: 'aircraft', both: 'ground units and aircraft' }[b.targets]]);
  return facts;
}

const factsHtml = (facts) => `<ul>${facts.map(([k, v]) => `<li><strong>${k}:</strong> ${esc(v)}</li>`).join('')}</ul>`;
const factsMd = (facts) => facts.map(([k, v]) => `- **${k}:** ${v}`).join('\n');

/** name → (argument, text after "|", mode) → html or Markdown. */
const SHORTCODES = {
  table: (arg, rest, mode) => {
    const make = G.TABLES[arg];
    if (!make) throw new Error(`No table "${arg}"`);
    return mode === 'md' ? tableMd(make()) : tableHtml(make(), rest === 'wide' ? 'wide' : '');
  },
  levels: (arg, rest, mode) => (mode === 'md' ? tableMd(G.buildingLevels(arg)) : tableHtml(G.buildingLevels(arg))),
  'unit-levels': (arg, rest, mode) => (mode === 'md' ? tableMd(G.unitLevels(arg)) : tableHtml(G.unitLevels(arg))),
  gallery: (arg, rest, mode) => {
    const b = G.buildings[arg];
    if (mode === 'md') return '';
    return `<ul class="levels" aria-label="${b.name} at every level">${b.levels.map((l, i) => `<li>${G.buildingPic(arg, i + 1, 92)}<span>Level ${i + 1}</span></li>`).join('')}</ul>`;
  },
  unit: (arg, rest, mode) => {
    const u = G.units[arg];
    if (!u) throw new Error(`No unit "${arg}"`);
    if (mode === 'md') return `## ${u.name}\n\n${u.desc}\n\n${factsMd(unitFacts(arg))}\n`;
    return `<div class="unit-head">${G.unitPic(arg, 84)}<div><h2 id="${arg}">${u.name}</h2><p>${esc(u.desc)}</p></div></div>\n${factsHtml(unitFacts(arg))}`;
  },
  building: (arg, rest, mode) => {
    const b = G.buildings[arg];
    if (!b) throw new Error(`No building "${arg}"`);
    if (mode === 'md') return `## ${b.name}\n\n${b.desc}\n\n${factsMd(buildingFacts(arg))}\n`;
    return `<div class="unit-head">${G.buildingPic(arg, b.levels.length, 84)}<div><h2 id="${arg}">${b.name}</h2><p>${esc(b.desc)}</p></div></div>\n${factsHtml(buildingFacts(arg))}`;
  },
  shot: (arg, rest, mode) => {
    if (mode === 'md') return rest ? `*Screenshot: ${rest}*` : '';
    return `<figure class="phone">${shotInfo(arg).replace('ALT', esc(rest ?? 'Dune Clash screenshot'))}${rest ? `<figcaption>${esc(rest)}</figcaption>` : ''}</figure>`;
  },
  shots: (arg, rest, mode) => {
    if (mode === 'md') return rest ? `*Screenshots: ${rest}*` : '';
    const names = arg.split(',');
    const caps = (rest ?? '').split('|');
    return `<div class="pair">${names.map((n, i) => `<figure class="phone">${shotInfo(n.trim()).replace('ALT', esc(caps[i] ?? 'Dune Clash screenshot'))}${caps[i] ? `<figcaption>${esc(caps[i])}</figcaption>` : ''}</figure>`).join('')}</div>`;
  },
  screen: (arg, rest, mode) => {
    if (mode === 'md') return rest ? `*Screenshot: ${rest}*` : '';
    return `<figure class="phone"><img src="/img/dc/screen-${arg}.webp" alt="${esc(rest ?? 'Dune Clash screenshot')}" width="540" height="960" loading="lazy" decoding="async">${rest ? `<figcaption>${esc(rest)}</figcaption>` : ''}</figure>`;
  },
  pic: (arg, rest, mode) => {
    if (mode === 'md') return '';
    return `<figure class="figure-art center">${G.sprite(arg, esc(rest ?? ''), 'sprite')}${rest ? `<figcaption>${esc(rest)}</figcaption>` : ''}</figure>`;
  },
  keyart: (arg, rest, mode) => {
    if (mode === 'md') return '';
    return `<figure class="figure-art"><img src="/img/dc/keyart-1280.webp" srcset="/img/dc/keyart-800.webp 800w, /img/dc/keyart-1280.webp 1280w" sizes="(max-width: 720px) 100vw, 672px" alt="${esc(rest ?? 'Dune Clash key art: the Sandmaw rises behind a walled desert base')}" width="1280" height="720" loading="lazy" decoding="async">${rest ? `<figcaption>${esc(rest)}</figcaption>` : ''}</figure>`;
  },
  cta: (arg, rest, mode) => {
    if (mode === 'md') return `Play Dune Clash: [iPhone (App Store)](${game.appStore.url}) or [in your browser](${game.web.url}).`;
    return cta(rest || undefined);
  },
};

function expand(text, mode) {
  // numbers from the game's data inside sentences
  text = text.replace(/\{\{n:([a-zA-Z]+)\}\}/g, (m, key) => {
    if (!(key in G.N)) throw new Error(`No number "${key}"`);
    return String(G.N[key]);
  });
  // one value of a building or unit ({{b:collector.1.cost}}, {{u:bulwark.6.hp}}), a building limit ({{limit:wall.3}}),
  // army space, room for oil or scrap and income at a Citadel level ({{space:5}}, {{store:oil.5}}, {{income:scrap.5}})
  text = text.replace(/\{\{(b|u):([a-zA-Z0-9.]+)\}\}/g, (m, kind, path) => G.value(kind, path));
  text = text.replace(/\{\{limit:([a-z]+\.[0-9])\}\}/g, (m, path) => G.limit(path));
  text = text.replace(/\{\{space:([0-9])\}\}/g, (m, c) => String(G.spaceAt(Number(c))));
  text = text.replace(/\{\{store:(oil|scrap)\.([0-9])\}\}/g, (m, kind, c) => G.num(G.storeAt(Number(c), kind)));
  text = text.replace(/\{\{income:(oil|scrap)\.([0-9])\}\}/g, (m, kind, c) => G.num(G.incomeAt(Number(c), kind)));
  return text.split('\n').map((line) => {
    const m = /^\{\{([a-z-]+)(?::([^|}]*))?(?:\|(.*))?\}\}$/.exec(line.trim());
    if (!m) {
      // a shortcode that is not alone on its line, or misspelt, would otherwise be printed as it is
      if (/\{\{|\}\}/.test(line)) throw new Error(`Stray shortcode in: ${line.trim().slice(0, 90)}`);
      return line;
    }
    const fn = SHORTCODES[m[1]];
    if (!fn) throw new Error(`Unknown shortcode ${line}`);
    return `\n${fn(m[2] ?? '', m[3], mode)}\n`;
  }).join('\n');
}

// ---------- articles ----------

function parse(file) {
  const raw = readFileSync(new URL(file, DIR), 'utf8');
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!m) throw new Error(`${file}: no front matter`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2] };
}

export function loadArticles() {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.md')).sort();
  const list = files.map((file) => {
    const slug = file.replace(/\.md$/, '');
    const { meta, body } = parse(file);
    for (const key of ['title', 'description', 'category', 'date', 'cover']) if (!meta[key]) throw new Error(`${file}: no "${key}"`);
    if (!categories[meta.category]) throw new Error(`${file}: unknown category "${meta.category}"`);
    if (meta.description.length > 165) console.warn(`  ${slug}: description is ${meta.description.length} characters`);
    if (meta.title.length > 66) console.warn(`  ${slug}: title is ${meta.title.length} characters`);
    let html, text;
    try {
      const env = { ids: new Set() };
      html = md.render(expand(body, 'html'), env);
      text = expand(body, 'md').replace(/\n{3,}/g, '\n\n').trim();
    } catch (e) {
      throw new Error(`${file}: ${e.message}`);
    }
    const toc = [...html.matchAll(/<h2 id="([^"]+)"[^>]*>(.*?)<\/h2>/g)].map((h) => ({ id: h[1], text: h[2].replace(/<[^>]+>/g, '') }));
    const words = body.replace(/\{\{[^}]*\}\}/g, ' ').split(/\s+/).filter(Boolean).length;
    return {
      slug, path: `/blog/${slug}/`, title: meta.title, description: meta.description, category: meta.category, section: categories[meta.category].title,
      date: meta.date, updated: meta.updated, order: Number(meta.order ?? 50), cover: meta.cover, coverAlt: meta.coverAlt ?? '',
      related: (meta.related ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      short: meta.short ?? meta.title, usesData: /\{\{(table|levels|unit-levels|unit|building|n|b|u|limit|space|store|income):/.test(body),
      faq: meta.faq === 'yes', html, text, toc, words, minutes: Math.max(2, Math.round(words / 210)),
      og: `/og/blog/${slug}.jpg`, thumb: `/covers/${slug}.webp`,
    };
  });
  const bySlug = new Map(list.map((a) => [a.slug, a]));
  // DRAFT=1: while articles are still being written, a link to one that does not exist yet is not an error
  for (const a of list) {
    if (process.env.DRAFT) a.related = a.related.filter((r) => bySlug.has(r));
    for (const r of a.related) if (!bySlug.has(r)) throw new Error(`${a.slug}: related article "${r}" does not exist`);
  }
  return list;
}

/** Questions and answers of an article written as "### Question?" followed by paragraphs, for FAQPage data. */
export function faqOf(html) {
  const out = [];
  const re = /<h3 id="[^"]*">(.*?)<\/h3>([\s\S]*?)(?=<h3 |<h2 |$)/g;
  for (const m of html.matchAll(re)) {
    const q = m[1].replace(/<[^>]+>/g, '').trim();
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (q.endsWith('?') && text) out.push({ q, text });
  }
  return out;
}
