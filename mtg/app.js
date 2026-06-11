/* ============================================================
 * Secrets of Strixhaven — MVP tabletop client.
 * One user pilots both players. The client automates zones,
 * turn structure, the stack, mana from lands, untapping (with
 * stun counters), and prepared spells; rules adjudication
 * (targets, costs, combat math) is on the honor system.
 * ============================================================ */

'use strict';

const PHASES = [
  'Untap', 'Upkeep', 'Draw', 'Main 1',
  'Begin Combat', 'Attackers', 'Blockers', 'Damage', 'End Combat',
  'Main 2', 'End Step', 'Cleanup',
];

const MANA_KEYS = ['W', 'U', 'B', 'R', 'G', 'C'];

const SAMPLE_DECKS = [
  {
    name: 'Prismari Spellslinging (UR)',
    list: `4 Emeritus of Conflict // Lightning Bolt
4 Expressive Firedancer
3 Elemental Mascot
3 Spectacular Skywhale
2 Stadium Tidalmage
4 Burst Lightning
4 Quick Study
3 Expressive Iteration
3 Vibrant Outburst
2 Prismari Charm
2 Traumatic Critique
2 Big Score
2 Abrade
11 Mountain
11 Island`,
  },
  {
    name: 'Silverquill Repartee (WB)',
    list: `4 Emeritus of Truce // Swords to Plowshares
4 Lecturing Scornmage
4 Informed Inkwright
3 Rehearsed Debater
3 Stirring Hopesinger
2 Scolding Administrator
2 Melancholic Poet
3 Interjection
3 Dissection Practice
2 Silverquill Charm
2 Last Gasp
2 Harsh Annotation
2 Render Speechless
2 Killian's Confidence
11 Plains
11 Swamp`,
  },
];

let state = null;
let iidCounter = 1;

/* ---------------- helpers ---------------- */

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function manaHTML(text) {
  return esc(text).replace(/\{([^}]+)\}/g, (m, sym) => {
    const cls = /^[WUBRGC]$/.test(sym) ? sym : (/^\d+$/.test(sym) || sym === 'X' ? 'N' : 'H');
    return `<span class="pip pip-${cls}">${esc(sym)}</span>`;
  });
}

function frameClass(def) {
  if (def.isLand) return 'frame-L';
  const c = def.colors || [];
  if (c.length === 0) return 'frame-C';
  if (c.length === 1) return 'frame-' + c[0];
  return 'frame-M';
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function log(msg) {
  state.log.push(`[T${state.turn} ${PHASES[state.phase]}] ${msg}`);
}

/* ---------------- game objects ---------------- */

function newInstance(def, owner) {
  return {
    iid: iidCounter++,
    def, owner, controller: owner,
    tapped: false,
    prepared: !!def.prepare, // most prepare creatures enter prepared; toggle off for those that don't
    counters: { p1: 0, stun: 0, misc: 0 },
    damage: 0,
    sick: false,
    isToken: !!def.isToken,
  };
}

function makePlayer(name, deckDefs, index) {
  const p = {
    name, life: 20,
    library: deckDefs.map(d => newInstance(d, index)),
    hand: [], battlefield: [], graveyard: [], exile: [],
    mana: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
    handHidden: false,
    mulls: 0,
    gainedLifeThisTurn: false,
  };
  return p;
}

function parseDecklist(text) {
  const defs = [], errors = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;
    const m = line.match(/^(\d+)[xX]?\s+(.+)$/);
    const count = m ? parseInt(m[1], 10) : 1;
    const name = m ? m[2].trim() : line;
    const def = findCard(name);
    if (!def) { errors.push(`Unknown card: "${name}"`); continue; }
    for (let i = 0; i < count; i++) defs.push(def);
  }
  return { defs, errors };
}

function randomDecklist() {
  const nonlands = CARD_NAMES.filter(n => !CARD_DB[n].isLand);
  const picks = shuffle(nonlands.slice()).slice(0, 24);
  const counts = {};
  const colorNeed = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (const n of picks) {
    counts[n] = Math.random() < 0.5 ? 2 : 1;
    for (const c of CARD_DB[n].colors) colorNeed[c] += counts[n];
  }
  let spellTotal = Object.values(counts).reduce((a, b) => a + b, 0);
  const landTotal = Math.max(20, 60 - spellTotal);
  const basics = { W: 'Plains', U: 'Island', B: 'Swamp', R: 'Mountain', G: 'Forest' };
  const needTotal = Object.values(colorNeed).reduce((a, b) => a + b, 0) || 1;
  const lines = Object.entries(counts).map(([n, c]) => `${c} ${n}`);
  let landsAdded = 0;
  for (const c of MANA_KEYS.slice(0, 5)) {
    const share = Math.round(landTotal * colorNeed[c] / needTotal);
    if (share > 0) { lines.push(`${share} ${basics[c]}`); landsAdded += share; }
  }
  if (landsAdded < landTotal) lines.push(`${landTotal - landsAdded} Forest`);
  return lines.join('\n');
}

/* ---------------- setup screen ---------------- */

