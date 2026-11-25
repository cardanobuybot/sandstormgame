// The pages that are not articles: home, the game, the list of guides, about, press kit, privacy, 404.
import { site, game, categories, disclaimer } from '../site.config.mjs';
import * as G from './gamedata.mjs';
import { esc, abs, longDate, storeButtons, cta, orgLd, websiteLd, gameLd, crumbsLd, faqLd, articleLd } from './html.mjs';
import { faqOf } from './content.mjs';

const card = (a) => `<li><a class="card" href="${a.path}">
<img src="${a.thumb}" alt="" width="800" height="420" loading="lazy" decoding="async">
<div class="card-body"><h3>${esc(a.title)}</h3><p>${esc(a.description)}</p></div></a></li>`;

const crumbs = (items) => `<nav class="crumbs wrap" aria-label="Breadcrumb"><ol>${items.map(([name, path], i) => (i < items.length - 1 ? `<li><a href="${path}">${esc(name)}</a></li>` : `<li aria-current="page">${esc(name)}</li>`)).join('')}</ol></nav>`;

const androidLine = game.googlePlay.status === 'live' ? 'iPhone, Android and web browsers' : 'iPhone and web browsers (Android is in testing and coming soon)';

// ---------- the game ----------

const GAME_FAQ = [
  ['What kind of game is Dune Clash?', `Dune Clash is a build-and-raid strategy game. You build a base in the desert, pump oil and cut scrap out of crashed spaceships, and raid other players' bases in battles of ${G.N.battleMinutes} minutes. A giant sand worm, the Sandmaw, hunts ground troops in about half of all raids.`],
  ['Is Dune Clash free?', 'Yes. The game is free to download and play and has no ads. There are optional in-app purchases: crystals, which finish builds at once or buy missing oil and scrap. Crystals are also earned by playing.'],
  ['Where can I play Dune Clash?', `On iPhone from the App Store (iOS 15 or later) and in a web browser on any device, with nothing to install. ${game.googlePlay.status === 'live' ? 'It is also on Google Play for Android.' : 'The Android version is in closed testing on Google Play and will open to everyone soon.'}`],
  ['Is Dune Clash connected to the Dune films or to Clash of Clans?', 'No. Dune Clash is an original game by Sandstorm Game, an independent studio. It is not made, licensed or endorsed by the owners of the Dune novels and films or by Supercell, the maker of Clash of Clans. A dune is a hill of sand, and that is where the game takes place.'],
  ['Do I need an account?', 'No. The game makes a guest account the first time you open it. On iPhone you can save your base to Game Center from the menu, and you can move it to any other phone, or from the browser to a phone, with a one-time transfer code.'],
  ['Can I play offline?', 'No. Dune Clash needs an internet connection, because every raid is checked on the server.'],
  ['Is Dune Clash suitable for children?', `The App Store rates it ${game.rating.appStore}, and we make it for players of 13 and up. The violence is cartoon-like, there is no chat and there are no ads. Parents can read our guide for the details.`],
];

