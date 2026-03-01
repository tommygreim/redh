/* ═══════════════════════════════════════════════════════════
   Hearts & Mana — App Controller
   Top-level state management and screen navigation
   ═══════════════════════════════════════════════════════════ */

'use strict';

const App = {

    /* ── Application State ──────────────────────────────────── */
    state: {
        currentScreen: 'title',
        selectedCharacter: null,   // charId
        selectedDeck: 'balance',   // deckId
        relationships: {},         // { charId: { love, attraction, inhibition, control } }
        lastMetrics: null,
        lastChanges: null,
    },

    /* ── Init ────────────────────────────────────────────────── */
    init() {
        // Initialize relationship stats for all characters
        for (const charId of Object.keys(CHARACTERS)) {
            this.state.relationships[charId] = { ...CHARACTERS[charId].initialStats };
        }

        // Load saved state if present
        this._loadState();

        // Show title screen
        UI.showScreen('title');
    },

    /* ── Navigation ──────────────────────────────────────────── */
    showScreen(id) {
        this.state.currentScreen = id;
        UI.showScreen(id);

        switch (id) {
            case 'character-select':
                UI.renderCharacterSelect(this.state);
                break;
            case 'character-profile':
                UI.renderCharacterProfile(this.state);
                break;
            case 'deck-select':
                UI.renderDeckSelect(this.state);
                break;
        }
    },

    selectCharacter(charId) {
        this.state.selectedCharacter = charId;
        this.showScreen('character-profile');
    },

    showCharacterProfile() {
        this.showScreen('character-profile');
    },

    showDeckSelect() {
        UI.renderDeckSelect(this.state);
        this.showScreen('deck-select');
    },

    selectDeck(deckId) {
        this.state.selectedDeck = deckId;
        UI.renderDeckSelect(this.state);
    },

    /* ── Game Start ──────────────────────────────────────────── */
    startGame() {
        const charId  = this.state.selectedCharacter;
        const deckId  = this.state.selectedDeck;

        if (!charId || !deckId) return;

        // Show the game screen first
        UI.showScreen('game');

        // Initialize the engine, passing current relationship stats for risqué checks
        const currentStats = this.state.relationships[charId];

        Engine.init(deckId, charId, {
            onLog:      (text, type) => UI.addLogEntry(text, type),
            onReaction: (text)       => UI.showReaction(text),
            onRender:   (state)      => UI.renderGame(state),
            onGameOver: (metrics, gameState) => this._handleGameOver(metrics, gameState),
            onRisque:   (cardId, outcome, changes, risque) => {
                // Apply immediate stat changes to App state
                const cId = this.state.selectedCharacter;
                const stats = this.state.relationships[cId];
                const updated = {};
                for (const stat of ['love', 'attraction', 'inhibition', 'control']) {
                    updated[stat] = Math.max(0, Math.min(100,
                        Math.round((stats[stat] + (changes[stat] || 0)) * 10) / 10
                    ));
                }
                this.state.relationships[cId] = updated;
                this._saveState();

                // Show the dramatic risqué overlay
                UI.showRisqueResult(cardId, outcome, changes, risque);
            },
        }, currentStats);
    },

    /* ── Game Over ───────────────────────────────────────────── */
    _handleGameOver(metrics, gameState) {
        const charId  = this.state.selectedCharacter;
        const current = this.state.relationships[charId];

        // Record final life totals for close-loss detection
        metrics.opponentLifeAtEnd = gameState.opponent.life;
        metrics.playerLifeAtEnd   = gameState.player.life;

        // Calculate and apply relationship changes
        const changes = Engine.calculateRelationshipChanges(metrics, current, charId);
        this.state.relationships[charId] = Engine.applyChanges(current, changes);
        this.state.lastMetrics = metrics;
        this.state.lastChanges = changes;

        // Save state
        this._saveState();

        // Transition to result screen after a short delay
        setTimeout(() => {
            this.showScreen('result');
            UI.renderResult(this.state, metrics, gameState, changes);
        }, 800);
    },

    /* ── Persistence ─────────────────────────────────────────── */
    _saveState() {
        try {
            localStorage.setItem('heartsAndMana', JSON.stringify({
                relationships: this.state.relationships,
                selectedDeck:  this.state.selectedDeck,
            }));
        } catch (e) {
            // Ignore storage errors
        }
    },

    _loadState() {
        try {
            const raw = localStorage.getItem('heartsAndMana');
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (saved.relationships) {
                for (const charId of Object.keys(saved.relationships)) {
                    if (this.state.relationships[charId]) {
                        this.state.relationships[charId] = saved.relationships[charId];
                    }
                }
            }
            if (saved.selectedDeck) {
                this.state.selectedDeck = saved.selectedDeck;
            }
        } catch (e) {
            // Ignore
        }
    },

    resetProgress() {
        for (const charId of Object.keys(CHARACTERS)) {
            this.state.relationships[charId] = { ...CHARACTERS[charId].initialStats };
        }
        this._saveState();
        this.showScreen('character-select');
    },
};

/* ─────────────────────────────────────────────────────────────
   Bootstrap
   ───────────────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
    App.init();
});
