/* ═══════════════════════════════════════════════════════════
   Hearts & Mana — UI Renderer
   Handles all screen rendering and DOM interaction
   ═══════════════════════════════════════════════════════════ */

'use strict';

const UI = {

    /* ─────────────────────────────────────────────────────────
       SCREEN: Title
       ───────────────────────────────────────────────────────── */
    // Static — nothing to render dynamically

    /* ─────────────────────────────────────────────────────────
       SCREEN: Character Select
       ───────────────────────────────────────────────────────── */
    renderCharacterSelect(appState) {
        const grid = document.getElementById('character-grid');
        if (!grid) return;
        grid.innerHTML = '';

        for (const charId of Object.keys(CHARACTERS)) {
            const char = CHARACTERS[charId];
            const stats = appState.relationships[charId] || { ...char.initialStats };
            const loveLevel = this._loveLevel(stats.love);

            const card = document.createElement('div');
            card.className = `character-card char-${charId}`;
            card.innerHTML = `
                <div class="char-portrait-small" style="${this._charBg(char)}">${char.art}</div>
                <div class="char-name">${char.name}</div>
                <div class="char-title">${char.title}</div>
                <div class="char-colors">
                    ${char.colors.map(c => `<span class="mana-pip ${c}">${c}</span>`).join('')}
                </div>
                <div class="char-teaser">${this._teaserText(charId, loveLevel)}</div>
                <div style="font-size:0.75rem; color:var(--color-love); margin-top:4px;">
                    ❤ ${Math.round(stats.love)}
                </div>
            `;
            card.addEventListener('click', () => App.selectCharacter(charId));
            grid.appendChild(card);
        }
    },

    _charBg(char) {
        const colorMap = {
            W: 'rgba(200,180,130,0.15)',
            U: 'rgba(70,144,220,0.15)',
            B: 'rgba(140,60,180,0.15)',
            R: 'rgba(200,60,40,0.15)',
            G: 'rgba(50,150,80,0.15)',
        };
        const c = char.colors[0] || 'W';
        return `background: ${colorMap[c]};`;
    },

    _loveLevel(love) {
        if (love < 25) return 'low';
        if (love < 60) return 'medium';
        return 'high';
    },

    _teaserText(charId, level) {
        const teasers = {
            seraphine: {
                low:    'A scholar of duels. She\'s not easily impressed.',
                medium: 'She remembers your games. Not all of them fondly.',
                high:   'She watches for you across the tournament hall.',
            },
            vesper: {
                low:    'She fights for sport. Your challenge means little yet.',
                medium: 'She\'s starting to see something in you. Maybe.',
                high:   'She asks for you by name. Make it worth her while.',
            },
            sylva: {
                low:    'Warm and open. She plays to enjoy the game.',
                medium: 'She smiles when she sees you coming.',
                high:   'She saves you a seat without being asked.',
            },
        };
        return (teasers[charId] && teasers[charId][level]) || '';
    },

    /* ─────────────────────────────────────────────────────────
       SCREEN: Character Profile
       ───────────────────────────────────────────────────────── */
    renderCharacterProfile(appState) {
        const charId = appState.selectedCharacter;
        const char   = CHARACTERS[charId];
        const stats  = appState.relationships[charId] || { ...char.initialStats };
        const level  = this._loveLevel(stats.love);

        // Portrait
        const portrait = document.getElementById('profile-portrait');
        if (portrait) {
            portrait.style.cssText = this._charBg(char);
            portrait.textContent = char.art;
        }

        // Playstyle hint
        const playstyleEl = document.getElementById('profile-playstyle');
        if (playstyleEl) playstyleEl.textContent = char.playstyle;

        // Name and title
        const nameEl = document.getElementById('profile-name');
        if (nameEl) nameEl.textContent = char.name;

        const titleEl = document.getElementById('profile-title-line');
        if (titleEl) titleEl.textContent = char.title;

        const descEl = document.getElementById('profile-description');
        if (descEl) descEl.textContent = char.description;

        // Stats
        this._renderRelationshipStats('profile-stats', stats);

        // Dialogue
        const dialogue = char.dialogue.greeting[level];
        const dlgEl = document.getElementById('profile-dialogue');
        if (dlgEl) dlgEl.textContent = dialogue;
    },

    _renderRelationshipStats(containerId, stats) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="stat-row">
                <div class="stat-label">❤ Love</div>
                <div class="stat-bar-wrap">
                    <div class="stat-bar love" style="width:${stats.love}%"></div>
                </div>
                <div class="stat-value">${Math.round(stats.love)}</div>
            </div>
            <div class="stat-row">
                <div class="stat-label">💕 Attraction</div>
                <div class="stat-bar-wrap">
                    <div class="stat-bar attraction" style="width:${stats.attraction}%"></div>
                </div>
                <div class="stat-value">${Math.round(stats.attraction)}</div>
            </div>
            <div class="stat-row">
                <div class="stat-label">🔒 Inhibition</div>
                <div class="stat-bar-wrap">
                    <div class="stat-bar inhibition" style="width:${stats.inhibition}%"></div>
                </div>
                <div class="stat-value">${Math.round(stats.inhibition)}</div>
            </div>
            <div class="stat-row">
                <div class="stat-label">⚖ Control</div>
                <div class="control-bar-wrap">
                    <div class="control-axis"></div>
                    <div class="control-pip" style="left:${stats.control}%"></div>
                </div>
                <div class="stat-value">${Math.round(stats.control)}</div>
            </div>
            <div class="control-labels" style="padding: 0 0 0 106px;">
                <span>← Yielding</span>
                <span>Dominant →</span>
            </div>
        `;
    },

    /* ─────────────────────────────────────────────────────────
       SCREEN: Deck Select
       ───────────────────────────────────────────────────────── */
    renderDeckSelect(appState) {
        const container = document.getElementById('deck-options');
        if (!container) return;
        container.innerHTML = '';

        for (const deckId of PLAYER_DECKS) {
            const deck = DECKS[deckId];
            const isSelected = appState.selectedDeck === deckId;

            const el = document.createElement('div');
            el.className = `deck-option${isSelected ? ' selected' : ''}`;
            el.innerHTML = `
                <div class="deck-name">${deck.name}</div>
                <div class="deck-colors">
                    ${deck.colors.map(c => `<span class="mana-pip ${c}">${c}</span>`).join('')}
                </div>
                <div class="deck-description">${deck.description}</div>
                <div class="deck-tags">${deck.tags}</div>
            `;
            el.addEventListener('click', () => App.selectDeck(deckId));
            container.appendChild(el);
        }
    },

    /* ─────────────────────────────────────────────────────────
       SCREEN: Game
       ───────────────────────────────────────────────────────── */
    renderGame(state) {
        if (!state) return;
        const char = CHARACTERS[state.characterId];

        // Portrait and name
        const portrait = document.getElementById('game-opponent-portrait');
        if (portrait) {
            portrait.style.cssText = UI._charBg(char);
            portrait.textContent = char.art;
        }
        const nameEl = document.getElementById('game-opponent-name');
        if (nameEl) nameEl.textContent = char.name;

        // Life totals
        const olvEl = document.getElementById('opp-life-value');
        if (olvEl) olvEl.textContent = state.opponent.life;
        const plvEl = document.getElementById('player-life-value');
        if (plvEl) plvEl.textContent = state.player.life;

        // Card counts
        const ohcEl = document.getElementById('opp-hand-count');
        if (ohcEl) ohcEl.textContent = state.opponent.hand.length;
        const olcEl = document.getElementById('opp-library-count');
        if (olcEl) olcEl.textContent = state.opponent.library.length;
        const plcEl = document.getElementById('player-library-count');
        if (plcEl) plcEl.textContent = state.player.library.length;
        const pgcEl = document.getElementById('player-graveyard-count');
        if (pgcEl) pgcEl.textContent = state.player.graveyard.length;
        const hcEl = document.getElementById('hand-count');
        if (hcEl) hcEl.textContent = state.player.hand.length;

        // Mana
        const manaAvail = Engine.getAvailableMana('player');
        const manaTotal = state.player.battlefield.filter(p => {
            const c = CARDS[p.cardId];
            return c && c.type === 'land';
        }).length;
        const maEl = document.getElementById('mana-available');
        if (maEl) maEl.textContent = manaAvail;
        const mtEl = document.getElementById('mana-total');
        if (mtEl) mtEl.textContent = manaTotal;

        // Battlefields
        this._renderBattlefield('opp-battlefield', state.opponent.battlefield, state, 'opponent');
        this._renderBattlefield('player-battlefield', state.player.battlefield, state, 'player');

        // Hand
        this._renderHand(state);

        // Targeting overlay
        this._updateTargetingOverlay(state);
    },

    _renderBattlefield(containerId, permanents, state, role) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        for (const perm of permanents) {
            const el = this._makePermanentEl(perm, state, role);
            container.appendChild(el);
        }
    },

    _makePermanentEl(perm, state, role) {
        const c = CARDS[perm.cardId];
        const isToken = perm.isToken;
        const isCreature = isToken || (c && c.type === 'creature');

        const el = document.createElement('div');
        el.className = 'permanent';
        el.dataset.uid = perm.uid;

        const power    = isToken ? perm.tokenPower    : Engine.getPower(perm);
        const toughness = isToken ? perm.tokenToughness : Engine.getToughness(perm);
        const art      = isToken ? perm.tokenArt : (c ? c.art : '?');
        const name     = isToken ? perm.tokenName : (c ? c.name : '?');
        const isLand   = c && c.type === 'land';

        if (isLand && c) {
            el.classList.add('land-permanent', `land-${c.color}`);
        }

        if (perm.tapped) el.classList.add('tapped');

        // Combat state highlights
        if (state.phase === 'attack_declare' && role === 'player' && isCreature && !perm.tapped) {
            el.classList.add('can-attack');
        }
        if (state.combat.attackers.includes(perm.uid)) {
            el.classList.add('attacker-selected');
        }
        if (state.phase === 'block_declare' && role === 'opponent' && state.combat.attackers.includes(perm.uid)) {
            el.classList.add('valid-block-target');
        }

        // Targeting highlight
        if (state.targeting.active && state.targeting.validTargets && state.targeting.validTargets.includes(perm.uid)) {
            el.classList.add('valid-target');
        }

        // Keywords badges
        const keywords = isToken ? [] : (c ? c.keywords : []);
        const kwHtml = keywords.map(kw => `<span class="kw-badge">${kw[0].toUpperCase()}</span>`).join('');

        el.innerHTML = `
            <div class="permanent-status">${kwHtml}</div>
            <div class="permanent-art">${art}</div>
            <div class="permanent-name">${name}</div>
            ${isCreature ? `<div class="permanent-pt">${power}/${toughness}</div>` : ''}
        `;

        // Click handlers
        if (state.targeting.active && state.targeting.validTargets && state.targeting.validTargets.includes(perm.uid)) {
            el.addEventListener('click', () => Engine.confirmTarget(perm.uid));
        } else if (state.phase === 'attack_declare' && role === 'player') {
            el.addEventListener('click', () => Engine.toggleAttacker(perm.uid));
        } else if (state.phase === 'block_declare' && role === 'player' && isCreature && !perm.tapped) {
            el.addEventListener('click', () => {
                // Handled by blocker overlay select
            });
        }

        return el;
    },

    _renderHand(state) {
        const container = document.getElementById('player-hand');
        if (!container) return;
        container.innerHTML = '';

        for (const inst of state.player.hand) {
            const cardEl = this._makeHandCardEl(inst, state);
            container.appendChild(cardEl);
        }

        // "Opponent player" target button (when targeting)
        if (state.targeting.active && state.targeting.validTargets &&
            state.targeting.validTargets.includes('__opponent_player__')) {
            const btn = document.createElement('button');
            btn.className = 'btn-primary';
            btn.style.cssText = 'align-self: center; margin-left: 20px; animation: pulse-green 1s ease-in-out infinite alternate;';
            btn.textContent = '→ Hit them directly';
            btn.addEventListener('click', () => Engine.confirmTarget('__opponent_player__'));
            container.appendChild(btn);
        }
    },

    _makeHandCardEl(inst, state) {
        const c = CARDS[inst.cardId];
        if (!c) return document.createElement('div');

        const canPlay = Engine.canPlay('player', inst.uid);
        const isTargetable = state.targeting.active && state.targeting.validTargets &&
            state.targeting.validTargets.includes(inst.uid);

        const colorClass = `color-${c.color}`;
        const el = document.createElement('div');
        el.className = `card ${colorClass} ${canPlay ? 'playable' : 'unplayable'} ${isTargetable ? 'valid-target' : ''}`;
        el.dataset.uid = inst.uid;

        // Cost display
        const costHtml = this._makeCostHtml(c);

        // Type line
        const typeLine = [c.type.charAt(0).toUpperCase() + c.type.slice(1), c.subtype].filter(Boolean).join(' — ');

        // Keywords
        const kwHtml = c.keywords.length
            ? `<div class="card-keywords">${c.keywords.map(kw =>
                `<span class="keyword-pip">${kw}</span>`).join('')}</div>`
            : '';

        // Effect text (short description)
        const effectText = this._effectText(c);

        el.innerHTML = `
            <div class="card-header">
                <span class="card-name" title="${c.name}">${c.name}</span>
                <div class="card-cost-display">${costHtml}</div>
            </div>
            <div class="card-art">${c.art || '?'}</div>
            <div class="card-text-area">
                <div class="card-type-line">${typeLine}</div>
                ${kwHtml}
                ${effectText ? `<div class="card-effect-text">${effectText}</div>` : ''}
                <div class="card-flavor-text">${c.flavorText || ''}</div>
            </div>
            ${c.type === 'creature' ? `<div class="card-pt">${c.power}/${c.toughness}</div>` : ''}
        `;

        if (canPlay) {
            el.addEventListener('click', () => Engine.playCard(inst.uid));
        } else if (isTargetable) {
            el.addEventListener('click', () => Engine.confirmTarget(inst.uid));
        }

        return el;
    },

    _makeCostHtml(c) {
        if (c.type === 'land') return '';
        if (c.cost === 0) return `<span class="mana-pip C" style="width:20px;height:20px;font-size:0.6rem">0</span>`;

        // Simplified: show generic mana pip with number
        return `<span class="mana-pip ${c.color}" style="width:20px;height:20px;font-size:0.6rem">${c.cost}</span>`;
    },

    _effectText(c) {
        if (!c.effect) return '';
        const v = c.effectValue;
        const vStr = Array.isArray(v) ? `+${v[0]}/+${v[1]}` : v;
        switch (c.effect) {
            case FX.GAIN_LIFE:           return `Gain ${v} life.`;
            case FX.LOSE_LIFE_DRAW:      return `Draw ${v} cards. Lose ${v} life.`;
            case FX.DRAW_CARDS:          return `Draw ${v} card${v !== 1 ? 's' : ''}.`;
            case FX.DRAW_SHARED:         return `Both draw ${v}. Both gain ${v} life.`;
            case FX.DEAL_DAMAGE_ANY:     return `Deal ${v} damage to any target.`;
            case FX.DEAL_DAMAGE_PLAYER:  return `Deal ${v} damage to opponent.`;
            case FX.DEAL_DAMAGE_CREATURE:return `Deal ${v} damage to target creature.`;
            case FX.DESTROY_CREATURE:    return `Destroy target creature.`;
            case FX.DESTROY_NONLAND:     return `Destroy target non-land permanent.`;
            case FX.OPPONENT_DISCARD:    return `Opponent discards ${v} cards.`;
            case FX.COUNTER_SPELL:       return `Counter target spell.`;
            case FX.BUFF_CREATURE_EOT:   return `Target creature gets ${vStr} until end of turn.`;
            case FX.PUMP_ALL_EOT:        return `All your creatures get +${v}/+0 and haste until EOT.`;
            case FX.ENCHANT_ALL_BUFF:    return `All your creatures get ${vStr}.`;
            case FX.CREATE_TOKENS:       return `Create ${v} 2/2 creature tokens.`;
            case FX.ETB_DRAW:            return `When this enters: draw ${v} card${v !== 1 ? 's' : ''}.`;
            case FX.DIES_DEAL_DAMAGE:    return `When this dies: deal ${v} damage to any target.`;
            default:                     return '';
        }
    },

    _updateTargetingOverlay(state) {
        const overlay = document.getElementById('targeting-overlay');
        const prompt  = document.getElementById('targeting-prompt');
        if (!overlay) return;

        if (state.targeting.active) {
            overlay.classList.remove('hidden');
            const c = CARDS[state.targeting.cardId];
            if (prompt && c) prompt.textContent = `${c.name}: choose a target`;
        } else {
            overlay.classList.add('hidden');
        }
    },

    /* ─────────────────────────────────────────────────────────
       SCREEN: Result
       ───────────────────────────────────────────────────────── */
    renderResult(appState, metrics, gameState, changes) {
        const charId  = appState.selectedCharacter;
        const char    = CHARACTERS[charId];
        const newStats = appState.relationships[charId];
        const won     = metrics.won;
        const level   = this._loveLevel(newStats.love);

        // Portrait
        const portrait = document.getElementById('result-portrait');
        if (portrait) {
            portrait.style.cssText = this._charBg(char);
            portrait.textContent = char.art;
        }

        // Outcome badge
        const badge = document.getElementById('result-outcome-badge');
        if (badge) {
            badge.className = `result-outcome-badge ${won ? 'outcome-win' : 'outcome-loss'}`;
            badge.textContent = won ? 'Victory' : 'Defeat';
        }

        // Title
        const titleEl = document.getElementById('result-title');
        if (titleEl) {
            const lvlLabels = { low: 'Strangers', medium: 'Acquaintances', high: 'Kindred' };
            titleEl.textContent = won
                ? `You bested ${char.name}`
                : `${char.name} prevailed`;
        }

        // Play style analysis
        const analysis = Engine.analyzePlayStyle(metrics);
        const analysisEl = document.getElementById('result-analysis');
        if (analysisEl) {
            analysisEl.innerHTML = `
                <div class="analysis-title">Your Approach</div>
                <div class="playstyle-badge">${analysis.label}</div>
                <div class="analysis-detail">${analysis.desc}</div>
                <div class="analysis-detail" style="margin-top:6px; color: var(--text-muted)">
                    Dealt ${metrics.directDamage} direct damage ·
                    Gained ${metrics.lifeGained} life ·
                    Drew ${metrics.cardsDrawn} cards ·
                    ${metrics.counterspells} counters
                </div>
            `;
        }

        // Relationship changes
        const changesEl = document.getElementById('result-changes');
        if (changesEl) {
            const statLabels = [
                { key: 'love',       label: '❤ Love',       cls: 'love' },
                { key: 'attraction', label: '💕 Attraction', cls: 'attraction' },
                { key: 'inhibition', label: '🔒 Inhibition', cls: 'inhibition' },
                { key: 'control',    label: '⚖ Control',    cls: 'control' },
            ];

            let html = '<div class="changes-title">Relationship Shifts</div>';
            for (const { key, label, cls } of statLabels) {
                const delta = changes[key];
                const posClass = delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'neu';
                const sign = delta > 0 ? '+' : '';
                const barPct = Math.min(100, Math.abs(delta) * 5);
                html += `
                    <div class="change-row">
                        <div class="change-label">${label}</div>
                        <div class="change-amount ${posClass}">${sign}${delta}</div>
                        <div class="change-bar-wrap">
                            <div class="change-bar ${cls}" style="width:${barPct}%"></div>
                        </div>
                        <div class="change-amount" style="width:30px;text-align:right;color:var(--text-muted)">${Math.round(newStats[key])}</div>
                    </div>
                `;
            }
            changesEl.innerHTML = html;
        }

        // Character dialogue
        const dlg = won ? char.dialogue.win[level] : char.dialogue.loss[level];
        const dlgEl = document.getElementById('result-dialogue');
        if (dlgEl) {
            dlgEl.innerHTML = `
                <div class="result-dialogue-speaker">${char.name} says:</div>
                ${dlg}
            `;
        }
    },

    /* ─────────────────────────────────────────────────────────
       LOG
       ───────────────────────────────────────────────────────── */
    addLogEntry(text, type = 'system') {
        const container = document.getElementById('log-entries');
        if (!container) return;
        const el = document.createElement('div');
        el.className = `log-entry ${type}`;
        el.textContent = text;
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;

        // Limit log length
        while (container.children.length > 80) {
            container.removeChild(container.firstChild);
        }
    },

    /* ─────────────────────────────────────────────────────────
       REACTION
       ───────────────────────────────────────────────────────── */
    showReaction(text) {
        const el = document.getElementById('reaction-text');
        if (!el) return;
        el.style.opacity = '0';
        setTimeout(() => {
            el.textContent = text;
            el.style.opacity = '1';
        }, 200);

        // Clear after 4 seconds
        clearTimeout(UI._reactionTimeout);
        UI._reactionTimeout = setTimeout(() => {
            if (el) el.style.opacity = '0';
        }, 4000);
    },

    _reactionTimeout: null,

    /* ─────────────────────────────────────────────────────────
       Utility
       ───────────────────────────────────────────────────────── */
    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`screen-${id}`);
        if (target) target.classList.add('active');
    },
};
