// Tells the search engines that take part in IndexNow (Bing, Yandex, Seznam, Naver and the services that use
// their indexes) which pages of the site are new or changed, so they are crawled within minutes, not weeks.
// Google does not take part: it finds pages through sitemap.xml and Search Console.
//
//   node tools/indexnow.mjs            pages whose date in the live sitemap is at most three days old
//   node tools/indexnow.mjs --all      every page in the live sitemap
//   node tools/indexnow.mjs --wait     first wait until the site serves the commit in GITHUB_SHA (used by the workflow)
//
// The key is not a secret: the protocol wants it published at /<key>.txt (public/<key>.txt).
import { site } from '../site.config.mjs';

const args = new Set(process.argv.slice(2));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (address) => {
  const r = await fetch(address, { headers: { 'cache-control': 'no-cache' } });
  if (!r.ok) throw new Error(`${address}: ${r.status}`);
  return r.text();
};

if (args.has('--wait') && process.env.GITHUB_SHA) {
  const want = process.env.GITHUB_SHA;
  let live = '';
  for (let i = 0; i < 40 && live !== want; i++) {
    if (i) await sleep(15_000);
    try { live = (await get(`${site.url}/build.txt?${Date.now()}`)).trim(); } catch { /* not there yet */ }
  }
  if (live !== want) {
    // a build that failed or was skipped: nothing new is live, so there is nothing to announce
    console.log(`The site still serves ${live || 'nothing'}, not ${want}. Nothing sent.`);
    process.exit(0);
  }
  console.log(`The site serves ${want}.`);
}

const sitemap = await get(`${site.url}/sitemap.xml`);
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].map((m) => ({ address: m[1], date: m[2] }));
const since = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
const list = (args.has('--all') ? pages : pages.filter((p) => p.date >= since)).map((p) => p.address);
if (!list.length) {
  console.log('No page is new or changed in the last three days. Nothing sent.');
  process.exit(0);
}

const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(site.url).host, key: site.indexNowKey, keyLocation: `${site.url}/${site.indexNowKey}.txt`, urlList: list }),
});
// 200: accepted. 202: accepted, the key is still being checked. Anything else is a refusal.
console.log(`${list.length} page${list.length === 1 ? '' : 's'} sent to IndexNow: ${r.status} ${r.statusText}`);
if (r.status !== 200 && r.status !== 202) {
  console.log(await r.text());
  process.exit(1);
}