function initSetup() {
  for (const i of [0, 1]) {
    const col = document.getElementById('setup-p' + i);
    col.innerHTML = `
      <h2>Player ${i + 1}</h2>
      <input type="text" id="name-p${i}" value="Player ${i + 1}">
      <div class="deck-buttons">
        ${SAMPLE_DECKS.map((d, j) =>
          `<button class="btn small" data-deck="${j}" data-player="${i}">${esc(d.name)}</button>`).join('')}
        <button class="btn small" data-deck="random" data-player="${i}">Random Deck</button>
      </div>
      <textarea id="deck-p${i}" rows="14" spellcheck="false"
        placeholder="One card per line: '4 Giant Growth'"></textarea>`;
  }
  document.getElementById('deck-p0').value = SAMPLE_DECKS[0].list;
  document.getElementById('deck-p1').value = SAMPLE_DECKS[1].list;

  document.querySelectorAll('.deck-buttons button').forEach(btn => {
    btn.onclick = () => {
      const ta = document.getElementById('deck-p' + btn.dataset.player);
      ta.value = btn.dataset.deck === 'random'
        ? randomDecklist()
        : SAMPLE_DECKS[+btn.dataset.deck].list;
    };
  });

  document.getElementById('btn-start').onclick = startGame;
  document.getElementById('btn-browse').onclick = showCardBrowser;
}

function startGame() {
  const errBox = document.getElementById('setup-errors');
  errBox.textContent = '';
  const players = [];
  for (const i of [0, 1]) {
    const { defs, errors } = parseDecklist(document.getElementById('deck-p' + i).value);
    if (errors.length) {
      errBox.innerHTML = `<b>Player ${i + 1} deck problems:</b><br>` + errors.map(esc).join('<br>');
      return;
    }
    if (defs.length === 0) { errBox.textContent = `Player ${i + 1} has an empty deck.`; return; }
    players.push(makePlayer(document.getElementById('name-p' + i).value || `Player ${i + 1}`, defs, i));
  }
  let first = document.getElementById('opt-first').value;
  if (first === 'random') first = Math.floor(Math.random() * 2);
  state = {
    turn: 1, active: +first, phase: 0,
    players, stack: [], log: [],
    spellsCastThisTurn: 0,
    skipFirstDraw: document.getElementById('opt-skipdraw').checked,
    firstDrawDone: false,
  };
  for (const p of players) {
    shuffle(p.library);
    for (let i = 0; i < 7; i++) drawCard(p, true);
  }
  log(`Game start. ${players[+first].name} is on the play. Both players draw 7.`);
  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  render();
}

/* ---------------- core actions ---------------- */

function drawCard(p, silent) {
  if (p.library.length === 0) {
    log(`${p.name} tries to draw from an empty library — they lose the game!`);
    return;
  }
  p.hand.push(p.library.shift());
  if (!silent) log(`${p.name} draws a card.`);
}

function moveTo(inst, zoneArr, opts = {}) {
  // remove from wherever it is
  for (const p of state.players) {
    for (const z of [p.library, p.hand, p.battlefield, p.graveyard, p.exile]) {
      const idx = z.indexOf(inst);
      if (idx >= 0) z.splice(idx, 1);
    }
  }
  const idx = state.stack.findIndex(s => s.inst === inst);
  if (idx >= 0) state.stack.splice(idx, 1);

  if (inst.isToken && zoneArr !== null && !opts.battlefield) {
    return; // tokens cease to exist outside the battlefield
  }
  if (zoneArr === null) return;
  // reset battlefield-only status
  if (!opts.battlefield) {
    inst.tapped = false; inst.damage = 0; inst.sick = false;
    inst.counters = { p1: 0, stun: 0, misc: 0 };
    inst.prepared = !!inst.def.prepare;
  }
  if (opts.top) zoneArr.unshift(inst); else zoneArr.push(inst);
}

function enterBattlefield(pi, inst, opts = {}) {
  const p = state.players[pi];
  inst.controller = pi;
  let tapped = !!opts.tapped;
  const t = inst.def.text || '';
  if (inst.def.isLand) {
    if (/enters tapped unless you control two or more other lands/.test(t)) {
      tapped = p.battlefield.filter(c => c.def.isLand).length < 2;
    } else if (/This land enters tapped/.test(t)) {
      tapped = true;
    }
  }
  moveTo(inst, p.battlefield, { battlefield: true });
  inst.tapped = tapped;
  inst.sick = inst.def.isCreature;
  inst.prepared = !!inst.def.prepare;
  log(`${inst.def.name} enters the battlefield under ${p.name}'s control${tapped ? ' tapped' : ''}` +
      (inst.def.prepare ? ' (prepared — toggle off if it does not enter prepared)' : '') + '.');
}

function castFromHand(pi, inst) {
  const p = state.players[pi];
  const def = inst.def;
  if (def.isLand) {
    enterBattlefield(pi, inst);
    log(`${p.name} plays ${def.name}.`);
    render();
    return;
  }
  state.spellsCastThisTurn++;
  moveTo(inst, null); // pull out of the hand; the stack item owns it now
  state.stack.push({
    id: iidCounter++,
    name: def.name, cost: def.cost, typeLine: def.typeLine, text: def.text,
    def, inst, controller: pi,
    resolveTo: def.isPermanent ? 'battlefield' : 'graveyard',
    tag: '',
  });
  log(`${p.name} casts ${def.name} ${def.cost}. (Spells cast this turn: ${state.spellsCastThisTurn})`);
  render();
}

function castPrepared(pi, inst) {
  const p = state.players[pi];
  const sp = inst.def.prepare;
  inst.prepared = false;
  state.spellsCastThisTurn++;
  state.stack.push({
    id: iidCounter++,
    name: sp.name, cost: sp.cost, typeLine: sp.typeLine, text: sp.text,
    def: { ...sp, colors: colorsOf(sp.cost), prepare: null, power: null, toughness: null },
    inst: null, controller: pi,
    resolveTo: 'none', tag: 'prepared copy',
  });
  log(`${p.name} casts the prepared spell ${sp.name} ${sp.cost} (${inst.def.name} becomes unprepared).`);
  render();
}