export function gamePage(articles) {
  const pick = (slug) => articles.find((a) => a.slug === slug);
  const link = (slug, text) => (pick(slug) ? `<a href="${pick(slug).path}">${text}</a>` : text);
  const start = ['dune-clash-beginners-guide', 'dune-clash-buildings-guide', 'dune-clash-units-guide', 'how-to-beat-the-sandmaw', 'how-to-get-three-stars-attack-guide', 'dune-clash-faq'].map(pick).filter(Boolean);
  const captions = [
    'Your base: pumpjacks, tanks, guns and a wall around them.',
    'A raid in full swing. You have three minutes.',
    'Scouting: 30 seconds to find a way in.',
    'The build menu: 17 buildings, paid with oil or scrap.',
    'Three stars: everything destroyed.',
  ];
  const facts = [
    ['Game', game.name],
    ['Genre', 'Build-and-raid strategy: base building and raids on other players'],
    ['Developer', site.name],
    ['Released', `${longDate(game.released)} (iPhone)`],
    ['Platforms', androidLine],
    ['Price', 'Free. Optional in-app purchases (crystals). No ads'],
    ['Players', 'Online: you raid other players\' bases while they are away'],
    ['Age rating', `${game.rating.appStore} on the App Store; made for ages ${game.ages}`],
    ['Language', game.language],
    ['Needs', `${game.appStore.requires}, or a modern browser; an internet connection`],
    ['Latest version', `${game.version.ios} (November 2026)`],
    ['In the game', `${G.N.buildingCount} buildings, ${G.N.unitCount} units, ${G.N.citadelMax} Citadel levels, two resources`],
  ];
  const body = `<section class="hero">
<div class="hero-in">
<figure class="hero-art"><picture>
<source media="(min-width: 900px)" srcset="/img/dc/keyart-square-900.webp">
<img src="/img/dc/keyart-square-560.webp" srcset="/img/dc/keyart-square-560.webp 560w, /img/dc/keyart-square-900.webp 900w" sizes="100vw" alt="Dune Clash: a giant sand worm rises against the sun behind a walled desert base with tanks, soldiers and gyrocopters around it" width="900" height="900" fetchpriority="high">
</picture></figure>
<div class="hero-copy wrap">
<h1 class="hero-title"><small>Dune Clash</small> Build. Raid. Dodge the worm.</h1>
<p class="lead">Dune Clash is a free strategy game. Build a base in the desert, raid other players for oil and scrap, and keep your troops off the open sand: a giant worm, the Sandmaw, hunts anything that walks there.</p>
<div id="get">${storeButtons()}</div>
<p class="under-buttons">Free, no ads, for ages ${game.ages}.${game.appStore.note ? ' If the App Store says the game is not available in your country (it has not reached the EU stores yet), play in the browser: your base can move to your phone later.' : ''}</p>
</div>
</div>
</section>

<section class="section"><div class="wrap">
<h2>See it in play</h2>
<div class="shots">${captions.map((c, i) => `<figure><img src="/img/dc/screen-${i + 1}.webp" alt="${esc(c)}" width="540" height="960" loading="lazy" decoding="async"><figcaption>${esc(c)}</figcaption></figure>`).join('')}</div>
</div></section>

<section class="section band"><div class="wrap">
<h2>What you do in Dune Clash</h2>
<div class="duo">
<article>${G.buildingPic('citadel', 8, 128)}<div><h3>Build a stronghold</h3><p>You start with a Citadel and a patch of sand. Pump oil, cut scrap out of crashed spaceships, and spend both on ${G.N.buildingCount} kinds of buildings. Every building looks different at every level. ${link('dune-clash-buildings-guide', 'All buildings')}</p></div></article>
<article>${G.unitPic('bulwark', 128)}<div><h3>Raise an army</h3><p>Nine units, from riflemen to a heavy bomber. They cost nothing to field and there is no waiting for them to train: fill your army space with any mix you like, every raid. ${link('dune-clash-units-guide', 'All units')}</p></div></article>
<article>${G.buildingPic('storage', 8, 128)}<div><h3>Raid other commanders</h3><p>Scout a real player's base for ${G.N.scoutSeconds} seconds, then land your troops. You have ${G.N.battleMinutes} minutes to earn up to three stars and carry off oil and scrap. ${link('how-to-get-three-stars-attack-guide', 'How to take three stars')}</p></div></article>
<article>${G.sprite('worm', 'The Sandmaw, a giant sand worm', 'sprite', 128)}<div><h3>Dodge the Sandmaw</h3><p>In about half of all raids a sand worm comes for whoever is making noise on the ground. It ignores buildings and cannot reach aircraft. Once it surfaces, your troops can kill it. ${link('how-to-beat-the-sandmaw', 'How to beat the Sandmaw')}</p></div></article>
<article>${G.buildingPic('turret', 8, 128)}<div><h3>Defend what you hold</h3><p>Others raid you while you are away. Walls, five kinds of guns, mines and hidden launchers decide how much they take, and a replay shows where the base gave way. ${link('dune-clash-defenses-guide', 'Defenses explained')}</p></div></article>
<article>${G.buildingPic('proving', 5, 128)}<div><h3>Win fairly</h3><p>Every raid is played again on the server from the orders you gave, so a result cannot be faked. No ads, and nothing in the store that a patient player cannot earn. ${link('fair-play-server-replays-anti-cheat', 'How it works')}</p></div></article>
</div>
</div></section>

<section class="section band-dark"><div class="wrap">
<h2>The nine units</h2>
<ul class="roster">${Object.entries(G.units).map(([key, u]) => `<li><a href="/blog/dune-clash-units-guide/#${key}">${G.unitPic(key, 110)}${u.name}</a></li>`).join('')}</ul>
</div></section>

<section class="section"><div class="wrap">
<h2>Dune Clash in short</h2>
<dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
</div></section>

<section class="section band"><div class="wrap">
<h2>Start with these guides</h2>
<ul class="cards">${start.map(card).join('')}</ul>
<p><a href="/blog/">All ${articles.length} guides and stories</a></p>
</div></section>

<section class="section"><div class="wrap faq">
<h2>Questions people ask</h2>
${GAME_FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div><p>${esc(a)}</p></div></details>`).join('\n')}
<p>More answers: ${link('dune-clash-faq', 'the full Dune Clash FAQ')} and ${link('is-dune-clash-safe-for-kids-parents-guide', 'the guide for parents')}.</p>
${cta('Ready to build?')}
</div></section>`;
  return {
    path: '/dune-clash/', current: '/dune-clash/', image: '/og/dune-clash.jpg',
    title: 'Dune Clash: Free Desert Build-and-Raid Strategy Game',
    description: 'Dune Clash is a free build-and-raid strategy game for iPhone and browsers. Build a desert base, raid other players for oil and scrap, and survive the giant sand worm.',
    body, ld: [orgLd(), gameLd(), crumbsLd([['Home', '/'], ['Dune Clash', '/dune-clash/']]), faqLd(GAME_FAQ.map(([q, text]) => ({ q, text })))],
  };
}

// ---------- home ----------

export function homePage(articles, logoBig) {
  const featured = ['what-is-dune-clash', 'dune-clash-beginners-guide', 'dune-clash-units-guide', 'how-to-beat-the-sandmaw', 'games-like-clash-of-clans-dune-clash', 'from-dune-ii-to-mobile-history-of-base-building-games']
    .map((s) => articles.find((a) => a.slug === s)).filter(Boolean);
  const body = `<section class="home-hero"><div class="wrap">
