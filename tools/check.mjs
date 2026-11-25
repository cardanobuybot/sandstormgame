// Looks over the built site (dist/) the way a search engine would and reports what is missing or odd:
// title, description, canonical, one h1, structured data that parses, pictures with sizes and alt text.
//   node build.mjs && node tools/check.mjs
// Exit code 1 if anything is wrong. Broken links are the build's own job (build.mjs stops on them).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const pages = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) walk(file);
    else if (name.endsWith('.html')) pages.push(file);
  }
})(dist);

let problems = 0;
const say = (page, text) => { problems++; console.log(`${path.relative(dist, page)}: ${text}`); };
const titles = new Map(), descriptions = new Map();
let words = 0, bytes = 0, schema = 0;

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const is404 = file.endsWith('404.html');
  bytes += html.length;
  const one = (re) => (re.exec(html) ?? [])[1];
  const title = one(/<title>([^<]*)<\/title>/);
  const description = one(/<meta name="description" content="([^"]*)"/);
  const canonical = one(/<link rel="canonical" href="([^"]*)"/);
  if (!title) say(file, 'no title');
  else {
    if (title.length > 70) say(file, `title is ${title.length} characters`);
    if (titles.has(title)) say(file, `same title as ${titles.get(title)}`);
    titles.set(title, path.relative(dist, file));
  }
  if (!description) say(file, 'no description');
  else {
    if (!is404 && (description.length < 70 || description.length > 170)) say(file, `description is ${description.length} characters`);
    if (descriptions.has(description)) say(file, `same description as ${descriptions.get(description)}`);
    descriptions.set(description, path.relative(dist, file));
  }
  if (!is404 && !canonical) say(file, 'no canonical address');
  if (canonical && !canonical.startsWith('https://sandstormgame.xyz/')) say(file, `canonical points elsewhere: ${canonical}`);
  const h1 = html.match(/<h1[\s>]/g) ?? [];
  if (h1.length !== 1) say(file, `${h1.length} h1 headings`);
  if (!/<html lang="en"/.test(html)) say(file, 'no lang on <html>');
  if (!is404 && !/property="og:image" content="https:\/\/sandstormgame\.xyz\/og\//.test(html)) say(file, 'no share picture');
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      schema += (data['@graph'] ?? [data]).length;
    } catch (e) {
      say(file, `structured data does not parse: ${e.message}`);
    }
  }
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    if (!/\balt="/.test(tag)) say(file, `picture without alt: ${tag.slice(0, 80)}`);
    if (!/\bwidth="\d+"/.test(tag) || !/\bheight="\d+"/.test(tag)) say(file, `picture without size: ${tag.slice(0, 80)}`);
  }
  // ids must be unique, or links to a heading land on the wrong one
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const twice = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (twice.length) say(file, `ids used twice: ${[...new Set(twice)].join(', ')}`);
  if (/\{\{|\}\}/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) say(file, 'a shortcode was left in the text');
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
  words += text.split(/\s+/).filter(Boolean).length;
}

for (const name of ['robots.txt', 'sitemap.xml', 'feed.xml', 'llms.txt', 'llms-full.txt', 'site.webmanifest', 'favicon.svg', '404.html']) {
  try { statSync(path.join(dist, name)); } catch { problems++; console.log(`${name}: missing`); }
}
const sitemap = readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
for (const file of pages) {
  if (file.endsWith('404.html')) continue;
  const address = `https://sandstormgame.xyz/${path.relative(dist, file).replace(/index\.html$/, '')}`;
  if (!listed.includes(address)) { problems++; console.log(`sitemap.xml: ${address} is not listed`); }
}

console.log(`${pages.length} pages, ${listed.length} in the sitemap, about ${words.toLocaleString('en-US')} words, ${schema} structured-data items, ${(bytes / 1024 / pages.length).toFixed(0)} KB of html a page on average`);
console.log(problems ? `${problems} problem${problems === 1 ? '' : 's'}` : 'nothing to fix');
process.exit(problems ? 1 : 0);