function castFromZone(pi, inst, resolveTo, label) {
  const p = state.players[pi];
  const def = inst.def;
  state.spellsCastThisTurn++;
  moveTo(inst, null); // pull out of its zone; the stack item owns it now
  state.stack.push({
    id: iidCounter++,
    name: def.name, cost: def.cost, typeLine: def.typeLine, text: def.text,
    def, inst, controller: pi,
    resolveTo, tag: label,
  });
  log(`${p.name} casts ${def.name} (${label}).`);
  render();
}

function resolveTop() {
  const item = state.stack.pop();
  if (!item) return;
  if (item.inst) {
    const ownerP = state.players[item.inst.owner ?? item.controller];
    if (item.resolveTo === 'battlefield') {
      enterBattlefield(item.controller, item.inst);
    } else if (item.resolveTo === 'exile') {
      moveTo(item.inst, ownerP.exile);
      log(`${item.name} resolves and is exiled.`);
    } else {
      moveTo(item.inst, ownerP.graveyard, { top: true });
      log(`${item.name} resolves → ${ownerP.name}'s graveyard.`);
    }
  } else {
    log(`${item.name}${item.tag ? ` (${item.tag})` : ''} resolves.`);
  }
  render();
}

function counterStackItem(item) {
  const idx = state.stack.indexOf(item);
  if (idx < 0) return;
  state.stack.splice(idx, 1);
  if (item.inst) {
    moveTo(item.inst, state.players[item.inst.owner ?? item.controller].graveyard, { top: true });
  }
  log(`${item.name} is countered.`);
  render();
}

function copyStackItem(item) {
  const idx = state.stack.indexOf(item);
  state.stack.splice(idx + 1, 0, { ...item, id: iidCounter++, inst: null, resolveTo: 'none', tag: 'copy' });
  log(`${item.name} is copied. The copy is put on the stack above it.`);
  render();
}

/* ---------------- turn structure ---------------- */

function clearManaPools() {
  for (const p of state.players) {
    const total = MANA_KEYS.reduce((a, k) => a + p.mana[k], 0);
    if (total > 0) {
      log(`${p.name}'s mana pool empties (${total} mana lost).`);
      for (const k of MANA_KEYS) p.mana[k] = 0;
    }
  }
}

function nextStep() {
  clearManaPools();
  if (state.phase >= PHASES.length - 1) { nextTurn(); return; }
  state.phase++;
  const ph = PHASES[state.phase];
  if (ph === 'Draw') {
    if (!state.firstDrawDone && state.skipFirstDraw && state.turn === 1) {
      log(`${state.players[state.active].name} is on the play and skips the first draw.`);
    } else {
      drawCard(state.players[state.active]);
    }
    state.firstDrawDone = true;
  } else if (ph === 'Cleanup') {
    let cleared = 0;
    for (const p of state.players) for (const c of p.battlefield) {
      if (c.damage > 0) { c.damage = 0; cleared++; }
    }
    if (cleared) log(`Damage is removed from ${cleared} creature(s).`);
    const hp = state.players[state.active];
    if (hp.hand.length > 7) log(`${hp.name} has ${hp.hand.length} cards — discard down to 7.`);
  }
  render();
}

function nextTurn() {
  clearManaPools();
  // implicit cleanup
  for (const p of state.players) for (const c of p.battlefield) c.damage = 0;
  state.turn++;
  state.active = 1 - state.active;
  state.phase = 0;
  state.spellsCastThisTurn = 0;
  for (const p of state.players) p.gainedLifeThisTurn = false;
  const ap = state.players[state.active];
  log(`— ${ap.name}'s turn —`);
  // untap step, honoring stun counters
  for (const c of ap.battlefield) {
    c.sick = false;
    if (c.tapped) {
      if (c.counters.stun > 0) {
        c.counters.stun--;
        log(`${c.def.name} stays tapped (stun counter removed, ${c.counters.stun} left).`);
      } else {
        c.tapped = false;
      }
    }
  }
  render();
}

/* ---------------- per-card actions ---------------- */

function adjustLife(pi, delta) {
  const p = state.players[pi];
  p.life += delta;
  if (delta > 0) p.gainedLifeThisTurn = true;
  log(`${p.name}'s life: ${p.life} (${delta > 0 ? '+' : ''}${delta}).`);
  render();
}

function tapForMana(pi, inst, ev) {
  const opts = inst.def.manaOpts;
  const apply = (symbols) => {
    inst.tapped = true;
    for (const s of symbols) state.players[pi].mana[s]++;
    log(`${state.players[pi].name} taps ${inst.def.name} for ${[...symbols].map(s => `{${s}}`).join('')}.`);
    render();
  };
  if (opts.length === 1) { apply(opts[0]); return; }
  openMenu(ev, opts.map(o => ({
    label: 'Add ' + [...o].map(s => `{${s}}`).join(''),
    fn: () => apply(o),
  })), 'Choose mana');
}