<img class="logo-big" src="/brand/logo-stacked.svg" alt="Sandstorm Game" width="${logoBig.w}" height="${logoBig.h}">
<h1>Sandstorm Game is a one-person studio. Our first game, Dune Clash, is out now.</h1>
<p>Strategy you can play in three minutes and think about for the rest of the day.</p>
</div></section>

<section class="section"><div class="wrap">
<h2>Our game</h2>
<div class="feature">
<a href="/dune-clash/"><img src="/img/dc/keyart-1280.webp" srcset="/img/dc/keyart-800.webp 800w, /img/dc/keyart-1280.webp 1280w, /img/dc/keyart-1920.webp 1920w" sizes="(max-width: 900px) 100vw, 620px" alt="Dune Clash: the Sandmaw rises behind a desert base" width="1280" height="720" fetchpriority="high"></a>
<div class="feature-body">
<h3><a href="/dune-clash/">Dune Clash</a></h3>
<p><strong>${esc(game.subtitle)}</strong></p>
<p>${esc(game.short)}</p>
${storeButtons()}
<p><a href="/dune-clash/">More about Dune Clash</a></p>
</div>
</div>
</div></section>

<section class="section band"><div class="wrap">
<h2>Guides and stories</h2>
<p class="intro">Written by the studio, with numbers taken straight from the game's own data.</p>
<ul class="cards">${featured.map(card).join('')}</ul>
<p><a href="/blog/">All ${articles.length} guides and stories</a></p>
</div></section>

