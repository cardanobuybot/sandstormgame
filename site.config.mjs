// Facts about the studio, the game and where to get it. Everything on the site that can go out of date
// (store links, versions, what is released where) is read from here: change it in one place and rebuild.

export const site = {
  url: 'https://sandstormgame.xyz',
  name: 'Sandstorm Game',
  tagline: 'An independent game studio. Maker of Dune Clash.',
  email: 'duneofclash@gmail.com',
  lang: 'en',
  /** Shown as the author of the guides: the studio itself. */
  author: 'Sandstorm Game',
  founded: '2026',
  /**
   * IndexNow key: lets the site tell Bing, Yandex and the search engines fed by them about new pages at once.
   * Not a secret: the protocol wants it published as /<key>.txt (it is in public/). tools/indexnow.mjs uses it.
   */
  indexNowKey: '6cd8ec07b3849c382cc584304c5312c7',
};

export const game = {
  name: 'Dune Clash',
  slug: 'dune-clash',
  subtitle: 'Build. Raid. Dodge the worm.',
  short: 'Build a desert stronghold, pump oil, cut crashed ships into scrap and raid other commanders in three-minute battles. And stay off the open sand: the Sandmaw is hunting.',
  genre: ['Strategy', 'Base building', 'Build and raid'],
  released: '2026-11-24',
  /** Versions the numbers on the site were taken from (data/dune-clash/*.json is a copy of the game's balance files). */
  version: { ios: '1.0.1', android: '0.1.20', data: '2026-11-25' },
  price: 'Free, with optional in-app purchases',
  language: 'English',
  ages: '13 and up',
  rating: { appStore: '9+', googlePlay: 'ESRB Everyone 10+, PEGI 7' },
  appStore: {
    id: '6837478004',
    url: 'https://apps.apple.com/app/dune-clash/id6837478004',
    developer: 'https://apps.apple.com/developer/pavels-sirjevs/id6837478006',
    requires: 'iOS 15.0 or later',
    /** The App Store does not carry the game in the European Union yet (Apple is still confirming the trader status). */
    note: 'Not in the App Store of EU countries yet',
  },
  googlePlay: {
    /** 'soon' until the game leaves closed testing; then set to 'live' and the buttons become links. */
    status: 'soon',
    url: 'https://play.google.com/store/apps/details?id=com.sandstormgame.duneofclash',
    requires: 'Android 7.0 or later',
  },
  web: { url: 'https://dune-of-clash.vercel.app/' },
  support: 'https://dune-of-clash.vercel.app/support.html',
  privacy: 'https://dune-of-clash.vercel.app/privacy.html',
  terms: 'https://dune-of-clash.vercel.app/terms.html',
};

/** Sections of the blog, in the order of the funnel: what is this, how do I play it, how do I get it. */
export const categories = {
  basics: { title: 'Start here', blurb: 'What Dune Clash is and how your first days go.' },
  guides: { title: 'Game guides', blurb: 'Buildings, units, defenses and the numbers behind them, straight from the game\'s own data.' },
  strategy: { title: 'Raiding and defending', blurb: 'How to take three stars and how to keep your own oil and scrap.' },
  stories: { title: 'Stories and background', blurb: 'Where build-and-raid games came from, and why there is a worm in ours.' },
  help: { title: 'Download and account', blurb: 'Getting the game, keeping your base, and answers for parents.' },
  news: { title: 'News', blurb: 'What changed in the game.' },
};

/** The line every page carries in its footer and that the comparison articles repeat. */
export const disclaimer = 'Dune Clash is an original game by Sandstorm Game. It is not affiliated with, endorsed by or connected to the Dune novels and films or their owners, or to Supercell and Clash of Clans. All trademarks belong to their owners.';