function cardActions(pi, inst, zone) {
  const p = state.players[pi];
  const items = [];
  const add = (label, fn) => items.push({ label, fn });
  const def = inst.def;

  if (zone === 'hand') {
    add(def.isLand ? '▶ Play land' : `▶ Cast ${def.cost || ''}`, () => castFromHand(pi, inst));
    add('Discard', () => { moveTo(inst, p.graveyard, { top: true }); log(`${p.name} discards ${def.name}.`); render(); });
    add('Exile', () => { moveTo(inst, p.exile); log(`${def.name} is exiled from ${p.name}'s hand.`); render(); });
    add('Reveal', () => { log(`${p.name} reveals ${def.name} from their hand.`); render(); });
    add('To top of library', () => { moveTo(inst, p.library, { top: true }); log(`${p.name} puts a card on top of their library.`); render(); });
    add('To bottom of library', () => { moveTo(inst, p.library); log(`${p.name} puts a card on the bottom of their library.`); render(); });
  }

  if (zone === 'battlefield') {
    const ownerP = state.players[inst.owner ?? pi];
    add(inst.tapped ? 'Untap' : 'Tap', () => {
      inst.tapped = !inst.tapped;
      log(`${def.name} ${inst.tapped ? 'taps' : 'untaps'}.`);
      render();
    });
    if (def.manaOpts && !inst.tapped) add('Tap for mana', (e) => tapForMana(pi, inst, e));
    if (def.prepare) {
      if (inst.prepared) {
        add(`✦ Cast ${def.prepare.name} ${def.prepare.cost}`, () => castPrepared(pi, inst));
        add('Mark unprepared', () => { inst.prepared = false; log(`${def.name} becomes unprepared.`); render(); });
      } else {
        add('Mark prepared', () => { inst.prepared = true; log(`${def.name} becomes prepared.`); render(); });
      }
    }
    add('+1/+1 counter +', () => { inst.counters.p1++; render(); });
    if (inst.counters.p1 > 0) add('+1/+1 counter −', () => { inst.counters.p1--; render(); });
    add('Stun counter +', () => { inst.counters.stun++; render(); });
    if (inst.counters.stun > 0) add('Stun counter −', () => { inst.counters.stun--; render(); });
    add('Misc counter +', () => { inst.counters.misc++; render(); });
    if (inst.counters.misc > 0) add('Misc counter −', () => { inst.counters.misc--; render(); });
    if (def.isCreature) {
      add('Damage +1', () => { inst.damage++; render(); });
      if (inst.damage > 0) add('Damage −1', () => { inst.damage--; render(); });
      add(inst.sick ? 'Clear summoning sickness' : 'Mark summoning sickness', () => { inst.sick = !inst.sick; render(); });
    }
    add('Create copy token', () => {
      const tok = newInstance({ ...def, isToken: true }, pi);
      tok.isToken = true;
      enterBattlefield(pi, tok);
      log(`A token copy of ${def.name} is created.`);
      render();
    });
    add('Give control to opponent', () => {
      moveTo(inst, state.players[1 - pi].battlefield, { battlefield: true });
      inst.controller = 1 - pi;
      log(`${def.name}'s control passes to ${state.players[1 - pi].name}.`);
      render();
    });
    add('To graveyard (destroy/sac)', () => { moveTo(inst, ownerP.graveyard, { top: true }); log(`${def.name} is put into the graveyard${inst.isToken ? ' (token ceases to exist)' : ''}.`); render(); });
    add('Exile', () => { moveTo(inst, ownerP.exile); log(`${def.name} is exiled${inst.isToken ? ' (token ceases to exist)' : ''}.`); render(); });
    add('Return to hand', () => { moveTo(inst, ownerP.hand); log(`${def.name} returns to ${ownerP.name}'s hand.`); render(); });
    add('To top of library', () => { moveTo(inst, ownerP.library, { top: true }); log(`${def.name} is put on top of ${ownerP.name}'s library.`); render(); });
    add('To bottom of library', () => { moveTo(inst, ownerP.library); log(`${def.name} is put on the bottom of ${ownerP.name}'s library.`); render(); });
  }

  if (zone === 'graveyard') {
    add('To hand', () => { moveTo(inst, p.hand); log(`${def.name} returns from graveyard to hand.`); render(); });
    if (def.isPermanent) {
      add('To battlefield', () => { enterBattlefield(pi, inst); render(); });
      add('To battlefield tapped', () => { enterBattlefield(pi, inst, { tapped: true }); render(); });
    }
    if (def.isInstant || def.isSorcery) {
      add('▶ Cast (flashback — exiles on resolve)', () => castFromZone(pi, inst, 'exile', 'from graveyard'));
    } else if (!def.isLand) {
      add('▶ Cast from graveyard', () => castFromZone(pi, inst, 'battlefield', 'from graveyard'));
    }
    add('Exile', () => { moveTo(inst, p.exile); log(`${def.name} is exiled from the graveyard.`); render(); });
    add('To top of library', () => { moveTo(inst, p.library, { top: true }); render(); });
    add('To bottom of library', () => { moveTo(inst, p.library); render(); });
  }

  if (zone === 'exile') {
    if (def.isInstant || def.isSorcery) {
      add('▶ Cast from exile', () => castFromZone(pi, inst, 'graveyard', 'from exile'));
    } else if (!def.isLand) {
      add('▶ Cast from exile', () => castFromZone(pi, inst, 'battlefield', 'from exile'));
    } else {
      add('Play (to battlefield)', () => { enterBattlefield(pi, inst); render(); });
    }
    add('To hand', () => { moveTo(inst, p.hand); log(`${def.name} returns from exile to hand.`); render(); });
    add('To graveyard', () => { moveTo(inst, p.graveyard, { top: true }); render(); });
    add('To battlefield', () => { enterBattlefield(pi, inst); render(); });
  }

  if (zone === 'library') {
    add('To hand', () => { moveTo(inst, p.hand); log(`${p.name} puts a card from their library into their hand.`); render(); });
    add('To battlefield', () => { enterBattlefield(pi, inst); render(); });
    add('To battlefield tapped', () => { enterBattlefield(pi, inst, { tapped: true }); render(); });
    add('To graveyard', () => { moveTo(inst, p.graveyard, { top: true }); render(); });
    add('Exile', () => { moveTo(inst, p.exile); render(); });
    add('To top of library', () => { moveTo(inst, p.library, { top: true }); render(); });
    add('To bottom of library', () => { moveTo(inst, p.library); render(); });
  }

  return items;
}