<section class="section"><div class="wrap">
<h2>About the studio</h2>
<p class="intro">Sandstorm Game is independent: no publisher, no investors, one developer. Dune Clash came out on the App Store in November 2026 and keeps growing: a second resource, a new look and new music arrived within days of launch, and clans are planned next.</p>
<p><a href="/about/">About Sandstorm Game</a> · <a href="/press/">Press kit</a> · <a href="mailto:${site.email}">${site.email}</a></p>
</div></section>`;
  return {
    path: '/', current: '/', image: '/og/default.jpg',
    title: 'Sandstorm Game: the indie studio behind Dune Clash',
    description: 'Sandstorm Game is an independent game studio. Our first game, Dune Clash, is a free desert build-and-raid strategy game for iPhone and browsers, with Android coming soon.',
    body, ld: [orgLd(), websiteLd()],
  };
}

// ---------- the list of guides ----------

export function blogIndex(articles) {
  const sections = Object.entries(categories).map(([key, c]) => {
    const list = articles.filter((a) => a.category === key).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
    if (!list.length) return '';
    return `<section class="section${key === 'guides' || key === 'stories' ? ' band' : ''}" id="${key}"><div class="wrap">
<h2>${esc(c.title)}</h2>
<p class="intro">${esc(c.blurb)}</p>
<ul class="cards">${list.map(card).join('')}</ul>
</div></section>`;
  }).join('\n');
  const body = `${crumbs([['Home', '/'], ['Guides', '/blog/']])}
<div class="wrap"><header class="article-head">
<h1>Dune Clash guides and stories</h1>
<p class="lead">${articles.length} pieces from the studio that makes the game: how to build, how to raid, how to keep your oil, and where games like this came from. Every number is read from the game's own balance data.</p>
</header></div>
${sections}
<div class="wrap">${cta()}</div>`;
  return {
    path: '/blog/', current: '/blog/', image: '/og/blog.jpg',
    title: 'Dune Clash guides, tips and stories',
    description: `${articles.length} Dune Clash guides from the developers: beginner tips, buildings, units, defenses, raid strategy, the Sandmaw, crystals, and how to download and save the game.`,
    body,
    ld: [orgLd(), crumbsLd([['Home', '/'], ['Guides', '/blog/']]), {
      '@type': 'CollectionPage', '@id': `${abs('/blog/')}#page`, name: 'Dune Clash guides and stories', url: abs('/blog/'), inLanguage: site.lang,
      mainEntity: { '@type': 'ItemList', itemListElement: articles.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(a.path), name: a.title })) },
    }],
  };
}

// ---------- one article ----------

export function articlePage(a, articles) {
  const bySlug = new Map(articles.map((x) => [x.slug, x]));
  let related = a.related.map((s) => bySlug.get(s));
  if (related.length < 3) related = related.concat(articles.filter((x) => x.category === a.category && x.slug !== a.slug && !related.includes(x)).slice(0, 3 - related.length));
  const toc = a.toc.length >= 3 ? `<nav class="toc${a.toc.length > 8 ? ' long' : ''}" aria-label="On this page"><strong>On this page</strong><ol>${a.toc.map((h) => `<li><a href="#${h.id}">${h.text}</a></li>`).join('')}</ol></nav>` : '';
  const source = a.usesData
    ? `<p class="source">The numbers on this page are read from the balance data of Dune Clash ${game.version.ios} (iPhone) and ${game.version.android} (Android), as it stood on ${longDate(game.version.data)}. They change when the game is rebalanced; this page is rebuilt from the new data when that happens.</p>`
    : '';
  const updated = a.updated && a.updated !== a.date ? `<span>Updated <time datetime="${a.updated}">${longDate(a.updated)}</time></span>` : '';
  const body = `${crumbs([['Home', '/'], ['Guides', '/blog/'], [a.short, a.path]])}
<article class="article wrap">
<header class="article-head">
<h1>${esc(a.title)}</h1>
<p class="lead">${esc(a.description)}</p>
<p class="byline"><span>By <a href="/about/">${site.author}</a></span><span><time datetime="${a.date}">${longDate(a.date)}</time></span>${updated}<span>${a.minutes} min read</span></p>
</header>
<div class="article-top${toc ? '' : ' solo'}">
<figure class="cover"><img src="${a.thumb}" alt="${esc(a.coverAlt)}" width="800" height="420" fetchpriority="high"></figure>
${toc}
</div>
<div class="prose">
${a.html}
</div>
${source}
${cta()}
<section class="related" aria-labelledby="related-h">
<h2 id="related-h">Read next</h2>
<ul class="cards">${related.map(card).join('')}</ul>
</section>
</article>`;
  const ldItems = [orgLd(), articleLd(a), crumbsLd([['Home', '/'], ['Guides', '/blog/'], [a.short, a.path]])];
  if (a.faq) { const qas = faqOf(a.html); if (qas.length) ldItems.push(faqLd(qas)); }
  return {
    path: a.path, current: '/blog/', image: a.og, type: 'article', title: a.title, description: a.description, body, ld: ldItems,
    published: a.date, modified: a.updated,
    head: `<link rel="alternate" type="text/markdown" href="/blog/${a.slug}.md" title="This guide as plain text">\n`,
  };
}

