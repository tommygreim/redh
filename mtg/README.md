# Strixhaven Tabletop — MtG MVP Client

A minimal, zero-dependency, browser-based Magic: The Gathering client. Open
`mtg/index.html` in any modern browser and click **Quick Start**.

Both players are controlled by the same person (hotseat). There is no AI.

## What's automated

The engine owns the tedious, well-defined parts of Magic:

- **Turn & phase structure** — Untap, Upkeep, Draw, Main 1, the five combat
  steps, Main 2, End, Cleanup. Step through with *Next Phase*, jump by clicking
  a phase, or *End Turn*.
- **Zones** — library, hand, battlefield, graveyard, exile, and the stack, with
  per-player life, mana pool, and counts.
- **Mana** — tap lands (and other mana sources) for the colors they produce;
  casting pays from your pool with full colored/hybrid/Phyrexian/{X}/{C}
  handling.
- **The stack** — spells and abilities go on the stack; resolve or counter the
  top. Permanents enter the battlefield on resolution; instants/sorceries go to
  the graveyard.
- **Summoning sickness & stun counters** — tracked automatically at untap.
- **Combat math** — declare attackers/blockers and let the engine resolve
  damage, including first strike, double strike, deathtouch, trample, lifelink,
  vigilance, menace/flying/reach (for legality), and state-based deaths.

## How all ~330 cards are playable

Faithfully auto-resolving every unique card (storm, cascade, converge,
flashback, spree, paradigm, …) is beyond an MVP. Instead this is a
**rules-assisted tabletop**: the full text of every card is shown, and you
resolve effects with the board tools:

- Per-card action buttons (in the detail panel): play/cast, tap, add/remove
  counters, temporary +X/+X, grant a keyword, set damage, destroy, exile,
  bounce, sacrifice, move between any zones, cast from graveyard/exile, etc.
- Player tools: draw, mill, shuffle, look at the top N (scry/surveil/dig),
  add mana, untap all, and a **token palette** for every token the set makes.
- **＋Card** drops *any* card from the full database straight into a hand,
  battlefield, library, or graveyard — so every listed card is reachable.

## Files

- `cards.js` — the full card list embedded as CSV, parsed into a database with
  derived mana value / colors / type flags.
- `engine.js` — game state and rules primitives.
- `ui.js` — rendering and all interactions.
- `app.js` — bootstrap and random 40-card deck generation.