/* ---------------- floating menu ---------------- */

function openMenu(ev, items, title) {
  ev.stopPropagation();
  const menu = document.getElementById('action-menu');
  menu.innerHTML = (title ? `<div class="menu-title">${esc(title)}</div>` : '');
  for (const it of items) {
    const b = document.createElement('button');
    b.innerHTML = manaHTML(it.label);
    b.onclick = (e) => { e.stopPropagation(); closeMenu(); it.fn(e); };
    menu.appendChild(b);
  }
  menu.classList.remove('hidden');
  const x = Math.min(ev.clientX, window.innerWidth - 280);
  const y = Math.min(ev.clientY, window.innerHeight - Math.min(items.length * 30 + 40, 420));
  menu.style.left = x + 'px';
  menu.style.top = Math.max(8, y) + 'px';
}

function closeMenu() {
  document.getElementById('action-menu').classList.add('hidden');
}

document.addEventListener('click', closeMenu);

/* ---------------- modals ---------------- */

function showModal(title, bodyNode, footButtons = []) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  box.innerHTML = `<div class="modal-head"><h2>${esc(title)}</h2><button class="btn small" id="modal-close">✕</button></div>`;
  const body = document.createElement('div');
  body.className = 'modal-body';
  body.appendChild(bodyNode);
  box.appendChild(body);
  if (footButtons.length) {
    const foot = document.createElement('div');
    foot.className = 'modal-foot';
    for (const fb of footButtons) {
      const b = document.createElement('button');
      b.className = 'btn small';
      b.textContent = fb.label;
      b.onclick = fb.fn;
      foot.appendChild(b);
    }
    box.appendChild(foot);
  }
  overlay.classList.remove('hidden');
  document.getElementById('modal-close').onclick = hideModal;
  overlay.onclick = (e) => { if (e.target === overlay) hideModal(); };
}

function hideModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function showZoneModal(pi, zoneName) {
  const p = state.players[pi];
  const zone = { graveyard: p.graveyard, exile: p.exile, library: p.library }[zoneName];
  const wrap = document.createElement('div');
  wrap.className = 'zone-grid';
  if (zone.length === 0) wrap.innerHTML = '<p class="dim">(empty)</p>';
  zone.slice().forEach(inst => {
    const el = renderCardEl(inst, pi, zoneName);
    wrap.appendChild(el);
  });
  const foots = [];
  if (zoneName === 'library') {
    foots.push({ label: 'Shuffle', fn: () => { shuffle(p.library); log(`${p.name} shuffles their library.`); hideModal(); render(); } });
  }
  foots.push({ label: 'Close', fn: hideModal });
  showModal(`${p.name} — ${zoneName} (${zone.length})`, wrap, foots);
}

function showTokenModal(pi) {
  const wrap = document.createElement('div');
  wrap.className = 'zone-grid';
  for (const t of TOKEN_DB) {
    const el = renderCardEl({ def: t, counters: { p1: 0, stun: 0, misc: 0 }, damage: 0 }, pi, 'tokenpicker');
    el.onclick = (e) => {
      e.stopPropagation();
      const tok = newInstance(t, pi);
      enterBattlefield(pi, tok);
      hideModal();
      render();
    };
    wrap.appendChild(el);
  }
  showModal(`Create token for ${state.players[pi].name}`, wrap, [{ label: 'Close', fn: hideModal }]);
}

function showCardBrowser() {
  const wrap = document.createElement('div');
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Filter by name, type, or rules text…';
  input.className = 'browser-filter';
  const grid = document.createElement('div');
  grid.className = 'zone-grid';
  const refresh = () => {
    const q = input.value.toLowerCase();
    grid.innerHTML = '';
    let shown = 0;
    for (const n of CARD_NAMES) {
      const d = CARD_DB[n];
      const hay = (d.fullName + ' ' + d.typeLine + ' ' + d.text).toLowerCase();
      if (q && !hay.includes(q)) continue;
      if (++shown > 80) break;
      grid.appendChild(renderCardEl({ def: d, counters: { p1: 0, stun: 0, misc: 0 }, damage: 0 }, 0, 'browser'));
    }
    if (!shown) grid.innerHTML = '<p class="dim">No matches.</p>';
  };
  input.oninput = refresh;
  wrap.appendChild(input);
  wrap.appendChild(grid);
  refresh();
  showModal(`Card Browser (${CARD_NAMES.length} cards)`, wrap, [{ label: 'Close', fn: hideModal }]);
}

