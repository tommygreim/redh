// engine.js — game state and rules primitives for the MtG MVP.
//
// Design note: faithfully auto-resolving ~300 unique cards is out of scope for
// an MVP, so this engine is a "rules-assisted tabletop". It owns the parts of
// Magic that are tedious and well-defined — zones, turn/phase structure, the
// mana pool, the stack, summoning sickness, stun counters, and combat math
// (including the common evergreen keywords). Card text that it can't automate
// is resolved by the human players via the UI's manipulation tools. Because
// both players are human-controlled, every listed card is playable.

const PHASES = [
  'Untap', 'Upkeep', 'Draw', 'Main 1',
  'Begin Combat', 'Declare Attackers', 'Declare Blockers', 'Combat Damage', 'End Combat',
  'Main 2', 'End Step', 'Cleanup',
];

const COLORS = ['W', 'U', 'B', 'R', 'G', 'C'];

let _uid = 1;
function nextUid() { return _uid++; }

const Engine = {
  G: null,
  instances: {},   // uid -> instance
  log: [],

  // ---- setup -------------------------------------------------------------

  newGame(decks, names) {
    this.instances = {};
    this.log = [];
    _uid = 1;
    const players = [0, 1].map(i => ({
      id: i,
      name: names[i] || `Player ${i + 1}`,
      life: 20,
      library: [],
      hand: [],
      graveyard: [],
      exile: [],
      manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
      landPlayedThisTurn: false,
      lifeGainedThisTurn: 0,
      poison: 0,
    }));

    decks.forEach((deck, pi) => {
      deck.forEach(cardName => {
        const card = CARD_BY_NAME[cardName];
        if (!card) { console.warn('Unknown card', cardName); return; }
        const inst = this.makeInstance(card, pi);
        inst.zone = 'library';
        players[pi].library.push(inst.uid);
      });
    });

    this.G = {
      players,
      battlefield: [],   // uids of permanents
      stack: [],         // stack items (objects)
      turn: 1,
      active: 0,
      phaseIdx: 0,
      firstTurn: true,
      gameOver: null,
    };

    players.forEach(p => this.shuffle(p));
    players.forEach(p => this.draw(p.id, 7));
    this.logMsg(`Game start. ${players[0].name} vs ${players[1].name}.`);
    this.beginPhase();
    return this.G;
  },

  makeInstance(card, owner, tokenInfo) {
    const uid = nextUid();
    const inst = {
      uid,
      card,
      name: card ? card.name : (tokenInfo ? tokenInfo.name : 'Token'),
      owner,
      controller: owner,
      zone: 'none',
      tapped: false,
      summoningSick: false,
      damage: 0,
      counters: {},
      tempP: 0,    // temporary +X/+0 until end of turn
      tempT: 0,
      tempKeywords: {},  // keyword -> true (until end of turn)
      attacking: false,
      attackTarget: null,
      blockingUid: null,    // attacker this creature is blocking
      blockedByUids: [],    // blockers assigned to this attacker
      isToken: !!tokenInfo,
      tokenInfo: tokenInfo || null,
    };
    this.instances[uid] = inst;
    return inst;
  },

  makeToken(tokenInfo, controller) {
    // tokenInfo: {name, power, toughness, colors:[], typeLine, oracle}
    const synthCard = {
      name: tokenInfo.name,
      typeLine: tokenInfo.typeLine || 'Creature',
      typeLineFull: tokenInfo.typeLine || 'Creature',
      oracle: tokenInfo.oracle || '',
      power: tokenInfo.power != null ? String(tokenInfo.power) : null,
      toughness: tokenInfo.toughness != null ? String(tokenInfo.toughness) : null,
      manaCostRaw: '',
      manaCostFull: '',
      colors: tokenInfo.colors || [],
      cmc: 0,
      mana: { pips: [], generic: 0, hasX: false, cmc: 0, colors: tokenInfo.colors || [] },
      isLand: /land/i.test(tokenInfo.typeLine || ''),
      isCreature: /creature/i.test(tokenInfo.typeLine || 'Creature'),
      isInstant: false, isSorcery: false,
      isArtifact: /artifact/i.test(tokenInfo.typeLine || ''),
      isEnchantment: false, isPlaneswalker: false, isLegendary: false,
      isPermanent: true,
    };
    const inst = this.makeInstance(synthCard, controller, tokenInfo);
    inst.controller = controller;
    inst.zone = 'battlefield';
    if (inst.isCreatureNow === undefined) { /* noop */ }
    inst.summoningSick = true;
    this.G.battlefield.push(inst.uid);
    this.logMsg(`${this.G.players[controller].name} creates a ${tokenInfo.name} token.`);
    return inst;
  },

  // ---- helpers -----------------------------------------------------------

  inst(uid) { return this.instances[uid]; },
  player(i) { return this.G.players[i]; },
  opp(i) { return i === 0 ? 1 : 0; },
  phaseName() { return PHASES[this.G.phaseIdx]; },

  isCreature(inst) { return inst.card && inst.card.isCreature; },
  isLand(inst) { return inst.card && inst.card.isLand; },

  // Effective power/toughness including counters and temp modifiers.
  power(inst) {
    let base = parseInt(inst.card && inst.card.power, 10);
    if (isNaN(base)) base = 0;
    const plus = inst.counters['+1/+1'] || 0;
    const minus = inst.counters['-1/-1'] || 0;
    return base + plus - minus + inst.tempP;
  },
  toughness(inst) {
    let base = parseInt(inst.card && inst.card.toughness, 10);
    if (isNaN(base)) base = 0;
    const plus = inst.counters['+1/+1'] || 0;
    const minus = inst.counters['-1/-1'] || 0;
    return base + plus - minus + inst.tempT;
  },

  hasKeyword(inst, kw) {
    if (inst.tempKeywords[kw]) return true;
    const text = ((inst.card && inst.card.oracle) || '').toLowerCase();
    // Match keyword as a standalone word in the rules text.
    const re = new RegExp('(^|[^a-z])' + kw.toLowerCase() + '([^a-z]|$)');
    return re.test(text);
  },

  // ---- library operations ------------------------------------------------

  shuffle(p) {
    const a = p.library;
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  },

  draw(pi, n = 1) {
    const p = this.player(pi);
    for (let k = 0; k < n; k++) {
      if (p.library.length === 0) {
        this.logMsg(`${p.name} can't draw — library empty! ${p.name} loses.`);
        this.setGameOver(this.opp(pi));
        return;
      }
      const uid = p.library.shift();
      this.inst(uid).zone = 'hand';
      p.hand.push(uid);
    }
    this.logMsg(`${p.name} draws ${n} card${n > 1 ? 's' : ''}.`);
  },

  mill(pi, n = 1) {
    const p = this.player(pi);
    for (let k = 0; k < n && p.library.length > 0; k++) {
      const uid = p.library.shift();
      this.inst(uid).zone = 'graveyard';
      p.graveyard.push(uid);
    }
    this.logMsg(`${p.name} mills ${n}.`);
  },

  // Move an instance from its current zone to a destination zone.
  moveTo(uid, destZone, opts = {}) {
    const inst = this.inst(uid);
    if (!inst) return;
    this.removeFromZone(uid);
    // Reset transient state when leaving the battlefield.
    if (inst.zone === 'battlefield' && destZone !== 'battlefield') {
      this.resetPermanentState(inst);
    }
    const owner = this.player(inst.owner);
    const ctrl = this.player(inst.controller);

    if (destZone === 'graveyard') {
      if (inst.isToken) { inst.zone = 'gone'; this.logMsg(`${inst.name} (token) ceases to exist.`); return; }
      inst.zone = 'graveyard'; inst.controller = inst.owner; owner.graveyard.push(uid);
    } else if (destZone === 'exile') {
      if (inst.isToken) { inst.zone = 'gone'; return; }
      inst.zone = 'exile'; inst.controller = inst.owner; owner.exile.push(uid);
    } else if (destZone === 'hand') {
      if (inst.isToken) { inst.zone = 'gone'; return; }
      inst.zone = 'hand'; inst.controller = inst.owner; owner.hand.push(uid);
    } else if (destZone === 'library') {
      if (inst.isToken) { inst.zone = 'gone'; return; }
      inst.zone = 'library'; inst.controller = inst.owner;
      if (opts.bottom) owner.library.push(uid); else owner.library.unshift(uid);
    } else if (destZone === 'battlefield') {
      inst.zone = 'battlefield';
      this.resetPermanentState(inst);
      if (this.isCreature(inst)) inst.summoningSick = true;
      this.G.battlefield.push(uid);
    } else if (destZone === 'stack') {
      inst.zone = 'stack';
    }
  },

  resetPermanentState(inst) {
    inst.tapped = false;
    inst.damage = 0;
    inst.counters = {};
    inst.tempP = 0; inst.tempT = 0; inst.tempKeywords = {};
    inst.attacking = false; inst.attackTarget = null;
    inst.blockingUid = null; inst.blockedByUids = [];
  },

  removeFromZone(uid) {
    const inst = this.inst(uid);
    const remove = arr => { const i = arr.indexOf(uid); if (i >= 0) arr.splice(i, 1); };
    remove(this.G.battlefield);
    this.G.players.forEach(p => {
      remove(p.library); remove(p.hand); remove(p.graveyard); remove(p.exile);
    });
    const si = this.G.stack.findIndex(s => s.uid === uid);
    if (si >= 0) this.G.stack.splice(si, 1);
  },

  // ---- life --------------------------------------------------------------

  gainLife(pi, n) {
    const p = this.player(pi);
    p.life += n;
    p.lifeGainedThisTurn += n;
    this.logMsg(`${p.name} gains ${n} life (now ${p.life}).`);
  },
  loseLife(pi, n) {
    const p = this.player(pi);
    p.life -= n;
    this.logMsg(`${p.name} loses ${n} life (now ${p.life}).`);
    this.checkLife();
  },
  setLife(pi, v) { this.player(pi).life = v; this.checkLife(); },

  checkLife() {
    this.G.players.forEach(p => {
      if (p.life <= 0 && !this.G.gameOver) {
        this.logMsg(`${p.name} is at ${p.life} life.`);
        this.setGameOver(this.opp(p.id));
      }
    });
  },
  setGameOver(winner) {
    if (this.G.gameOver) return;
    this.G.gameOver = winner;
    this.logMsg(`*** ${this.player(winner).name} wins the game! ***`);
  },

  // ---- mana --------------------------------------------------------------

  addMana(pi, color, n = 1) {
    this.player(pi).manaPool[color] = (this.player(pi).manaPool[color] || 0) + n;
  },
  emptyPool(pi) {
    this.player(pi).manaPool = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
  },
  poolTotal(pi) {
    const m = this.player(pi).manaPool;
    return COLORS.reduce((s, c) => s + m[c], 0);
  },

  // Tap a permanent for mana. The UI supplies the chosen color for duals.
  tapForMana(uid, color) {
    const inst = this.inst(uid);
    if (inst.tapped) return false;
    inst.tapped = true;
    this.addMana(inst.controller, color, 1);
    this.logMsg(`${this.player(inst.controller).name} taps ${inst.name} for {${color}}.`);
    return true;
  },

  // Determine which mana symbols a land can produce, from its oracle text.
  landManaOptions(inst) {
    const card = inst.card;
    const text = (card.oracle || '') + ' ' + (card.typeLine || '');
    const opts = new Set();
    // Basic land subtypes.
    if (/Plains/.test(card.typeLine)) opts.add('W');
    if (/Island/.test(card.typeLine)) opts.add('U');
    if (/Swamp/.test(card.typeLine)) opts.add('B');
    if (/Mountain/.test(card.typeLine)) opts.add('R');
    if (/Forest/.test(card.typeLine)) opts.add('G');
    // "Add {X}" patterns.
    const re = /Add ([^.]*)/g; let m;
    while ((m = re.exec(text)) !== null) {
      const seg = m[1];
      (seg.match(/\{([WUBRGC])\}/g) || []).forEach(s => opts.add(s.replace(/[{}]/g, '')));
      if (/any color/.test(seg)) ['W', 'U', 'B', 'R', 'G'].forEach(c => opts.add(c));
    }
    if (opts.size === 0) opts.add('C');
    return [...opts];
  },

  // Pay a mana cost from a player's pool. Returns {ok, spent} where spent is
  // total mana used (for "amount of mana spent" cards). xValue/lifeForPhy let
  // the UI resolve {X} and phyrexian choices. Generic is paid greedily.
  canAfford(pi, card, xValue = 0) {
    return this.payManaCost(pi, card, { xValue, dryRun: true }).ok;
  },

  payManaCost(pi, card, opts = {}) {
    const pool = { ...this.player(pi).manaPool };
    const pips = card.mana.pips;
    const xValue = opts.xValue || 0;
    let lifePaid = 0;
    let spent = 0;
    const take = (color) => { if (pool[color] > 0) { pool[color]--; spent++; return true; } return false; };
    const takeAny = () => {
      for (const c of COLORS) if (pool[c] > 0) { pool[c]--; spent++; return true; }
      return false;
    };
    let xCount = 0;
    for (const pip of pips) {
      if (pip.type === 'generic') {
        for (let k = 0; k < pip.amount; k++) if (!takeAny()) return { ok: false };
      } else if (pip.type === 'x') {
        xCount++;
      } else if (pip.type === 'colorless') {
        if (!take('C') && !takeAny()) return { ok: false }; // allow any if no C-only desired (lenient)
      } else if (pip.type === 'color') {
        if (!take(pip.color)) return { ok: false };
      } else if (pip.type === 'hybrid') {
        if (!take(pip.colors[0]) && !take(pip.colors[1])) return { ok: false };
      } else if (pip.type === 'monohybrid') {
        // pay color, else 2 generic
        if (!take(pip.color)) { if (!takeAny() || !takeAny()) return { ok: false }; }
      } else if (pip.type === 'phyrexian') {
        if (!take(pip.color)) lifePaid += 2;
      }
    }
    // pay X*count generic
    const xTotal = xCount * xValue;
    for (let k = 0; k < xTotal; k++) if (!takeAny()) return { ok: false };

    if (opts.dryRun) return { ok: true, spent: spent + lifePaid / 2, lifePaid };
    // commit
    this.player(pi).manaPool = pool;
    if (lifePaid > 0) { this.player(pi).life -= lifePaid; this.logMsg(`${this.player(pi).name} pays ${lifePaid} life (Phyrexian).`); }
    return { ok: true, spent, lifePaid };
  },

  // ---- casting & stack ---------------------------------------------------

  // Put a spell on the stack (mana already paid by UI, or override).
  pushSpell(uid, info = {}) {
    const inst = this.inst(uid);
    inst.zone = 'stack';
    this.removeFromZoneExceptStack(uid);
    const item = {
      kind: 'spell',
      uid,
      name: inst.name,
      controller: inst.controller,
      card: inst.card,
      manaSpent: info.manaSpent || 0,
      xValue: info.xValue || 0,
      text: inst.card.oracle,
    };
    this.G.stack.push(item);
    this.logMsg(`${this.player(inst.controller).name} casts ${inst.name}` +
      (info.manaSpent ? ` (${info.manaSpent} mana spent).` : '.'));
    return item;
  },

  removeFromZoneExceptStack(uid) {
    const remove = arr => { const i = arr.indexOf(uid); if (i >= 0) arr.splice(i, 1); };
    remove(this.G.battlefield);
    this.G.players.forEach(p => { remove(p.library); remove(p.hand); remove(p.graveyard); remove(p.exile); });
  },

  // Push an ability (activated/triggered) onto the stack as a resolvable note.
  pushAbility(sourceUid, text, controller) {
    const item = {
      kind: 'ability',
      uid: null,
      sourceUid,
      name: (this.inst(sourceUid) ? this.inst(sourceUid).name : 'Ability'),
      controller,
      text,
    };
    this.G.stack.push(item);
    this.logMsg(`${this.player(controller).name} activates an ability of ${item.name}.`);
    return item;
  },

  // Resolve the top stack item. Permanents enter the battlefield; instants and
  // sorceries go to the graveyard. The actual game effect is applied by the
  // players through the manipulation tools (manual resolution).
  resolveTop() {
    if (this.G.stack.length === 0) return;
    const item = this.G.stack.pop();
    if (item.kind === 'spell') {
      const inst = this.inst(item.uid);
      if (inst.card.isPermanent) {
        this.moveTo(item.uid, 'battlefield');
        this.logMsg(`${inst.name} resolves and enters the battlefield.`);
      } else {
        this.moveTo(item.uid, 'graveyard');
        this.logMsg(`${inst.name} resolves.`);
      }
    } else {
      this.logMsg(`Ability of ${item.name} resolves.`);
    }
  },

  counterTop() {
    if (this.G.stack.length === 0) return;
    const item = this.G.stack.pop();
    if (item.kind === 'spell') {
      this.moveTo(item.uid, 'graveyard');
      this.logMsg(`${item.name} is countered.`);
    } else {
      this.logMsg(`Ability of ${item.name} is countered/removed.`);
    }
  },

  // ---- play land ---------------------------------------------------------

  playLand(uid) {
    const inst = this.inst(uid);
    const p = this.player(inst.controller);
    this.moveTo(uid, 'battlefield');
    // Tapland detection.
    const txt = inst.card.oracle || '';
    if (/enters tapped(?!\s+unless)/i.test(txt)) inst.tapped = true;
    p.landPlayedThisTurn = true;
    this.logMsg(`${p.name} plays ${inst.name}.`);
  },

  // ---- turn structure ----------------------------------------------------

  beginPhase() {
    const phase = this.phaseName();
    const ap = this.G.active;
    if (phase === 'Untap') {
      this.untapStep(ap);
      this.advancePhase();   // auto-pass through untap
      return;
    }
    if (phase === 'Draw') {
      if (!(this.G.firstTurn && this.G.turn === 1)) this.draw(ap, 1);
    }
    if (phase === 'Cleanup') {
      this.cleanupStep(ap);
    }
  },

  untapStep(pi) {
    this.G.battlefield.forEach(uid => {
      const inst = this.inst(uid);
      if (inst.controller !== pi) return;
      // summoning sickness clears for creatures the player has controlled
      // since the start of this turn.
      if (this.isCreature(inst)) inst.summoningSick = false;
      if (inst.counters['stun'] > 0 && inst.tapped) {
        inst.counters['stun']--;
        if (inst.counters['stun'] === 0) delete inst.counters['stun'];
        this.logMsg(`${inst.name} stays tapped (stun counter removed).`);
      } else {
        inst.tapped = false;
      }
    });
    this.emptyPool(pi);
    this.logMsg(`--- ${this.player(pi).name}'s turn ${this.G.turn} ---`);
  },

  cleanupStep(pi) {
    // Remove "until end of turn" effects and reset damage.
    this.G.battlefield.forEach(uid => {
      const inst = this.inst(uid);
      inst.damage = 0;
      inst.tempP = 0; inst.tempT = 0; inst.tempKeywords = {};
    });
    this.G.players.forEach(p => { p.lifeGainedThisTurn = 0; });
  },

  advancePhase() {
    if (this.G.gameOver) return;
    // empty mana pools at end of each step
    this.emptyPool(this.G.active);
    this.emptyPool(this.opp(this.G.active));

    this.G.phaseIdx++;
    if (this.G.phaseIdx >= PHASES.length) {
      this.nextTurn();
      return;
    }
    this.beginPhase();
  },

  nextTurn() {
    this.G.phaseIdx = 0;
    this.G.active = this.opp(this.G.active);
    if (this.G.active === 0) this.G.turn++;
    this.G.firstTurn = false;
    this.player(this.G.active).landPlayedThisTurn = false;
    // clear combat flags
    this.G.battlefield.forEach(uid => {
      const inst = this.inst(uid);
      inst.attacking = false; inst.attackTarget = null;
      inst.blockingUid = null; inst.blockedByUids = [];
    });
    this.beginPhase();
  },

  goToPhase(name) {
    const idx = PHASES.indexOf(name);
    if (idx < 0) return;
    while (this.G.phaseIdx < idx && !this.G.gameOver) this.advancePhase();
  },

  // ---- combat ------------------------------------------------------------

  declareAttacker(uid, targetPlayer) {
    const inst = this.inst(uid);
    if (!this.canAttack(inst)) return false;
    inst.attacking = true;
    inst.attackTarget = targetPlayer;
    if (!this.hasKeyword(inst, 'vigilance')) inst.tapped = true;
    this.logMsg(`${inst.name} attacks ${this.player(targetPlayer).name}.`);
    return true;
  },

  canAttack(inst) {
    if (!this.isCreature(inst) || inst.zone !== 'battlefield') return false;
    if (inst.tapped) return false;
    if ((inst.counters['stun'] || 0) > 0) return false;
    if (inst.summoningSick && !this.hasKeyword(inst, 'haste')) return false;
    if (/can't attack/i.test(inst.card.oracle || '')) return false;
    return true;
  },

  unDeclareAttacker(uid) {
    const inst = this.inst(uid);
    inst.attacking = false; inst.attackTarget = null;
    if (!this.hasKeyword(inst, 'vigilance')) inst.tapped = false;
  },

  declareBlock(blockerUid, attackerUid) {
    const blocker = this.inst(blockerUid);
    const attacker = this.inst(attackerUid);
    if (!this.isCreature(blocker) || blocker.tapped) return false;
    blocker.blockingUid = attackerUid;
    if (!attacker.blockedByUids.includes(blockerUid)) attacker.blockedByUids.push(blockerUid);
    this.logMsg(`${blocker.name} blocks ${attacker.name}.`);
    return true;
  },

  unDeclareBlock(blockerUid) {
    const blocker = this.inst(blockerUid);
    const atk = this.inst(blocker.blockingUid);
    if (atk) atk.blockedByUids = atk.blockedByUids.filter(u => u !== blockerUid);
    blocker.blockingUid = null;
  },

  attackers() {
    return this.G.battlefield.map(u => this.inst(u)).filter(i => i.attacking);
  },

  // Resolve combat damage. Handles first/double strike, deathtouch, trample,
  // lifelink. Returns nothing; applies damage and runs state-based actions.
  combatDamage() {
    const atkrs = this.attackers();
    // Two passes: first-strike step, then normal step.
    const doStep = (firstStrikeStep) => {
      atkrs.forEach(atk => {
        const atkFS = this.hasKeyword(atk, 'first strike') || this.hasKeyword(atk, 'double strike');
        const atkDeals = firstStrikeStep ? atkFS : (!this.hasKeyword(atk, 'first strike') || this.hasKeyword(atk, 'double strike'));
        const blockers = atk.blockedByUids.map(u => this.inst(u)).filter(b => b && b.zone === 'battlefield');
        if (blockers.length === 0) {
          // unblocked → hit player (only if not blocked at all)
          if (atk.blockedByUids.length === 0 && atkDeals) {
            const dmg = Math.max(0, this.power(atk));
            if (dmg > 0) {
              this.loseLife(atk.attackTarget, dmg);
              this.dealLifelink(atk, dmg);
            }
          }
          return;
        }
        // blocked
        if (atkDeals) {
          let remaining = Math.max(0, this.power(atk));
          const deathtouch = this.hasKeyword(atk, 'deathtouch');
          for (const b of blockers) {
            if (remaining <= 0) break;
            const lethal = deathtouch ? 1 : Math.max(1, this.toughness(b) - b.damage);
            const assign = Math.min(remaining, lethal);
            b.damage += assign;
            remaining -= assign;
            this.dealLifelink(atk, assign);
          }
          if (this.hasKeyword(atk, 'trample') && remaining > 0) {
            this.loseLife(atk.attackTarget, remaining);
            this.dealLifelink(atk, remaining);
          }
        }
        // blockers deal to attacker
        blockers.forEach(b => {
          const bFS = this.hasKeyword(b, 'first strike') || this.hasKeyword(b, 'double strike');
          const bDeals = firstStrikeStep ? bFS : (!this.hasKeyword(b, 'first strike') || this.hasKeyword(b, 'double strike'));
          if (bDeals) {
            const dmg = Math.max(0, this.power(b));
            atk.damage += dmg;
            this.dealLifelink(b, dmg);
          }
        });
      });
    };

    const anyFirstStrike = atkrs.some(a => this.hasKeyword(a, 'first strike') || this.hasKeyword(a, 'double strike')) ||
      atkrs.some(a => a.blockedByUids.some(u => { const b = this.inst(u); return b && (this.hasKeyword(b, 'first strike') || this.hasKeyword(b, 'double strike')); }));
    if (anyFirstStrike) { doStep(true); this.stateBasedActions(); }
    doStep(false);
    this.stateBasedActions();
    this.logMsg('Combat damage dealt.');
  },

  dealLifelink(inst, amount) {
    if (this.hasKeyword(inst, 'lifelink') && amount > 0) {
      this.gainLife(inst.controller, amount);
    }
  },

  // State-based actions: creatures with lethal damage or 0 toughness die.
  stateBasedActions() {
    const dying = [];
    this.G.battlefield.forEach(uid => {
      const inst = this.inst(uid);
      if (!this.isCreature(inst)) return;
      const tough = this.toughness(inst);
      if (tough <= 0) dying.push(uid);
      else if (inst.damage >= tough && !this.hasKeyword(inst, 'indestructible')) dying.push(uid);
    });
    dying.forEach(uid => {
      this.logMsg(`${this.inst(uid).name} dies.`);
      this.moveTo(uid, 'graveyard');
    });
    this.checkLife();
  },

  // ---- counters ----------------------------------------------------------

  addCounter(uid, kind, n = 1) {
    const inst = this.inst(uid);
    inst.counters[kind] = (inst.counters[kind] || 0) + n;
    if (inst.counters[kind] <= 0) delete inst.counters[kind];
    if (kind === 'stun' && inst.counters['stun'] > 0 && !inst.tapped) {
      // stun counters typically come with a tap; UI handles tapping separately.
    }
  },

  // ---- logging -----------------------------------------------------------

  logMsg(msg) {
    this.log.push(msg);
    if (this.log.length > 300) this.log.shift();
  },
};