// ---------- about, press, privacy, 404 ----------

export function aboutPage() {
  const body = `${crumbs([['Home', '/'], ['About', '/about/']])}
<article class="article wrap">
<header class="article-head"><h1>About Sandstorm Game</h1>
<p class="lead">An independent studio run by one developer. Its first game is Dune Clash.</p></header>
<div class="prose">
<h2 id="who">Who we are</h2>
<p>Sandstorm Game is an independent game studio with no publisher and no investors. One developer runs all of it: design, code, art, balance and support. "We" on this site means the studio.</p>
<p>Our first game, <a href="/dune-clash/">Dune Clash</a>, came out on the App Store on ${longDate(game.released)}. It also runs in web browsers, and the Android version is ${game.googlePlay.status === 'live' ? 'on Google Play' : 'in closed testing on Google Play'}.</p>
<h2 id="how">How Dune Clash is made</h2>
<ul>
<li>The game is written in TypeScript on the Phaser engine and wrapped as a native app for iPhone and Android.</li>
<li>Battles run on a simulation that gives the same result on every device. The server replays each raid from the attacker's orders, which is why results cannot be faked.</li>
<li>Buildings and units are small 3D models, baked into sprites. Every building has its own look at every level.</li>
<li>The interface icons are drawn in code, so they look the same on every phone.</li>
</ul>
<h2 id="guides">How the guides are written</h2>
<p>The <a href="/blog/">guides</a> on this site are published by the studio. Tables of costs, health, damage and build times are not typed by hand: they are generated from the same balance files the game ships with, so they match what you see in the game. We use AI tools to help draft and edit the text, and check it against the game before it goes out.</p>
<p>If you find a mistake, please write to <a href="mailto:${site.email}">${site.email}</a>.</p>
<h2 id="independence">What Dune Clash is not</h2>
<p>${esc(disclaimer)}</p>
<h2 id="contact">Contact</h2>
<p>Players, press and anyone curious: <a href="mailto:${site.email}">${site.email}</a>. Help with the game itself is on the <a href="${game.support}" rel="noopener">support page</a>. Images and facts for articles and videos are in the <a href="/press/">press kit</a>.</p>
</div>
${cta()}
</article>`;
  return {
    path: '/about/', current: '/about/', title: 'About Sandstorm Game', image: '/og/default.jpg',
    description: 'Sandstorm Game is an independent, one-person game studio. It makes Dune Clash, a desert build-and-raid strategy game for iPhone, Android and browsers.',
    body, ld: [orgLd(), crumbsLd([['Home', '/'], ['About', '/about/']]), { '@type': 'AboutPage', '@id': `${abs('/about/')}#page`, url: abs('/about/'), name: 'About Sandstorm Game', about: { '@id': `${site.url}/#org` } }],
  };
}