const KEYWORD_GLOSSARY = [
  ['Prepared / Prepare spells', 'Some creatures have a second instant or sorcery half ("Creature // Spell"). While the creature is on the battlefield and prepared, you may cast that spell (sorceries at sorcery speed, instants any time) by paying its cost; the creature then becomes unprepared. Most of these creatures enter the battlefield prepared (the client marks them prepared by default — toggle it off for ones that don\'t). Cards like Biblioplex Tomekeeper and Skycoach Waypoint can re-prepare or unprepare creatures: use "Mark prepared/unprepared" on the card menu.'],
  ['Increment', 'Whenever you cast a spell, if the amount of mana you spent is greater than this creature\'s power or toughness, put a +1/+1 counter on it. (Checks on trigger and on resolution.)'],
  ['Opus', 'Triggers whenever you cast an instant or sorcery spell; an upgraded or extra effect happens if five or more mana was spent to cast that spell (all mana spent counts, not just the mana cost).'],
  ['Repartee', 'Triggers whenever you cast an instant or sorcery spell that targets a creature (only once even if the spell targets several creatures).'],
  ['Infusion', 'Ability word: cares whether you gained life this turn (any amount). The client shows a ❤ badge next to a player who has gained life this turn.'],
  ['Paradigm', 'On Lesson sorceries: the first time the spell resolves, exile it; afterwards you may cast a copy of it from exile for free at the beginning of each of your first main phases. (Cast it from the exile zone in this client; use the stack\'s Copy button if needed.)'],
  ['Converge', 'Counts the number of colors of mana spent to cast the spell.'],
  ['Flashback', 'Cast the card from your graveyard for its flashback cost, then exile it. (Use ▶ Cast on the card in the graveyard — it auto-exiles on resolution.)'],
  ['Storm', 'When you cast the spell, copy it for each spell cast before it this turn. The top bar tracks spells cast this turn; use the stack item\'s Copy button.'],
  ['Surveil N', 'Look at the top N cards of your library; put any number into your graveyard and the rest back on top in any order.'],
  ['Ward', 'Spells/abilities opponents cast targeting this counter it unless they pay the ward cost.'],
  ['Stun counters', 'If a permanent with a stun counter would untap, remove a stun counter instead. The client handles this automatically during the untap step.'],
  ['Kicker / Overload / Spree / Convoke / Cascade / Suspend / Miracle / Casualty / Grandeur / Cycling', 'Alternative or additional cost mechanics — pay/track them on the honor system and use the stack Copy/Exile actions as needed.'],
];

function showKeywords() {
  const wrap = document.createElement('div');
  wrap.className = 'glossary';
  for (const [k, v] of KEYWORD_GLOSSARY) {
    const d = document.createElement('div');
    d.innerHTML = `<h4>${esc(k)}</h4><p>${esc(v)}</p>`;
    wrap.appendChild(d);
  }
  showModal('Keyword Mechanics — Secrets of Strixhaven', wrap, [{ label: 'Close', fn: hideModal }]);
}

function showHelp() {
  const wrap = document.createElement('div');
  wrap.className = 'glossary';
  wrap.innerHTML = `
    <h4>How this client works</h4>
    <p>You control both players. Click any card for a context menu of actions. The client automates
    zones, the stack, turn structure, untapping (with stun counters), drawing, mana from lands, and
    prepared spells — but it does not enforce costs, targets, or combat rules. Play both seats honestly!</p>
    <h4>Casting spells</h4>
    <p>Click a card in hand → Cast. It goes on the stack; resolve with the stack's <b>Resolve</b> button.
    Permanents enter the battlefield, instants/sorceries go to the graveyard. Lands skip the stack.</p>
    <h4>Prepared spells</h4>
    <p>Creatures named "A // B" carry a prepare spell. While on the battlefield and prepared (✦ badge),
    the card menu offers <b>✦ Cast [spell]</b>. Casting it unprepares the creature. Most enter prepared —
    toggle with Mark prepared/unprepared.</p>
    <h4>Mana</h4>
    <p>Use <b>Tap for mana</b> on lands (and mana creatures/artifacts) to fill the mana pool; click a
    mana pip to add one, shift-click to remove one. Pools clear automatically at each step.</p>
    <h4>Combat</h4>
    <p>Tap creatures to attack during the Attackers step; track damage with the per-card Damage +/−
    actions (cleared at cleanup) and adjust life totals with the +/− buttons.</p>
    <h4>Tokens & counters</h4>
    <p>Each player has a Token button for the set's predefined tokens; any battlefield card can get
    +1/+1, stun, or misc counters from its menu.</p>`;
  showModal('Help', wrap, [{ label: 'Close', fn: hideModal }]);
}

/* ---------------- rendering ---------------- */

function ptText(inst) {
  const d = inst.def;
  if (d.power === null) return '';
  const p = parseInt(d.power, 10) + (inst.counters ? inst.counters.p1 : 0);
  const t = parseInt(d.toughness, 10) + (inst.counters ? inst.counters.p1 : 0);
  return isNaN(p) ? `${d.power}/${d.toughness}` : `${p}/${t}`;
}

function renderCardEl(inst, pi, zone) {
  const def = inst.def;
  const el = document.createElement('div');
  el.className = `card ${frameClass(def)}` +
    (inst.tapped ? ' tapped' : '') +
    (inst.sick ? ' sick' : '') +
    (def.isToken || inst.isToken ? ' token' : '');
  const badges = [];
  if (def.prepare && zone === 'battlefield') {
    badges.push(`<span class="badge prep ${inst.prepared ? '' : 'off'}">${inst.prepared ? '✦ PREPARED' : 'unprepared'}</span>`);
  }
  if (inst.counters) {
    if (inst.counters.p1 > 0) badges.push(`<span class="badge p1">+${inst.counters.p1}/+${inst.counters.p1}</span>`);
    if (inst.counters.stun > 0) badges.push(`<span class="badge stun">⛔${inst.counters.stun}</span>`);
    if (inst.counters.misc > 0) badges.push(`<span class="badge misc">●${inst.counters.misc}</span>`);
  }
  if (inst.damage > 0) badges.push(`<span class="badge dmg">⚡${inst.damage}</span>`);

  el.innerHTML = `
    <div class="card-top">
      <span class="card-name">${esc(def.name)}</span>
      <span class="card-cost">${manaHTML(def.cost || '')}</span>
    </div>
    <div class="card-type">${esc(def.typeLine)}</div>
    <div class="card-text">${manaHTML(def.text || '')}</div>
    ${def.power !== null ? `<div class="card-pt">${esc(ptText(inst))}</div>` : ''}
    <div class="card-badges">${badges.join('')}</div>`;

  if (zone !== 'browser' && zone !== 'tokenpicker') {
    el.onclick = (e) => openMenu(e, cardActions(pi, inst, zone), def.name);
  }
  el.onmouseenter = () => showPreview(def, inst);
  el.onmouseleave = hidePreview;
  return el;
}

