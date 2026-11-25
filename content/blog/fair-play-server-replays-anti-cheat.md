---
title: How Dune Clash Stops Cheating: Every Raid Is Replayed
short: Fair play and anti-cheat
description: In Dune Clash your phone never decides the result of a raid. The server replays every battle and works out the stars and loot itself. Here is how that works.
category: stories
order: 4
date: 2026-11-25
cover: sprites b-proving-5 u-longshot
coverAlt: A proving ground and a Longshot
related: trophies-ladder-shields-explained, what-is-dune-clash, is-dune-clash-safe-for-kids-parents-guide
---

In any game where players take things from each other, somebody will try to cheat. The usual tricks are old: edit the game so it reports a win, give yourself resources, wind the phone's clock forward to skip a timer. Dune Clash was built so that none of these does anything. This page explains how, without the jargon.

## The rule: your phone is not trusted

A phone belongs to its owner. With enough effort its owner can change anything an app does on it. So Dune Clash never asks your phone what happened. It asks what you **did**, and works out the rest on the server.

That one decision covers nearly everything below.

## How a raid is checked

**1. The server sets the scene.** When you tap **Attack**, the server picks the opponent and writes down everything about the battle that is about to start: a snapshot of the base with every building and its level, how much oil and scrap each building holds, your army space, your unit levels, and a random number called the seed.

**2. You play.** The battle runs on your phone, so it is smooth and needs no connection for every shot. The only things you decide are which unit you land, where and when.

**3. Your phone sends a list.** Not "three stars, 40,000 oil". Just the list: *Infantry at this cell at this moment, a Ram at that cell half a second later*, and when the battle ended. A long raid is a few hundred lines.

**4. The server plays it again.** It takes the snapshot from step 1 and your list from step 3 and runs the entire battle from the first tick to the last: every step, every shot, every Mine, the worm. Then it reads the result off its own copy.

**5. The server's result is the result.** Stars, loot and trophies come from the server's replay. If a doctored app claims something else, it makes no difference: the claim is never used.

## Why the replay comes out the same

For this to work, the same battle must unfold identically on a phone and on the server. So a battle in Dune Clash is fully deterministic:

- It runs in fixed steps, **ten per second**, the same everywhere.
- Every bit of chance (whether the worm comes, when, from which side) is drawn from the **seed** the server chose. Same seed, same worm.
- Nothing depends on how fast your phone is or how smooth the picture is.

Give the same base, the same seed and the same list of landings to any device, and you get the same battle, to the last point of health. That is also why **replays** in the Log are exact: a replay is not a video. It is the battle being played again from the same list.

## What the server refuses

When the list arrives, the server checks it as it plays:

- **A unit you have not unlocked?** Not landed.
- **More troops than your army space?** The extra ones are not landed.
- **A unit dropped inside the base** instead of on the strip around it? Not landed.
- **A list that arrives long after the raid should have ended?** Counted as an empty raid.

There is nothing to gain by sending a creative list. The best list you can send is an honest one.

## Your base lives on the server too

The same idea protects everything outside battles.

- **Oil, scrap and crystals** are stored on the server. Your phone shows the numbers; it does not own them.
- **Every action is checked** by the same rules the game uses: when you tap Upgrade, the server confirms that you have the oil, a free builder and a high enough Citadel before anything changes.
- **Time is the server's time.** Moving the clock on your phone forward finishes nothing.
- **Purchases are confirmed with Apple or Google** before crystals are added, and each one is credited exactly once.

## What this means when you are raided

When your Log says someone took three stars and 30,000 oil from you, that raid happened as shown. You can watch it. You will see where every soldier landed and which of your guns fired. Nobody skipped your defenses with an edited app, because an edited app has no say.

And what you lose is limited by rules the server applies, not by what the raider's phone asks for: a share of your stores, never all of them. See the [loot guide](/blog/loot-guide-how-much-oil-and-scrap-can-you-steal/).

## What it does not solve

It would be dishonest to call any system perfect. Server replays stop faked results, invented resources and clock tricks. They do not stop everything people can do:

- **Bots.** A program could play the game by the rules, tirelessly. That breaks our terms, and accounts caught doing it can be suspended, but a replay cannot tell a patient robot from a patient person.
- **Rude names.** A check on names catches the obvious ones. For the rest there is a flag next to every name: in a raid, in the Log and on the Ladder. A reported name disappears for you at once, and a name reported by several players is reset.
- **Bugs.** If the rules themselves have a hole, the server will faithfully apply the hole. When we find one, we fix it for everyone at the same moment, since the rules live in one place.

## Why we built it this way

Dune Clash is a small game made by one person. A small game cannot afford a team that hunts cheaters. What it can afford is a design in which cheating is pointless from the first day. So the battle engine was written to give the same answer on a phone and on a server, and everything else stands on it.

The cost is some freedom. We cannot add a rule that depends on your phone alone, and every new unit has to behave identically everywhere. We think that is the right trade.

## In short

| Trick | What happens |
| --- | --- |
| Edit the app to report a win | The server ignores reported results and replays the raid itself |
| Land more troops than you own | The extra ones are refused |
| Give yourself oil or crystals | The numbers are stored on the server |
| Move the phone's clock forward | Timers run on server time |
| Fake a purchase | Purchases are confirmed with the store |
| Play by the rules, but with a bot | Not caught by replays; forbidden by the terms |

The rules that the server enforces are described in [trophies, shields and revenge](/blog/trophies-ladder-shields-explained/). If you find something that looks wrong in a replay, write to us: the address is on the [about page](/about/).