export function pressPage() {
  const facts = [
    ['Game', game.name], ['Developer and publisher', site.name], ['Released', `${longDate(game.released)} (App Store)`],
    ['Platforms', androidLine], ['Price', 'Free, optional in-app purchases, no ads'], ['Genre', 'Build-and-raid strategy'],
    ['Players', 'Online, asynchronous player-versus-player raids'], ['Language', game.language], ['Age rating', `App Store ${game.rating.appStore}`],
    ['App Store', game.appStore.url], ['Play in a browser', game.web.url], ['Website', `${site.url}/dune-clash/`], ['Contact', site.email],
  ];
  const linkify = (v) => (/^https?:/.test(v) ? `<a href="${v}" rel="noopener">${v.replace(/^https?:\/\//, '')}</a>` : v.includes('@') ? `<a href="mailto:${v}">${v}</a>` : esc(v));
  const asset = (src, label, w, h, links) => `<li><img src="${src}" alt="${esc(label)}" width="${w}" height="${h}" loading="lazy" decoding="async">${esc(label)}<br>${links.map(([t, u]) => `<a href="${u}" download>${t}</a>`).join(' · ')}</li>`;
  const body = `${crumbs([['Home', '/'], ['Press kit', '/press/']])}
<article class="article wrap">
<header class="article-head"><h1>Dune Clash press kit</h1>
<p class="lead">Facts, descriptions, logos and screenshots for articles, videos and streams about Dune Clash.</p></header>
<div class="prose">
<h2 id="facts">Fact sheet</h2>
</div>
<dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${linkify(v)}</dd></div>`).join('')}</dl>
<div class="prose">
<h2 id="description">Description</h2>
<p><strong>One line:</strong> ${esc(game.subtitle)} A free desert strategy game where a giant sand worm hunts both sides.</p>
<p><strong>Short:</strong> ${esc(game.short)}</p>
<p><strong>Long:</strong> Dune Clash is a build-and-raid strategy game set on a desert world where oil runs everything and the sand is full of crashed spaceships. Players raise a Citadel through ${G.N.citadelMax} levels, pump oil, cut wrecks into scrap, and spend both on ${G.N.buildingCount} kinds of buildings. Nine units, from riflemen to a heavy bomber, are free to field in any mix. Raids on other players last ${G.N.battleMinutes} minutes, after ${G.N.scoutSeconds} seconds of scouting, and are replayed on the server so that results cannot be faked. In about half of all raids the Sandmaw, a neutral giant sand worm, comes for ground troops; it can be killed once it surfaces.</p>
<h2 id="features">What sets it apart</h2>
<ul>
<li>A neutral monster in a player-versus-player game: the Sandmaw eats ground units of whoever is on the field.</li>
<li>No training timers and no cost for troops: every raid starts with a full army of your choice.</li>
<li>Two resources with separate jobs: oil runs the base and the army, scrap pays for everything that defends.</li>
<li>Combined arms: infantry, vehicles and aircraft, with defenses that are good against some and blind to others.</li>
<li>Server-checked raids and replays of every attack on your base.</li>
<li>No ads. Made by a single independent developer.</li>
</ul>
<h2 id="images">Logos and key art</h2>
</div>
<ul class="assets">
${asset('/img/dc/logo-480.webp', 'Dune Clash logo', 480, 276, [['PNG', '/press/dune-clash-logo.png']])}
${asset('/img/dc/icon-256.webp', 'Dune Clash app icon', 256, 256, [['PNG 1024', '/press/dune-clash-icon-1024.png']])}
${asset('/img/dc/keyart-800.webp', 'Key art', 800, 450, [['JPG 2622×1475', '/press/dune-clash-key-art.jpg']])}
${asset('/brand/mark-512.png', 'Sandstorm Game emblem', 512, 512, [['SVG', '/brand/mark.svg'], ['PNG', '/brand/mark-512.png']])}
${asset('/brand/logo.png', 'Sandstorm Game logo', 1600, 396, [['SVG', '/brand/logo.svg'], ['PNG', '/brand/logo.png']])}
</ul>
<div class="prose"><h2 id="screenshots">Screenshots</h2><p>Phone screenshots, 1080×1920, taken from version ${game.version.ios}.</p></div>
<ul class="assets">
${[1, 2, 3, 4, 5].map((n) => asset(`/img/dc/screen-${n}.webp`, ['The base', 'A raid', 'Scouting', 'The build menu', 'Victory'][n - 1], 540, 960, [['JPG', `/press/dune-clash-screenshot-${n}.jpg`]])).join('\n')}
</ul>
<div class="prose">
<h2 id="use">Using these images</h2>
<p>You may use the images on this page in articles, reviews, videos and streams about Dune Clash. Please do not use them to suggest that Sandstorm Game endorses another product.</p>
<p>${esc(disclaimer)}</p>
<p>Questions, interview requests, review notes: <a href="mailto:${site.email}">${site.email}</a>.</p>
</div>
</article>`;
  return {
    path: '/press/', title: 'Dune Clash press kit: facts, logos, screenshots', image: '/og/dune-clash.jpg',
    description: 'Press kit for Dune Clash by Sandstorm Game: fact sheet, descriptions, logos, key art and screenshots you can use in articles and videos.',
    body, ld: [orgLd(), crumbsLd([['Home', '/'], ['Press kit', '/press/']])],
  };
}

export function privacyPage() {
  const body = `${crumbs([['Home', '/'], ['Privacy', '/privacy/']])}