function showPreview(def, inst) {
  const pv = document.getElementById('card-preview');
  let html = `
    <div class="pv-card ${frameClass(def)}">
      <div class="pv-top"><b>${esc(def.name)}</b><span>${manaHTML(def.cost || '')}</span></div>
      <div class="pv-type">${esc(def.typeLine)}</div>
      <div class="pv-text">${manaHTML(def.text || '')}</div>
      ${def.power !== null ? `<div class="pv-pt">${esc(def.power)}/${esc(def.toughness)}</div>` : ''}
    </div>`;
  if (def.prepare) {
    html += `
    <div class="pv-card pv-prepare">
      <div class="pv-top"><b>✦ ${esc(def.prepare.name)}</b><span>${manaHTML(def.prepare.cost)}</span></div>
      <div class="pv-type">${esc(def.prepare.typeLine)} (prepare spell)</div>
      <div class="pv-text">${manaHTML(def.prepare.text)}</div>
    </div>`;
  }
  pv.innerHTML = html;
  pv.classList.remove('hidden');
}

function hidePreview() {
  document.getElementById('card-preview').classList.add('hidden');
}

function renderTopbar() {
  const tb = document.getElementById('topbar');
  const ap = state.players[state.active];
  tb.innerHTML = `
    <span class="tb-title">SoS Tabletop</span>
    <span class="tb-turn">Turn ${state.turn} — <b>${esc(ap.name)}</b></span>
    <span class="tb-phases">${PHASES.map((p, i) =>
      `<span class="phase-chip${i === state.phase ? ' on' : ''}">${p}</span>`).join('')}</span>
    <span class="tb-storm" title="Spells cast this turn (storm count)">🌀 ${state.spellsCastThisTurn}</span>
    <button class="btn small" id="tb-next">Next Step ▸</button>
    <button class="btn small" id="tb-turn">End Turn ⏭</button>
    <button class="btn small" id="tb-keywords">Keywords</button>
    <button class="btn small" id="tb-help">Help</button>
    <button class="btn small warn" id="tb-new">New Game</button>`;
  document.getElementById('tb-next').onclick = nextStep;
  document.getElementById('tb-turn').onclick = nextTurn;
  document.getElementById('tb-keywords').onclick = showKeywords;
  document.getElementById('tb-help').onclick = showHelp;
  document.getElementById('tb-new').onclick = () => {
    if (confirm('Abandon this game and return to setup?')) {
      document.getElementById('game-screen').classList.add('hidden');
      document.getElementById('setup-screen').classList.remove('hidden');
    }
  };
}

