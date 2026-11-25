// Tables and pictures built from the game's own balance files (data/dune-clash/*.json, a copy of src/data of the game).
// The guides do not retype numbers: they ask for a table by name ({{levels:turret}}), so a balance change is
// one copy of four files and a rebuild.
import { readFileSync } from 'node:fs';

const load = (name) => JSON.parse(readFileSync(new URL(`../data/dune-clash/${name}.json`, import.meta.url), 'utf8'));
export const buildings = load('buildings');
export const units = load('units');
export const config = load('config');
export const monster = load('monster');
export const spriteSizes = JSON.parse(readFileSync(new URL('../public/img/dc/sprites/sizes.json', import.meta.url), 'utf8'));

// ---------- words and numbers ----------

export const num = (n) => Math.round(n).toLocaleString('en-US');
/** 1.5 → "1.5", 2 → "2". */
export const dec = (n, d = 1) => String(Number(n.toFixed(d)));

/** Seconds as people say them: 10 s, 1 min, 3 h, 1 d 12 h. */
export function dur(sec) {
  if (!sec) return 'instant';
  if (sec < 60) return `${sec} s`;
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.round((sec % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d} d`);
  if (h) parts.push(`${h} h`);
  if (m && !d) parts.push(`${m} min`);
  return parts.join(' ');
}

export const CATEGORY = { core: 'Core', resource: 'Economy', army: 'Army', defense: 'Defense', wall: 'Wall', trap: 'Trap' };
export const paysWith = (key) => (buildings[key].pays === 'scrap' ? 'scrap' : 'oil');
const TARGETS = { ground: 'Ground', air: 'Air', both: 'Ground and air' };
const ARMOR = { light: 'light units (Infantry, Ranger, Scavenger)', armor: 'armoured vehicles', air: 'aircraft' };
const UNLOCK_BUILDING = { barracks: 'Barracks', motor: 'Motor Works', rotor: 'Rotor Pad' };
const PREFERS = { any: 'the nearest building', defense: 'defenses first', resource: 'oil and scrap buildings first' };

/** Citadel level at which a building can reach this level. */
export const citadelFor = (key, level) => (key === 'citadel' ? level : buildings[key].unlock + level - 1);

// ---------- pictures ----------

export function sprite(name, alt, cls = 'sprite', max = 0) {
  const size = spriteSizes[name];
  if (!size) throw new Error(`No sprite "${name}"`);
  let [w, h] = size;
  // sprites are stored at twice the size they are shown at
  w = Math.round(w / 2); h = Math.round(h / 2);
  if (max && Math.max(w, h) > max) { const k = max / Math.max(w, h); w = Math.round(w * k); h = Math.round(h * k); }
  return `<img class="${cls}" src="/img/dc/sprites/${name}.webp" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async">`;
}

export const buildingPic = (key, level, max = 0, cls = 'sprite') => sprite(`b-${key}-${level}`, `${buildings[key].name}, level ${level}`, cls, max);
export const unitPic = (key, max = 0, cls = 'sprite') => sprite(`u-${key}`, units[key].name, cls, max);

// ---------- tables: { caption, head, rows, num (columns that hold numbers), note } ----------

export function buildingLevels(key) {
  const b = buildings[key];
  const res = paysWith(key);
  const head = ['Level'];
  const cols = [(l, i) => String(i + 1)];
  const add = (title, fn) => { head.push(title); cols.push(fn); };
  if (key !== 'citadel') add('Needs Citadel', (l, i) => String(citadelFor(key, i + 1)));
  add(`Cost (${res})`, (l) => (l.cost ? num(l.cost) : 'free'));
  if (b.levels.some((l) => l.time > 0)) add('Build time', (l) => dur(l.time));
  if (b.category !== 'trap') add('Health', (l) => num(l.hp));
  if (key === 'citadel') {
    add('Stores oil', (l) => num(l.storage));
    add('Stores scrap', (l) => num(l.scrapStorage));
    add('Builders', (l, i) => String(config.citadel[i].builders));
    add('Crystals for reaching it', (l, i) => (config.crystals.citadelReward[i + 1] ? `+${config.crystals.citadelReward[i + 1]}` : 'none'));
  }
  if (b.levels[0].ratePerMinute) {
    add('Makes per hour', (l) => num(l.ratePerMinute * 60));
    add('Holds', (l) => num(l.capacity));
    add('Full after', (l) => dur(Math.round((l.capacity / l.ratePerMinute) * 60)));
  }
  if (key === 'storage') add('Stores oil', (l) => num(l.storage));
  if (key === 'depot') add('Stores scrap', (l) => num(l.scrapStorage));
  if (b.levels[0].housing) add('Army space', (l) => String(l.housing));
  if (key === 'proving') add('Units can reach level', (l, i) => String(i + 2));
  if (b.levels[0].damage) {
    add(b.category === 'trap' ? 'Damage' : 'Damage per shot', (l) => num(l.damage));
    if (b.levels[0].cooldown) add('Damage per second', (l) => dec(l.damage / l.cooldown));
    if (b.levels.some((l) => l.range !== b.levels[0].range)) add('Range (cells)', (l) => dec(l.range));
    if (b.levels[0].splashRadius && b.levels.some((l) => l.splashRadius !== b.levels[0].splashRadius)) add('Blast radius (cells)', (l) => dec(l.splashRadius));
  }
  return {
    caption: `${b.name}: every level`,
    head, rows: b.levels.map((l, i) => cols.map((fn) => fn(l, i))), text: [],
  };
}

export function unitLevels(key) {
  const u = units[key];
  const heals = !!u.healRange;
  const head = ['Level', 'Health', heals ? 'Repairs per second' : 'Damage per hit'];
  if (!heals) head.push('Damage per second');
  head.push('Research cost (oil)', 'Research time', 'Needs Proving Ground');
  const rows = u.levels.map((l, i) => {
    const r = [String(i + 1), num(l.hp), heals ? num(l.heal / u.cooldown) : num(l.damage)];
    if (!heals) r.push(dec(l.damage / u.cooldown));
    r.push(i ? num(l.cost) : 'starts here', i ? dur(l.time) : '', i ? `level ${i}` : '');
    return r;
  });
  return { caption: `${u.name}: every level`, head, rows };
}

export function unitBonus(key) {
  const u = units[key];
  const out = [];
  if (u.mult?.defense) out.push(`×${u.mult.defense} to defenses`);
  if (u.mult?.wall) out.push(`×${u.mult.wall} to walls`);
  if (u.mult?.resource) out.push(`×${u.mult.resource} to oil and scrap buildings`);
  if (u.splashRadius) out.push(`hits an area (${u.splashRadius} cells)`);
  if (u.healRange) out.push(`repairs vehicles within ${u.healRange} cells`);
  return out.join('; ');
}

export function unitsSummary() {
  const head = ['Unit', 'Comes from', 'Army space', 'Health', 'Damage per hit', 'Hits every', 'Range (cells)', 'Speed (cells/s)', 'Goes for', 'Special'];
  const rows = Object.entries(units).map(([key, u]) => {
    const first = u.levels[0], last = u.levels[u.levels.length - 1];
    return [
      { html: `<a href="/blog/dune-clash-units-guide/#${key}">${u.name}</a>`, text: u.name },
      `${UNLOCK_BUILDING[u.unlock.building]}, Citadel ${u.unlock.citadel}`,
      String(u.housing),
      `${num(first.hp)} to ${num(last.hp)}`,
      u.healRange ? 'none' : `${num(first.damage)} to ${num(last.damage)}`,
      `${dec(u.cooldown)} s`,
      u.healRange ? `${u.healRange} (repair)` : dec(u.range),
      dec(u.speed),
      u.healRange ? 'follows your vehicles' : PREFERS[u.prefers],
      unitBonus(key) || (u.flying ? 'flies over walls' : ''),
    ];
  });
  return { caption: 'All nine units at a glance (level 1 to level 6)', head, rows };
}

export function buildingsSummary() {
  const head = ['Building', 'Kind', 'Footprint', 'Paid with', 'From Citadel', 'Levels', 'What it does'];
  const rows = Object.entries(buildings).map(([key, b]) => [
    { html: `<a href="/blog/dune-clash-buildings-guide/#${key}">${b.name}</a>`, text: b.name },
    CATEGORY[b.category], `${b.size}×${b.size}`, paysWith(key), String(b.unlock), String(b.levels.length), b.desc,
  ]);
  return { caption: 'All 17 buildings', head, rows };
}

export function defensesSummary() {
  const head = ['Defense', 'From Citadel', 'Hits', 'Damage per shot', 'Reload', 'Range (cells)', 'Strong against', 'Weak spot'];
  const weak = {
    turret: 'Cannot hit aircraft; outranged by Longshots',
    shellpit: 'Blind inside 3 cells and to aircraft; shells take 1.2 s to land',
    flak: 'Ignores everything on the ground',
    blind: 'Short reach',
    rocket: 'Slow reload',
  };
  const rows = ['turret', 'shellpit', 'flak', 'blind', 'rocket'].map((key) => {
    const b = buildings[key], first = b.levels[0], last = b.levels[b.levels.length - 1];
    const bonus = Object.entries(b.bonus ?? {}).map(([k, v]) => `×${v} to ${ARMOR[k]}`).join('; ');
    return [
      { html: `<a href="/blog/dune-clash-buildings-guide/#${key}">${b.name}</a>`, text: b.name },
      String(b.unlock), TARGETS[b.targets], `${num(first.damage)} to ${num(last.damage)}`, `${dec(first.cooldown)} s`,
      first.range === last.range ? dec(first.range) : `${dec(first.range)} to ${dec(last.range)}`,
      (b.splashRadius || first.splashRadius ? 'groups (area damage); ' : '') + (bonus || (key === 'flak' ? 'aircraft, the only thing it shoots' : 'everything on the ground')),
      weak[key],
    ];
  });
  return { caption: 'The five guns compared (level 1 to top level)', head, rows };
}

/** What becomes available at each Citadel level. */
export function citadelUnlocks() {
  const head = ['Citadel', 'Upgrade cost (oil)', 'Upgrade time', 'New buildings', 'New units', 'Builders', 'Crystals'];
  const rows = config.citadel.map((c, i) => {
    const level = i + 1;
    const newB = Object.entries(buildings).filter(([key, b]) => key !== 'citadel' && b.unlock === level).map(([, b]) => b.name);
    const newU = Object.values(units).filter((u) => u.unlock.citadel === level).map((u) => u.name);
    const l = buildings.citadel.levels[i];
    return [String(level), l.cost ? num(l.cost) : 'you start here', l.time ? dur(l.time) : '', newB.join(', ') || 'none', newU.join(', ') || 'none', String(c.builders),
      config.crystals.citadelReward[level] ? `+${config.crystals.citadelReward[level]}` : ''];
  });
  return { caption: 'What every Citadel level unlocks', head, rows };
}

/** How many of each building a Citadel level allows. */
export function citadelLimits() {
  const head = ['Building', ...config.citadel.map((c, i) => `C${i + 1}`)];
  const rows = Object.entries(buildings).filter(([key]) => key !== 'citadel').map(([key, b]) => [b.name, ...config.citadel.map((c) => (c.limits[key] ? String(c.limits[key]) : '–'))]);
  return { caption: 'How many of each building you may have, by Citadel level', head, rows };
}

/** Highest level of each building at each Citadel level. */
export function citadelCaps() {
  const head = ['Building', ...config.citadel.map((c, i) => `C${i + 1}`)];
  const rows = Object.entries(buildings).filter(([key]) => key !== 'citadel').map(([key, b]) => [b.name, ...config.citadel.map((c, i) => {
    const cap = Math.max(0, Math.min(b.levels.length, i + 1 - b.unlock + 1));
    return cap ? String(cap) : '–';
  })]);
  return { caption: 'Highest level of each building, by Citadel level', head, rows };
}

export function armySpace() {
  const head = ['Citadel', 'Barracks', 'Motor Works', 'Rotor Pad', 'Most army space'];
  const rows = config.citadel.map((c, i) => {
    const level = i + 1;
    const part = (key) => {
      const b = buildings[key];
      const n = c.limits[key] ?? 0;
      const cap = Math.max(0, Math.min(b.levels.length, level - b.unlock + 1));
      return n && cap ? { n, cap, space: n * b.levels[cap - 1].housing } : null;
    };
    const parts = ['barracks', 'motor', 'rotor'].map(part);
    return [String(level), ...parts.map((p) => (p ? `${p.n} × level ${p.cap}` : '–')), String(parts.reduce((a, p) => a + (p?.space ?? 0), 0))];
  });
  return { caption: 'Army space with every army building at its top level for that Citadel', head, rows };
}

export function lootShare() {
  const head = ['Defender\'s Citadel', 'Share of stored oil and scrap on offer', 'From pumpjacks and salvage yards'];
  // neighbouring Citadel levels with the same share make one row
  const groups = [];
  config.citadel.forEach((c, i) => {
    const last = groups[groups.length - 1];
    if (last && last.share === c.lootShare) last.to = i + 1;
    else groups.push({ from: i + 1, to: i + 1, share: c.lootShare });
  });
  const rows = groups.map((g) => [g.from === g.to ? String(g.from) : `${g.from} to ${g.to}`, `${Math.round(g.share * 100)}%`, `${Math.round(config.collectorLootShare * 100)}% of what sits inside`]);
  return { caption: 'How much of a base a raid can carry off', head, rows };
}

export function lootByLevel() {
  const head = ['Their Citadel compared with yours', 'Loot multiplier'];
  const order = ['-3', '-2', '-1', '0', '1', '2', '3'];
  const label = { '-3': '3 or more levels lower', '-2': '2 levels lower', '-1': '1 level lower', 0: 'same level', 1: '1 level higher', 2: '2 levels higher', 3: '3 or more levels higher' };
  return { caption: 'Loot multiplier by Citadel difference', head, rows: order.map((k) => [label[k], `×${config.lootByLevelDiff[k]}`]) };
}

export function trophies() {
  const t = config.pvp.trophies;
  const head = ['Stars', 'How you earn it', 'Trophies you gain', 'Trophies the defender loses'];
  const how = ['less than half the base, Citadel standing', 'half the base destroyed, or the Citadel', 'half the base and the Citadel', 'everything destroyed'];
  return { caption: 'Stars and trophies', head, rows: t.map((v, i) => [String(i), how[i], `+${v}`, v ? `−${Math.floor(v * config.pvp.defenseLossShare)}` : '0']) };
}

function onCurve(points, x) {
  let i = 1;
  while (i < points.length - 1 && x > points[i][0]) i++;
  const [x0, y0] = points[i - 1], [x1, y1] = points[i];
  return Math.max(1, Math.ceil(y0 + ((y1 - y0) * (x - x0)) / (x1 - x0) - 1e-9));
}

export function crystalFinish() {
  const samples = [60, 600, 3600, 3 * 3600, 8 * 3600, 86400, 3 * 86400];
  return { caption: 'Crystals to finish a job now', head: ['Time left', 'Crystals'], rows: samples.map((s) => [dur(s), num(onCurve(config.crystals.finish, s))]) };
}

export function crystalBuy() {
  const samples = [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000];
  return { caption: 'Crystals for missing oil or scrap', head: ['Oil or scrap you are short of', 'Crystals'], rows: samples.map((s) => [num(s), num(onCurve(config.crystals.oil, s))]) };
}

export function crystalPacks() {
  const usd = { crystals_100: '$0.99', crystals_550: '$4.99', crystals_1200: '$9.99', crystals_2600: '$19.99', crystals_7000: '$49.99' };
  return {
    caption: 'Crystal packs (App Store prices in the United States; your store shows the local price)',
    head: ['Pack', 'Crystals', 'US price'], rows: config.crystals.packs.map((p) => [p.name, num(p.crystals), usd[p.id]]),
  };
}

export function nextCost() {
  return { caption: 'Oil to skip to the next opponent', head: ['Your Citadel', 'Oil per skip'], rows: config.citadel.map((c, i) => [String(i + 1), num(c.nextCost)]) };
}


// ---------- derived tables: what the data adds up to ----------

const capAt = (key, citadel) => (key === 'citadel' ? citadel : Math.max(0, Math.min(buildings[key].levels.length, citadel - buildings[key].unlock + 1)));
const countAt = (key, citadel) => (key === 'citadel' ? 1 : config.citadel[citadel - 1].limits[key] ?? 0);

/** Most army space at a Citadel level, with every army building at its top level. */
export function spaceAt(citadel) {
  return ['barracks', 'motor', 'rotor'].reduce((sum, key) => {
    const cap = capAt(key, citadel);
    return sum + (cap ? countAt(key, citadel) * buildings[key].levels[cap - 1].housing : 0);
  }, 0);
}

/** Room for oil or scrap at a Citadel level with every store at its top level. */
export function storeAt(citadel, kind = 'oil') {
  const field = kind === 'scrap' ? 'scrapStorage' : 'storage';
  const key = kind === 'scrap' ? 'depot' : 'storage';
  return buildings.citadel.levels[citadel - 1][field] + countAt(key, citadel) * buildings[key].levels[capAt(key, citadel) - 1][field];
}

/** Oil or scrap an hour at a Citadel level with every pumpjack or salvage yard at its top level. */
export function incomeAt(citadel, kind = 'oil') {
  const key = kind === 'scrap' ? 'salvage' : 'collector';
  return countAt(key, citadel) * buildings[key].levels[capAt(key, citadel) - 1].ratePerMinute * 60;
}

export function economy() {
  const head = ['Citadel', 'Pumpjacks', 'Oil per hour', 'Salvage Yards', 'Scrap per hour', 'Room for oil', 'Room for scrap'];
  const rows = config.citadel.map((c, i) => {
    const level = i + 1;
    return [String(level), `${countAt('collector', level)} × level ${capAt('collector', level)}`, num(incomeAt(level)),
      `${countAt('salvage', level)} × level ${capAt('salvage', level)}`, num(incomeAt(level, 'scrap')), num(storeAt(level)), num(storeAt(level, 'scrap'))];
  });
  return { caption: 'Income and storage with everything at its top level for that Citadel', head, rows };
}

/** The building work each Citadel level opens: new buildings, and new levels for the ones already standing. */
function stageWork() {
  const out = [];
  for (let level = 1; level <= config.citadel.length; level++) {
    let time = 0, oil = 0, scrap = 0;
    for (const [key, b] of Object.entries(buildings)) {
      if (key === 'citadel') continue;
      const had = level > 1 ? countAt(key, level - 1) : 0, hadCap = level > 1 ? capAt(key, level - 1) : 0;
      const now = countAt(key, level), cap = capAt(key, level);
      const add = (l) => { const d = b.levels[l - 1]; time += d.time; if (b.pays === 'scrap') scrap += d.cost; else oil += d.cost; };
      for (let n = 0; n < had; n++) for (let l = hadCap + 1; l <= cap; l++) add(l);
      for (let n = had; n < now; n++) for (let l = 1; l <= cap; l++) add(l);
    }
    out.push({ level, time, oil, scrap, builders: config.citadel[level - 1].builders });
  }
  return out;
}

const days = (sec) => (sec < 3600 ? dur(Math.round(sec / 60) * 60) : sec < 86400 ? `${dec(sec / 3600)} h` : `${dec(sec / 86400)} days`);

export function stages() {
  const work = stageWork();
  const head = ['Citadel', 'Builders', 'Building work it opens', 'With every builder busy', 'Oil for buildings', 'Scrap for defenses and walls'];
  const rows = work.map((w) => [String(w.level), String(w.builders), days(w.time), days(w.time / w.builders), num(w.oil), num(w.scrap)]);
  const sum = (f) => work.reduce((a, w) => a + f(w), 0);
  rows.push(['All eight', '', days(sum((w) => w.time)), days(sum((w) => w.time / w.builders)), num(sum((w) => w.oil)), num(sum((w) => w.scrap))]);
  return { caption: 'How much there is to build at each Citadel level (the Citadel upgrade itself not counted)', head, rows };
}

export function wormHealth() {
  const head = ['Your Citadel', 'Most army space', 'Sandmaw health'];
  const rows = config.citadel.map((c, i) => [String(i + 1), String(spaceAt(i + 1)), num(monster.hp + monster.hpPerHousing * spaceAt(i + 1))]);
  return { caption: 'The bigger your army, the tougher the worm', head, rows };
}

export function wormBites() {
  const head = ['Unit', 'Health (level 1 to 6)', 'Bites to kill it at level 1', 'At level 6', 'Can the worm reach it?'];
  const rows = Object.values(units).map((u) => {
    const first = u.levels[0].hp, last = u.levels[u.levels.length - 1].hp;
    const bites = (hp) => (u.flying ? '–' : String(Math.ceil(hp / monster.damage)));
    return [u.name, `${num(first)} to ${num(last)}`, bites(first), bites(last), u.flying ? 'no, it flies' : 'yes'];
  });
  return { caption: `What a Sandmaw bite (${monster.damage} damage) does to each unit`, head, rows };
}

export function wallBreak() {
  const who = ['breaker', 'bulwark', 'infantry', 'shooter'];
  const head = ['Wall level', 'Wall health', ...who.map((k) => `${units[k].name} hits`)];
  const hits = (k, hp) => {
    const u = units[k], m = u.mult?.wall ?? 1;
    const at = (l) => Math.ceil(hp / (u.levels[l].damage * m));
    return `${at(0)} / ${at(u.levels.length - 1)}`;
  };
  const rows = buildings.wall.levels.map((l, i) => [String(i + 1), num(l.hp), ...who.map((k) => hits(k, l.hp))]);
  return { caption: 'Hits one unit needs to break one wall (unit at level 1 / unit at level 6)', head, rows };
}

export function antiAir() {
  const keys = ['flak', 'blind', 'rocket', 'snare'];
  const head = ['Defense', 'From Citadel', 'Damage (level 1 to top)', 'Reload', 'Reach (cells)', 'Hits to down a Flyer', 'Hits to down a Thunderwing'];
  const rows = keys.map((key) => {
    const b = buildings[key], first = b.levels[0], last = b.levels[b.levels.length - 1];
    const need = (unit) => {
      const u = units[unit];
      return `${Math.ceil(u.levels[0].hp / first.damage)} / ${Math.ceil(u.levels[u.levels.length - 1].hp / last.damage)}`;
    };
    return [b.name, String(b.unlock), `${num(first.damage)} to ${num(last.damage)}`, first.cooldown ? `${dec(first.cooldown)} s` : 'fires once',
      dec(first.range ?? first.triggerRadius), need('flyer'), need('thunderwing')];
  });
  return { caption: 'Everything that can shoot at aircraft (level 1 defense against a level 1 aircraft / top level against level 6)', head, rows };
}

export function research() {
  const head = ['Unit', 'Oil for all five upgrades', 'Research time for all five', 'Last upgrade alone'];
  const rows = Object.values(units).map((u) => {
    const ups = u.levels.slice(1);
    return [u.name, num(ups.reduce((a, l) => a + l.cost, 0)), days(ups.reduce((a, l) => a + l.time, 0)), `${num(ups[ups.length - 1].cost)} oil, ${dur(ups[ups.length - 1].time)}`];
  });
  const all = Object.values(units).flatMap((u) => u.levels.slice(1));
  rows.push(['All nine units', num(all.reduce((a, l) => a + l.cost, 0)), days(all.reduce((a, l) => a + l.time, 0)), '']);
  return { caption: 'What it takes to research every unit from level 1 to level 6', head, rows };
}

/**
 * What a raid can bring from a base that loses nothing (an Echo, or a base under a shield): the game works it out
 * from the base's stores, taken as about a third full. Here: a base of the same Citadel level with every store and
 * producer at its top level, every building that holds loot destroyed.
 */
export function echoLoot() {
  const fill = 0.35;
  const of = (level, kind) => {
    const share = config.citadel[level - 1].lootShare;
    const producer = kind === 'scrap' ? 'salvage' : 'collector';
    const inside = countAt(producer, level) * buildings[producer].levels[capAt(producer, level) - 1].capacity * fill * 0.25 * config.collectorLootShare;
    return Math.floor(storeAt(level, kind) * fill * share + inside);
  };
  const head = ['Citadel (yours and theirs)', 'Oil', 'Scrap', 'The same oil from your own pumpjacks takes'];
  const rows = config.citadel.map((c, i) => {
    const level = i + 1, oil = of(level, 'oil');
    return [String(level), `about ${num(Math.round(oil / 100) * 100)}`, `about ${num(Math.round(of(level, 'scrap') / 100) * 100)}`, dur(Math.round((oil / incomeAt(level)) * 60) * 60)];
  });
  return { caption: 'A full raid on an Echo of your own level, if its stores and producers are at top level', head, rows };
}

export const TABLES = {
  units: unitsSummary, buildings: buildingsSummary, defenses: defensesSummary, 'citadel-unlocks': citadelUnlocks, 'citadel-limits': citadelLimits,
  'citadel-caps': citadelCaps, 'army-space': armySpace, 'loot-share': lootShare, 'loot-level': lootByLevel, trophies, 'crystal-finish': crystalFinish,
  'crystal-buy': crystalBuy, 'crystal-packs': crystalPacks, 'next-cost': nextCost, economy, stages, 'worm-health': wormHealth, 'worm-bites': wormBites,
  'wall-break': wallBreak, 'anti-air': antiAir, research, 'echo-loot': echoLoot,
};

/** A few numbers the prose needs, so that articles can say {{n:shieldHours}} instead of a figure that may change. */
export const N = {
  shieldHours: config.pvp.shieldHours,
  shieldShare: Math.round(config.pvp.shieldLootShare * 100),
  revengeHours: config.pvp.revengeHours,
  battleSeconds: config.battleDuration,
  battleMinutes: config.battleDuration / 60,
  scoutSeconds: config.scoutTime,
  startOil: num(config.startResource),
  startScrap: num(config.startScrap),
  startCrystals: config.crystals.start,
  dailyCrystals: config.crystals.dailyWin,
  refund: Math.round(config.refundRate * 100),
  wormChance: Math.round(monster.battle.spawnChance * 100),
  wormFrom: monster.battle.minTime,
  wormTo: monster.battle.maxTime,
  wormStay: monster.battle.duration,
  wormDamage: monster.damage,
  wormBase: monster.hp,
  wormPer: monster.hpPerHousing,
  wormAlert: monster.alertRange,
  wormSplash: monster.splashRadius,
  buildingCount: Object.keys(buildings).length,
  unitCount: Object.keys(units).length,
  citadelMax: buildings.citadel.levels.length,
  grid: config.gridSize - 2 * config.baseMargin,
  strip: config.baseMargin,
  matchRange: config.pvp.matchRange,
  wormSpeed: monster.speed,
  wormReload: monster.cooldown,
  wormSurface: monster.surfaceTime,
  citadelCrystals: config.crystals.citadelReward.reduce((a, b) => a + b, 0),
  freeCrystals: config.crystals.start + config.crystals.citadelReward.reduce((a, b) => a + b, 0),
  lootProducers: Math.round(config.collectorLootShare * 100),
  lootShareLow: Math.round(config.citadel[0].lootShare * 100),
  lootShareTop: Math.round(config.citadel[config.citadel.length - 1].lootShare * 100),
  revealPercent: 51,
  walls: config.citadel[config.citadel.length - 1].limits.wall,
  topSpace: spaceAt(config.citadel.length),
  topWorm: num(monster.hp + monster.hpPerHousing * spaceAt(config.citadel.length)),
  buildDays: Math.round((stageWork().reduce((a, w) => a + w.time, 0) + buildings.citadel.levels.reduce((a, l) => a + l.time, 0)) / 86400),
  buildDaysBusy: Math.round((stageWork().reduce((a, w) => a + w.time / w.builders, 0) + buildings.citadel.levels.reduce((a, l) => a + l.time, 0)) / 86400),
  researchDays: Math.round(Object.values(units).flatMap((u) => u.levels.slice(1)).reduce((a, l) => a + l.time, 0) / 86400),
};

/** Long form of a duration for sentences: "15 minutes", "2 hours", "1 day 12 hours". */
export function durLong(sec) {
  if (!sec) return 'no time';
  const say = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  if (sec < 60) return say(sec, 'second');
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.round((sec % 3600) / 60);
  const parts = [];
  if (d) parts.push(say(d, 'day'));
  if (h) parts.push(say(h, 'hour'));
  if (m && !d) parts.push(say(m, 'minute'));
  return parts.join(' ');
}

const FIELD = {
  time: durLong, range: (v) => dec(v), cooldown: (v) => dec(v), splashRadius: (v) => dec(v), triggerRadius: (v) => dec(v),
};

/** One value from the data for a sentence: value('b', 'collector.1.cost') → "150". "perHour" and "fullAfter" are worked out. */
export function value(kind, path) {
  const [key, levelText, field] = path.split('.');
  const def = (kind === 'b' ? buildings : units)[key];
  if (!def) throw new Error(`No ${kind === 'b' ? 'building' : 'unit'} "${key}"`);
  const l = def.levels[Number(levelText) - 1];
  if (!l) throw new Error(`"${key}" has no level ${levelText}`);
  if (field === 'perHour') return num(l.ratePerMinute * 60);
  if (field === 'fullAfter') return durLong(Math.round((l.capacity / l.ratePerMinute) * 60));
  if (!(field in l)) throw new Error(`"${key}" level ${levelText} has no "${field}"`);
  return (FIELD[field] ?? num)(l[field]);
}

/** How many of a building a Citadel level allows. */
export function limit(path) {
  const [key, citadel] = path.split('.');
  const c = config.citadel[Number(citadel) - 1];
  if (!c || !(key in c.limits)) throw new Error(`No limit "${path}"`);
  return String(c.limits[key]);
}

