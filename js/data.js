/* ═══════════════════════════════════════════════════════════
   Hearts & Mana — Game Data
   Cards, Characters, and Decks

   Color philosophy:
     W (White)  — Devotion, commitment, protection, tenderness
     U (Blue)   — Wit, mystery, patience, clever understanding
     B (Black)  — Desire, intensity, power dynamics, edge
     R (Red)    — Passion, impulse, raw emotion, heat
     G (Green)  — Nature, openness, growth, shared vulnerability
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   EFFECT CONSTANTS
   ───────────────────────────────────────────────────────────── */
const FX = {
    // Lands
    PRODUCE_MANA:        'PRODUCE_MANA',

    // Life
    GAIN_LIFE:           'GAIN_LIFE',
    LOSE_LIFE_DRAW:      'LOSE_LIFE_DRAW',      // draw N, lose N life

    // Damage
    DEAL_DAMAGE_ANY:     'DEAL_DAMAGE_ANY',      // target: any creature or player
    DEAL_DAMAGE_PLAYER:  'DEAL_DAMAGE_PLAYER',   // target: opponent only
    DEAL_DAMAGE_CREATURE:'DEAL_DAMAGE_CREATURE', // target: any creature

    // Cards
    DRAW_CARDS:          'DRAW_CARDS',
    DRAW_SHARED:         'DRAW_SHARED',          // both players draw N, both gain N life
    OPPONENT_DISCARD:    'OPPONENT_DISCARD',      // opponent discards N cards

    // Removal
    DESTROY_CREATURE:    'DESTROY_CREATURE',     // destroy target creature
    DESTROY_NONLAND:     'DESTROY_NONLAND',      // destroy target non-land permanent

    // Buffs
    BUFF_CREATURE_EOT:   'BUFF_CREATURE_EOT',    // target creature +N/+M until EOT
    PUMP_ALL_EOT:        'PUMP_ALL_EOT',         // all your creatures +N/+0 & haste EOT
    ENCHANT_ALL_BUFF:    'ENCHANT_ALL_BUFF',     // enchantment: all your creatures get +1/+1

    // Other
    CREATE_TOKENS:       'CREATE_TOKENS',        // create N 2/2 green tokens
    COUNTER_SPELL:       'COUNTER_SPELL',        // counter target spell

    // ETB triggers (on creatures)
    ETB_DRAW:            'ETB_DRAW',             // draw N when creature enters
    ETB_GAIN_LIFE:       'ETB_GAIN_LIFE',
    DIES_DEAL_DAMAGE:    'DIES_DEAL_DAMAGE',     // deal N damage when dies
};

/* ─────────────────────────────────────────────────────────────
   CARD DATABASE
   ───────────────────────────────────────────────────────────── */
