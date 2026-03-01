/* ═══════════════════════════════════════════════════════════
   Hearts & Mana — Game Engine  (v2)

   New in v2:
   • Colored mana system (W/U/B/R/G pips must be paid correctly)
   • Summoning sickness (creatures can't attack the turn they enter)
   • Multiple blockers per attacker; attacker assigns damage in order
   • AI won't suicide-attack into favorable blockers
   • Priority window: player can counter AI non-creature spells
   • Risqué card stat checks with immediate relationship changes
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   UID generator
   ───────────────────────────────────────────────────────────── */
let _uidCounter = 0;
function uid() { return 'p' + (++_uidCounter); }

/* ─────────────────────────────────────────────────────────────
   ENGINE
   ───────────────────────────────────────────────────────────── */
const Engine = {

    /* ── State ──────────────────────────────────────────────── */
    state: null,
    characterStats: null,   // live relationship stats for risqué checks
    callbacks: {
        onLog:      () => {},
        onReaction: () => {},
        onRender:   () => {},
        onGameOver: () => {},
        onRisque:   () => {},
    },

    /* ── Init ───────────────────────────────────────────────── */
    init(playerDeckId, characterId, callbacks, characterStats) {
        this.callbacks = { ...this.callbacks, ...callbacks };
        this.characterStats = characterStats ? { ...characterStats } : { ...CHARACTERS[characterId].initialStats };

        const character    = CHARACTERS[characterId];
        const playerDeckDef = DECKS[playerDeckId];
        const oppDeckDef    = DECKS[character.deckId];

        this.state = {
            turn: 1,
            phase: 'main',
            gameOver: false,
            winner: null,
            characterId,

            player:   this._buildPlayerState('player',   playerDeckDef.cards),
            opponent: this._buildPlayerState('opponent', oppDeckDef.cards),

            combat: {
                attackers:   [],    // UIDs of attacking creatures
                blockerMap:  {},    // { attackerUID: string[] }  — multiple blockers per attacker
                pendingBlocker: null,
            },

            targeting: {
                active: false,
                cardUID: null,
                cardId: null,
                effect: null,
                validTargets: [],
                callback: null,
            },

            priorityWindow: {
                active: false,
                aiSpellName: null,
                aiSpellArt: null,
                aiSpellEffect: null,
                counterspells: [],  // player hand instances with FX.COUNTER_SPELL
                resolve: null,      // fn to resolve the AI spell
                callCount: 0,
                done: null,
            },

            stack: [],
            enchantments: [],

            metrics: {
                directDamage: 0,
                creaturesPlayed: 0,
                spellsCast: 0,
                lifeGained: 0,
                cardsDrawn: 0,
                removalsUsed: 0,
                counterspells: 0,
                colors: { W:0, U:0, B:0, R:0, G:0 },
            },
        };

        for (let i = 0; i < 7; i++) {
            this._drawCard('player', true);
            this._drawCard('opponent', true);
        }

        this.callbacks.onLog('A new duel begins.', 'system');
        this.callbacks.onRender(this.state);
        this._updatePhaseUI();
    },

    _buildPlayerState(role, deckCardIds) {
        const library = this._buildLibrary(deckCardIds);
        this._shuffle(library);
        return {
            role,
            life: 20,
            hand: [],
            battlefield: [],
            graveyard: [],
            library,
            landPlayedThisTurn: false,
            hasDrawnThisTurn: false,
        };
    },

    _buildLibrary(cardIds) {
        return cardIds.map(id => ({ uid: uid(), cardId: id }));
    },

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    /* ── Card lookup ─────────────────────────────────────────── */
    _card(cardId) { return CARDS[cardId]; },
    _cardOfInstance(inst) { return CARDS[inst.cardId]; },

    /* ── Mana ────────────────────────────────────────────────── */

    /** Returns { W:n, U:n, ... } counts of untapped colored lands */
    _getManaPool(role) {
        const pool = { W: 0, U: 0, B: 0, R: 0, G: 0 };
        for (const p of this.state[role].battlefield) {
            if (p.tapped) continue;
            const c = this._card(p.cardId);
            if (c && c.type === 'land' && c.color) {
                pool[c.color] = (pool[c.color] || 0) + 1;
            }
        }
        return pool;
    },

    /** Total untapped lands (generic mana for display) */
    getAvailableMana(role) {
        return this.state[role].battlefield.filter(p => {
            const c = this._card(p.cardId);
            return c && c.type === 'land' && !p.tapped;
        }).length;
    },

    /** Can the role afford the given cost object? */
    canAfford(role, cost) {
        if (!cost || (typeof cost === 'object' && Object.keys(cost).length === 0)) return true;
        if (typeof cost === 'number') return this.getAvailableMana(role) >= cost;

        const pool = this._getManaPool(role);
        let poolTotal = Object.values(pool).reduce((a, b) => a + b, 0);

        // Check colored pips first
        for (const [color, needed] of Object.entries(cost)) {
            if (color === 'c') continue;
            if ((pool[color] || 0) < needed) return false;
            pool[color] -= needed;
            poolTotal -= needed;
        }
        return poolTotal >= (cost.c || 0);
    },

    _spendMana(role, cost) {
        if (!cost || (typeof cost === 'object' && Object.keys(cost).length === 0)) return;
        const bf = this.state[role].battlefield;

        if (typeof cost === 'number') {
            let spent = 0;
            for (const p of bf) {
                if (spent >= cost) break;
                const c = this._card(p.cardId);
                if (c && c.type === 'land' && !p.tapped) { p.tapped = true; spent++; }
            }
            return;
        }

        // Spend colored pips first (tap matching lands)
        for (const [color, needed] of Object.entries(cost)) {
            if (color === 'c') continue;
            let remaining = needed;
            for (const p of bf) {
                if (remaining <= 0) break;
                if (p.tapped) continue;
                const c = this._card(p.cardId);
                if (c && c.type === 'land' && c.color === color) { p.tapped = true; remaining--; }
            }
        }

        // Spend generic (any remaining untapped land)
        let generic = cost.c || 0;
        for (const p of bf) {
            if (generic <= 0) break;
            if (p.tapped) continue;
            const c = this._card(p.cardId);
            if (c && c.type === 'land') { p.tapped = true; generic--; }
        }
    },

    /* ── Drawing ─────────────────────────────────────────────── */
    _drawCard(role, silent = false) {
        const ps = this.state[role];
        if (ps.library.length === 0) {
            this.callbacks.onLog(`${role === 'player' ? 'You' : 'They'} tried to draw from an empty library!`, 'system');
            return null;
        }
        const card = ps.library.shift();
        ps.hand.push(card);
        if (!silent) {
            if (role === 'player') {
                this.callbacks.onLog(`You draw ${this._card(card.cardId).name}.`, 'player');
                this.state.metrics.cardsDrawn++;
            } else {
                this.callbacks.onLog(`${CHARACTERS[this.state.characterId].name} draws a card.`, 'opponent');
            }
        }
        return card;
    },

    /* ── Playing Cards ───────────────────────────────────────── */
    canPlay(role, handUID) {
        const ps = this.state[role];
        const inst = ps.hand.find(h => h.uid === handUID);
        if (!inst) return false;
        const c = this._card(inst.cardId);

        if (this.state.gameOver) return false;
        if (this.state.priorityWindow.active) return false;
        if (this.state.phase === 'opp_turn') return false;

        if (c.type === 'land') {
            return !ps.landPlayedThisTurn && this.state.phase === 'main';
        }
        if (c.type === 'sorcery' || c.type === 'enchantment' || c.type === 'creature') {
            if (this.state.phase !== 'main') return false;
        }
        return this.canAfford(role, c.cost);
    },

    playCard(handUID) {
        if (this.state.gameOver) return;
        if (this.state.priorityWindow.active) return;
        if (this.state.phase === 'opp_turn') return;

        const ps = this.state.player;
        const instIdx = ps.hand.findIndex(h => h.uid === handUID);
        if (instIdx === -1) return;

        const inst = ps.hand[instIdx];
        const c = this._card(inst.cardId);

        if (!this.canPlay('player', handUID)) return;

        // Land — no cost, no stack
        if (c.type === 'land') {
            ps.hand.splice(instIdx, 1);
            ps.landPlayedThisTurn = true;
            const perm = this._makePermanent(inst, 'player');
            ps.battlefield.push(perm);
            this.callbacks.onLog(`You play ${c.name}.`, 'player');
            this.callbacks.onRender(this.state);
            return;
        }

        // Track color metric
        if (c.color && c.color !== 'C') {
            this.state.metrics.colors[c.color] = (this.state.metrics.colors[c.color] || 0) + 1;
        }

        // Targeted spells: validate targets BEFORE paying mana
        if (this._needsTarget(c)) {
            const validTargets = this._getValidTargets(c, 'player');
            if (validTargets.length === 0) {
                this.callbacks.onLog(`No valid targets for ${c.name}.`, 'system');
                return;
            }
            this._spendMana('player', c.cost);
            ps.hand.splice(instIdx, 1);
            this.state.metrics.spellsCast++;
            this.state.targeting = {
                active: true,
                cardUID: inst.uid,
                cardId: inst.cardId,
                effect: c.effect,
                validTargets,
                callback: (targetUID) => {
                    this.state.targeting.active = false;
                    this.callbacks.onRender(this.state);
                    ps.graveyard.push({ uid: inst.uid, cardId: inst.cardId });
                    this._resolveEffect(c, 'player', targetUID);
                    if (c.extraEffect) this._resolveExtraEffect(c, 'player', null);
                    this._checkRisque(c);
                    this._checkWin();
                    this.callbacks.onRender(this.state);
                    this._triggerReaction(c);
                },
            };
            this.callbacks.onRender(this.state);
            return;
        }

        // Non-targeted spell
        this._spendMana('player', c.cost);
        ps.hand.splice(instIdx, 1);
        this.state.metrics.spellsCast++;

        if (c.type === 'creature') {
            this.state.metrics.creaturesPlayed++;
            const perm = this._makePermanent(inst, 'player');
            this._applyEnchantmentsToPermanent(perm);
            ps.battlefield.push(perm);
            this.callbacks.onLog(`You play ${c.name} (${c.power}/${c.toughness}).`, 'player');
            if (c.effect === FX.ETB_DRAW)      this._doDrawCards('player', c.effectValue);
            if (c.effect === FX.ETB_GAIN_LIFE) this._doGainLife('player', c.effectValue);
            this._checkRisque(c);
            this._checkWin();
            this.callbacks.onRender(this.state);
            this._triggerReaction(c);
            return;
        }

        if (c.type === 'enchantment') {
            const perm = this._makePermanent(inst, 'player');
            ps.battlefield.push(perm);
            this.callbacks.onLog(`You enchant with ${c.name}.`, 'player');
            this._resolveEffect(c, 'player', null);
            this._checkRisque(c);
            this._checkWin();
            this.callbacks.onRender(this.state);
            this._triggerReaction(c);
            return;
        }

        // No-target sorcery / instant
        ps.graveyard.push({ uid: inst.uid, cardId: inst.cardId });
        this._resolveEffect(c, 'player', null);
        if (c.extraEffect) this._resolveExtraEffect(c, 'player', null);
        this._checkRisque(c);
        this._checkWin();
        this.callbacks.onRender(this.state);
        this._triggerReaction(c);
    },

    confirmTarget(targetUID) {
        if (!this.state.targeting.active) return;
        this.state.targeting.callback(targetUID);
        this.state.targeting.active = false;
    },

    cancelTargeting() {
        if (!this.state.targeting.active) return;
        this.state.targeting.active = false;
        this.callbacks.onLog('Targeting cancelled.', 'system');
        this.callbacks.onRender(this.state);
    },

    /* ── Risqué check ────────────────────────────────────────── */
    _checkRisque(c) {
        if (!c.risque) return;
        const r = c.risque;
        const statVal = this.characterStats ? (this.characterStats[r.stat] || 0) : 50;
        const passes  = r.dir === 'above' ? statVal >= r.thresh : statVal <= r.thresh;
        const outcome = passes ? 'win' : 'lose';
        const changes = r[outcome];

        // Update live characterStats immediately
        if (this.characterStats) {
            for (const stat of ['love', 'attraction', 'inhibition', 'control']) {
                if (changes[stat]) {
                    this.characterStats[stat] = Math.max(0, Math.min(100,
                        Math.round((this.characterStats[stat] + changes[stat]) * 10) / 10
                    ));
                }
            }
        }

        this.callbacks.onRisque(c.id, outcome, changes, r);
    },

    /* ── Permanents ──────────────────────────────────────────── */
    _makePermanent(inst, controller) {
        const c = this._card(inst.cardId);
        const isCreature = c && c.type === 'creature';
        const hasHaste   = isCreature && c.keywords && c.keywords.includes('haste');
        return {
            uid: inst.uid,
            cardId: inst.cardId,
            controller,
            type: c ? c.type : 'creature',
            tapped: false,
            damage: 0,
            tempPowerBuff: 0,
            tempToughBuff: 0,
            gainedHaste: false,
            powerBuff: 0,
            toughBuff: 0,
            sick: isCreature && !hasHaste,  // summoning sickness; cleared at start of controller's turn
        };
    },

    getPower(perm) {
        if (perm.isToken) return (perm.tokenPower    || 0) + perm.powerBuff + perm.tempPowerBuff;
        const c = this._card(perm.cardId);
        return ((c && c.power) || 0) + perm.powerBuff + perm.tempPowerBuff;
    },

    getToughness(perm) {
        if (perm.isToken) return (perm.tokenToughness || 0) + perm.toughBuff + perm.tempToughBuff;
        const c = this._card(perm.cardId);
        return ((c && c.toughness) || 0) + perm.toughBuff + perm.tempToughBuff;
    },

    /* ── Enchantment buffs ───────────────────────────────────── */
    _applyEnchantmentsToPermanent(perm) {
        if (!perm.isToken) {
            const pc = this._card(perm.cardId);
            if (!pc || pc.type !== 'creature') return;
        }
        for (const e of this.state.enchantments) {
            if (e.controller === perm.controller) {
                const ec = this._card(e.cardId);
                if (ec && ec.effect === FX.ENCHANT_ALL_BUFF) {
                    perm.powerBuff += ec.effectValue[0];
                    perm.toughBuff += ec.effectValue[1];
                }
            }
        }
    },

    /* ── Effect resolution ───────────────────────────────────── */
    _needsTarget(c) {
        return c.effectTarget && c.effectTarget !== 'none'
            && c.effectTarget !== 'opponent' && c.effectTarget !== 'spell';
    },

    _getValidTargets(c, casterRole) {
        const oppRole = casterRole === 'player' ? 'opponent' : 'player';
        const isCreature = (p) => p.isToken || (this._card(p.cardId) && this._card(p.cardId).type === 'creature');
        const isNonLand  = (p) => {
            if (p.isToken) return true;
            const pc = this._card(p.cardId);
            return !pc || pc.type !== 'land';
        };
        switch (c.effectTarget) {
            case 'any':
                return [
                    ...this.state[oppRole].battlefield.filter(isCreature).map(p => p.uid),
                    ...this.state[casterRole].battlefield.filter(isCreature).map(p => p.uid),
                    '__opponent_player__', '__player_player__',
                ];
            case 'creature':
                return [
                    ...this.state[oppRole].battlefield.filter(isCreature).map(p => p.uid),
                    ...this.state[casterRole].battlefield.filter(isCreature).map(p => p.uid),
                ];
            case 'opp_creature':
                return this.state[oppRole].battlefield.filter(isCreature).map(p => p.uid);
            case 'your_creature':
                return this.state[casterRole].battlefield.filter(isCreature).map(p => p.uid);
            case 'any_permanent':
                return [
                    ...this.state[oppRole].battlefield.filter(isNonLand).map(p => p.uid),
                    ...this.state[casterRole].battlefield.filter(isNonLand).map(p => p.uid),
                ];
            default:
                return [];
        }
    },

    _findPermanent(permUID) {
        for (const role of ['player', 'opponent']) {
            const p = this.state[role].battlefield.find(p => p.uid === permUID);
            if (p) return { perm: p, role };
        }
        return null;
    },

    _resolveEffect(c, casterRole, targetUID) {
        const oppRole = casterRole === 'player' ? 'opponent' : 'player';

        switch (c.effect) {
            case FX.GAIN_LIFE:
                this._doGainLife(casterRole, c.effectValue);
                break;

            case FX.LOSE_LIFE_DRAW:
                this._doGainLife(casterRole, -c.effectValue);
                this._doDrawCards(casterRole, c.effectValue);
                break;

            case FX.DRAW_CARDS:
                this._doDrawCards(casterRole, c.effectValue);
                break;

            case FX.DRAW_SHARED:
                this._doDrawCards(casterRole, c.effectValue);
                this._doDrawCards(oppRole, c.effectValue);
                this._doGainLife(casterRole, c.effectValue);
                this._doGainLife(oppRole, c.effectValue);
                break;

            case FX.SCRY_DRAW:
                // Simplified scry: look at top N (not shown), then draw 1
                this.callbacks.onLog(`You scry ${c.effectValue}, then draw 1.`, casterRole);
                this._doDrawCards(casterRole, 1);
                break;

            case FX.DEAL_DAMAGE_ANY:
            case FX.DEAL_DAMAGE_CREATURE:
                if (targetUID === '__opponent_player__' || targetUID === '__opp__') {
                    this._doDamageToPlayer(oppRole, c.effectValue, casterRole);
                } else if (targetUID === '__player_player__') {
                    this._doDamageToPlayer(casterRole, c.effectValue, casterRole);
                } else if (targetUID) {
                    this._doDamageToCreature(targetUID, c.effectValue, casterRole);
                }
                break;

            case FX.DEAL_DAMAGE_PLAYER:
                this._doDamageToPlayer(oppRole, c.effectValue, casterRole);
                break;

            case FX.DESTROY_CREATURE:
            case FX.DESTROY_NONLAND:
                if (targetUID) this._destroyPermanent(targetUID, casterRole);
                break;

            case FX.OPPONENT_DISCARD:
                this._doOpponentDiscard(oppRole, c.effectValue);
                if (casterRole === 'player') this.state.metrics.removalsUsed++;
                break;

            case FX.COUNTER_SPELL:
                this.callbacks.onLog(
                    `${casterRole === 'player' ? 'You counter' : 'They counter'} the spell.`, casterRole
                );
                if (casterRole === 'player') this.state.metrics.counterspells++;
                break;

            case FX.BUFF_CREATURE_EOT:
                if (targetUID) {
                    const res = this._findPermanent(targetUID);
                    if (res) {
                        const [pw, tg] = Array.isArray(c.effectValue) ? c.effectValue : [0, c.effectValue];
                        res.perm.tempPowerBuff += pw;
                        res.perm.tempToughBuff += tg;
                        const n = res.perm.isToken ? 'Token' : (this._card(res.perm.cardId) || {}).name || '?';
                        this.callbacks.onLog(`${n} gets +${pw}/+${tg} until end of turn.`, casterRole);
                    }
                }
                break;

            case FX.PUMP_ALL_EOT:
                for (const p of this.state[casterRole].battlefield) {
                    if (p.isToken || (this._card(p.cardId) && this._card(p.cardId).type === 'creature')) {
                        p.tempPowerBuff += c.effectValue;
                        p.gainedHaste = true;
                    }
                }
                this.callbacks.onLog(`All your creatures get +${c.effectValue}/+0 and haste until end of turn.`, casterRole);
                break;

            case FX.ENCHANT_ALL_BUFF:
                this.state.enchantments.push({ uid: uid(), cardId: c.id, controller: casterRole });
                for (const p of this.state[casterRole].battlefield) {
                    if (p.isToken || (this._card(p.cardId) && this._card(p.cardId).type === 'creature')) {
                        p.powerBuff += c.effectValue[0];
                        p.toughBuff += c.effectValue[1];
                    }
                }
                this.callbacks.onLog(`${c.name} enchants your side — all creatures get +1/+1.`, casterRole);
                break;

            case FX.CREATE_TOKENS: {
                for (let i = 0; i < c.effectValue; i++) {
                    this.state[casterRole].battlefield.push({
                        uid: uid(), cardId: '__token__', controller: casterRole,
                        type: 'creature', tapped: false, damage: 0,
                        tempPowerBuff: 0, tempToughBuff: 0, gainedHaste: false,
                        powerBuff: 0, toughBuff: 0,
                        isToken: true, sick: false,
                        tokenPower: 2, tokenToughness: 2,
                        tokenArt: '🌸', tokenName: 'Bloom Token',
                    });
                }
                this.callbacks.onLog(`You create ${c.effectValue} 2/2 tokens.`, casterRole);
                break;
            }

            case FX.ETB_DRAW:
            case FX.ETB_GAIN_LIFE:
                // Handled at creature play time
                break;

            default:
                break;
        }
    },

    _resolveExtraEffect(c, casterRole) {
        if (!c.extraEffect) return;
        if (c.extraEffect === FX.DRAW_CARDS) this._doDrawCards(casterRole, c.extraEffectValue);
    },

    /* ── Damage helpers ──────────────────────────────────────── */
    _doDamageToPlayer(role, amount, sourceRole) {
        this.state[role].life = Math.max(0, this.state[role].life - amount);
        this.callbacks.onLog(
            `${role === 'player' ? 'You take' : 'They take'} ${amount} damage. (${this.state[role].life} life)`,
            sourceRole === 'player' ? 'damage' : 'opponent'
        );
        if (sourceRole === 'player') this.state.metrics.directDamage += amount;
        this._flashLifeOrb(role);
    },

    _doDamageToCreature(permUID, amount, sourceRole) {
        const res = this._findPermanent(permUID);
        if (!res) return;
        const { perm } = res;
        perm.damage += amount;
        const name = perm.isToken ? (perm.tokenName || 'Token') : (this._card(perm.cardId) || {}).name || '?';
        this.callbacks.onLog(`${name} takes ${amount} damage.`, sourceRole);
        if (sourceRole === 'player') this.state.metrics.directDamage += amount;
        this._checkLethalDamage(perm, res.role);
    },

    _flashLifeOrb(role) {
        const id = role === 'player' ? 'player-life-display' : 'opp-life-display';
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('damage-flash');
            setTimeout(() => el.classList.remove('damage-flash'), 500);
        }
    },

    _doGainLife(role, amount) {
        if (amount > 0) {
            this.state[role].life = Math.min(999, this.state[role].life + amount);
            this.callbacks.onLog(
                `${role === 'player' ? 'You gain' : 'They gain'} ${amount} life. (${this.state[role].life})`,
                role === 'player' ? 'player' : 'opponent'
            );
            if (role === 'player') this.state.metrics.lifeGained += amount;
        } else if (amount < 0) {
            this._doDamageToPlayer(role, -amount, role);
        }
    },

    _doDrawCards(role, n) {
        for (let i = 0; i < n; i++) this._drawCard(role);
    },

    _doOpponentDiscard(oppRole, n) {
        for (let i = 0; i < n && this.state[oppRole].hand.length > 0; i++) {
            const discarded = this.state[oppRole].hand.shift();
            this.state[oppRole].graveyard.push(discarded);
            const name = (this._card(discarded.cardId) || {}).name || '?';
            this.callbacks.onLog(
                `${oppRole === 'player' ? 'You discard' : 'They discard'} ${name}.`, oppRole
            );
        }
    },

    /* ── Destruction / death ─────────────────────────────────── */
    _destroyPermanent(permUID, sourceRole) {
        for (const role of ['player', 'opponent']) {
            const idx = this.state[role].battlefield.findIndex(p => p.uid === permUID);
            if (idx !== -1) {
                const perm = this.state[role].battlefield[idx];
                const c = this._card(perm.cardId);
                this.state[role].battlefield.splice(idx, 1);
                if (!perm.isToken) this.state[role].graveyard.push({ uid: perm.uid, cardId: perm.cardId });
                this.callbacks.onLog(`${c ? c.name : 'Token'} is destroyed.`, sourceRole);
                if (sourceRole === 'player') this.state.metrics.removalsUsed++;
                if (c && c.effect === FX.DIES_DEAL_DAMAGE) {
                    this._doDamageToPlayer(role === 'player' ? 'opponent' : 'player', c.effectValue, role);
                }
                return;
            }
        }
    },

    _checkLethalDamage(perm, role) {
        const tough = this.getToughness(perm);
        const c = this._card(perm.cardId);
        if (perm.damage >= tough) {
            const idx = this.state[role].battlefield.indexOf(perm);
            if (idx !== -1) {
                this.state[role].battlefield.splice(idx, 1);
                if (!perm.isToken) this.state[role].graveyard.push({ uid: perm.uid, cardId: perm.cardId });
                this.callbacks.onLog(`${c ? c.name : 'Token'} is destroyed by damage.`, 'system');
                if (c && c.effect === FX.DIES_DEAL_DAMAGE) {
                    this._doDamageToPlayer(role === 'player' ? 'opponent' : 'player', c.effectValue, role);
                }
            }
        }
    },

    /* ── Win check ───────────────────────────────────────────── */
    _checkWin() {
        if (this.state.gameOver) return;
        if (this.state.player.life <= 0)   this._endGame('opponent');
        else if (this.state.opponent.life <= 0) this._endGame('player');
    },

    _endGame(winner) {
        this.state.gameOver = true;
        this.state.winner = winner;
        this.callbacks.onLog(winner === 'player' ? '✦ You win!' : '✦ They win!', 'system');
        this.callbacks.onRender(this.state);
        setTimeout(() => {
            const metrics = { ...this.state.metrics, won: winner === 'player' };
            this.callbacks.onGameOver(metrics, this.state);
        }, 1200);
    },

    /* ── Turn management ─────────────────────────────────────── */
    beginPlayerTurn() {
        const ps = this.state.player;
        this.state.phase = 'main';
        this.state.turn++;
        ps.landPlayedThisTurn = false;

        // Untap all player permanents + clear summoning sickness
        for (const p of ps.battlefield) {
            p.tapped = false;
            p.gainedHaste = false;
            p.sick = false;
        }

        this._drawCard('player');
        this.callbacks.onLog(`Turn ${this.state.turn} — your turn.`, 'system');
        this.callbacks.onRender(this.state);
        this._updatePhaseUI();
    },

    endPlayerTurn() {
        if (this.state.phase === 'opp_turn' || this.state.gameOver) return;

        // Clear EOT buffs
        for (const p of this.state.player.battlefield) {
            p.tempPowerBuff = 0;
            p.tempToughBuff = 0;
        }

        this.state.combat = { attackers: [], blockerMap: {}, pendingBlocker: null };
        this.callbacks.onLog('Your turn ends.', 'system');
        this.state.phase = 'opp_turn';
        this.callbacks.onRender(this.state);
        this._updatePhaseUI();

        setTimeout(() => this._aiTurn(), 900);
    },

    /* ── Combat: player attacks ──────────────────────────────── */
    enterAttackPhase() {
        if (this.state.phase !== 'main' || this.state.gameOver) return;
        this.state.phase = 'attack_declare';
        this.callbacks.onLog('Select attackers, then confirm.', 'system');
        this.callbacks.onRender(this.state);
        this._updatePhaseUI();
    },

    toggleAttacker(permUID) {
        if (this.state.phase !== 'attack_declare') return;
        const perm = this.state.player.battlefield.find(p => p.uid === permUID);
        if (!perm) return;

        const c = this._card(perm.cardId);
        const isCreatureOrToken = perm.isToken || (c && c.type === 'creature');
        if (!isCreatureOrToken || perm.tapped) return;

        // Summoning sickness check
        const hasHaste = (c && c.keywords && c.keywords.includes('haste')) || perm.gainedHaste;
        if (perm.sick && !hasHaste) {
            this.callbacks.onLog('That creature has summoning sickness and cannot attack yet.', 'system');
            return;
        }

        const idx = this.state.combat.attackers.indexOf(permUID);
        if (idx === -1) this.state.combat.attackers.push(permUID);
        else this.state.combat.attackers.splice(idx, 1);
        this.callbacks.onRender(this.state);
    },

    confirmAttackers() {
        if (this.state.phase !== 'attack_declare') return;
        const attackers = this.state.combat.attackers;

        if (attackers.length === 0) {
            this.state.phase = 'main';
            this.callbacks.onRender(this.state);
            this._updatePhaseUI();
            return;
        }

        // Tap non-vigilance attackers
        for (const aUID of attackers) {
            const perm = this.state.player.battlefield.find(p => p.uid === aUID);
            if (!perm) continue;
            const c = this._card(perm.cardId);
            if (!c || !c.keywords.includes('vigilance')) perm.tapped = true;
        }

        const names = attackers.map(aUID => {
            const p = this.state.player.battlefield.find(p => p.uid === aUID);
            if (!p) return '?';
            return p.isToken ? (p.tokenName || 'Token') : (this._card(p.cardId) || {}).name || '?';
        });
        this.callbacks.onLog(`You attack with: ${names.join(', ')}.`, 'player');

        this._aiAssignBlockers(attackers);
    },

    /* ── AI assigns blockers for player attack ───────────────── */
    _aiAssignBlockers(attackerUIDs) {
        const oppCreatures = this.state.opponent.battlefield.filter(p => {
            const c = this._card(p.cardId);
            return (p.isToken || (c && c.type === 'creature')) && !p.tapped && !p.sick;
        });

        const blockerMap = {};
        const usedBlockers = new Set();

        for (const aUID of attackerUIDs) {
            const attacker = this.state.player.battlefield.find(p => p.uid === aUID);
            if (!attacker) { blockerMap[aUID] = []; continue; }

            const aPow  = this.getPower(attacker);
            const aTgh  = this.getToughness(attacker);
            const aCard = this._card(attacker.cardId);
            const aHasDT = !attacker.isToken && aCard && aCard.keywords && aCard.keywords.includes('deathtouch');

            let chosen = null;
            for (const blocker of oppCreatures) {
                if (usedBlockers.has(blocker.uid)) continue;
                const bPow  = this.getPower(blocker);
                const bTgh  = this.getToughness(blocker);
                const bCard = this._card(blocker.cardId);
                const bHasDT = !blocker.isToken && bCard && bCard.keywords && bCard.keywords.includes('deathtouch');

                const attackerDies = bHasDT ? bPow > 0 : bPow >= aTgh;
                const blockerDies  = aHasDT ? aPow > 0 : aPow >= bTgh;

                if (attackerDies) {
                    chosen = blocker;
                    if (!blockerDies) break; // favorable for AI (blocker survives)
                }
            }
            blockerMap[aUID] = chosen ? [chosen.uid] : [];
            if (chosen) usedBlockers.add(chosen.uid);
        }

        this.state.combat.blockerMap = blockerMap;
        this.state.phase = 'damage';
        this.callbacks.onRender(this.state);
        setTimeout(() => this._resolveCombat('player'), 600);
    },

    /* ── Player assigns blockers for AI attack ───────────────── */
    confirmBlockers(noBlock = false) {
        if (this.state.phase !== 'block_declare') return;
        if (noBlock) {
            for (const aUID of this.state.combat.attackers) {
                this.state.combat.blockerMap[aUID] = [];
            }
        }
        this.state.phase = 'damage';
        document.getElementById('blocker-overlay').classList.add('hidden');
        this.callbacks.onRender(this.state);
        setTimeout(() => this._resolveCombat('opponent'), 400);
    },

    /** Toggle a blocker on/off for an attacker; enforces one-blocker-per-creature */
    toggleBlocker(attackerUID, blockerUID) {
        if (!Array.isArray(this.state.combat.blockerMap[attackerUID])) {
            this.state.combat.blockerMap[attackerUID] = [];
        }
        // Remove this blocker from any other attacker first
        for (const [aUID, blockers] of Object.entries(this.state.combat.blockerMap)) {
            if (aUID === attackerUID) continue;
            const idx = blockers.indexOf(blockerUID);
            if (idx !== -1) blockers.splice(idx, 1);
        }
        const arr = this.state.combat.blockerMap[attackerUID];
        const idx = arr.indexOf(blockerUID);
        if (idx === -1) arr.push(blockerUID);
        else arr.splice(idx, 1);

        this._renderBlockerOverlay();
        this.callbacks.onRender(this.state);
    },

    /* ── Combat damage resolution ────────────────────────────── */
    _resolveCombat(attackingRole) {
        const defendingRole = attackingRole === 'player' ? 'opponent' : 'player';
        const attackerUIDs  = this.state.combat.attackers;

        const firstStrikeAttackers = attackerUIDs.filter(aUID => {
            const p = this.state[attackingRole].battlefield.find(p => p.uid === aUID);
            if (!p || p.isToken) return false;
            const c = this._card(p.cardId);
            return c && c.keywords && c.keywords.includes('first_strike');
        });
        const normalAttackers = attackerUIDs.filter(aUID => {
            const p = this.state[attackingRole].battlefield.find(p => p.uid === aUID);
            if (!p) return false;
            if (p.isToken) return true;
            const c = this._card(p.cardId);
            return !c || !c.keywords || !c.keywords.includes('first_strike');
        });

        this._combatDamagePass(firstStrikeAttackers, attackingRole, defendingRole, true);
        this._combatDamagePass(normalAttackers,      attackingRole, defendingRole, false);

        this._checkWin();
        this._cleanupCombat();
        if (this.state.gameOver) return;

        if (attackingRole === 'player') {
            this.state.phase = 'main';
            this.callbacks.onLog('Combat ends.', 'system');
            this.callbacks.onRender(this.state);
            this._updatePhaseUI();
        } else {
            this.callbacks.onLog('Combat ends.', 'system');
            this.callbacks.onRender(this.state);
            setTimeout(() => this._aiPostCombat(), 400);
        }
    },

    _combatDamagePass(attackerUIDs, attackingRole, defendingRole, isFirstStrike) {
        for (const aUID of attackerUIDs) {
            const attacker = this.state[attackingRole].battlefield.find(p => p.uid === aUID);
            if (!attacker) continue;

            const aCard       = this._card(attacker.cardId);
            const aHasDT      = !attacker.isToken && aCard && aCard.keywords && aCard.keywords.includes('deathtouch');
            const aHasLifelink= !attacker.isToken && aCard && aCard.keywords && aCard.keywords.includes('lifelink');
            const aHasTrample = !attacker.isToken && aCard && aCard.keywords && aCard.keywords.includes('trample');
            const aName       = attacker.isToken ? (attacker.tokenName || 'Token') : (aCard ? aCard.name : '?');
            const blockerUIDs = this.state.combat.blockerMap[aUID] || [];

            if (blockerUIDs.length === 0) {
                // Unblocked — deal full damage to defending player
                const aPow = this.getPower(attacker);
                this._doDamageToPlayer(defendingRole, aPow, attackingRole);
                if (aHasLifelink) this._doGainLife(attackingRole, aPow);
                continue;
            }

            // Blocked — attacker assigns damage to blockers in order (front-to-back)
            let remainingAttackerPow = this.getPower(attacker);
            let totalBlockerDamage   = 0;

            for (const blockerUID of blockerUIDs) {
                const blocker = this.state[defendingRole].battlefield.find(p => p.uid === blockerUID);
                if (!blocker) continue;

                const bCard       = this._card(blocker.cardId);
                const bHasDT      = !blocker.isToken && bCard && bCard.keywords && bCard.keywords.includes('deathtouch');
                const bHasFS      = !blocker.isToken && bCard && bCard.keywords && bCard.keywords.includes('first_strike');
                const bPow        = this.getPower(blocker);
                const bTgh        = this.getToughness(blocker);
                const bName       = blocker.isToken ? (blocker.tokenName || 'Token') : (bCard ? bCard.name : '?');

                // Attacker assigns lethal to this blocker, then moves on
                const dmgToBlocker = aHasDT
                    ? Math.min(1, remainingAttackerPow)
                    : Math.min(bTgh, remainingAttackerPow);
                remainingAttackerPow -= dmgToBlocker;

                blocker.damage += dmgToBlocker;
                this.callbacks.onLog(`${aName} deals ${dmgToBlocker} to ${bName}.`, attackingRole);
                if (aHasLifelink) this._doGainLife(attackingRole, dmgToBlocker);

                // Blocker deals damage to attacker simultaneously (unless first-strike already fired)
                const blockerAlreadyDealt = isFirstStrike && bHasFS;
                if (!blockerAlreadyDealt) {
                    const dmgToAttacker = bHasDT ? Math.min(bPow, this.getToughness(attacker)) : bPow;
                    totalBlockerDamage += dmgToAttacker;
                    this.callbacks.onLog(`${bName} deals ${bPow} to ${aName}.`, defendingRole);
                }

                this._checkLethalDamage(blocker, defendingRole);
            }

            attacker.damage += totalBlockerDamage;
            this._checkLethalDamage(attacker, attackingRole);

            // Trample: excess damage spills to defending player
            if (aHasTrample && remainingAttackerPow > 0) {
                this._doDamageToPlayer(defendingRole, remainingAttackerPow, attackingRole);
                if (aHasLifelink) this._doGainLife(attackingRole, remainingAttackerPow);
            }
        }
    },

    _cleanupCombat() {
        this.state.combat = { attackers: [], blockerMap: {}, pendingBlocker: null };
    },

    /* ── AI Turn ─────────────────────────────────────────────── */
    _aiTurn() {
        if (this.state.gameOver) return;
        const opp = this.state.opponent;

        // Untap all opponent permanents + clear sickness
        for (const p of opp.battlefield) {
            p.tapped = false;
            p.gainedHaste = false;
            p.sick = false;
        }

        this._drawCard('opponent');

        // Clear EOT buffs from previous turn
        for (const p of opp.battlefield) { p.tempPowerBuff = 0; p.tempToughBuff = 0; }

        this.callbacks.onRender(this.state);
        this._aiPlayCards(0, () => { this._aiAttack(); });
    },

    _aiPlayCards(callCount, done) {
        if (this.state.gameOver) { done(); return; }
        if (callCount > 20) { done(); return; }

        const result = this._aiPlayOneCard(callCount, done);
        if (result === 'priority') return;  // waiting for player response
        if (result) {
            this.callbacks.onRender(this.state);
            setTimeout(() => this._aiPlayCards(callCount + 1, done), 600);
        } else {
            done();
        }
    },

    _aiPlayOneCard(callCount, done) {
        if (this.state.gameOver) return false;
        const opp      = this.state.opponent;
        const charName = CHARACTERS[this.state.characterId].name;

        // Land first
        if (!opp.landPlayedThisTurn) {
            const landIdx = opp.hand.findIndex(h => this._card(h.cardId).type === 'land');
            if (landIdx !== -1) {
                const inst = opp.hand[landIdx];
                opp.hand.splice(landIdx, 1);
                opp.landPlayedThisTurn = true;
                const perm = this._makePermanent(inst, 'opponent');
                opp.battlefield.push(perm);
                this.callbacks.onLog(`${charName} plays ${this._card(inst.cardId).name}.`, 'opponent');
                return true;
            }
        }

        // Playable non-land spells (enforce colored mana)
        const playable = opp.hand.filter(h => {
            const c = this._card(h.cardId);
            return c.type !== 'land'
                && c.effect !== FX.COUNTER_SPELL   // AI saves counterspells
                && this.canAfford('opponent', c.cost);
        });

        if (playable.length === 0) return false;

        // Priority: removal > creature > direct damage > other; by cost descending
        const priority = (h) => {
            const c = this._card(h.cardId);
            if (c.effect === FX.DESTROY_CREATURE || c.effect === FX.DESTROY_NONLAND) return 0;
            if (c.type === 'creature') return 1;
            if (c.effect === FX.DEAL_DAMAGE_ANY || c.effect === FX.DEAL_DAMAGE_PLAYER) return 2;
            return 3;
        };
        playable.sort((a, b) =>
            priority(a) - priority(b) ||
            cmc(this._card(b.cardId).cost) - cmc(this._card(a.cardId).cost)
        );

        const chosen = playable[0];
        const c      = this._card(chosen.cardId);

        // Creature: play immediately, no priority window
        if (c.type === 'creature') {
            this._spendMana('opponent', c.cost);
            opp.hand.splice(opp.hand.indexOf(chosen), 1);
            const perm = this._makePermanent(chosen, 'opponent');
            this._applyEnchantmentsToPermanent(perm);
            opp.battlefield.push(perm);
            this.callbacks.onLog(`${charName} plays ${c.name}.`, 'opponent');
            if (c.effect === FX.ETB_DRAW) this._doDrawCards('opponent', c.effectValue);
            this._checkWin();
            return true;
        }

        // Non-creature spell — announce, then check for player priority
        const targetUID = this._aiChooseTarget(c, 'opponent');

        const resolveSpell = () => {
            this._spendMana('opponent', c.cost);
            const idx = opp.hand.indexOf(chosen);
            if (idx !== -1) opp.hand.splice(idx, 1);

            if (c.type === 'enchantment') {
                opp.battlefield.push(this._makePermanent(chosen, 'opponent'));
            } else {
                opp.graveyard.push(chosen);
            }
            this.callbacks.onLog(`${charName} casts ${c.name}.`, 'opponent');
            this._resolveEffect(c, 'opponent', targetUID);
            this._checkWin();
            this.callbacks.onRender(this.state);
        };

        // Check if player has affordable counterspells
        const counters = this.state.player.hand.filter(h => {
            const hc = this._card(h.cardId);
            return hc && hc.effect === FX.COUNTER_SPELL && this.canAfford('player', hc.cost);
        });

        if (counters.length > 0) {
            this.callbacks.onLog(`${charName} is casting ${c.name}...`, 'opponent');
            this.state.priorityWindow = {
                active: true,
                aiSpellName:   c.name,
                aiSpellArt:    c.art,
                aiSpellEffect: c.effect,
                counterspells: counters,
                resolve:       resolveSpell,
                callCount,
                done,
            };
            this.callbacks.onRender(this.state);
            return 'priority';
        }

        resolveSpell();
        return true;
    },

    /* ── Priority window: player responds to AI spell ─────────── */
    passPriority() {
        if (!this.state.priorityWindow.active) return;
        const pw = this.state.priorityWindow;
        pw.active = false;
        this.callbacks.onRender(this.state);
        pw.resolve();
        setTimeout(() => this._aiPlayCards(pw.callCount + 1, pw.done), 600);
    },

    useCounterspell(handUID) {
        if (!this.state.priorityWindow.active) return;
        const pw  = this.state.priorityWindow;
        const ps  = this.state.player;
        const instIdx = ps.hand.findIndex(h => h.uid === handUID);
        if (instIdx === -1) return;

        const inst = ps.hand[instIdx];
        const c    = this._card(inst.cardId);

        this._spendMana('player', c.cost);
        ps.hand.splice(instIdx, 1);
        ps.graveyard.push({ uid: inst.uid, cardId: inst.cardId });
        this.state.metrics.spellsCast++;
        this.state.metrics.counterspells++;
        if (c.color && c.color !== 'C') {
            this.state.metrics.colors[c.color] = (this.state.metrics.colors[c.color] || 0) + 1;
        }

        this.callbacks.onLog(`You counter ${pw.aiSpellName} with ${c.name}!`, 'player');
        if (c.extraEffect === FX.DRAW_CARDS) this._doDrawCards('player', c.extraEffectValue);
        this._triggerReaction(c);

        pw.active = false;
        this.callbacks.onRender(this.state);
        setTimeout(() => this._aiPlayCards(pw.callCount + 1, pw.done), 600);
    },

    /* ── AI chooses targets ──────────────────────────────────── */
    _aiChooseTarget(c, casterRole) {
        const oppRole    = casterRole === 'player' ? 'opponent' : 'player';
        const isCreature = (p) => p.isToken || (this._card(p.cardId) && this._card(p.cardId).type === 'creature');

        switch (c.effectTarget) {
            case 'any': {
                if (c.effect === FX.DEAL_DAMAGE_ANY || c.effect === FX.DEAL_DAMAGE_CREATURE) {
                    const threats = this.state[oppRole].battlefield
                        .filter(isCreature)
                        .filter(p => this.getPower(p) >= 3);
                    return threats.length > 0 ? threats[0].uid : '__opponent_player__';
                }
                return '__opponent_player__';
            }
            case 'creature': {
                const creatures = this.state[oppRole].battlefield
                    .filter(isCreature)
                    .sort((a, b) => this.getPower(b) - this.getPower(a));
                return creatures.length > 0 ? creatures[0].uid : null;
            }
            case 'opp_creature': {
                const c2 = this.state[oppRole].battlefield.filter(isCreature);
                return c2.length > 0 ? c2[0].uid : null;
            }
            case 'your_creature': {
                const mine = this.state[casterRole].battlefield.filter(isCreature);
                return mine.length > 0 ? mine[0].uid : null;
            }
            case 'any_permanent': {
                const targets = this.state[oppRole].battlefield.filter(p => {
                    const pc = this._card(p.cardId);
                    return p.isToken || (pc && pc.type !== 'land');
                });
                return targets.length > 0 ? targets[0].uid : null;
            }
            default:
                return null;
        }
    },

    /* ── AI Attack ───────────────────────────────────────────── */
    _aiAttack() {
        if (this.state.gameOver) return;

        const oppCreatures = this.state.opponent.battlefield.filter(p => {
            const c = this._card(p.cardId);
            return (p.isToken || (c && c.type === 'creature')) && !p.tapped && !p.sick;
        });

        // Only attack with creatures that won't be killed for free
        const attackers = oppCreatures.filter(p => this._shouldAttackWith(p));

        if (attackers.length === 0) {
            this._aiEndTurn();
            return;
        }

        this.callbacks.onLog(`${CHARACTERS[this.state.characterId].name} attacks!`, 'opponent');
        this.state.combat.attackers = attackers.map(p => p.uid);

        for (const perm of attackers) {
            const c = this._card(perm.cardId);
            if (!perm.isToken && c && c.keywords && c.keywords.includes('vigilance')) continue;
            perm.tapped = true;
        }

        // Initialize empty blocker map
        this.state.combat.blockerMap = {};
        for (const aUID of this.state.combat.attackers) {
            this.state.combat.blockerMap[aUID] = [];
        }

        this.state.phase = 'block_declare';
        this.callbacks.onRender(this.state);
        document.getElementById('blocker-overlay').classList.remove('hidden');
        this._renderBlockerOverlay();
    },

    /** Returns true if the AI should attack with this creature */
    _shouldAttackWith(perm) {
        const aPow  = this.getPower(perm);
        const aTgh  = this.getToughness(perm);
        const aCard = this._card(perm.cardId);
        const aHasDT = !perm.isToken && aCard && aCard.keywords && aCard.keywords.includes('deathtouch');

        const playerBlockers = this.state.player.battlefield.filter(p => {
            const pc = this._card(p.cardId);
            return (p.isToken || (pc && pc.type === 'creature')) && !p.tapped && !p.sick;
        });

        if (playerBlockers.length === 0) return true;

        // Would this attacker die without killing any available blocker?
        for (const blocker of playerBlockers) {
            const bPow  = this.getPower(blocker);
            const bTgh  = this.getToughness(blocker);
            const bCard = this._card(blocker.cardId);
            const bHasDT = !blocker.isToken && bCard && bCard.keywords && bCard.keywords.includes('deathtouch');

            const attackerDies = bHasDT ? bPow > 0 : bPow >= aTgh;
            const blockerDies  = aHasDT ? aPow > 0 : aPow >= bTgh;

            if (attackerDies && !blockerDies) return false;  // bad trade — skip
        }
        return true;
    },

    _renderBlockerOverlay() {
        const area = document.getElementById('blocker-area');
        if (!area) return;
        area.innerHTML = '';

        const attackerUIDs  = this.state.combat.attackers;
        const playerCreatures = this.state.player.battlefield.filter(p => {
            const c = this._card(p.cardId);
            return (p.isToken || (c && c.type === 'creature')) && !p.tapped && !p.sick;
        });

        if (playerCreatures.length === 0) {
            area.innerHTML = '<p style="color:var(--text-muted);font-style:italic;text-align:center">No available blockers.</p>';
            return;
        }

        for (const aUID of attackerUIDs) {
            const attacker = this.state.opponent.battlefield.find(p => p.uid === aUID);
            if (!attacker) continue;

            const aCard = this._card(attacker.cardId);
            const aName = attacker.isToken ? (attacker.tokenName || 'Token') : (aCard ? aCard.name : '?');
            const aPow  = this.getPower(attacker);
            const aTgh  = this.getToughness(attacker);
            const currentBlockers = this.state.combat.blockerMap[aUID] || [];

            const row = document.createElement('div');
            row.className = 'blocker-row';

            const attackerDiv = document.createElement('div');
            attackerDiv.className = 'blocker-attacker';
            attackerDiv.innerHTML = `<strong>${aName}</strong> <span class="blocker-pt">${aPow}/${aTgh}</span>`;

            const blockerListDiv = document.createElement('div');
            blockerListDiv.className = 'blocker-list';

            for (const pc of playerCreatures) {
                const pcCard = this._card(pc.cardId);
                const pcName = pc.isToken ? (pc.tokenName || 'Token') : (pcCard ? pcCard.name : '?');
                const isAssigned = currentBlockers.includes(pc.uid);

                const btn = document.createElement('button');
                btn.className = `blocker-assign-btn${isAssigned ? ' assigned' : ''}`;
                btn.innerHTML = `${isAssigned ? '✓ ' : ''}<span>${pcName}</span> <span class="blocker-pt">${this.getPower(pc)}/${this.getToughness(pc)}</span>`;
                btn.addEventListener('click', () => Engine.toggleBlocker(aUID, pc.uid));
                blockerListDiv.appendChild(btn);
            }

            row.appendChild(attackerDiv);
            row.appendChild(blockerListDiv);
            area.appendChild(row);
        }
    },

    _aiPostCombat() {
        if (this.state.gameOver) return;
        this._aiEndTurn();
    },

    _aiEndTurn() {
        if (this.state.gameOver) return;
        for (const p of this.state.opponent.battlefield) {
            p.tempPowerBuff = 0;
            p.tempToughBuff = 0;
        }
        this.state.opponent.landPlayedThisTurn = false;
        this.callbacks.onLog('Their turn ends.', 'system');
        this.state.phase = 'main';
        this.callbacks.onRender(this.state);
        setTimeout(() => this.beginPlayerTurn(), 400);
    },

    /* ── Reaction triggers ───────────────────────────────────── */
    _triggerReaction(card) {
        if (!card) return;
        const char = CHARACTERS[this.state.characterId];
        const r = char.dialogue.reaction;
        let reaction = null;

        if (card.keywords && card.keywords.includes('lifelink')) {
            reaction = r.lifelink;
        } else if (card.effect === FX.COUNTER_SPELL) {
            reaction = r.counterspell;
        } else if (card.effect === FX.DESTROY_CREATURE || card.effect === FX.DESTROY_NONLAND || card.effect === FX.OPPONENT_DISCARD) {
            reaction = r.removal;
        } else if (card.effect === FX.DEAL_DAMAGE_ANY || card.effect === FX.DEAL_DAMAGE_PLAYER || card.effect === FX.DEAL_DAMAGE_CREATURE) {
            reaction = (card.effectValue || 0) >= 4 ? r.big_damage : r.aggressive;
        } else if (card.type === 'creature' && (card.power || 0) >= 3) {
            reaction = r.aggressive;
        } else if (card.effect === FX.GAIN_LIFE || card.effect === FX.BUFF_CREATURE_EOT || card.effect === FX.PUMP_ALL_EOT) {
            reaction = r.defensive;
        } else if (card.effect === FX.DRAW_CARDS || card.effect === FX.DRAW_SHARED || card.effect === FX.SCRY_DRAW) {
            reaction = r.draw_spell;
        } else if (card.romanticTheme === 'wit' || card.romanticTheme === 'mystery') {
            reaction = r.clever;
        }

        // Situational fallback based on life totals
        if (!reaction) {
            if (this.state.opponent.life <= 8)  reaction = r.losing;
            else if (this.state.player.life <= 8) reaction = r.winning;
        }

        if (reaction) this.callbacks.onReaction(reaction);
    },

    /* ── Phase UI ────────────────────────────────────────────── */
    _updatePhaseUI() {
        const actionsDiv = document.getElementById('phase-actions');
        const phaseLabel = document.getElementById('phase-name');
        const turnLabel  = document.getElementById('phase-turn-label');
        if (!actionsDiv || !phaseLabel) return;

        turnLabel.textContent = `Turn ${this.state.turn}`;
        actionsDiv.innerHTML  = '';

        const addBtn = (text, cls, handler, disabled = false) => {
            const btn = document.createElement('button');
            btn.className = cls;
            btn.textContent = text;
            btn.disabled = disabled;
            btn.addEventListener('click', handler);
            actionsDiv.appendChild(btn);
        };

        switch (this.state.phase) {
            case 'main':
                phaseLabel.textContent = 'Your Turn — Main Phase';
                addBtn('⚔ Attack', 'btn-phase', () => this.enterAttackPhase());
                addBtn('⏭ End Turn', 'btn-secondary', () => this.endPlayerTurn());
                break;
            case 'attack_declare':
                phaseLabel.textContent = 'Declare Attackers';
                addBtn('✓ Confirm Attackers', 'btn-phase', () => this.confirmAttackers());
                addBtn('✕ Cancel', 'btn-secondary', () => {
                    this.state.combat.attackers = [];
                    this.state.phase = 'main';
                    this.callbacks.onRender(this.state);
                    this._updatePhaseUI();
                });
                break;
            case 'block_declare':
                phaseLabel.textContent = `${CHARACTERS[this.state.characterId].name} attacks — Assign Blockers`;
                break;
            case 'damage':
                phaseLabel.textContent = 'Combat Damage';
                break;
            case 'opp_turn':
                phaseLabel.textContent = `${CHARACTERS[this.state.characterId].name}'s Turn...`;
                break;
        }
    },

    /* ── Relationship calculation ────────────────────────────── */
    calculateRelationshipChanges(metrics, currentStats, characterId) {
        const char   = CHARACTERS[characterId];
        const prefs  = char.preferences;
        const changes = { love: 0, attraction: 0, inhibition: 0, control: 0 };

        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

        const dmgNorm   = clamp(metrics.directDamage    / 15, 0, 1);
        const lifeNorm  = clamp(metrics.lifeGained       / 10, 0, 1);
        const drawNorm  = clamp(metrics.cardsDrawn        /  6, 0, 1);
        const remNorm   = clamp(metrics.removalsUsed      /  3, 0, 1);
        const ctrsNorm  = clamp(metrics.counterspells     /  3, 0, 1);
        const creatNorm = clamp(metrics.creaturesPlayed   /  5, 0, 1);

        const totalColorCards = Object.values(metrics.colors).reduce((a, b) => a + b, 0) || 1;
        const colorNorm = {};
        for (const col of ['W','U','B','R','G']) {
            colorNorm[col] = clamp((metrics.colors[col] || 0) / totalColorCards, 0, 1);
        }

        const apply = (weight, norm) => {
            for (const stat of ['love','attraction','inhibition','control']) {
                changes[stat] += (weight[stat] || 0) * norm;
            }
        };

        apply(prefs.directDamage,    dmgNorm);
        apply(prefs.lifeGained,      lifeNorm);
        apply(prefs.cardsDrawn,      drawNorm);
        apply(prefs.removalsUsed,    remNorm);
        apply(prefs.counterspells,   ctrsNorm);
        apply(prefs.creaturesPlayed, creatNorm);
        apply(prefs.colorW, colorNorm.W);
        apply(prefs.colorU, colorNorm.U);
        apply(prefs.colorB, colorNorm.B);
        apply(prefs.colorR, colorNorm.R);
        apply(prefs.colorG, colorNorm.G);

        if (metrics.won) {
            for (const stat of ['love','attraction','inhibition','control']) {
                changes[stat] += prefs.winBonus[stat] || 0;
            }
        } else {
            const bonusKey = (metrics.opponentLifeAtEnd !== undefined && metrics.opponentLifeAtEnd <= 5)
                ? 'closeLoss' : 'bigLoss';
            for (const stat of ['love','attraction','inhibition','control']) {
                changes[stat] += prefs[bonusKey][stat] || 0;
            }
        }

        for (const stat of ['love','attraction','inhibition','control']) {
            changes[stat] = Math.round(changes[stat] * 10) / 10;
        }

        return changes;
    },

    applyChanges(current, changes) {
        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v * 10) / 10));
        return {
            love:       clamp(current.love       + changes.love,       0, 100),
            attraction: clamp(current.attraction + changes.attraction, 0, 100),
            inhibition: clamp(current.inhibition + changes.inhibition, 0, 100),
            control:    clamp(current.control    + changes.control,    0, 100),
        };
    },

    /* ── Play style analysis ─────────────────────────────────── */
    analyzePlayStyle(metrics) {
        const totalCards = metrics.creaturesPlayed + metrics.spellsCast;
        if (totalCards === 0) return { label: 'Quiet Observer', desc: 'You barely played a card.' };

        const aggroScore    = (metrics.directDamage / 20) + (metrics.creaturesPlayed / 10);
        const controlScore  = (metrics.counterspells / 3) + (metrics.removalsUsed / 5) + (metrics.cardsDrawn / 8);
        const nurturingScore = (metrics.lifeGained / 10);
        const colorR_B = ((metrics.colors.R || 0) + (metrics.colors.B || 0)) / (totalCards || 1);
        const colorU_W = ((metrics.colors.U || 0) + (metrics.colors.W || 0)) / (totalCards || 1);

        if (aggroScore > 1.5 && colorR_B > 0.5)  return { label: 'Ardent Aggressor',    desc: 'You played with fire and fury — direct, passionate, unapologetic.' };
        if (controlScore > 1.2 && colorU_W > 0.5) return { label: 'Thoughtful Schemer',  desc: 'You played with precision and patience, always one step ahead.' };
        if (nurturingScore > 0.8)                  return { label: 'Gentle Caretaker',    desc: 'You prioritized stability and healing — a reassuring presence.' };
        if (metrics.counterspells >= 2)            return { label: 'Careful Controller',  desc: 'You kept them guessing, denying their plans with quiet authority.' };
        if (metrics.creaturesPlayed >= 4)          return { label: 'Forceful Presence',   desc: 'You filled the field with conviction — hard to ignore.' };
        if (metrics.cardsDrawn >= 5)               return { label: 'Curious Mind',        desc: 'You sought information, always looking deeper.' };

        return { label: 'Balanced Suitor', desc: 'Your approach was varied and adaptable — genuinely hard to read.' };
    },
};