function renderPlayer(pi) {
  const p = state.players[pi];
  const area = document.getElementById('area-p' + pi);
  area.classList.toggle('active-player', state.active === pi);
  area.innerHTML = '';

  // side panel
  const side = document.createElement('div');
  side.className = 'side-panel';
  side.innerHTML = `
    <div class="pname">${esc(p.name)}${p.gainedLifeThisTurn ? ' <span class="heart" title="Gained life this turn (Infusion)">❤</span>' : ''}</div>
    <div class="life">
      <button class="btn tiny" data-d="-1">−</button>
      <span class="life-num">${p.life}</span>
      <button class="btn tiny" data-d="1">+</button>
    </div>
    <div class="mana-pool">${MANA_KEYS.map(k =>
      `<span class="pool-pip pip-${k}" data-k="${k}" title="Click +1, shift-click −1">${k}<b>${p.mana[k]}</b></span>`).join('')}</div>
    <div class="piles">
      <button class="pile" data-z="library">Library<br><b>${p.library.length}</b></button>
      <button class="pile" data-z="graveyard">Grave<br><b>${p.graveyard.length}</b></button>
      <button class="pile" data-z="exile">Exile<br><b>${p.exile.length}</b></button>
    </div>
    <div class="side-buttons">
      <button class="btn tiny" data-act="draw">Draw</button>
      <button class="btn tiny" data-act="mill">Mill</button>
      <button class="btn tiny" data-act="shuffle">Shuffle</button>
      <button class="btn tiny" data-act="revealtop">Top?</button>
      <button class="btn tiny" data-act="token">Token</button>
      <button class="btn tiny" data-act="mull">Mulligan</button>
      <button class="btn tiny" data-act="hidehand">${p.handHidden ? 'Show hand' : 'Hide hand'}</button>
    </div>`;

  side.querySelectorAll('.life button').forEach(b => b.onclick = (e) => { e.stopPropagation(); adjustLife(pi, +b.dataset.d); });
  side.querySelectorAll('.pool-pip').forEach(el => el.onclick = (e) => {
    e.stopPropagation();
    const k = el.dataset.k;
    if (e.shiftKey) { if (p.mana[k] > 0) p.mana[k]--; } else p.mana[k]++;
    render();
  });
  side.querySelectorAll('.pile').forEach(b => b.onclick = (e) => { e.stopPropagation(); showZoneModal(pi, b.dataset.z); });
  side.querySelector('[data-act=draw]').onclick = (e) => { e.stopPropagation(); drawCard(p); render(); };
  side.querySelector('[data-act=mill]').onclick = (e) => {
    e.stopPropagation();
    if (p.library.length) { const c = p.library.shift(); moveTo(c, p.graveyard, { top: true }); log(`${p.name} mills ${c.def.name}.`); }
    render();
  };
  side.querySelector('[data-act=shuffle]').onclick = (e) => { e.stopPropagation(); shuffle(p.library); log(`${p.name} shuffles their library.`); render(); };
  side.querySelector('[data-act=revealtop]').onclick = (e) => {
    e.stopPropagation();
    log(p.library.length ? `Top of ${p.name}'s library: ${p.library[0].def.name}.` : `${p.name}'s library is empty.`);
    render();
  };
  side.querySelector('[data-act=token]').onclick = (e) => { e.stopPropagation(); showTokenModal(pi); };
  side.querySelector('[data-act=mull]').onclick = (e) => {
    e.stopPropagation();
    p.mulls++;
    while (p.hand.length) moveTo(p.hand[0], p.library);
    shuffle(p.library);
    for (let i = 0; i < 7; i++) drawCard(p, true); // London mulligan: draw 7, put N back manually

    log(`${p.name} mulligans to a new 7 (mulligan #${p.mulls} — put ${p.mulls} card(s) on the bottom).`);
    render();
  };
  side.querySelector('[data-act=hidehand]').onclick = (e) => { e.stopPropagation(); p.handHidden = !p.handHidden; render(); };
  area.appendChild(side);

  // play zone
  const play = document.createElement('div');
  play.className = 'play-zone';

  const bf = document.createElement('div');
  bf.className = 'battlefield';
  const nonlands = document.createElement('div');
  nonlands.className = 'bf-row';
  const lands = document.createElement('div');
  lands.className = 'bf-row lands-row';
  for (const inst of p.battlefield) {
    (inst.def.isLand ? lands : nonlands).appendChild(renderCardEl(inst, pi, 'battlefield'));
  }
  if (!p.battlefield.some(c => !c.def.isLand)) nonlands.innerHTML = '<span class="dim">battlefield</span>';
  if (!p.battlefield.some(c => c.def.isLand)) lands.innerHTML = '<span class="dim">lands</span>';
  bf.appendChild(nonlands);
  bf.appendChild(lands);
  play.appendChild(bf);

  const hand = document.createElement('div');
  hand.className = 'hand';
  if (p.handHidden) {
    hand.innerHTML = `<span class="dim">hand hidden — ${p.hand.length} card(s)</span>`;
  } else if (p.hand.length === 0) {
    hand.innerHTML = '<span class="dim">hand (empty)</span>';
  } else {
    for (const inst of p.hand) hand.appendChild(renderCardEl(inst, pi, 'hand'));
  }
  play.appendChild(hand);
  area.appendChild(play);
}

function renderStack() {
  const box = document.getElementById('stack-items');
  box.innerHTML = state.stack.length ? '' : '<p class="dim">(empty)</p>';
  // display top of stack first
  state.stack.slice().reverse().forEach((item, ri) => {
    const isTop = ri === 0;
    const el = document.createElement('div');
    el.className = 'stack-item' + (isTop ? ' top' : '');
    el.innerHTML = `
      <div class="si-name">${esc(item.name)} <span>${manaHTML(item.cost || '')}</span></div>
      <div class="si-meta">${esc(item.typeLine)}${item.tag ? ' — ' + esc(item.tag) : ''} · ${esc(state.players[item.controller].name)}</div>
      <div class="si-buttons">
        ${isTop ? '<button class="btn tiny" data-a="resolve">Resolve</button>' : ''}
        <button class="btn tiny" data-a="counter">Counter</button>
        <button class="btn tiny" data-a="copy">Copy</button>
      </div>`;
    el.querySelector('[data-a=counter]').onclick = (e) => { e.stopPropagation(); counterStackItem(item); };
    el.querySelector('[data-a=copy]').onclick = (e) => { e.stopPropagation(); copyStackItem(item); };
    const rb = el.querySelector('[data-a=resolve]');
    if (rb) rb.onclick = (e) => { e.stopPropagation(); resolveTop(); };
    el.onmouseenter = () => showPreview(item.def || item, null);
    el.onmouseleave = hidePreview;
    box.appendChild(el);
  });
}

function renderLog() {
  const box = document.getElementById('log-items');
  box.innerHTML = state.log.slice(-200).map(l => `<div>${esc(l)}</div>`).join('');
  box.scrollTop = box.scrollHeight;
}

function render() {
  renderTopbar();
  renderPlayer(0);
  renderPlayer(1);
  renderStack();
  renderLog();
}

/* ---------------- boot ---------------- */

document.addEventListener('mousemove', (e) => {
  const pv = document.getElementById('card-preview');
  if (pv.classList.contains('hidden')) return;
  const w = 280;
  let x = e.clientX + 18;
  if (x + w > window.innerWidth) x = e.clientX - w - 18;
  pv.style.left = Math.max(4, x) + 'px';
  pv.style.top = Math.max(4, Math.min(e.clientY - 60, window.innerHeight - pv.offsetHeight - 8)) + 'px';
});

initSetup();