const CARDS = {

    /* ══ LANDS ══════════════════════════════════════════ */

    hallowed_grounds: {
        id: 'hallowed_grounds', name: 'Hallowed Grounds',
        type: 'land', subtype: 'Plains', color: 'W',
        cost: 0, power: null, toughness: null, keywords: [],
        effect: FX.PRODUCE_MANA, effectValue: 1, effectTarget: 'none',
        art: '⛪', flavorText: 'Where devotion takes root, love is never far.',
        romanticTheme: 'devotion',
    },

    reflection_pool: {
        id: 'reflection_pool', name: 'Reflection Pool',
        type: 'land', subtype: 'Island', color: 'U',
        cost: 0, power: null, toughness: null, keywords: [],
        effect: FX.PRODUCE_MANA, effectValue: 1, effectTarget: 'none',
        art: '🫧', flavorText: 'Still waters reveal what the heart dares not speak aloud.',
        romanticTheme: 'mystery',
    },

    desires_depths: {
        id: 'desires_depths', name: "Desire's Depths",
        type: 'land', subtype: 'Swamp', color: 'B',
        cost: 0, power: null, toughness: null, keywords: [],
        effect: FX.PRODUCE_MANA, effectValue: 1, effectTarget: 'none',
        art: '🌑', flavorText: 'The deeper you go, the more you want.',
        romanticTheme: 'desire',
    },

    passions_peak: {
        id: 'passions_peak', name: "Passion's Peak",
        type: 'land', subtype: 'Mountain', color: 'R',
        cost: 0, power: null, toughness: null, keywords: [],
        effect: FX.PRODUCE_MANA, effectValue: 1, effectTarget: 'none',
        art: '🔥', flavorText: 'The summit is not a destination. It is a feeling.',
        romanticTheme: 'passion',
    },

    hearts_grove: {
        id: 'hearts_grove', name: "Heart's Grove",
        type: 'land', subtype: 'Forest', color: 'G',
        cost: 0, power: null, toughness: null, keywords: [],
        effect: FX.PRODUCE_MANA, effectValue: 1, effectTarget: 'none',
        art: '🌿', flavorText: 'In the quiet between words, the real conversation begins.',
        romanticTheme: 'nature',
    },

    /* ══ WHITE CREATURES ════════════════════════════════ */

    guardians_embrace: {
        id: 'guardians_embrace', name: "Guardian's Embrace",
        type: 'creature', subtype: 'Knight', color: 'W',
        cost: 3, power: 2, toughness: 4,
        keywords: ['lifelink'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🛡️', flavorText: 'To shield another completely is the most intimate act.',
        romanticTheme: 'protection',
    },

    tender_care: {
        id: 'tender_care', name: 'Tender Care',
        type: 'creature', subtype: 'Cleric', color: 'W',
        cost: 2, power: 1, toughness: 3,
        keywords: ['lifelink'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🕊️', flavorText: 'Every small gesture accumulates into something lasting.',
        romanticTheme: 'devotion',
    },

    knight_of_devotion: {
        id: 'knight_of_devotion', name: 'Knight of Devotion',
        type: 'creature', subtype: 'Knight', color: 'W',
        cost: 3, power: 2, toughness: 2,
        keywords: ['vigilance'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '⚔️', flavorText: 'Never turning away, never looking back.',
        romanticTheme: 'devotion',
    },

    /* ══ BLUE CREATURES ══════════════════════════════════ */

    veiled_desire: {
        id: 'veiled_desire', name: 'Veiled Desire',
        type: 'creature', subtype: 'Faerie', color: 'U',
        cost: 2, power: 2, toughness: 2,
        keywords: ['flying'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🦋', flavorText: 'What you can't quite reach only makes you want it more.',
        romanticTheme: 'mystery',
    },

    arcane_scholar: {
        id: 'arcane_scholar', name: 'Arcane Scholar',
        type: 'creature', subtype: 'Wizard', color: 'U',
        cost: 3, power: 1, toughness: 3,
        keywords: [],
        effect: FX.ETB_DRAW, effectValue: 1, effectTarget: 'none',
        art: '📖', flavorText: 'Understanding someone deeply is its own form of intimacy.',
        romanticTheme: 'wit',
    },

    phantom_touch: {
        id: 'phantom_touch', name: 'Phantom Touch',
        type: 'creature', subtype: 'Spirit', color: 'U',
        cost: 1, power: 1, toughness: 1,
        keywords: ['flying'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '👻', flavorText: 'Light as a thought. Persistent as longing.',
        romanticTheme: 'mystery',
    },

    /* ══ BLACK CREATURES ════════════════════════════════ */

    dark_allure: {
        id: 'dark_allure', name: 'Dark Allure',
        type: 'creature', subtype: 'Rogue', color: 'B',
        cost: 3, power: 3, toughness: 2,
        keywords: [],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🖤', flavorText: 'Drawn to the darkness, unable to resist.',
        romanticTheme: 'desire',
    },

    shadow_stalker: {
        id: 'shadow_stalker', name: 'Shadow Stalker',
        type: 'creature', subtype: 'Rogue', color: 'B',
        cost: 2, power: 2, toughness: 1,
        keywords: [],
        effect: FX.DIES_DEAL_DAMAGE, effectValue: 1, effectTarget: 'any',
        art: '🌒', flavorText: 'Even in departure, they leave their mark.',
        romanticTheme: 'intensity',
    },

    midnight_temptress: {
        id: 'midnight_temptress', name: 'Midnight Temptress',
        type: 'creature', subtype: 'Vampire', color: 'B',
        cost: 3, power: 3, toughness: 1,
        keywords: ['deathtouch'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🧛', flavorText: 'One touch is all it takes.',
        romanticTheme: 'intensity',
    },

    /* ══ RED CREATURES ══════════════════════════════════ */

    passionate_knight: {
        id: 'passionate_knight', name: 'Passionate Knight',
        type: 'creature', subtype: 'Knight', color: 'R',
        cost: 3, power: 3, toughness: 1,
        keywords: ['haste'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '❤️‍🔥', flavorText: 'Heart on sleeve, charging headlong.',
        romanticTheme: 'passion',
    },

    spark_of_desire: {
        id: 'spark_of_desire', name: 'Spark of Desire',
        type: 'creature', subtype: 'Elemental', color: 'R',
        cost: 2, power: 2, toughness: 2,
        keywords: ['haste'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '✨', flavorText: 'Kindled in an instant, burning bright.',
        romanticTheme: 'passion',
    },

    burning_devotee: {
        id: 'burning_devotee', name: 'Burning Devotee',
        type: 'creature', subtype: 'Human', color: 'R',
        cost: 3, power: 2, toughness: 3,
        keywords: [],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🕯️', flavorText: 'The fire never dims.',
        romanticTheme: 'devotion',
    },

    /* ══ GREEN CREATURES ════════════════════════════════ */

    natural_bond: {
        id: 'natural_bond', name: 'Natural Bond',
        type: 'creature', subtype: 'Beast', color: 'G',
        cost: 3, power: 3, toughness: 3,
        keywords: [],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🐺', flavorText: 'Simply present with each other, needing no words.',
        romanticTheme: 'nature',
    },

    grove_protector: {
        id: 'grove_protector', name: 'Grove Protector',
        type: 'creature', subtype: 'Elemental', color: 'G',
        cost: 3, power: 2, toughness: 4,
        keywords: [],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🌳', flavorText: 'Shelter found in another\'s presence.',
        romanticTheme: 'protection',
    },

    wild_heart: {
        id: 'wild_heart', name: 'Wild Heart',
        type: 'creature', subtype: 'Beast', color: 'G',
        cost: 4, power: 4, toughness: 2,
        keywords: ['trample'],
        effect: null, effectValue: null, effectTarget: 'none',
        art: '🦌', flavorText: 'Unrestrained. Unstoppable. Honest.',
        romanticTheme: 'nature',
    },

    /* ══ WHITE SPELLS ════════════════════════════════════ */

    sacred_vow: {
        id: 'sacred_vow', name: 'Sacred Vow',
        type: 'sorcery', subtype: null, color: 'W',
        cost: 3, power: null, toughness: null, keywords: [],
        effect: FX.GAIN_LIFE, effectValue: 6, effectTarget: 'none',
        art: '💍', flavorText: 'A promise that outlasts all else.',
        romanticTheme: 'devotion',
    },

    protective_ward: {
        id: 'protective_ward', name: 'Protective Ward',
        type: 'instant', subtype: null, color: 'W',
        cost: 2, power: null, toughness: null, keywords: [],
        effect: FX.BUFF_CREATURE_EOT, effectValue: [0, 4], effectTarget: 'your_creature',
        art: '✨', flavorText: 'I will not let you fall.',
        romanticTheme: 'protection',
    },

    cleansing_light: {
        id: 'cleansing_light', name: 'Cleansing Light',
        type: 'sorcery', subtype: null, color: 'W',
        cost: 3, power: null, toughness: null, keywords: [],
        effect: FX.DESTROY_NONLAND, effectValue: null, effectTarget: 'any_permanent',
        art: '☀️', flavorText: 'What was tarnished, made pure. What blocked the path, removed.',
        romanticTheme: 'devotion',
    },

    /* ══ BLUE SPELLS ════════════════════════════════════ */

    whispered_riddle: {
        id: 'whispered_riddle', name: 'Whispered Riddle',
        type: 'instant', subtype: null, color: 'U',
        cost: 2, power: null, toughness: null, keywords: [],
        effect: FX.COUNTER_SPELL, effectValue: 1, effectTarget: 'spell',
        extraEffect: FX.DRAW_CARDS, extraEffectValue: 1,
        art: '💭', flavorText: 'Let them wonder what you\'re thinking.',
        romanticTheme: 'wit',
    },

    clever_deflection: {
        id: 'clever_deflection', name: 'Clever Deflection',
        type: 'instant', subtype: null, color: 'U',
        cost: 1, power: null, toughness: null, keywords: [],
        effect: FX.COUNTER_SPELL, effectValue: null, effectTarget: 'spell',
        art: '🌊', flavorText: 'Never quite where you expect.',
        romanticTheme: 'wit',
    },

    studied_interest: {
        id: 'studied_interest', name: 'Studied Interest',
        type: 'sorcery', subtype: null, color: 'U',
        cost: 4, power: null, toughness: null, keywords: [],
        effect: FX.DRAW_CARDS, effectValue: 3, effectTarget: 'none',
        art: '🔭', flavorText: 'Knowing them better than they know themselves.',
        romanticTheme: 'wit',
    },

    /* ══ BLACK SPELLS ════════════════════════════════════ */

    consuming_hunger: {
        id: 'consuming_hunger', name: 'Consuming Hunger',
        type: 'sorcery', subtype: null, color: 'B',
        cost: 3, power: null, toughness: null, keywords: [],
        effect: FX.DESTROY_CREATURE, effectValue: null, effectTarget: 'creature',
        art: '🌑', flavorText: 'What you desire, you claim. What stands in your way, falls.',
        romanticTheme: 'desire',
    },

    smoldering_glance: {
        id: 'smoldering_glance', name: 'Smoldering Glance',
        type: 'instant', subtype: null, color: 'B',
        cost: 2, power: null, toughness: null, keywords: [],
        effect: FX.DEAL_DAMAGE_ANY, effectValue: 2, effectTarget: 'any',
        art: '👁️', flavorText: 'A single look that lingers long after they look away.',
        romanticTheme: 'desire',
    },

    claim_what_is_mine: {
        id: 'claim_what_is_mine', name: 'Claim What Is Mine',
        type: 'sorcery', subtype: null, color: 'B',
        cost: 4, power: null, toughness: null, keywords: [],
        effect: FX.OPPONENT_DISCARD, effectValue: 2, effectTarget: 'none',
        art: '⛓️', flavorText: 'Mine. Now.',
        romanticTheme: 'control',
    },

    dark_bargain: {
        id: 'dark_bargain', name: 'Dark Bargain',
        type: 'sorcery', subtype: null, color: 'B',
        cost: 3, power: null, toughness: null, keywords: [],
        effect: FX.LOSE_LIFE_DRAW, effectValue: 3, effectTarget: 'none',
        art: '🩸', flavorText: 'Some prices are worth paying.',
        romanticTheme: 'intensity',
    },

    /* ══ RED SPELLS ════════════════════════════════════ */

    reckless_affection: {
        id: 'reckless_affection', name: 'Reckless Affection',
        type: 'sorcery', subtype: null, color: 'R',
        cost: 4, power: null, toughness: null, keywords: [],
        effect: FX.DEAL_DAMAGE_ANY, effectValue: 4, effectTarget: 'any',
        art: '💥', flavorText: 'No restraint. No hesitation. No apology.',
        romanticTheme: 'passion',
    },

    burning_touch: {
        id: 'burning_touch', name: 'Burning Touch',
        type: 'instant', subtype: null, color: 'R',
        cost: 2, power: null, toughness: null, keywords: [],
        effect: FX.DEAL_DAMAGE_ANY, effectValue: 2, effectTarget: 'any',
        art: '🔥', flavorText: 'Even the briefest contact sets them ablaze.',
        romanticTheme: 'passion',
    },

    fevered_rush: {
        id: 'fevered_rush', name: 'Fevered Rush',
        type: 'instant', subtype: null, color: 'R',
        cost: 3, power: null, toughness: null, keywords: [],
        effect: FX.PUMP_ALL_EOT, effectValue: 2, effectTarget: 'none',
        art: '⚡', flavorText: 'When the moment takes you, there is nothing else.',
        romanticTheme: 'passion',
    },

    blazing_confession: {
        id: 'blazing_confession', name: 'Blazing Confession',
        type: 'sorcery', subtype: null, color: 'R',
        cost: 3, power: null, toughness: null, keywords: [],
        effect: FX.DEAL_DAMAGE_PLAYER, effectValue: 3, effectTarget: 'opponent',
        art: '💌', flavorText: 'Words that sear the moment they are spoken.',
        romanticTheme: 'passion',
    },

    /* ══ GREEN SPELLS ════════════════════════════════════ */

    open_heart: {
        id: 'open_heart', name: 'Open Heart',
        type: 'sorcery', subtype: null, color: 'G',
        cost: 2, power: null, toughness: null, keywords: [],
        effect: FX.DRAW_SHARED, effectValue: 2, effectTarget: 'none',
        art: '💚', flavorText: 'Vulnerability, offered freely, is the strongest thing there is.',
        romanticTheme: 'openness',
    },

    wild_instinct: {
        id: 'wild_instinct', name: 'Wild Instinct',
        type: 'instant', subtype: null, color: 'G',
        cost: 3, power: null, toughness: null, keywords: [],
        effect: FX.BUFF_CREATURE_EOT, effectValue: [3, 3], effectTarget: 'your_creature',
        art: '🌿', flavorText: 'Trust what you feel. It knows before you do.',
        romanticTheme: 'nature',
    },

    growth_together: {
        id: 'growth_together', name: 'Growth Together',
        type: 'enchantment', subtype: null, color: 'G',
        cost: 3, power: null, toughness: null, keywords: [],
        effect: FX.ENCHANT_ALL_BUFF, effectValue: [1, 1], effectTarget: 'none',
        art: '🌱', flavorText: 'Flourishing in each other\'s presence.',
        romanticTheme: 'openness',
    },

    verdant_embrace: {
        id: 'verdant_embrace', name: 'Verdant Embrace',
        type: 'sorcery', subtype: null, color: 'G',
        cost: 4, power: null, toughness: null, keywords: [],
        effect: FX.CREATE_TOKENS, effectValue: 2, effectTarget: 'none',
        art: '🌸', flavorText: 'In togetherness, abundance.',
        romanticTheme: 'nature',
    },
};

/* ─────────────────────────────────────────────────────────────
   DECK DEFINITIONS  (array of card IDs, duplicates allowed)
   ───────────────────────────────────────────────────────────── */
const DECKS = {
    /* Player decks — four archetypes to choose from */

    devotion: {
        id: 'devotion',
        name: 'Devotion',
        description: 'A patient, protective style built on lifelink and steady commitment. You play the long game.',
        colors: ['W', 'G'],
        tags: 'Gentle · Protective · Enduring',
        cards: [
            // Lands (12)
            'hallowed_grounds','hallowed_grounds','hallowed_grounds','hallowed_grounds',
            'hallowed_grounds','hallowed_grounds',
            'hearts_grove','hearts_grove','hearts_grove','hearts_grove',
            'hearts_grove','hearts_grove',
            // Creatures (11)
            'guardians_embrace','guardians_embrace','guardians_embrace',
            'tender_care','tender_care','tender_care',
            'knight_of_devotion','knight_of_devotion',
            'grove_protector','grove_protector',
            'natural_bond',
            // Spells (7)
            'sacred_vow','sacred_vow','sacred_vow',
            'protective_ward','protective_ward',
            'open_heart','open_heart',
        ],
    },

    mystique: {
        id: 'mystique',
        name: 'Mystique',
        description: 'Card advantage and counterspells. You always seem to know more than they expect.',
        colors: ['U', 'W'],
        tags: 'Clever · Reserved · Strategic',
        cards: [
            // Lands (12)
            'reflection_pool','reflection_pool','reflection_pool','reflection_pool',
            'reflection_pool','reflection_pool',
            'hallowed_grounds','hallowed_grounds','hallowed_grounds','hallowed_grounds',
            'hallowed_grounds','hallowed_grounds',
            // Creatures (8)
            'veiled_desire','veiled_desire','veiled_desire',
            'arcane_scholar','arcane_scholar','arcane_scholar',
            'phantom_touch','phantom_touch',
            // Spells (10)
            'whispered_riddle','whispered_riddle','whispered_riddle',
            'clever_deflection','clever_deflection','clever_deflection',
            'studied_interest','studied_interest',
            'protective_ward',
            'sacred_vow',
        ],
    },

    ardor: {
        id: 'ardor',
        name: 'Ardor',
        description: 'Fast, passionate, and direct. You make your feelings known immediately — with force.',
        colors: ['R', 'B'],
        tags: 'Bold · Intense · Relentless',
        cards: [
            // Lands (12)
            'passions_peak','passions_peak','passions_peak','passions_peak',
            'passions_peak','passions_peak',
            'desires_depths','desires_depths','desires_depths','desires_depths',
            'desires_depths','desires_depths',
            // Creatures (10)
            'passionate_knight','passionate_knight','passionate_knight',
            'spark_of_desire','spark_of_desire','spark_of_desire',
            'dark_allure','dark_allure',
            'midnight_temptress','midnight_temptress',
            // Spells (8)
            'reckless_affection','reckless_affection',
            'burning_touch','burning_touch','burning_touch',
            'blazing_confession','blazing_confession',
            'smoldering_glance',
        ],
    },

    balance: {
        id: 'balance',
        name: 'Balanced',
        description: 'A thoughtful mix of all five colors. Flexible, honest, and genuine.',
        colors: ['W','U','B','R','G'],
        tags: 'Versatile · Honest · Curious',
        cards: [
            // Lands (12)
            'hallowed_grounds','hallowed_grounds',
            'reflection_pool','reflection_pool',
            'desires_depths','desires_depths',
            'passions_peak','passions_peak',
            'hearts_grove','hearts_grove','hearts_grove','hearts_grove',
            // Creatures (10)
            'guardians_embrace','guardians_embrace',
            'veiled_desire',
            'dark_allure',
            'passionate_knight','passionate_knight',
            'natural_bond','natural_bond',
            'grove_protector',
            'tender_care',
            // Spells (8)
            'sacred_vow',
            'whispered_riddle',
            'consuming_hunger',
            'burning_touch','burning_touch',
            'open_heart','open_heart',
            'wild_instinct',
        ],
    },

    /* ──────────────────────────────────────────────────
       CHARACTER DECKS  (AI opponents)
    ────────────────────────────────────────────────── */

    /* Seraphine: Blue/White control — patient, methodical */
    seraphine_deck: {
        id: 'seraphine_deck', name: 'Seraphine\'s Deck',
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
            'clever_deflection','clever_deflection',
            'studied_interest','studied_interest',
            'protective_ward','protective_ward',
        ],
    },

    /* Vesper: Black/Red aggro — fast and domineering */
    vesper_deck: {
        id: 'vesper_deck', name: 'Vesper\'s Deck',
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

    /* Sylva: Green/White midrange — balanced and nurturing */
    sylva_deck: {
        id: 'sylva_deck', name: 'Sylva\'s Deck',
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

/*
  Relationship stats:
    love        0–100  — general affection and emotional connection
    attraction  0–100  — physical and romantic interest
    inhibition  0–100  — how reserved/guarded they are (high = closed off)
    control     0–100  — their dominance tendency (50 = neutral; <50 = yielding; >50 = domineering)

  Preference weights — how each play-metric shifts their stats.
  Applied per game as: change = weight × normalized_metric_value
*/
const CHARACTERS = {

    seraphine: {
        id: 'seraphine',
        name: 'Seraphine Vael',
        title: 'Court Scholar & Duel Theorist',
        description: 'Precise, perceptive, and quietly intense. Seraphine has studied dueling as art — and views how someone plays as a window into their character. She is drawn to cleverness and patience; recklessness makes her withdraw.',
        colors: ['U', 'W'],
        art: '🔮',
        cssClass: 'char-seraphine',
        playstyle: 'Favors: Control decks, draw spells, counterspells. Dislikes: pure aggression.',
        deckId: 'seraphine_deck',

        initialStats: { love: 15, attraction: 10, inhibition: 72, control: 55 },

        // How game metrics shift her stats (multipliers applied to normalized values)
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
            // Win/loss multipliers applied once per game
            winBonus:        { love:  3,   attraction:  4,   inhibition: -5,   control: -4   },
            closeLoss:       { love:  2,   attraction:  1,   inhibition: -1,   control:  2   },
            bigLoss:         { love:  0,   attraction: -1,   inhibition:  2,   control:  4   },
            gracefulLoss:    { love:  1,   attraction:  0,   inhibition:  0,   control:  2   },
        },

        dialogue: {
            greeting: {
                low:    '"Oh. You\'re challenging me again? ... Very well. Let\'s see if you\'ve improved."',
                medium: '"I\'ve been looking forward to this, though I\'d never admit it."',
                high:   '"You again. *small smile* I was hoping."',
            },
            win: {
                low:    '"A competent showing. You\'re learning. Perhaps we\'ll make a duel of it yet."',
                medium: '"Well played. There were moments where I thought... never mind. Good game."',
                high:   '"I wouldn\'t say you made it easy. *pause* I would say I\'m... impressed."',
            },
            loss: {
                low:    '"You beat me. I hope you understand what that means. Don\'t let it go to your head."',
                medium: '"I... that was unexpected. You read my strategy entirely. *quiet* Well done."',
                high:   '"You beat me at my own game. *long pause* I find that thoroughly... compelling."',
            },
            reaction: {
                aggressive: '"Brute force. How disappointingly predictable."',
                defensive:  '"A patient approach. Good. Patience suggests depth."',
                clever:     '"Oh. That was... *quiet* rather well done."',
                draw_spell: '"More information. You understand the value of preparation."',
                counterspell: '"Mirror tactics. *the faintest smile* I see."',
            },
        },
    },

    vesper: {
        id: 'vesper',
        name: 'Vesper Nox',
        title: 'Duelist of the Obsidian Circuit',
        description: 'Bold, magnetic, and used to winning. Vesper fights with her whole self — and expects the same from anyone who dares sit across from her. She has little patience for hesitation and even less for weakness. Power earns her respect. Genuine vulnerability earns her heart.',
        colors: ['B', 'R'],
        art: '⚔️',
        cssClass: 'char-vesper',
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
            winBonus:        { love:  2,   attraction:  5,   inhibition: -6,   control: -5   },
            closeLoss:       { love:  3,   attraction:  2,   inhibition: -2,   control: -1   },
            bigLoss:         { love: -1,   attraction: -2,   inhibition:  1,   control:  3   },
            gracefulLoss:    { love:  0,   attraction: -1,   inhibition:  0,   control:  3   },
        },

        dialogue: {
            greeting: {
                low:    '"You again? Fine. Try to actually challenge me this time."',
                medium: '"*crosses arms* Let\'s skip the formalities. I\'m here to fight."',
                high:   '"I\'ve been waiting. *sharp smile* Don\'t disappoint me."',
            },
            win: {
                low:    '"Finally. You didn\'t just roll over. That\'s... a start."',
                medium: '"Mm. *tilts head* You\'re getting interesting."',
                high:   '"*quiet for once* That was... actually good. Really good."',
            },
            loss: {
                low:    '"You beat me. So what? Do it again before you celebrate."',
                medium: '"*stares at you* How did you— fine. That was a real fight."',
                high:   '"*stunned silence* I didn\'t see it coming. *barely audible* Good."',
            },
            reaction: {
                aggressive: '"Yes. THAT. Do more of that."',
                defensive:  '"If you\'re waiting for an opening, I\'ll just keep hitting you."',
                clever:     '"Hm. I did not expect that."',
                draw_spell: '"Reading my moves? Bold."',
                counterspell: '"*irritated* Don\'t think that trick will work twice."',
            },
        },
    },

    sylva: {
        id: 'sylva',
        name: 'Sylva Dawnbrook',
        title: 'Wandering Naturalist & Grove Tender',
        description: 'Warm, unhurried, and quietly perceptive. Sylva doesn\'t duel to dominate — she duels to connect. She pays as much attention to how you play as whether you win. Kindness, honesty, and a willingness to be vulnerable move her most.',
        colors: ['G', 'W'],
        art: '🌿',
        cssClass: 'char-sylva',
        playstyle: 'Favors: Creature decks, lifegain, mutual growth. Dislikes: discard effects and harsh removal.',
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
            winBonus:        { love:  2,   attraction:  3,   inhibition: -3,   control: -3   },
            closeLoss:       { love:  4,   attraction:  2,   inhibition: -3,   control: -1   },
            bigLoss:         { love:  1,   attraction:  0,   inhibition:  1,   control:  2   },
            gracefulLoss:    { love:  3,   attraction:  1,   inhibition: -2,   control: -1   },
        },

        dialogue: {
            greeting: {
                low:    '"Hello again. I\'m glad you came back. Are you ready?"',
                medium: '"*smiles warmly* I thought about our last game. Shall we?"',
                high:   '"*laughing softly* I was wondering when you\'d arrive."',
            },
            win: {
                low:    '"A good game. I liked watching how you thought."',
                medium: '"You play with such... care. It shows."',
                high:   '"*glowing* That was one of the best games I\'ve had. Truly."',
            },
            loss: {
                low:    '"You bested me! But honestly — the way you played was lovely."',
                medium: '"*laughing* I was not expecting that! You\'ve grown so much."',
                high:   '"*quietly, sincerely* I lose to you and I don\'t mind one bit."',
            },
            reaction: {
                aggressive: '"Oh — that\'s quite forceful. I\'ll... adapt."',
                defensive:  '"You\'re being so careful. I appreciate that."',
                clever:     '"Oh, that was beautiful. Genuinely."',
                draw_spell: '"You\'re curious. I like that."',
                counterspell: '"*gentle laugh* Foiled! Alright, I see you."',
            },
        },
    },
};

/* ─────────────────────────────────────────────────────────────
   PLAYER DECK OPTIONS  (shown in deck select screen)
   ───────────────────────────────────────────────────────────── */
const PLAYER_DECKS = ['devotion', 'mystique', 'ardor', 'balance'];
