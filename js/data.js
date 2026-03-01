/* ═══════════════════════════════════════════════════════════
   Hearts & Mana — Game Data  (v2)

   Card costs use colored mana format: { W:1, c:2 } = 1W + 2 generic
   "c" = colorless/generic mana (paid with any color)
   Colored pips must be paid with the matching color land.

   Color philosophy:
     W (White)  — Devotion, protection, commitment, tenderness
     U (Blue)   — Wit, mystery, patience, clever understanding
     B (Black)  — Desire, intensity, power dynamics, edge
     R (Red)    — Passion, impulse, raw emotion, heat
     G (Green)  — Openness, growth, vulnerability, nature
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   EFFECT CONSTANTS
   ───────────────────────────────────────────────────────────── */
const FX = {
    PRODUCE_MANA:        'PRODUCE_MANA',
    GAIN_LIFE:           'GAIN_LIFE',
    LOSE_LIFE_DRAW:      'LOSE_LIFE_DRAW',
    DEAL_DAMAGE_ANY:     'DEAL_DAMAGE_ANY',
    DEAL_DAMAGE_PLAYER:  'DEAL_DAMAGE_PLAYER',
    DEAL_DAMAGE_CREATURE:'DEAL_DAMAGE_CREATURE',
    DRAW_CARDS:          'DRAW_CARDS',
    DRAW_SHARED:         'DRAW_SHARED',
    OPPONENT_DISCARD:    'OPPONENT_DISCARD',
    DESTROY_CREATURE:    'DESTROY_CREATURE',
    DESTROY_NONLAND:     'DESTROY_NONLAND',
    BUFF_CREATURE_EOT:   'BUFF_CREATURE_EOT',
    PUMP_ALL_EOT:        'PUMP_ALL_EOT',
    ENCHANT_ALL_BUFF:    'ENCHANT_ALL_BUFF',
    CREATE_TOKENS:       'CREATE_TOKENS',
    COUNTER_SPELL:       'COUNTER_SPELL',
    ETB_DRAW:            'ETB_DRAW',
    ETB_GAIN_LIFE:       'ETB_GAIN_LIFE',
    DIES_DEAL_DAMAGE:    'DIES_DEAL_DAMAGE',
    SCRY_DRAW:           'SCRY_DRAW',       // look at top N, keep any, draw 1
};

/* Compute total mana cost (colored + generic) */
function cmc(cost) {
    if (typeof cost === 'number') return cost;
    return Object.values(cost).reduce((a, b) => a + b, 0);
}

/* ─────────────────────────────────────────────────────────────
   CARD DATABASE
   Cost format: { W:1, c:2 } = pay 1 white + 2 any = 3 total
   ───────────────────────────────────────────────────────────── */
