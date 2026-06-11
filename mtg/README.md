# Secrets of Strixhaven — Tabletop Client (MVP)

A zero-dependency, browser-based Magic: The Gathering client for the
*Secrets of Strixhaven* card pool (336 cards). One user pilots **both**
players — there is no AI. Open `index.html` in any browser to play.

## Philosophy

Like Untap.in or Cockatrice, this is a *tabletop* client: it automates the
bookkeeping and leaves rules adjudication to the player. That means every
card in the pool is fully playable — including modal spells, storm,
converge, spree, and so on — without needing a rules engine for each one.

### What's automated

- **Zones & the stack** — library, hand, battlefield, graveyard, exile;
  spells go on a real stack with Resolve / Counter / Copy actions.
  Permanents resolve to the battlefield, instants/sorceries to the
  graveyard, flashback casts auto-exile on resolution.
- **Turn structure** — full phase/step tracker; untapping (with automatic
  stun-counter handling), draw step (first-player draw skip), mana pools
  emptying between steps, damage clearing at cleanup.
- **Prepared spells** — creatures printed as `Creature // Spell` carry
  their prepare spell. They enter the battlefield *prepared* by default
  (toggle off for ones that don't); while prepared, the card menu offers
  **✦ Cast [spell]**, which puts the spell on the stack and unprepares the
  creature. Re-prepare/unprepare via the card menu (for Biblioplex
  Tomekeeper, Skycoach Waypoint, etc.).
- **Mana** — "Tap for mana" on lands and mana permanents reads the card's
  mana ability (including dual lands and "any color" choices) and fills the
  pool; manual pips for everything else.
- **Helpers** — summoning-sickness markers, +1/+1 / stun / misc counters,
  damage markers, token creation (all of the set's predefined tokens plus
  copy-tokens), life-gained-this-turn ❤ badge for Infusion, spells-cast
  counter for Storm, London mulligans, library search/mill/surveil moves,
  and a full game log.

### What's manual (honor system)

Paying costs, choosing legal targets, combat math, and triggered abilities —
exactly like playing with real cards across a table.

## Files

| File | Purpose |
|---|---|
| `index.html` | App shell (setup screen + game board) |
| `cards.js` | Card database — the source CSV embedded verbatim + parser |
| `app.js` | Game state, actions, turn engine, and UI rendering |
| `style.css` | Dark tabletop theme |

## Mechanics reference

The in-game **Keywords** button explains the set's mechanics (Prepared,
Increment, Opus, Repartee, Infusion, Paradigm, Converge, …), based on the
official mechanics articles for the March 2026 set.
