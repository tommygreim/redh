/* ═══════════════════════════════════════════════════════════
   Hearts & Mana — Game Engine
   Manages game state, rules, AI, and relationship calculations
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
    callbacks: {
        onLog:      () => {},
        onReaction: () => {},
        onRender:   () => {},
        onGameOver: () => {},
    },

    /* ── Init ───────────────────────────────────────────────── */
    init(playerDeckId, characterId, callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
        const character = CHARACTERS[characterId];
        const playerDeckDef = DECKS[playerDeckId];
        const oppDeckDef    = DECKS[character.deckId];

        this.state = {
            turn: 1,
            phase: 'main',        // main | attack_declare | block_declare | damage | opp_turn
            gameOver: false,
            winner: null,
            characterId,

            player: this._buildPlayerState('player', playerDeckDef.cards),
            opponent: this._buildPlayerState('opponent', oppDeckDef.cards),

            combat: {
                attackers: [],        // UIDs of attacking creatures (opponent or player)
                blockerMap: {},       // { attackerUID: blockerUID | null }
                pendingBlocker: null, // attacker UID waiting for blocker assignment
            },

            targeting: {
                active: false,
                cardUID: null,       // UID of card being cast
                cardId: null,
                effect: null,
                callback: null,
            },

            stack: [],   // spells being cast (simplified — mostly for counterspells)

            enchantments: [],  // { uid, cardId, controller } — global enchantments

            // Metrics accumulated across the entire game
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

        // Draw opening hands (7 cards each)
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
        return cardIds.map(id => ({
            uid: uid(),
            cardId: id,
        }));
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
    getAvailableMana(role) {
        return this.state[role].battlefield.filter(p => {
            const c = this._cardOfInstance(p);
            return c && c.type === 'land' && !p.tapped;
        }).length;
    },

    _spendMana(role, amount) {
        let spent = 0;
        for (const p of this.state[role].battlefield) {
            if (spent >= amount) break;
            const c = this._cardOfInstance(p);
            if (c && c.type === 'land' && !p.tapped) {
                p.tapped = true;
                spent++;
            }
        }
    },

    /* ── Drawing ─────────────────────────────────────────────── */
    _drawCard(role, silent = false) {
        const ps = this.state[role];
        if (ps.library.length === 0) {
            this.callbacks.onLog(`${role === 'player' ? 'You' : 'They'} tried to draw from an empty library!`, 'system');
            // In MtG you lose if you can't draw — but for PoC we skip this
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

        if (this.state.phase === 'opp_turn') return false;
        if (this.state.gameOver) return false;

        if (c.type === 'land') {
            return !ps.landPlayedThisTurn && this.state.phase === 'main';
        }
        // Instants can be played any time (including combat), sorceries only in main
        if (c.type === 'sorcery' || c.type === 'enchantment' || c.type === 'creature') {
            if (this.state.phase !== 'main') return false;
        }
        return this.getAvailableMana('player') >= c.cost;
    },

    playCard(handUID) {
        if (this.state.phase === 'opp_turn' || this.state.gameOver) return;
        const ps = this.state.player;
        const instIdx = ps.hand.findIndex(h => h.uid === handUID);
        if (instIdx === -1) return;

        const inst = ps.hand[instIdx];
        const c = this._card(inst.cardId);

        if (!this.canPlay('player', handUID)) return;

        if (c.type === 'land') {
            ps.hand.splice(instIdx, 1);
            ps.landPlayedThisTurn = true;
            const perm = this._makePermanent(inst, 'player');
            ps.battlefield.push(perm);
            this.callbacks.onLog(`You play ${c.name}.`, 'player');
            this.callbacks.onRender(this.state);
            return;
        }

        // Track color metric (only for non-land spells)
        if (c.color && c.color !== 'C') {
            this.state.metrics.colors[c.color] = (this.state.metrics.colors[c.color] || 0) + 1;
        }

        // For targeted spells, check targets BEFORE paying mana
        if (this._needsTarget(c)) {
            const validTargets = this._getValidTargets(c, 'player');
            if (validTargets.length === 0) {
                this.callbacks.onLog(`No valid targets for ${c.name}.`, 'system');
                return; // Don't pay mana or remove from hand
            }
            // Pay mana, remove from hand, enter targeting mode
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
                    if (c.extraEffect) {
                        this._resolveExtraEffect(c, 'player', null);
                    }
                    this._checkWin();
                    this.callbacks.onRender(this.state);
                    this._triggerReaction(c);
                },
            };
            this.callbacks.onRender(this.state);
            return;
        }

        // Non-targeted spell (creature, enchantment, or no-target sorcery/instant)
        this._spendMana('player', c.cost);
        ps.hand.splice(instIdx, 1);
        this.state.metrics.spellsCast++;

        if (c.type === 'creature') {
            this.state.metrics.creaturesPlayed++;
            const perm = this._makePermanent(inst, 'player');
            this._applyEnchantmentsToPermanent(perm);
            ps.battlefield.push(perm);
            this.callbacks.onLog(`You play ${c.name} (${c.power}/${c.toughness}).`, 'player');
            if (c.effect === FX.ETB_DRAW)    this._doDrawCards('player', c.effectValue);
            if (c.effect === FX.ETB_GAIN_LIFE) this._doGainLife('player', c.effectValue);
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
            this._checkWin();
            this.callbacks.onRender(this.state);
            this._triggerReaction(c);
            return;
        }

        // No-target sorcery / instant
        ps.graveyard.push({ uid: inst.uid, cardId: inst.cardId });
        this._resolveEffect(c, 'player', null);
        if (c.extraEffect) this._resolveExtraEffect(c, 'player', null);
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
        // Return cost — find the card in graveyard staging
        this.state.targeting.active = false;
        this.callbacks.onLog('Targeting cancelled.', 'system');
        this.callbacks.onRender(this.state);
    },

    /* ── Permanents ──────────────────────────────────────────── */
    _makePermanent(inst, controller) {
        const c = this._card(inst.cardId);
        return {
            uid: inst.uid,
            cardId: inst.cardId,
            controller,
            type: c.type,
            tapped: false,
            damage: 0,
            tempPowerBuff: 0,
            tempToughBuff: 0,
            gainedHaste: false,
            // For creatures: resolved power/toughness (base + enchant buffs)
            powerBuff: 0,   // from enchantments
            toughBuff: 0,
        };
    },

    getPower(perm) {
        if (perm.isToken) return (perm.tokenPower || 0) + perm.powerBuff + perm.tempPowerBuff;
        const c = this._card(perm.cardId);
        return ((c && c.power) || 0) + perm.powerBuff + perm.tempPowerBuff;
    },

    getToughness(perm) {
        if (perm.isToken) return (perm.tokenToughness || 0) + perm.toughBuff + perm.tempToughBuff;
        const c = this._card(perm.cardId);
        return ((c && c.toughness) || 0) + perm.toughBuff + perm.tempToughBuff;
    },

    /* ── Enchantment global buffs ────────────────────────────── */
    _applyEnchantmentsToPermanent(perm) {
        const pc = this._card(perm.cardId);
        if (!perm.isToken && (!pc || pc.type !== 'creature')) return;
        for (const e of this.state.enchantments) {
            if (e.controller === perm.controller) {
                const ec = this._card(e.cardId);
                if (ec.effect === FX.ENCHANT_ALL_BUFF) {
                    perm.powerBuff += ec.effectValue[0];
                    perm.toughBuff += ec.effectValue[1];
                }
            }
        }
    },

    /* ── Effect resolution ───────────────────────────────────── */
    _needsTarget(c) {
        return c.effectTarget && c.effectTarget !== 'none' && c.effectTarget !== 'opponent'
            && c.effectTarget !== 'spell';
    },

    _getValidTargets(c, casterRole) {
        const oppRole = casterRole === 'player' ? 'opponent' : 'player';
        // Token-safe helpers — tokens have isToken:true and no card definition
        const isCreature = (p) => {
            if (p.isToken) return true;
            const pc = this._card(p.cardId);
            return pc && pc.type === 'creature';
        };
        const isNonLand = (p) => {
            if (p.isToken) return true;
            const pc = this._card(p.cardId);
            return !pc || pc.type !== 'land';
        };
        switch (c.effectTarget) {
            case 'any':
                return [
                    ...this.state[oppRole].battlefield.filter(isCreature).map(p => p.uid),
                    ...this.state[casterRole].battlefield.filter(isCreature).map(p => p.uid),
                    '__opponent_player__',
                    '__player_player__',
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

    _findPermanent(uid) {
        for (const role of ['player', 'opponent']) {
            const p = this.state[role].battlefield.find(p => p.uid === uid);
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
                // Both draw N, both gain N life (Open Heart)
                this._doDrawCards(casterRole, c.effectValue);
                this._doDrawCards(oppRole, c.effectValue);
                this._doGainLife(casterRole, c.effectValue);
                this._doGainLife(oppRole, c.effectValue);
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
                // Handled before resolution — here just for completeness
                this.callbacks.onLog(`${casterRole === 'player' ? 'You counter' : 'They counter'} the spell.`, casterRole);
                if (casterRole === 'player') this.state.metrics.counterspells++;
                break;

            case FX.BUFF_CREATURE_EOT:
                if (targetUID) {
                    const res = this._findPermanent(targetUID);
                    if (res) {
                        const [pw, tg] = Array.isArray(c.effectValue) ? c.effectValue : [0, c.effectValue];
                        res.perm.tempPowerBuff += pw;
                        res.perm.tempToughBuff += tg;
                        this.callbacks.onLog(
                            `${this._card(res.perm.cardId).name} gets +${pw}/+${tg} until end of turn.`, casterRole
                        );
                    }
                }
                break;

            case FX.PUMP_ALL_EOT:
                // All player creatures get +N/+0 and haste until EOT
                for (const p of this.state[casterRole].battlefield) {
                    if (this._card(p.cardId).type === 'creature') {
                        p.tempPowerBuff += c.effectValue;
                        p.gainedHaste = true;
                    }
                }
                this.callbacks.onLog(`All your creatures gain +${c.effectValue}/+0 and haste until end of turn.`, casterRole);
                break;

            case FX.ENCHANT_ALL_BUFF:
                // Enchantment: track it, apply to all existing creatures
                this.state.enchantments.push({ uid: uid(), cardId: c.id, controller: casterRole });
                for (const p of this.state[casterRole].battlefield) {
                    const pc2 = this._card(p.cardId);
                    if (p.isToken || (pc2 && pc2.type === 'creature')) {
                        p.powerBuff += c.effectValue[0];
                        p.toughBuff += c.effectValue[1];
                    }
                }
                this.callbacks.onLog(`${c.name} enchants your side — all creatures get +1/+1.`, casterRole);
                break;

            case FX.CREATE_TOKENS: {
                const tokenCard = {
                    uid: uid(), cardId: '__token__', controller: casterRole,
                    type: 'creature', tapped: false, damage: 0,
                    tempPowerBuff: 0, tempToughBuff: 0, gainedHaste: false,
                    powerBuff: 0, toughBuff: 0,
                    isToken: true, tokenPower: 2, tokenToughness: 2,
                    tokenArt: '🌸', tokenName: 'Bloom Token',
                };
                for (let i = 0; i < c.effectValue; i++) {
                    this.state[casterRole].battlefield.push({ ...tokenCard, uid: uid() });
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

    _resolveExtraEffect(c, casterRole, targetUID) {
        // For cards with an extraEffect (e.g. Whispered Riddle: counter + draw)
        if (!c.extraEffect) return;
        if (c.extraEffect === FX.DRAW_CARDS) {
            this._doDrawCards(casterRole, c.extraEffectValue);
        }
    },

    /* ── Damage helpers ──────────────────────────────────────── */
    _doDamageToPlayer(role, amount, sourceRole) {
        this.state[role].life = Math.max(0, this.state[role].life - amount);
        const isPlayer = role === 'player';
        this.callbacks.onLog(
            `${isPlayer ? 'You take' : 'They take'} ${amount} damage. (${this.state[role].life} life)`,
            sourceRole === 'player' ? 'damage' : 'opponent'
        );
        if (sourceRole === 'player') {
            this.state.metrics.directDamage += amount;
        }
        this._flashLifeOrb(role);
    },

    _doDamageToCreature(permUID, amount, sourceRole) {
        const res = this._findPermanent(permUID);
        if (!res) return;
        const { perm } = res;
        perm.damage += amount;
        this.callbacks.onLog(
            `${this._card(perm.cardId).name} takes ${amount} damage.`, sourceRole
        );
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
            this.callbacks.onLog(
                `${oppRole === 'player' ? 'You discard' : 'They discard'} ${this._card(discarded.cardId).name}.`,
                oppRole
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
                // Trigger dies effects
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
        // Deathtouch: any damage is lethal (perm.damage > 0 is handled at combat)
        const lethal = perm.damage >= tough;
        if (lethal) {
            const idx = this.state[role].battlefield.indexOf(perm);
            if (idx !== -1) {
                this.state[role].battlefield.splice(idx, 1);
                if (!perm.isToken) this.state[role].graveyard.push({ uid: perm.uid, cardId: perm.cardId });
                this.callbacks.onLog(`${c ? c.name : 'Token'} is destroyed by damage.`, 'system');
                if (c && c.effect === FX.DIES_DEAL_DAMAGE) {
                    const oppRole = role === 'player' ? 'opponent' : 'player';
                    this._doDamageToPlayer(oppRole, c.effectValue, role);
                }
            }
        }
    },

    /* ── Win check ───────────────────────────────────────────── */
    _checkWin() {
        if (this.state.gameOver) return;
        if (this.state.player.life <= 0) {
            this._endGame('opponent');
        } else if (this.state.opponent.life <= 0) {
            this._endGame('player');
        }
    },

    _endGame(winner) {
        this.state.gameOver = true;
        this.state.winner = winner;
        this.callbacks.onLog(
            winner === 'player' ? '✦ You win!' : '✦ They win!',
            'system'
        );
        this.callbacks.onRender(this.state);
        // Small delay then call onGameOver
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

        // Untap all player permanents
        for (const p of ps.battlefield) { p.tapped = false; p.gainedHaste = false; }

        // Draw a card
        this._drawCard('player');

        this.callbacks.onLog(`Turn ${this.state.turn} — your turn.`, 'system');
        this.callbacks.onRender(this.state);
        this._updatePhaseUI();
    },

    endPlayerTurn() {
        if (this.state.phase === 'opp_turn' || this.state.gameOver) return;

        // Clear end-of-turn buffs
        for (const p of this.state.player.battlefield) {
            p.tempPowerBuff = 0;
            p.tempToughBuff = 0;
        }

        // Clear attack state
        this.state.combat = { attackers: [], blockerMap: {}, pendingBlocker: null };

        this.callbacks.onLog('Your turn ends.', 'system');
        this.state.phase = 'opp_turn';
        this.callbacks.onRender(this.state);
        this._updatePhaseUI();

        // Delay before AI takes its turn
        setTimeout(() => this._aiTurn(), 900);
    },

    /* ── Combat ──────────────────────────────────────────────── */
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
        if (c.type !== 'creature' || perm.tapped) return;
        // Creatures with haste can attack even if they entered this turn
        const hasHaste = c.keywords.includes('haste') || perm.gainedHaste;
        if (!hasHaste && perm.summoningSicknessFlag) return; // simplified: no sickness in PoC

        const idx = this.state.combat.attackers.indexOf(permUID);
        if (idx === -1) {
            this.state.combat.attackers.push(permUID);
        } else {
            this.state.combat.attackers.splice(idx, 1);
        }
        this.callbacks.onRender(this.state);
    },

    confirmAttackers() {
        if (this.state.phase !== 'attack_declare') return;
        const attackers = this.state.combat.attackers;
        if (attackers.length === 0) {
            // No attackers, go back to main
            this.state.phase = 'main';
            this.callbacks.onRender(this.state);
            this._updatePhaseUI();
            return;
        }

        // Tap attackers (non-vigilance)
        for (const aUID of attackers) {
            const perm = this.state.player.battlefield.find(p => p.uid === aUID);
            if (!perm) continue;
            const c = this._card(perm.cardId);
            if (!c.keywords.includes('vigilance')) perm.tapped = true;
        }

        const names = attackers.map(aUID => {
            const p = this.state.player.battlefield.find(p => p.uid === aUID);
            return p ? this._card(p.cardId).name : '?';
        });
        this.callbacks.onLog(`You attack with: ${names.join(', ')}.`, 'player');

        // AI assigns blockers
        this._aiAssignBlockers(attackers);
    },

    _aiAssignBlockers(attackerUIDs) {
        // AI (opponent) selects blockers to minimize damage
        const oppCreatures = this.state.opponent.battlefield.filter(p => {
            const c = this._card(p.cardId);
            return c && c.type === 'creature' && !p.tapped;
        });

        const blockerMap = {};
        const usedBlockers = new Set();

        for (const aUID of attackerUIDs) {
            const attacker = this.state.player.battlefield.find(p => p.uid === aUID);
            if (!attacker) continue;
            const aPow = this.getPower(attacker);
            const aTgh = this.getToughness(attacker);
            const aCard = this._card(attacker.cardId);

            // Find best blocker: one that either kills attacker or just trades
            let chosen = null;
            for (const blocker of oppCreatures) {
                if (usedBlockers.has(blocker.uid)) continue;
                const bPow = this.getPower(blocker);
                const bTgh = this.getToughness(blocker);
                const aHasDT = aCard.keywords.includes('deathtouch');
                const bCardDef = this._card(blocker.cardId);
                const bHasDT = bCardDef && bCardDef.keywords.includes('deathtouch');

                const blockerDiestoAttacker = (aHasDT && bTgh <= aPow) || bTgh <= aPow;
                const attackerDiestoBlocker = (bHasDT && aTgh <= bPow) || aTgh <= bPow;

                // Block if we kill attacker, even if we die (trade or win)
                if (attackerDiestoBlocker) {
                    chosen = blocker;
                    if (!blockerDiestoAttacker) break; // winner, take it
                }
            }
            blockerMap[aUID] = chosen ? chosen.uid : null;
            if (chosen) usedBlockers.add(chosen.uid);
        }

        this.state.combat.blockerMap = blockerMap;
        this.state.phase = 'damage';
        this.callbacks.onRender(this.state);

        setTimeout(() => this._resolveCombat('player'), 600);
    },

    confirmBlockers(noBlock = false) {
        // Player confirms their blocker assignments (during opponent's attack)
        if (this.state.phase !== 'block_declare') return;
        if (noBlock) {
            for (const aUID of this.state.combat.attackers) {
                this.state.combat.blockerMap[aUID] = null;
            }
        }
        this.state.phase = 'damage';
        document.getElementById('blocker-overlay').classList.add('hidden');
        this.callbacks.onRender(this.state);
        setTimeout(() => this._resolveCombat('opponent'), 400);
    },

    assignBlocker(attackerUID, blockerUID) {
        this.state.combat.blockerMap[attackerUID] = blockerUID;
        this.callbacks.onRender(this.state);
    },

    _resolveCombat(attackingRole) {
        const defendingRole = attackingRole === 'player' ? 'opponent' : 'player';
        const attackerUIDs = this.state.combat.attackers;

        // First strike damage pass
        const firstStrikeAttackers = attackerUIDs.filter(aUID => {
            const p = this.state[attackingRole].battlefield.find(p => p.uid === aUID);
            return p && this._card(p.cardId).keywords.includes('first_strike');
        });

        // Normal pass
        const normalAttackers = attackerUIDs.filter(aUID => {
            const p = this.state[attackingRole].battlefield.find(p => p.uid === aUID);
            return p && !this._card(p.cardId).keywords.includes('first_strike');
        });

        this._combatDamagePass(firstStrikeAttackers, attackingRole, defendingRole, true);
        this._combatDamagePass(normalAttackers, attackingRole, defendingRole, false);

        // Check wins
        this._checkWin();
        if (this.state.gameOver) {
            this._cleanupCombat();
            return;
        }

        // Cleanup
        this._cleanupCombat();

        if (attackingRole === 'player') {
            // Back to main phase after player attack
            this.state.phase = 'main';
            this.callbacks.onLog('Combat ends.', 'system');
            this.callbacks.onRender(this.state);
            this._updatePhaseUI();
        } else {
            // After opponent attack, back to opponent's main phase
            this.callbacks.onLog('Combat ends.', 'system');
            this.callbacks.onRender(this.state);
            setTimeout(() => this._aiPostCombat(), 400);
        }
    },

    _combatDamagePass(attackerUIDs, attackingRole, defendingRole, isFirstStrike) {
        for (const aUID of attackerUIDs) {
            const attacker = this.state[attackingRole].battlefield.find(p => p.uid === aUID);
            if (!attacker) continue;  // already dead

            const blockerUID = this.state.combat.blockerMap[aUID];
            const aCard = this._card(attacker.cardId);
            const aHasDeathtouch = aCard && aCard.keywords.includes('deathtouch');
            const aHasLifelink = aCard && aCard.keywords.includes('lifelink');
            const aHasTrample = aCard && aCard.keywords.includes('trample');
            const aPow = this.getPower(attacker);

            if (blockerUID) {
                const blocker = this.state[defendingRole].battlefield.find(p => p.uid === blockerUID);
                if (!blocker) {
                    // Blocker died earlier (e.g., first strike), damage goes through
                    this._doDamageToPlayer(defendingRole, aPow, attackingRole);
                    if (aHasLifelink) this._doGainLife(attackingRole, aPow);
                    continue;
                }

                const bCard = this._card(blocker.cardId);
                const bHasDeathtouch = bCard && bCard.keywords.includes('deathtouch');
                const bHasFirstStrike = bCard && bCard.keywords.includes('first_strike');
                const bPow = this.getPower(blocker);
                const bTgh = this.getToughness(blocker);
                const aTgh = this.getToughness(attacker);

                // Attacker deals damage to blocker
                const dmgToBlocker = aHasDeathtouch ? Math.min(aPow, bTgh) : aPow;
                blocker.damage += dmgToBlocker;
                this.callbacks.onLog(
                    `${aCard ? aCard.name : 'Attacker'} deals ${dmgToBlocker} to ${bCard ? bCard.name : 'Blocker'}.`,
                    attackingRole
                );

                // Blocker deals damage back (if it hasn't dealt first-strike damage already)
                const blockerAlreadyDealt = isFirstStrike && bHasFirstStrike;
                if (!blockerAlreadyDealt) {
                    attacker.damage += bHasDeathtouch ? Math.min(bPow, aTgh) : bPow;
                    this.callbacks.onLog(
                        `${bCard ? bCard.name : 'Blocker'} deals ${bPow} to ${aCard ? aCard.name : 'Attacker'}.`,
                        defendingRole
                    );
                }

                if (aHasLifelink) this._doGainLife(attackingRole, dmgToBlocker);

                // Trample: excess damage to player
                if (aHasTrample) {
                    const excess = aPow - bTgh;
                    if (excess > 0) {
                        this._doDamageToPlayer(defendingRole, excess, attackingRole);
                        if (aHasLifelink) this._doGainLife(attackingRole, excess);
                    }
                }

                // Check lethal on both
                this._checkLethalDamage(blocker, defendingRole);
                this._checkLethalDamage(attacker, attackingRole);

            } else {
                // Unblocked — damage goes to player
                this._doDamageToPlayer(defendingRole, aPow, attackingRole);
                if (aHasLifelink) this._doGainLife(attackingRole, aPow);
                if (attackingRole !== 'player') {
                    // Player is being hit
                }
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
        const char = CHARACTERS[this.state.characterId];

        // Untap all opponent permanents
        for (const p of opp.battlefield) { p.tapped = false; p.gainedHaste = false; }

        // Draw
        this._drawCard('opponent');

        // Clear EOT buffs
        for (const p of opp.battlefield) { p.tempPowerBuff = 0; p.tempToughBuff = 0; }

        this.callbacks.onRender(this.state);

        // Play cards with a small delay between each for visual effect
        this._aiPlayCards(0, () => {
            this._aiAttack();
        });
    },

    _aiPlayCards(callCount, done) {
        if (this.state.gameOver) { done(); return; }
        if (callCount > 20) { done(); return; } // safety

        const played = this._aiPlayOneCard();
        if (played) {
            this.callbacks.onRender(this.state);
            setTimeout(() => this._aiPlayCards(callCount + 1, done), 600);
        } else {
            done();
        }
    },

    _aiPlayOneCard() {
        const opp = this.state.opponent;
        const mana = this.getAvailableMana('opponent');

        // Land first
        if (!opp.landPlayedThisTurn) {
            const landIdx = opp.hand.findIndex(h => this._card(h.cardId).type === 'land');
            if (landIdx !== -1) {
                const inst = opp.hand[landIdx];
                opp.hand.splice(landIdx, 1);
                opp.landPlayedThisTurn = true;
                opp.battlefield.push(this._makePermanent(inst, 'opponent'));
                const c = this._card(inst.cardId);
                this.callbacks.onLog(`${CHARACTERS[this.state.characterId].name} plays ${c.name}.`, 'opponent');
                return true;
            }
        }

        // Recalc mana after land
        const mana2 = this.getAvailableMana('opponent');

        // Try to play a spell — prefer creatures, then removal, then others
        // Sort hand by: 1) creature, 2) removal, 3) damage spell, 4) other; within each group by cost desc
        const playable = opp.hand.filter(h => {
            const c = this._card(h.cardId);
            return c.type !== 'land' && c.cost <= mana2;
        });

        if (playable.length === 0) return false;

        // Priority: removal > creature > direct damage > other
        const priority = (h) => {
            const c = this._card(h.cardId);
            if (c.effect === FX.DESTROY_CREATURE || c.effect === FX.DESTROY_NONLAND) return 0;
            if (c.type === 'creature') return 1;
            if (c.effect === FX.DEAL_DAMAGE_ANY || c.effect === FX.DEAL_DAMAGE_PLAYER || c.effect === FX.DEAL_DAMAGE_CREATURE) return 2;
            return 3;
        };

        playable.sort((a, b) => priority(a) - priority(b) || this._card(b.cardId).cost - this._card(a.cardId).cost);
        const chosen = playable[0];
        const c = this._card(chosen.cardId);

        // Check if can use counterspell (only against player spells, not useful here in main phase)
        if (c.effect === FX.COUNTER_SPELL) return false; // AI saves counterspells for reactions

        this._spendMana('opponent', c.cost);
        const instIdx = opp.hand.indexOf(chosen);
        opp.hand.splice(instIdx, 1);

        if (c.type === 'creature') {
            const perm = this._makePermanent(chosen, 'opponent');
            this._applyEnchantmentsToPermanent(perm);
            opp.battlefield.push(perm);
            this.callbacks.onLog(`${CHARACTERS[this.state.characterId].name} plays ${c.name}.`, 'opponent');
            if (c.effect === FX.ETB_DRAW) this._doDrawCards('opponent', c.effectValue);
        } else if (c.type === 'enchantment') {
            opp.battlefield.push(this._makePermanent(chosen, 'opponent'));
            this.callbacks.onLog(`${CHARACTERS[this.state.characterId].name} plays ${c.name}.`, 'opponent');
            this._resolveEffect(c, 'opponent', this._aiChooseTarget(c, 'opponent'));
        } else {
            // Sorcery/Instant
            opp.graveyard.push(chosen);
            const targetUID = this._aiChooseTarget(c, 'opponent');
            this.callbacks.onLog(`${CHARACTERS[this.state.characterId].name} casts ${c.name}.`, 'opponent');
            this._resolveEffect(c, 'opponent', targetUID);
        }

        this._checkWin();
        return true;
    },

    _aiChooseTarget(c, casterRole) {
        const oppRole = casterRole === 'player' ? 'opponent' : 'player';
        const isCreature = (p) => p.isToken || (this._card(p.cardId) && this._card(p.cardId).type === 'creature');

        switch (c.effectTarget) {
            case 'any': {
                // Prefer killing a threatening creature, else hit player directly
                if (c.effect === FX.DEAL_DAMAGE_ANY || c.effect === FX.DEAL_DAMAGE_CREATURE) {
                    const threats = this.state[oppRole].battlefield
                        .filter(isCreature)
                        .filter(p => this.getPower(p) >= 3);
                    if (threats.length > 0) return threats[0].uid;
                    return '__opponent_player__';
                }
                return '__opponent_player__';
            }
            case 'creature': {
                // Pick biggest creature on opponent's side
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
                const mine = this.state[casterRole].battlefield
                    .filter(p => { const pc = this._card(p.cardId); return pc && pc.type === 'creature'; });
                return mine.length > 0 ? mine[0].uid : null;
            }
            case 'any_permanent': {
                const targets = this.state[oppRole].battlefield
                    .filter(p => this._card(p.cardId).type !== 'land');
                return targets.length > 0 ? targets[0].uid : null;
            }
            default:
                return null;
        }
    },

    _aiAttack() {
        if (this.state.gameOver) return;

        const oppCreatures = this.state.opponent.battlefield.filter(p => {
            const c = this._card(p.cardId);
            return c && c.type === 'creature' && !p.tapped;
        });

        if (oppCreatures.length === 0) {
            this._aiEndTurn();
            return;
        }

        this.callbacks.onLog(`${CHARACTERS[this.state.characterId].name} attacks!`, 'opponent');
        this.state.combat.attackers = oppCreatures.map(p => p.uid);

        // Tap non-vigilance attackers
        for (const perm of oppCreatures) {
            const c = this._card(perm.cardId);
            if (!c.keywords.includes('vigilance')) perm.tapped = true;
        }

        // Initialize blocker map
        this.state.combat.blockerMap = {};
        for (const aUID of this.state.combat.attackers) {
            this.state.combat.blockerMap[aUID] = null;
        }

        this.state.phase = 'block_declare';
        this.callbacks.onRender(this.state);

        // Show blocker overlay
        document.getElementById('blocker-overlay').classList.remove('hidden');
        this._renderBlockerOverlay();
    },

    _renderBlockerOverlay() {
        const area = document.getElementById('blocker-area');
        if (!area) return;
        area.innerHTML = '';

        const attackerUIDs = this.state.combat.attackers;
        const playerCreatures = this.state.player.battlefield.filter(p => {
            const c = this._card(p.cardId);
            return c && c.type === 'creature' && !p.tapped;
        });

        for (const aUID of attackerUIDs) {
            const attacker = this.state.opponent.battlefield.find(p => p.uid === aUID);
            if (!attacker) continue;
            const aCard = this._card(attacker.cardId);
            const aPow = this.getPower(attacker);
            const aTgh = this.getToughness(attacker);

            const row = document.createElement('div');
            row.className = 'blocker-row';

            const attackerDiv = document.createElement('div');
            attackerDiv.className = 'blocker-attacker';
            attackerDiv.textContent = `${aCard ? aCard.name : '?'} (${aPow}/${aTgh})`;

            const arrow = document.createElement('div');
            arrow.className = 'blocker-arrow';
            arrow.textContent = '←';

            const blockerDiv = document.createElement('div');
            blockerDiv.className = 'blocker-blocker';
            blockerDiv.id = `blocker-slot-${aUID}`;
            blockerDiv.textContent = '(none)';

            const select = document.createElement('select');
            select.className = 'blocker-assign-btn';
            const noneOpt = document.createElement('option');
            noneOpt.value = '';
            noneOpt.textContent = '— No block —';
            select.appendChild(noneOpt);
            for (const pc of playerCreatures) {
                const pcCard = this._card(pc.cardId);
                const opt = document.createElement('option');
                opt.value = pc.uid;
                opt.textContent = `${pcCard ? pcCard.name : 'Token'} (${this.getPower(pc)}/${this.getToughness(pc)})`;
                select.appendChild(opt);
            }
            select.addEventListener('change', (e) => {
                this.state.combat.blockerMap[aUID] = e.target.value || null;
                blockerDiv.textContent = e.target.value
                    ? (this._card(playerCreatures.find(p => p.uid === e.target.value)?.cardId)?.name || '?')
                    : '(none)';
            });

            row.appendChild(attackerDiv);
            row.appendChild(arrow);
            row.appendChild(blockerDiv);
            row.appendChild(select);
            area.appendChild(row);
        }
    },

    _aiPostCombat() {
        if (this.state.gameOver) return;
        // AI can play more cards after combat (simplified: skip for now)
        this._aiEndTurn();
    },

    _aiEndTurn() {
        if (this.state.gameOver) return;

        // Clear EOT buffs for opponent
        for (const p of this.state.opponent.battlefield) {
            p.tempPowerBuff = 0;
            p.tempToughBuff = 0;
        }
        this.state.opponent.landPlayedThisTurn = false;

        this.callbacks.onLog('Their turn ends.', 'system');
        this.state.phase = 'main';
        this.callbacks.onRender(this.state);

        // Start player's next turn
        setTimeout(() => this.beginPlayerTurn(), 400);
    },

    /* ── Reaction triggers ───────────────────────────────────── */
    _triggerReaction(card) {
        const char = CHARACTERS[this.state.characterId];
        let reaction = null;

        if (card.effect === FX.DEAL_DAMAGE_ANY || card.effect === FX.DEAL_DAMAGE_PLAYER ||
            card.type === 'creature' && this.getPowerFromCard(card) >= 3) {
            reaction = char.dialogue.reaction.aggressive;
        } else if (card.effect === FX.GAIN_LIFE || card.effect === FX.BUFF_CREATURE_EOT) {
            reaction = char.dialogue.reaction.defensive;
        } else if (card.effect === FX.DRAW_CARDS || card.effect === FX.DRAW_SHARED) {
            reaction = char.dialogue.reaction.draw_spell;
        } else if (card.effect === FX.COUNTER_SPELL) {
            reaction = char.dialogue.reaction.counterspell;
        } else if (card.romanticTheme === 'wit' || card.romanticTheme === 'mystery') {
            reaction = char.dialogue.reaction.clever;
        }

        if (reaction) {
            this.callbacks.onReaction(reaction);
        }
    },

    getPowerFromCard(c) { return c.power || 0; },

    /* ── Phase UI helper ─────────────────────────────────────── */
    _updatePhaseUI() {
        const actionsDiv = document.getElementById('phase-actions');
        const phaseLabel = document.getElementById('phase-name');
        const turnLabel  = document.getElementById('phase-turn-label');
        if (!actionsDiv || !phaseLabel) return;

        const t = this.state.turn;
        turnLabel.textContent = `Turn ${t}`;
        actionsDiv.innerHTML = '';

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
                // Buttons are in the overlay
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
        const char = CHARACTERS[characterId];
        const prefs = char.preferences;
        const changes = { love: 0, attraction: 0, inhibition: 0, control: 0 };

        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

        // Normalize metrics to 0–1 scale for weighting
        const dmgNorm   = clamp(metrics.directDamage / 15, 0, 1);
        const lifeNorm  = clamp(metrics.lifeGained   / 10, 0, 1);
        const drawNorm  = clamp(metrics.cardsDrawn   /  6, 0, 1);
        const remNorm   = clamp(metrics.removalsUsed /  3, 0, 1);
        const ctrsNorm  = clamp(metrics.counterspells/  3, 0, 1);
        const creatNorm = clamp(metrics.creaturesPlayed/ 5, 0, 1);

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

        // Win/loss bonuses
        if (metrics.won) {
            for (const stat of ['love','attraction','inhibition','control']) {
                changes[stat] += prefs.winBonus[stat] || 0;
            }
        } else {
            // Close loss (opponent life <= 5 when they win) — show they pushed hard
            if (metrics.opponentLifeAtEnd !== undefined && metrics.opponentLifeAtEnd <= 5) {
                for (const stat of ['love','attraction','inhibition','control']) {
                    changes[stat] += prefs.closeLoss[stat] || 0;
                }
            } else {
                for (const stat of ['love','attraction','inhibition','control']) {
                    changes[stat] += prefs.bigLoss[stat] || 0;
                }
            }
        }

        // Round to 1 decimal
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

        const aggroScore = (metrics.directDamage / 20) + (metrics.creaturesPlayed / 10);
        const controlScore = (metrics.counterspells / 3) + (metrics.removalsUsed / 5) + (metrics.cardsDrawn / 8);
        const nurturingScore = (metrics.lifeGained / 10);
        const colorR_B = ((metrics.colors.R || 0) + (metrics.colors.B || 0)) / (totalCards || 1);
        const colorU_W = ((metrics.colors.U || 0) + (metrics.colors.W || 0)) / (totalCards || 1);

        if (aggroScore > 1.5 && colorR_B > 0.5) return { label: 'Ardent Aggressor', desc: 'You played with fire and fury — direct, passionate, unapologetic.' };
        if (controlScore > 1.2 && colorU_W > 0.5) return { label: 'Thoughtful Schemer', desc: 'You played with precision and patience, always one step ahead.' };
        if (nurturingScore > 0.8) return { label: 'Gentle Caretaker', desc: 'You prioritized stability and healing — a reassuring presence.' };
        if (metrics.counterspells >= 2) return { label: 'Careful Controller', desc: 'You kept them guessing, denying their plans with quiet authority.' };
        if (metrics.creaturesPlayed >= 4) return { label: 'Forceful Presence', desc: 'You filled the field with conviction — hard to ignore.' };
        if (metrics.cardsDrawn >= 5) return { label: 'Curious Mind', desc: 'You sought information, always looking deeper.' };

        return { label: 'Balanced Suitor', desc: 'Your approach was varied and adaptable — genuinely hard to read.' };
    },
};