const CARDS = {

    /* ══ LANDS ══════════════════════════════════════════════ */

    hallowed_grounds: {
        id: 'hallowed_grounds', name: 'Hallowed Grounds',
        type: 'land', subtype: 'Plains', color: 'W',
        cost: {}, power: null, toughness: null, keywords: [],
        effect: FX.PRODUCE_MANA, effectValue: 1, effectTarget: 'none',
        art: '⛪', flavorText: "Where devotion takes root, love is never far.",
        romanticTheme: 'devotion',
    },
    reflection_pool: {
        id: 'reflection_pool', name: 'Reflection Pool',
        type: 'land', subtype: 'Island', color: 'U',
        cost: {}, power: null, toughness: null, keywords: [],
        effect: FX.PRODUCE_MANA, effectValue: 1, effectTarget: 'none',
        art: '🫧', flavorText: "Still waters reveal what the heart dares not speak aloud.",
        romanticTheme: 'mystery',
    },
    desires_depths: {
        id: 'desires_depths', name: "Desire's Depths",
        type: 'land', subtype: 'Swamp', color: 'B',
        cost: {}, power: null, toughness: null, keywords: [],
        effect: FX.PRODUCE_MANA, effectValue: 1, effectTarget: 'none',
        art: '🌑', flavorText: "The deeper you go, the more you want.",
        romanticTheme: 'desire',
    },
    passions_peak: {
        id: 'passions_peak', name: "Passion's Peak",
        type: 'land', subtype: 'Mountain', color: 'R',
        cost: {}, power: null, toughness: null, keywords: [],
        effect: FX.PRODUCE_MANA, effectValue: 1, effectTarget: 'none',
        art: '🔥', flavorText: "The summit is not a destination. It is a feeling.",
        romanticTheme: 'passion',
    },
    hearts_grove: {
        id: 'hearts_grove', name: "Heart's Grove",
        type: 'land', subtype: 'Forest', color: 'G',
        cost: {}, power: null, toughness: null, keywords: [],
        effect: FX.PRODUCE_MANA, effectValue: 1, effectTarget: 'none',
        art: '🌿', flavorText: "In the quiet between words, the real conversation begins.",
        romanticTheme: 'nature',
    },

    /* ══ WHITE CREATURES ══════════════════════════════════════ */

    guardians_embrace: {
        id: 'guardians_embrace', name: "Guardian's Embrace",
        type: 'creature', subtype: 'Knight', color: 'W',
        cost: { W:1, c:2 }, power: 2, toughness: 4, keywords: ['lifelink'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🛡️', flavorText: "Holding them close. Keeping the world at bay.",
        romanticTheme: 'protection',
    },
    tender_care: {
        id: 'tender_care', name: 'Tender Care',
        type: 'creature', subtype: 'Cleric', color: 'W',
        cost: { W:1, c:1 }, power: 1, toughness: 3, keywords: ['lifelink'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🕊️', flavorText: "Every small gesture accumulates into something lasting.",
        romanticTheme: 'devotion',
    },
    knight_of_devotion: {
        id: 'knight_of_devotion', name: 'Knight of Devotion',
        type: 'creature', subtype: 'Knight', color: 'W',
        cost: { W:1, c:2 }, power: 2, toughness: 2, keywords: ['vigilance'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '⚔️', flavorText: "Never turning away. Never looking back.",
        romanticTheme: 'devotion',
    },

    /* ══ BLUE CREATURES ══════════════════════════════════════ */

    veiled_desire: {
        id: 'veiled_desire', name: 'Veiled Desire',
        type: 'creature', subtype: 'Faerie', color: 'U',
        cost: { U:1, c:1 }, power: 2, toughness: 2, keywords: ['flying'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🦋', flavorText: "What you can't quite reach only makes you want it more.",
        romanticTheme: 'mystery',
    },
    arcane_scholar: {
        id: 'arcane_scholar', name: 'Arcane Scholar',
        type: 'creature', subtype: 'Wizard', color: 'U',
        cost: { U:1, c:2 }, power: 1, toughness: 3, keywords: [],
        effect: FX.ETB_DRAW, effectValue: 1, effectTarget: 'none',
        art: '📖', flavorText: "Understanding someone deeply is its own form of intimacy.",
        romanticTheme: 'wit',
    },
    phantom_touch: {
        id: 'phantom_touch', name: 'Phantom Touch',
        type: 'creature', subtype: 'Spirit', color: 'U',
        cost: { U:1 }, power: 1, toughness: 1, keywords: ['flying'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '👻', flavorText: "Light as a thought. Persistent as longing.",
        romanticTheme: 'mystery',
    },

    /* ══ BLACK CREATURES ════════════════════════════════════ */

    dark_allure: {
        id: 'dark_allure', name: 'Dark Allure',
        type: 'creature', subtype: 'Rogue', color: 'B',
        cost: { B:1, c:2 }, power: 3, toughness: 2, keywords: [],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🖤', flavorText: "Drawn to the darkness, unable to resist.",
        romanticTheme: 'desire',
    },
    shadow_stalker: {
        id: 'shadow_stalker', name: 'Shadow Stalker',
        type: 'creature', subtype: 'Rogue', color: 'B',
        cost: { B:1, c:1 }, power: 2, toughness: 1, keywords: [],
        effect: FX.DIES_DEAL_DAMAGE, effectValue: 1, effectTarget: 'any',
        art: '🌒', flavorText: "Even in departure, they leave their mark.",
        romanticTheme: 'intensity',
    },
    midnight_temptress: {
        id: 'midnight_temptress', name: 'Midnight Temptress',
        type: 'creature', subtype: 'Vampire', color: 'B',
        cost: { B:1, c:2 }, power: 3, toughness: 1, keywords: ['deathtouch'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🧛', flavorText: "One touch is all it takes.",
        romanticTheme: 'intensity',
    },

    /* ══ RED CREATURES ══════════════════════════════════════ */

    passionate_knight: {
        id: 'passionate_knight', name: 'Passionate Knight',
        type: 'creature', subtype: 'Knight', color: 'R',
        cost: { R:1, c:2 }, power: 3, toughness: 1, keywords: ['haste'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '❤️', flavorText: "Heart on sleeve, charging headlong.",
        romanticTheme: 'passion',
    },
    spark_of_desire: {
        id: 'spark_of_desire', name: 'Spark of Desire',
        type: 'creature', subtype: 'Elemental', color: 'R',
        cost: { R:1, c:1 }, power: 2, toughness: 2, keywords: ['haste'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '✨', flavorText: "Kindled in an instant, burning bright.",
        romanticTheme: 'passion',
    },
    burning_devotee: {
        id: 'burning_devotee', name: 'Burning Devotee',
        type: 'creature', subtype: 'Human', color: 'R',
        cost: { R:1, c:2 }, power: 2, toughness: 3, keywords: [],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🕯️', flavorText: "The fire never dims.",
        romanticTheme: 'devotion',
    },

    /* ══ GREEN CREATURES ════════════════════════════════════ */

    natural_bond: {
        id: 'natural_bond', name: 'Natural Bond',
        type: 'creature', subtype: 'Beast', color: 'G',
        cost: { G:1, c:2 }, power: 3, toughness: 3, keywords: [],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🐺', flavorText: "Simply present with each other, needing no words.",
        romanticTheme: 'nature',
    },
    grove_protector: {
        id: 'grove_protector', name: 'Grove Protector',
        type: 'creature', subtype: 'Elemental', color: 'G',
        cost: { G:1, c:2 }, power: 2, toughness: 4, keywords: [],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🌳', flavorText: "Shelter found in another's presence.",
        romanticTheme: 'protection',
    },
    wild_heart: {
        id: 'wild_heart', name: 'Wild Heart',
        type: 'creature', subtype: 'Beast', color: 'G',
        cost: { G:1, c:3 }, power: 4, toughness: 2, keywords: ['trample'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🦌', flavorText: "Unrestrained. Unstoppable. Honest.",
        romanticTheme: 'nature',
    },

    /* ══ WHITE SPELLS ═════════════════════════════════════════ */

    sacred_vow: {
        id: 'sacred_vow', name: 'Sacred Vow',
        type: 'sorcery', subtype: null, color: 'W',
        cost: { W:1, c:2 }, power: null, toughness: null, keywords: [],
        effect: FX.GAIN_LIFE, effectValue: 6, effectTarget: 'none',
        art: '💍', flavorText: "A promise that outlasts all else.",
        romanticTheme: 'devotion',
    },
    protective_ward: {
        id: 'protective_ward', name: 'Protective Ward',
        type: 'instant', subtype: null, color: 'W',
        cost: { W:1, c:1 }, power: null, toughness: null, keywords: [],
        effect: FX.BUFF_CREATURE_EOT, effectValue: [0, 4], effectTarget: 'your_creature',
        art: '✨', flavorText: "I will not let you fall.",
        romanticTheme: 'protection',
    },
    cleansing_light: {
        id: 'cleansing_light', name: 'Cleansing Light',
        type: 'sorcery', subtype: null, color: 'W',
        cost: { W:1, c:2 }, power: null, toughness: null, keywords: [],
        effect: FX.DESTROY_NONLAND, effectValue: null, effectTarget: 'any_permanent',
        art: '☀️', flavorText: "What blocked the path between you, removed.",
        romanticTheme: 'devotion',
    },

    /* ══ BLUE SPELLS ═════════════════════════════════════════ */

    whispered_riddle: {
        id: 'whispered_riddle', name: 'Whispered Riddle',
        type: 'instant', subtype: null, color: 'U',
        cost: { U:1, c:1 }, power: null, toughness: null, keywords: [],
        effect: FX.COUNTER_SPELL, effectValue: null, effectTarget: 'spell',
        extraEffect: FX.DRAW_CARDS, extraEffectValue: 1,
        art: '💭', flavorText: "Let them wonder what you're thinking.",
        romanticTheme: 'wit',
    },
    knowing_smile: {
        id: 'knowing_smile', name: 'Knowing Smile',
        type: 'instant', subtype: null, color: 'U',
        cost: { U:1, c:1 }, power: null, toughness: null, keywords: [],
        effect: FX.SCRY_DRAW, effectValue: 2, effectTarget: 'none',
        art: '🌊', flavorText: "You already knew. You just waited for the right moment to show it.",
        romanticTheme: 'wit',
    },
    studied_interest: {
        id: 'studied_interest', name: 'Studied Interest',
        type: 'sorcery', subtype: null, color: 'U',
        cost: { U:1, c:3 }, power: null, toughness: null, keywords: [],
        effect: FX.DRAW_CARDS, effectValue: 3, effectTarget: 'none',
        art: '🔭', flavorText: "Knowing them better than they know themselves.",
        romanticTheme: 'wit',
    },

    /* ══ BLACK SPELLS ════════════════════════════════════════ */

    consuming_hunger: {
        id: 'consuming_hunger', name: 'Consuming Hunger',
        type: 'sorcery', subtype: null, color: 'B',
        cost: { B:1, c:2 }, power: null, toughness: null, keywords: [],
        effect: FX.DESTROY_CREATURE, effectValue: null, effectTarget: 'creature',
        art: '🌑', flavorText: "What stands between you and what you want, falls.",
        romanticTheme: 'desire',
    },
    smoldering_glance: {
        id: 'smoldering_glance', name: 'Smoldering Glance',
        type: 'instant', subtype: null, color: 'B',
        cost: { B:1, c:1 }, power: null, toughness: null, keywords: [],
        effect: FX.DEAL_DAMAGE_ANY, effectValue: 2, effectTarget: 'any',
        art: '👁️', flavorText: "A single look that lingers long after they look away.",
        romanticTheme: 'desire',
    },
    claim_what_is_mine: {
        id: 'claim_what_is_mine', name: 'Claim What Is Mine',
        type: 'sorcery', subtype: null, color: 'B',
        cost: { B:1, c:3 }, power: null, toughness: null, keywords: [],
        effect: FX.OPPONENT_DISCARD, effectValue: 2, effectTarget: 'none',
        art: '⛓️', flavorText: "Mine. Now.",
        romanticTheme: 'control',
    },
    dark_bargain: {
        id: 'dark_bargain', name: 'Dark Bargain',
        type: 'sorcery', subtype: null, color: 'B',
        cost: { B:1, c:2 }, power: null, toughness: null, keywords: [],
        effect: FX.LOSE_LIFE_DRAW, effectValue: 3, effectTarget: 'none',
        art: '🩸', flavorText: "Some prices are worth paying.",
        romanticTheme: 'intensity',
    },

    /* ══ RED SPELLS ══════════════════════════════════════════ */

    reckless_affection: {
        id: 'reckless_affection', name: 'Reckless Affection',
        type: 'sorcery', subtype: null, color: 'R',
        cost: { R:1, c:3 }, power: null, toughness: null, keywords: [],
        effect: FX.DEAL_DAMAGE_ANY, effectValue: 4, effectTarget: 'any',
        art: '💥', flavorText: "No restraint. No hesitation. No apology.",
        romanticTheme: 'passion',
    },
    burning_touch: {
        id: 'burning_touch', name: 'Burning Touch',
        type: 'instant', subtype: null, color: 'R',
        cost: { R:1, c:1 }, power: null, toughness: null, keywords: [],
        effect: FX.DEAL_DAMAGE_ANY, effectValue: 2, effectTarget: 'any',
        art: '🔥', flavorText: "Even the briefest contact sets them ablaze.",
        romanticTheme: 'passion',
    },
    fevered_rush: {
        id: 'fevered_rush', name: 'Fevered Rush',
        type: 'instant', subtype: null, color: 'R',
        cost: { R:1, c:2 }, power: null, toughness: null, keywords: [],
        effect: FX.PUMP_ALL_EOT, effectValue: 2, effectTarget: 'none',
        art: '⚡', flavorText: "When the moment takes you, there is nothing else.",
        romanticTheme: 'passion',
    },
    blazing_confession: {
        id: 'blazing_confession', name: 'Blazing Confession',
        type: 'sorcery', subtype: null, color: 'R',
        cost: { R:1, c:2 }, power: null, toughness: null, keywords: [],
        effect: FX.DEAL_DAMAGE_PLAYER, effectValue: 3, effectTarget: 'opponent',
        art: '💌', flavorText: "Words that sear the moment they are spoken.",
        romanticTheme: 'passion',
    },

    /* ══ GREEN SPELLS ════════════════════════════════════════ */

    open_heart: {
        id: 'open_heart', name: 'Open Heart',
        type: 'sorcery', subtype: null, color: 'G',
        cost: { G:1, c:1 }, power: null, toughness: null, keywords: [],
        effect: FX.DRAW_SHARED, effectValue: 2, effectTarget: 'none',
        art: '💚', flavorText: "Vulnerability offered freely is the strongest thing there is.",
        romanticTheme: 'openness',
    },
    wild_instinct: {
        id: 'wild_instinct', name: 'Wild Instinct',
        type: 'instant', subtype: null, color: 'G',
        cost: { G:1, c:2 }, power: null, toughness: null, keywords: [],
        effect: FX.BUFF_CREATURE_EOT, effectValue: [3, 3], effectTarget: 'your_creature',
        art: '🌿', flavorText: "Trust what you feel. It knows before you do.",
        romanticTheme: 'nature',
    },
    growth_together: {
        id: 'growth_together', name: 'Growth Together',
        type: 'enchantment', subtype: null, color: 'G',
        cost: { G:1, c:2 }, power: null, toughness: null, keywords: [],
        effect: FX.ENCHANT_ALL_BUFF, effectValue: [1, 1], effectTarget: 'none',
        art: '🌱', flavorText: "Flourishing in each other's presence.",
        romanticTheme: 'openness',
    },
    verdant_embrace: {
        id: 'verdant_embrace', name: 'Verdant Embrace',
        type: 'sorcery', subtype: null, color: 'G',
        cost: { G:1, c:3 }, power: null, toughness: null, keywords: [],
        effect: FX.CREATE_TOKENS, effectValue: 2, effectTarget: 'none',
        art: '🌸', flavorText: "In togetherness, abundance.",
        romanticTheme: 'nature',
    },

    /* ══ RISQUÉ CARDS ════════════════════════════════════════
       These cards carry a normal game effect AND a relationship
       consequence that depends on the character's current stats.
       Success payoff is large — but failure is a setback.

       risque.stat    — which relationship stat is checked
       risque.dir     — 'above' or 'below' threshold
       risque.thresh  — the stat value boundary
       risque.win     — relationship changes on success
       risque.lose    — relationship changes on failure
    ══════════════════════════════════════════════════════════ */

    bold_confession: {
        id: 'bold_confession', name: 'Bold Confession',
        type: 'sorcery', subtype: null, color: 'R',
        cost: { R:1, c:1 }, power: null, toughness: null, keywords: [],
        effect: FX.DEAL_DAMAGE_PLAYER, effectValue: 2, effectTarget: 'opponent',
        art: '💋', flavorText: "Some feelings refuse to stay contained.",
        romanticTheme: 'passion',
        risque: {
            stat: 'love', dir: 'above', thresh: 30,
            moment: "You speak plainly about how you feel. The game stops.",
            win:  { love: 12, attraction: 10, inhibition: -8, control: 0 },
            lose: { love: -8, attraction: -3, inhibition: 5,  control: 5 },
            winLine:  "Their breath catches. For a moment, the duel is forgotten.",
            loseLine: "Too forward, too soon. They look away, something cooling between you.",
        },
    },

    stolen_glance: {
        id: 'stolen_glance', name: 'Stolen Glance',
        type: 'instant', subtype: null, color: 'B',
        cost: { B:1, c:1 }, power: null, toughness: null, keywords: [],
        effect: FX.SCRY_DRAW, effectValue: 2, effectTarget: 'none',
        art: '👁️', flavorText: "Caught looking. Neither of you looks away.",
        romanticTheme: 'desire',
        risque: {
            stat: 'attraction', dir: 'above', thresh: 40,
            moment: "You hold their gaze a beat too long. You both know what it means.",
            win:  { love: 5, attraction: 12, inhibition: -10, control: -3 },
            lose: { love: 0, attraction: -5, inhibition: 5,   control: 3  },
            winLine:  "They don't pull away. Something shifts between you.",
            loseLine: "They glance aside. The moment passes, uncomfortable.",
        },
    },

    tender_invitation: {
        id: 'tender_invitation', name: 'Tender Invitation',
        type: 'sorcery', subtype: null, color: 'W',
        cost: { W:1, c:2 }, power: null, toughness: null, keywords: [],
        effect: FX.GAIN_LIFE, effectValue: 4, effectTarget: 'none',
        art: '🌹', flavorText: "An offer made. The answer waits in their eyes.",
        romanticTheme: 'devotion',
        risque: {
            stat: 'love', dir: 'above', thresh: 45,
            moment: "You reach across the table and offer your hand. It is more than a gesture.",
            win:  { love: 15, attraction: 5, inhibition: -12, control: -5 },
            lose: { love: -5, attraction: 0, inhibition: 5,   control: 5  },
            winLine:  "They take it. Fingers curl around yours. The duel can wait.",
            loseLine: "They hesitate too long. You withdraw. Not yet.",
        },
    },

    demanding_presence: {
        id: 'demanding_presence', name: 'Demanding Presence',
        type: 'sorcery', subtype: null, color: 'B',
        cost: { B:1, c:3 }, power: null, toughness: null, keywords: [],
        effect: FX.OPPONENT_DISCARD, effectValue: 2, effectTarget: 'none',
        art: '⛓️', flavorText: "You make it clear: this is not a request.",
        romanticTheme: 'control',
        risque: {
            stat: 'control', dir: 'below', thresh: 40,
            moment: "You lean forward. Something in your manner makes the air change.",
            win:  { love: 5, attraction: 15, inhibition: -8, control: -12 },
            lose: { love: -5, attraction: -5, inhibition: 8,  control: 8  },
            winLine:  "Their resistance dissolves into something quieter. You both feel the shift.",
            loseLine: "They push back — hard. They are not yours to command. Not yet. Maybe never.",
        },
    },

    fever_dream: {
        id: 'fever_dream', name: 'Fever Dream',
        type: 'sorcery', subtype: null, color: 'R',
        cost: { R:1, c:3 }, power: null, toughness: null, keywords: [],
        effect: FX.DEAL_DAMAGE_ANY, effectValue: 5, effectTarget: 'any',
        art: '🌡️', flavorText: "Everything burns. Everything.",
        romanticTheme: 'passion',
        risque: {
            stat: 'attraction', dir: 'above', thresh: 55,
            moment: "Your intent is obvious. Unmistakable. You stop pretending otherwise.",
            win:  { love: 5, attraction: 15, inhibition: -15, control: -5 },
            lose: { love: -5, attraction: -8, inhibition: 8,  control: 5  },
            winLine:  "They meet you there. Something gives way. The heat between you is no longer metaphor.",
            loseLine: "They pull back. This was too much, too soon, for who they are right now.",
        },
    },

    open_up_to_me: {
        id: 'open_up_to_me', name: 'Open Up to Me',
        type: 'sorcery', subtype: null, color: 'G',
        cost: { G:1, c:2 }, power: null, toughness: null, keywords: [],
        effect: FX.DRAW_SHARED, effectValue: 2, effectTarget: 'none',
        art: '🌿', flavorText: "Asking for more than they may be ready to give.",
        romanticTheme: 'openness',
        risque: {
            stat: 'inhibition', dir: 'below', thresh: 50,
            moment: "You ask them, simply and honestly, to let you in. The moment stretches.",
            win:  { love: 15, attraction: 5, inhibition: -20, control: -3 },
            lose: { love: 5,  attraction: 0, inhibition: -3,  control: 0  },
            winLine:  "Something in them opens. They tell you something true, something small. It feels enormous.",
            loseLine: "They smile, but it doesn't reach their eyes. Not quite there yet.",
        },
    },
};

/* ─────────────────────────────────────────────────────────────
   DECK DEFINITIONS
   ───────────────────────────────────────────────────────────── */
const DECKS = {

    /* ── Player Decks ─────────────────────────────────────── */

    devotion: {
        id: 'devotion', name: 'Devotion',
        description: "Patient, protective, built on lifelink and commitment. You play for the long game.",
        colors: ['W', 'G'], tags: 'Gentle · Protective · Enduring',
        cards: [
            'hallowed_grounds','hallowed_grounds','hallowed_grounds','hallowed_grounds',
            'hallowed_grounds','hallowed_grounds',
            'hearts_grove','hearts_grove','hearts_grove','hearts_grove',
            'hearts_grove','hearts_grove',
            'guardians_embrace','guardians_embrace','guardians_embrace',
            'tender_care','tender_care','tender_care',
            'knight_of_devotion','knight_of_devotion',
            'grove_protector','grove_protector',
            'natural_bond',
            'sacred_vow','sacred_vow','sacred_vow',
            'protective_ward','protective_ward',
            'open_heart','open_heart',
            'tender_invitation',            // risqué
        ],
    },

    mystique: {
        id: 'mystique', name: 'Mystique',
        description: "Card advantage and counterspells. You always seem to know more than they expect.",
        colors: ['U', 'W'], tags: 'Clever · Reserved · Strategic',
        cards: [
            'reflection_pool','reflection_pool','reflection_pool','reflection_pool',
            'reflection_pool','reflection_pool',
            'hallowed_grounds','hallowed_grounds','hallowed_grounds','hallowed_grounds',
            'hallowed_grounds','hallowed_grounds',
            'veiled_desire','veiled_desire','veiled_desire',
            'arcane_scholar','arcane_scholar','arcane_scholar',
            'phantom_touch','phantom_touch',
            'guardians_embrace','guardians_embrace',
            'whispered_riddle','whispered_riddle','whispered_riddle',
            'knowing_smile','knowing_smile',
            'studied_interest','studied_interest',
            'protective_ward',
            'stolen_glance',                // risqué
        ],
    },

    ardor: {
        id: 'ardor', name: 'Ardor',
        description: "Fast, passionate, direct. You make your feelings known immediately — with force.",
        colors: ['R', 'B'], tags: 'Bold · Intense · Relentless',
        cards: [
            'passions_peak','passions_peak','passions_peak','passions_peak',
            'passions_peak','passions_peak',
            'desires_depths','desires_depths','desires_depths','desires_depths',
            'desires_depths','desires_depths',
            'passionate_knight','passionate_knight','passionate_knight',
            'spark_of_desire','spark_of_desire','spark_of_desire',
            'dark_allure','dark_allure',
            'midnight_temptress','midnight_temptress',
            'reckless_affection','reckless_affection',
            'burning_touch','burning_touch',
            'blazing_confession',
            'smoldering_glance',
            'bold_confession',              // risqué
            'demanding_presence',           // risqué
        ],
    },

    balance: {
        id: 'balance', name: 'Balanced',
        description: "A thoughtful mix of all five colors. Flexible, honest, and genuine.",
        colors: ['W','U','B','R','G'], tags: 'Versatile · Honest · Curious',
        cards: [
            'hallowed_grounds','hallowed_grounds',
            'reflection_pool','reflection_pool',
            'desires_depths','desires_depths',
            'passions_peak','passions_peak',
            'hearts_grove','hearts_grove','hearts_grove','hearts_grove',
            'guardians_embrace','guardians_embrace',
            'veiled_desire',
            'dark_allure',
            'passionate_knight','passionate_knight',
            'natural_bond','natural_bond',
            'grove_protector',
            'tender_care',
            'sacred_vow',
            'whispered_riddle',
            'consuming_hunger',
            'burning_touch','burning_touch',
            'open_heart','open_heart',
            'wild_instinct',
            'open_up_to_me',                // risqué
            'fever_dream',                  // risqué
        ],
    },

    /* ── Character Decks (AI) ─────────────────────────────── */

    seraphine_deck: {
        id: 'seraphine_deck', name: "Seraphine's Deck",
        colors: ['U','W'], cards: [
            'reflection_pool','reflection_pool','reflection_pool','reflection_pool',
            'reflection_pool','reflection_pool',
            'hallowed_grounds','hallowed_grounds','hallowed_grounds','hallowed_grounds',
            'hallowed_grounds','hallowed_grounds',
            'veiled_desire','veiled_desire','veiled_desire',
            'arcane_scholar','arcane_scholar','arcane_scholar',
            'phantom_touch','phantom_touch',
            'guardians_embrace','guardians_embrace',
            'whispered_riddle','whispered_riddle','whispered_riddle',
            'knowing_smile','knowing_smile',
            'studied_interest','studied_interest',
            'protective_ward','protective_ward',
        ],
    },

    vesper_deck: {
        id: 'vesper_deck', name: "Vesper's Deck",
        colors: ['B','R'], cards: [
            'desires_depths','desires_depths','desires_depths','desires_depths',
            'desires_depths','desires_depths',
            'passions_peak','passions_peak','passions_peak','passions_peak',
            'passions_peak','passions_peak',
            'dark_allure','dark_allure','dark_allure',
            'passionate_knight','passionate_knight','passionate_knight',
            'spark_of_desire','spark_of_desire','spark_of_desire',
            'midnight_temptress','midnight_temptress',
            'shadow_stalker','shadow_stalker',
            'reckless_affection','reckless_affection',
            'burning_touch','burning_touch',
            'smoldering_glance','smoldering_glance',
        ],
    },

    sylva_deck: {
        id: 'sylva_deck', name: "Sylva's Deck",
        colors: ['G','W'], cards: [
            'hearts_grove','hearts_grove','hearts_grove','hearts_grove',
            'hearts_grove','hearts_grove',
            'hallowed_grounds','hallowed_grounds','hallowed_grounds','hallowed_grounds',
            'hallowed_grounds','hallowed_grounds',
            'natural_bond','natural_bond','natural_bond',
            'grove_protector','grove_protector','grove_protector',
            'tender_care','tender_care',
            'wild_heart','wild_heart',
            'sacred_vow','sacred_vow',
            'open_heart','open_heart',
            'wild_instinct','wild_instinct',
            'growth_together','growth_together',
        ],
    },
};

/* ─────────────────────────────────────────────────────────────
   CHARACTER DEFINITIONS
   ───────────────────────────────────────────────────────────── */
const CHARACTERS = {

    seraphine: {
        id: 'seraphine',
        name: 'Seraphine Vael',
        title: 'Court Scholar & Duel Theorist',
        description: "Precise, perceptive, and quietly intense. Seraphine has studied dueling as art — and views how someone plays as a window into their character. She is drawn to cleverness and patience; recklessness makes her withdraw.",
        colors: ['U', 'W'],
        art: '🔮',
        playstyle: 'Favors: Control decks, draw spells, counterspells. Dislikes: pure aggression.',
        deckId: 'seraphine_deck',
        initialStats: { love: 15, attraction: 10, inhibition: 72, control: 55 },

        preferences: {
            directDamage:    { love: -0.8, attraction:  0.1, inhibition:  0.5, control:  0.1 },
            lifeGained:      { love:  0.6, attraction:  0.2, inhibition: -0.3, control:  0.2 },
            cardsDrawn:      { love:  1.2, attraction:  0.6, inhibition: -0.7, control: -0.2 },
            removalsUsed:    { love: -0.2, attraction:  0.1, inhibition:  0.2, control: -0.4 },
            counterspells:   { love:  0.8, attraction:  0.5, inhibition: -0.5, control: -0.3 },
            creaturesPlayed: { love:  0.1, attraction:  0.2, inhibition:  0.0, control:  0.0 },
            colorW: { love:  0.4, attraction:  0.1, inhibition: -0.2, control:  0.1 },
            colorU: { love:  1.0, attraction:  0.5, inhibition: -0.6, control: -0.2 },
            colorB: { love: -0.5, attraction:  0.2, inhibition:  0.3, control:  0.1 },
            colorR: { love: -0.8, attraction:  0.3, inhibition:  0.4, control:  0.0 },
            colorG: { love:  0.3, attraction:  0.1, inhibition: -0.3, control: -0.1 },
            winBonus:     { love:  3, attraction:  4, inhibition: -5, control: -4 },
            closeLoss:    { love:  2, attraction:  1, inhibition: -1, control:  2 },
            bigLoss:      { love:  0, attraction: -1, inhibition:  2, control:  4 },
            gracefulLoss: { love:  1, attraction:  0, inhibition:  0, control:  2 },
        },

        dialogue: {
            greeting: {
                low:    "\"Oh. You're challenging me again? ... Very well. Let's see if you've improved.\"",
                medium: "\"I've been looking forward to this, though I'd never admit it.\"",
                high:   "\"You again.\" *small smile* \"I was hoping.\"",
            },
            win: {
                low:    "\"A competent showing. You're learning. Perhaps we'll make a duel of it yet.\"",
                medium: "\"Well played. There were moments where I thought... never mind. Good game.\"",
                high:   "\"I wouldn't say you made it easy.\" *pause* \"I would say I'm... impressed.\"",
            },
            loss: {
                low:    "\"You beat me. I hope you understand what that means. Don't let it go to your head.\"",
                medium: "\"I... that was unexpected. You read my strategy entirely.\" *quiet* \"Well done.\"",
                high:   "\"You beat me at my own game.\" *long pause* \"I find that thoroughly... compelling.\"",
            },
            reaction: {
                aggressive: "\"Brute force. How disappointingly predictable.\"",
                defensive:  "\"A patient approach. Good. Patience suggests depth.\"",
                clever:     "\"Oh. That was...\" *quiet* \"rather well done.\"",
                draw_spell: "\"More information. You understand the value of preparation.\"",
                counterspell: "\"Mirror tactics.\" *the faintest smile* \"I see.\"",
                lifelink:   "\"Sustaining yourself while pressing forward. Disciplined.\"",
                removal:    "\"Efficient. Clinical. I appreciate the precision.\"",
                big_damage: "\"I underestimated you. That won't happen again.\"",
                losing:     "\"Don't think this is over. I'm still thinking.\"",
                winning:    "\"You're playing exactly as I expected. Adjust.\"",
            },
        },
    },

    vesper: {
        id: 'vesper',
        name: 'Vesper Nox',
        title: 'Duelist of the Obsidian Circuit',
        description: "Bold, magnetic, and used to winning. Vesper fights with her whole self — and expects the same from anyone who dares sit across from her. Power earns her respect. Genuine vulnerability earns her heart.",
        colors: ['B', 'R'],
        art: '⚔️',
        playstyle: 'Favors: Aggressive decks, direct damage, fast creatures. Dislikes: slow lifegain decks.',
        deckId: 'vesper_deck',
        initialStats: { love: 10, attraction: 25, inhibition: 28, control: 72 },

        preferences: {
            directDamage:    { love:  0.4, attraction:  1.0, inhibition: -0.6, control: -0.5 },
            lifeGained:      { love: -0.3, attraction: -0.3, inhibition:  0.2, control:  0.3 },
            cardsDrawn:      { love:  0.0, attraction: -0.1, inhibition:  0.0, control:  0.1 },
            removalsUsed:    { love:  0.3, attraction:  0.5, inhibition: -0.4, control: -0.3 },
            counterspells:   { love: -0.2, attraction: -0.2, inhibition:  0.2, control:  0.2 },
            creaturesPlayed: { love:  0.2, attraction:  0.4, inhibition: -0.2, control: -0.2 },
            colorW: { love:  0.0, attraction: -0.2, inhibition:  0.1, control:  0.2 },
            colorU: { love: -0.2, attraction: -0.1, inhibition:  0.1, control:  0.3 },
            colorB: { love:  0.3, attraction:  0.7, inhibition: -0.4, control: -0.3 },
            colorR: { love:  0.5, attraction:  0.9, inhibition: -0.7, control: -0.5 },
            colorG: { love:  0.2, attraction:  0.1, inhibition: -0.2, control:  0.1 },
            winBonus:     { love:  2, attraction:  5, inhibition: -6, control: -5 },
            closeLoss:    { love:  3, attraction:  2, inhibition: -2, control: -1 },
            bigLoss:      { love: -1, attraction: -2, inhibition:  1, control:  3 },
            gracefulLoss: { love:  0, attraction: -1, inhibition:  0, control:  3 },
        },

        dialogue: {
            greeting: {
                low:    "\"You again? Fine. Try to actually challenge me this time.\"",
                medium: "\"*crosses arms* Let's skip the formalities. I'm here to fight.\"",
                high:   "\"I've been waiting. *sharp smile* Don't disappoint me.\"",
            },
            win: {
                low:    "\"Finally. You didn't just roll over. That's... a start.\"",
                medium: "\"Mm. *tilts head* You're getting interesting.\"",
                high:   "\"*quiet for once* That was... actually good. Really good.\"",
            },
            loss: {
                low:    "\"You beat me. So what? Do it again before you celebrate.\"",
                medium: "\"*stares at you* How did you— Fine. That was a real fight.\"",
                high:   "\"*stunned silence* I didn't see it coming. *barely audible* Good.\"",
            },
            reaction: {
                aggressive: "\"Yes. THAT. Do more of that.\"",
                defensive:  "\"If you're waiting for an opening, I'll just keep hitting you.\"",
                clever:     "\"Hm. I did not expect that.\"",
                draw_spell: "\"Reading my moves? Bold.\"",
                counterspell: "\"*irritated* Don't think that trick will work twice.\"",
                lifelink:   "\"Dragging this out. Cowardly.\"",
                removal:    "\"Oh, you like to clear the board? So do I.\"",
                big_damage: "\"*laughs* Now you're speaking my language.\"",
                losing:     "\"*teeth* You got lucky. ONCE.\"",
                winning:    "\"You're mine. You just don't know it yet.\"",
            },
        },
    },

    sylva: {
        id: 'sylva',
        name: 'Sylva Dawnbrook',
        title: 'Wandering Naturalist & Grove Tender',
        description: "Warm, unhurried, and quietly perceptive. Sylva doesn't duel to dominate — she duels to connect. She pays as much attention to how you play as whether you win. Kindness, honesty, and willingness to be vulnerable move her most.",
        colors: ['G', 'W'],
        art: '🌿',
        playstyle: "Favors: Creature decks, lifegain, mutual growth. Dislikes: discard effects and harsh removal.",
        deckId: 'sylva_deck',
        initialStats: { love: 20, attraction: 15, inhibition: 48, control: 50 },

        preferences: {
            directDamage:    { love: -0.4, attraction:  0.1, inhibition:  0.3, control:  0.2 },
            lifeGained:      { love:  0.9, attraction:  0.4, inhibition: -0.5, control: -0.2 },
            cardsDrawn:      { love:  0.3, attraction:  0.2, inhibition: -0.2, control:  0.0 },
            removalsUsed:    { love: -0.6, attraction:  0.0, inhibition:  0.3, control:  0.2 },
            counterspells:   { love: -0.2, attraction:  0.0, inhibition:  0.1, control:  0.1 },
            creaturesPlayed: { love:  0.5, attraction:  0.3, inhibition: -0.3, control: -0.1 },
            colorW: { love:  0.6, attraction:  0.3, inhibition: -0.4, control: -0.1 },
            colorU: { love:  0.1, attraction:  0.1, inhibition:  0.0, control:  0.1 },
            colorB: { love: -0.4, attraction:  0.1, inhibition:  0.2, control:  0.2 },
            colorR: { love: -0.3, attraction:  0.2, inhibition:  0.2, control:  0.1 },
            colorG: { love:  0.8, attraction:  0.4, inhibition: -0.6, control: -0.2 },
            winBonus:     { love:  2, attraction:  3, inhibition: -3, control: -3 },
            closeLoss:    { love:  4, attraction:  2, inhibition: -3, control: -1 },
            bigLoss:      { love:  1, attraction:  0, inhibition:  1, control:  2 },
            gracefulLoss: { love:  3, attraction:  1, inhibition: -2, control: -1 },
        },

        dialogue: {
            greeting: {
                low:    "\"Hello again. I'm glad you came back. Are you ready?\"",
                medium: "\"*smiles warmly* I thought about our last game. Shall we?\"",
                high:   "\"*laughing softly* I was wondering when you'd arrive.\"",
            },
            win: {
                low:    "\"A good game. I liked watching how you thought.\"",
                medium: "\"You play with such... care. It shows.\"",
                high:   "\"*glowing* That was one of the best games I've had. Truly.\"",
            },
            loss: {
                low:    "\"You bested me! But honestly — the way you played was lovely.\"",
                medium: "\"*laughing* I was not expecting that! You've grown so much.\"",
                high:   "\"*quietly, sincerely* I lose to you and I don't mind one bit.\"",
            },
            reaction: {
                aggressive: "\"Oh — that's quite forceful. I'll... adapt.\"",
                defensive:  "\"You're being so careful. I appreciate that.\"",
                clever:     "\"Oh, that was beautiful. Genuinely.\"",
                draw_spell: "\"You're curious. I like that.\"",
                counterspell: "\"*gentle laugh* Foiled! Alright, I see you.\"",
                lifelink:   "\"Taking care of yourself while taking care of the board. Thoughtful.\"",
                removal:    "\"Oh, that was a bit harsh, wasn't it?\"",
                big_damage: "\"*winces* That... stung.\"",
                losing:     "\"You're doing well. I'm proud, even as I try to beat you.\"",
                winning:    "\"*earnestly* I want you to push me, okay? Don't hold back.\"",
            },
        },
    },
};

const PLAYER_DECKS = ['devotion', 'mystique', 'ardor', 'balance'];
