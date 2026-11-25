# sandstormgame.xyz

The website of Sandstorm Game, the studio behind [Dune Clash](https://sandstormgame.xyz/dune-clash/): the game's page, a press kit and the guides.

It is a static site with no JavaScript in the browser. A small Node script (`build.mjs`) turns Markdown articles and the game's balance data into plain HTML. Vercel runs it on every push to `main`.

## Run it

```sh
npm ci
npm run dev      # builds and serves http://localhost:4321
npm run build    # builds into dist/, stops on a broken link or anchor
npm run check    # looks over dist/: titles, descriptions, structured data, pictures
```

Node 20 or later. The only dependency is `markdown-it`.

## What is where

| Path | What it is |
| --- | --- |
| `site.config.mjs` | Facts that go out of date: store links, versions, what is released where. Change here, rebuild. |
| `content/blog/*.md` | The articles. File name = address (`/blog/<name>/`). |
| `data/dune-clash/*.json` | A copy of the game's balance files. Every table and number in the guides is read from here. |
| `src/gamedata.mjs` | Tables and numbers built from that data. |
| `src/content.mjs` | Markdown and the `{{shortcodes}}` the articles use. |
| `src/pages.mjs`, `src/html.mjs` | The pages and the page frame (head, header, footer, structured data). |
| `src/styles.css` | All the styles. |
| `public/` | Copied as it is: pictures, fonts, covers, press files. |
| `tools/` | Scripts that make pictures and check the result (see below). |
| `build.mjs` | The build: pages, `sitemap.xml`, `robots.txt`, `feed.xml`, `llms.txt`, `llms-full.txt`, a `.md` copy of every article. |
| `vercel.json` | Build settings, redirects to the main address, security and cache headers. |

## Writing an article

Create `content/blog/<address>.md`:

```md
---
title: How to Do the Thing in Dune Clash
short: Doing the thing
description: One or two sentences, at most 165 characters. This is the text under the link in search results.
category: guides
order: 11
date: 2026-12-01
cover: sprites b-turret-8 u-infantry
coverAlt: A turret and an Infantry soldier
related: dune-clash-units-guide, walls-guide
---

Text in Markdown. Link to other pages with their address: [the walls guide](/blog/walls-guide/).
```

- `category`: `basics`, `guides`, `strategy`, `stories`, `help` or `news` (see `site.config.mjs`).
- `order`: position inside the category.
- `updated: 2026-12-20`: add it when an article changes in a way readers should know about.
- `faq: yes`: questions written as `### Question?` become FAQ data for search engines.
- `cover`: `keyart`, or `sprites <up to five sprite names>`, or `shot <name> [sprites]`, or `screen <1-5> [sprites]`.

Then make its pictures and build:

```sh
node tools/make-covers.mjs <address>   # needs Playwright with Chrome and ImageMagick
npm run build && npm run check
```

### Numbers from the game

Do not type the game's numbers by hand. Ask for them:

| In the text | Gives |
| --- | --- |
| `{{n:shieldHours}}` | a named number (the list is at the end of `src/gamedata.mjs`) |
| `{{b:collector.3.cost}}` | a value of a building level: `cost`, `time`, `hp`, `damage`, `range`, `storage`, `housing`, `perHour`, `fullAfter`… |
| `{{u:bulwark.6.hp}}` | a value of a unit level |
| `{{limit:wall.5}}` | how many of a building Citadel 5 allows |
| `{{space:5}}`, `{{store:oil.5}}`, `{{income:scrap.5}}` | army space, room and income at a Citadel level |

Alone on a line:

| Line | Gives |
| --- | --- |
| `{{table:units}}` | a ready table: `units`, `buildings`, `defenses`, `citadel-unlocks`, `citadel-limits`, `citadel-caps`, `army-space`, `stages`, `economy`, `research`, `loot-share`, `loot-level`, `echo-loot`, `trophies`, `next-cost`, `crystal-finish`, `crystal-buy`, `crystal-packs`, `worm-health`, `worm-bites`, `wall-break`, `anti-air` |
| `{{levels:turret}}`, `{{unit-levels:flyer}}` | every level of a building or a unit |
| `{{building:turret}}`, `{{unit:flyer}}` | a heading with picture and key facts |
| `{{gallery:citadel}}` | the building at every level |
| `{{shot:worm\|Caption}}`, `{{shots:scout,deploy\|First\|Second}}`, `{{screen:1\|Caption}}` | screenshots |
| `{{pic:worm\|Caption}}`, `{{keyart\|Caption}}` | art |
| `{{cta\|Heading}}` | the download box |

A misspelt shortcode stops the build.

## After the game changes

1. Copy `src/data/{buildings,units,config,monster}.json` from the game into `data/dune-clash/`.
2. Update `game.version` in `site.config.mjs`.
3. New buildings, units or looks: `python3 tools/export-sprites.py <path to the game>`; new screenshots: `tools/game-shots.mjs`.
4. `npm run build && npm run check`, then read the articles that quote numbers in plain words.

When the Android version is public, set `googlePlay.status` to `'live'` in `site.config.mjs`: the "coming soon" buttons become links.

## Tools

| Script | What it does |
| --- | --- |
| `tools/check.mjs` | Checks the built site. |
| `tools/make-covers.mjs` | Draws the cover and the share picture of every article, and the site's share pictures. |
| `tools/make-logo.py` | Draws the studio logo and the icons. |
| `tools/export-sprites.py` | Cuts the game's sprites into `public/img/dc/sprites/`. |
| `tools/game-shots.mjs` | Takes the in-game screenshots used in the guides. |
| `tools/indexnow.mjs` | Tells Bing, Yandex and other IndexNow search engines about new pages. Runs by itself after every push (`.github/workflows/indexnow.yml`). |

## Notes

- Dune Clash is not affiliated with the Dune franchise or with Supercell. Every page says so in its footer.
- The font is Rubik, under the SIL Open Font License (`public/assets/fonts/OFL.txt`).