<article class="article wrap">
<header class="article-head"><h1>Privacy on this website</h1>
<p class="lead">This site sets no cookies, shows no ads and runs no analytics.</p></header>
<div class="prose">
<h2 id="site">What this site does with your data</h2>
<p>sandstormgame.xyz is a set of plain pages. It has no sign-in, no forms, no cookies, no advertising and no tracking scripts. Fonts and images come from this site, not from other companies.</p>
<p>The pages are hosted by Vercel. Like every web host, Vercel receives your IP address and browser details in order to send you a page, and keeps short-lived technical logs. We do not use those logs to identify visitors.</p>
<p>Links to the App Store, Google Play and the browser version of the game take you to other sites with their own rules.</p>
<h2 id="game">The game has its own policy</h2>
<p>Dune Clash, the game, does store data it needs to work: your account, your base and your purchases. That is described in the <a href="${game.privacy}" rel="noopener">Dune Clash privacy policy</a>, which also explains how to delete your account. The <a href="${game.terms}" rel="noopener">terms of use</a> are there too.</p>
<h2 id="contact">Contact</h2>
<p><a href="mailto:${site.email}">${site.email}</a></p>
</div>
</article>`;
  return {
    path: '/privacy/', title: 'Privacy on this website', image: '/og/default.jpg',
    description: 'sandstormgame.xyz uses no cookies, ads or analytics. The game Dune Clash has its own privacy policy, linked here.',
    body, ld: [orgLd(), crumbsLd([['Home', '/'], ['Privacy', '/privacy/']])],
  };
}

export function notFoundPage(articles) {
  const some = ['what-is-dune-clash', 'dune-clash-beginners-guide', 'dune-clash-faq'].map((s) => articles.find((a) => a.slug === s)).filter(Boolean);
  const body = `<article class="article wrap">
<header class="article-head"><h1>Nothing here but sand</h1>
<p class="lead">The page you asked for does not exist, or the worm got it. These do:</p></header>
<ul class="plain-list">
<li><a href="/dune-clash/">Dune Clash</a><span>What the game is and where to get it</span></li>
<li><a href="/blog/">All guides</a><span>${articles.length} guides and stories</span></li>
${some.map((a) => `<li><a href="${a.path}">${esc(a.title)}</a><span>${esc(a.description)}</span></li>`).join('\n')}
</ul>
</article>`;
  return { path: '/404.html', title: 'Page not found', description: 'This page does not exist.', body, noindex: true, ld: [] };
}
