// cards.js — card database for the MtG MVP client.
// The card list is embedded verbatim as CSV and parsed at runtime so that the
// data stays faithful to the source. Each parsed card is enriched with derived
// fields (mana value, colors, type flags) used by the engine and UI.

const CARD_CSV = String.raw`name,mana_cost,type_line,oracle_text,power,toughness
Aberrant Manawurm,{3}{G},Creature — Wurm,"Trample
Whenever you cast an instant or sorcery spell, this creature gets +X/+0 until end of turn, where X is the amount of mana spent to cast that spell.",2,5
"Abigale, Poet Laureate // Heroic Stanza",{1}{W}{B} // {1}{W/B},Legendary Creature — Bird Bard // Sorcery,,2,3
Abrade,{1}{R},Instant,"Choose one —
• Abrade deals 3 damage to target creature.
• Destroy target artifact.",,
Abstract Paintmage,{U}{U/R}{R},Creature — Djinn Sorcerer,"At the beginning of your first main phase, add {U}{R}. Spend this mana only to cast instant and sorcery spells.",2,2
Additive Evolution,{3}{G}{G},Enchantment,"When this enchantment enters, create a 0/0 green and blue Fractal creature token. Put three +1/+1 counters on it.
At the beginning of combat on your turn, put a +1/+1 counter on target creature you control. It gains vigilance until end of turn.",,
Ad Nauseam,{3}{B}{B},Instant,Reveal the top card of your library and put that card into your hand. You lose life equal to its mana value. You may repeat this process any number of times.,,
Adventurous Eater // Have a Bite,{2}{B} // {B},Creature — Human Warlock // Sorcery,,3,2
Ajani's Response,{4}{W},Instant,"This spell costs {3} less to cast if it targets a tapped creature.
Destroy target creature.",,
Akroma's Will,{3}{W},Instant,"Choose one. If you control a commander as you cast this spell, you may choose both instead.
• Creatures you control gain flying, vigilance, and double strike until end of turn.
• Creatures you control gain lifelink, indestructible, and protection from each color until end of turn.",,
Ambitious Augmenter,{G},Creature — Turtle Wizard,"Increment (Whenever you cast a spell, if the amount of mana you spent is greater than this creature's power or toughness, put a +1/+1 counter on this creature.)
When this creature dies, if it had one or more counters on it, create a 0/0 green and blue Fractal creature token, then put this creature's counters on that token.",1,1
Ancestral Anger,{R},Sorcery,"Target creature gains trample and gets +X/+0 until end of turn, where X is 1 plus the number of cards named Ancestral Anger in your graveyard.
Draw a card.",,
Angel's Grace,{W},Instant,"Split second (As long as this spell is on the stack, players can't cast spells or activate abilities that aren't mana abilities.)
You can't lose the game this turn and your opponents can't win the game this turn. Until end of turn, damage that would reduce your life total to less than 1 reduces it to 1 instead.",,
Antiquities on the Loose,{1}{W}{W},Sorcery,"Create two 2/2 red and white Spirit creature tokens. Then if this spell was cast from anywhere other than your hand, put a +1/+1 counter on each Spirit you control.
Flashback {4}{W}{W} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",,
Applied Geometry,{2}{G}{U},Sorcery,"Create a token that's a copy of target non-Aura permanent you control, except it's a 0/0 Fractal creature in addition to its other types. Put six +1/+1 counters on it.",,
Arcane Omens,{4}{B},Sorcery,"Converge — Target player discards X cards, where X is the number of colors of mana spent to cast this spell.",,
Archaic's Agony,{4}{R},Sorcery,"Converge — Archaic's Agony deals X damage to target creature, where X is the number of colors of mana spent to cast this spell. Exile cards from the top of your library equal to the excess damage dealt to that creature this way. You may play those cards until the end of your next turn.",,
Ark of Hunger,{2}{R}{W},Artifact,"Whenever one or more cards leave your graveyard, this artifact deals 1 damage to each opponent and you gain 1 life.
{T}: Mill a card. You may play that card this turn.",,
Armageddon,{3}{W},Sorcery,Destroy all lands.,,
"Arnyn, Deathbloom Botanist",{2}{B},Legendary Creature — Vampire Druid,"Deathtouch
Whenever a creature you control with power or toughness 1 or less dies, target opponent loses 2 life and you gain 2 life.",2,2
Artistic Process,{3}{R}{R},Sorcery,"Choose one —
• Artistic Process deals 6 damage to target creature.
• Artistic Process deals 2 damage to each creature you don't control.
• Create a 3/3 blue and red Elemental creature token with flying. It gains haste until end of turn.",,
Ascendant Dustspeaker,{4}{W},Creature — Orc Cleric,"Flying
When this creature enters, put a +1/+1 counter on another target creature you control.
At the beginning of combat on your turn, exile up to one target card from a graveyard.",3,4
Awaken the Woods,{X}{G}{G},Sorcery,Create X 1/1 green Forest Dryad land creature tokens. (They're affected by summoning sickness.),,
"Aziza, Mage Tower Captain",{R}{W},Legendary Creature — Djinn Sorcerer,"Whenever you cast an instant or sorcery spell, you may tap three untapped creatures you control. If you do, copy that spell. You may choose new targets for the copy.",2,2
Banishing Betrayal,{1}{U},Instant,Return target nonland permanent to its owner's hand. Surveil 1. (Look at the top card of your library. You may put it into your graveyard.),,
Berserk,{G},Instant,"Cast this spell only before the combat damage step.
Target creature gains trample and gets +X/+0 until end of turn, where X is its power. At the beginning of the next end step, destroy that creature if it attacked this turn.",,
"Berta, Wise Extrapolator",{2}{G}{U},Legendary Creature — Frog Druid,"Increment (Whenever you cast a spell, if the amount of mana you spent is greater than this creature's power or toughness, put a +1/+1 counter on this creature.)
Whenever one or more +1/+1 counters are put on Berta, add one mana of any color.
{X}, {T}: Create a 0/0 green and blue Fractal creature token and put X +1/+1 counters on it.",1,4
Biblioplex Tomekeeper,{4},Artifact Creature — Construct,"When this creature enters, choose up to one —
• Target creature becomes prepared. (Only creatures with prepare spells can become prepared.)
• Target creature becomes unprepared.",3,4
Big Score,{3}{R},Instant,"As an additional cost to cast this spell, discard a card.
Draw two cards and create two Treasure tokens. (They're artifacts with ""{T}, Sacrifice this token: Add one mana of any color."")",,
Bitter Triumph,{1}{B},Instant,"As an additional cost to cast this spell, discard a card or pay 3 life.
Destroy target creature or planeswalker.",,
Blazing Firesinger // Seething Song,{2}{R} // {2}{R},Creature — Dwarf Bard // Instant,,2,3
"Blech, Loafing Pest",{1}{B}{G},Legendary Creature — Pest,"Whenever you gain life, put a +1/+1 counter on each Pest, Bat, Insect, Snake, and Spider you control.",3,4
Bogwater Lumaret,{B}{G},Creature — Spirit Frog,"Whenever this creature or another creature you control enters, you gain 1 life.",2,2
Borrowed Knowledge,{2}{R}{W},Sorcery,"Choose one —
• Discard your hand, then draw cards equal to the number of cards in target opponent's hand.
• Discard your hand, then draw cards equal to the number of cards discarded this way.",,
Brain Freeze,{1}{U},Instant,"Target player mills three cards.
Storm (When you cast this spell, copy it for each spell cast before it this turn. You may choose new targets for the copies.)",,
Bring to Light,{3}{G}{U},Sorcery,"Converge — Search your library for a creature, instant, or sorcery card with mana value less than or equal to the number of colors of mana spent to cast this spell, exile that card, then shuffle. You may cast that card without paying its mana cost.",,
Brotherhood's End,{1}{R}{R},Sorcery,"Choose one —
• Brotherhood's End deals 3 damage to each creature and each planeswalker.
• Destroy all artifacts with mana value 3 or less.",,
Brush Off,{2}{U}{U},Instant,"This spell costs {1}{U} less to cast if it targets an instant or sorcery spell.
Counter target spell.",,
Bulk Up,{1}{R},Instant,"Double target creature's power until end of turn.
Flashback {4}{R}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",,
Burrog Banemaker,{B},Creature — Frog Warlock,"Deathtouch
{1}{B}: This creature gets +1/+1 until end of turn.",1,1
Burrog Barrage,{1}{G},Instant,Target creature you control gets +1/+0 until end of turn if you've cast another instant or sorcery spell this turn. Then it deals damage equal to its power to up to one target creature an opponent controls.,,
Burst Lightning,{R},Instant,"Kicker {4} (You may pay an additional {4} as you cast this spell.)
Burst Lightning deals 2 damage to any target. If this spell was kicked, it deals 4 damage instead.",,
Campus Composer // Aqueous Aria,{3}{U} // {4}{U},Creature — Merfolk Bard // Sorcery,,3,4
Cauldron of Essence,{1}{B}{G},Artifact,"Whenever a creature you control dies, each opponent loses 1 life and you gain 1 life.
{1}{B}{G}, {T}, Sacrifice a creature: Return target creature card from your graveyard to the battlefield. Activate only as a sorcery.",,
Charging Strifeknight,{2}{R},Creature — Spirit Knight,"Haste
{T}, Discard a card: Draw a card.",3,3
Chase Inspiration,{U},Instant,Target creature you control gets +0/+3 and gains hexproof until end of turn. (It can't be the target of spells or abilities your opponents control.),,
Cheerful Osteomancer // Raise Dead,{3}{B} // {B},Creature — Orc Warlock // Sorcery,,4,2
Chelonian Tackle,{2}{G},Sorcery,Target creature you control gets +0/+10 until end of turn. Then it fights up to one target creature an opponent controls. (Each deals damage equal to its power to the other.),,
Choreographed Sparks,{R}{R},Instant,"This spell can't be copied.
Choose one or both —
• Copy target instant or sorcery spell you control. You may choose new targets for the copy.
• Copy target creature spell you control. The copy gains haste and ""At the beginning of the end step, sacrifice this token.""",,
Colorstorm Stallion,{1}{U}{R},Creature — Elemental Horse,"Ward {1}, haste
Opus — Whenever you cast an instant or sorcery spell, this creature gets +1/+1 until end of turn. If five or more mana was spent to cast that spell, create a token that's a copy of this creature.",3,3
Colossus of the Blood Age,{4}{R}{W},Artifact Creature — Construct,"When this creature enters, it deals 3 damage to each opponent and you gain 3 life.
When this creature dies, discard any number of cards, then draw that many cards plus one.",6,6
Comforting Counsel,{1}{G},Enchantment,"Whenever you gain life, put a growth counter on this enchantment.
As long as there are five or more growth counters on this enchantment, creatures you control get +3/+3.",,
Conciliator's Duelist,{W}{W}{B}{B},Creature — Kor Warlock,"When this creature enters, draw a card. Each player loses 1 life.
Repartee — Whenever you cast an instant or sorcery spell that targets a creature, exile up to one target creature. Return that card to the battlefield under its owner's control at the beginning of the next end step.",4,3
Cost of Brilliance,{2}{B},Sorcery,Target player draws two cards and loses 2 life. Put a +1/+1 counter on up to one target creature.,,
Crackle with Power,{X}{X}{X}{R}{R},Sorcery,Crackle with Power deals five times X damage to each of up to X targets.,,
Crop Rotation,{G},Instant,"As an additional cost to cast this spell, sacrifice a land.
Search your library for a land card, put that card onto the battlefield, then shuffle.",,
Cuboid Colony,{G}{U},Creature — Insect,"Flash
Flying, trample
Increment (Whenever you cast a spell, if the amount of mana you spent is greater than this creature's power or toughness, put a +1/+1 counter on this creature.)",1,1
Culling Ritual,{2}{B}{G},Sorcery,Destroy each nonland permanent with mana value 2 or less. Add {B} or {G} for each permanent destroyed this way.,,
Culling the Weak,{B},Instant,"As an additional cost to cast this spell, sacrifice a creature.
Add {B}{B}{B}{B}.",,
Cyclonic Rift,{1}{U},Instant,"Return target nonland permanent you don't control to its owner's hand.
Overload {6}{U} (You may cast this spell for its overload cost. If you do, change ""target"" in its text to ""each."")",,
Daydream,{W},Sorcery,"Exile target creature you control, then return that card to the battlefield under its owner's control with a +1/+1 counter on it.
Flashback {2}{W} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",,
Daze,{1}{U},Instant,"You may return an Island you control to its owner's hand rather than pay this spell's mana cost.
Counter target spell unless its controller pays {1}.",,
Deathcap Glade,,Land,"This land enters tapped unless you control two or more other lands.
{T}: Add {B} or {G}.",,
Decorum Dissertation,{3}{B}{B},Sorcery — Lesson,"Target player draws two cards and loses 2 life.
Paradigm (Then exile this spell. After you first resolve a spell with this name, you may cast a copy of it from exile without paying its mana cost at the beginning of each of your first main phases.)",,
Deduce,{1}{U},Instant,"Draw a card. Investigate. (Create a Clue token. It's an artifact with ""{2}, Sacrifice this token: Draw a card."")",,
Deflecting Palm,{R}{W},Instant,"The next time a source of your choice would deal damage to you this turn, prevent that damage. If damage is prevented this way, Deflecting Palm deals that much damage to that source's controller.",,
Deluge Virtuoso,{2}{U},Creature — Human Wizard,"When this creature enters, tap target creature an opponent controls and put a stun counter on it. (If a permanent with a stun counter would become untapped, remove one from it instead.)
Opus — Whenever you cast an instant or sorcery spell, this creature gets +1/+1 until end of turn. If five or more mana was spent to cast that spell, this creature gets +2/+2 until end of turn instead.",2,2
Diary of Dreams,{2},Artifact — Book,"Whenever you cast an instant or sorcery spell, put a page counter on this artifact.
{5}, {T}: Draw a card. This ability costs {1} less to activate for each page counter on this artifact.",,
Dig Site Inventory,{W},Sorcery,"Put a +1/+1 counter on target creature you control. It gains vigilance until end of turn.
Flashback {W} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",,
Dina's Guidance,{1}{B}{G},Instant,"Search your library for a creature card, reveal it, put it into your hand or graveyard, then shuffle.",,
Disdainful Stroke,{1}{U},Instant,Counter target spell with mana value 4 or greater.,,
Dismember,{1}{B/P}{B/P},Instant,"({B/P} can be paid with either {B} or 2 life.)
Target creature gets -5/-5 until end of turn.",,
Dissection Practice,{B},Instant,"Target opponent loses 1 life and you gain 1 life.
Up to one target creature gets +1/+1 until end of turn.
Up to one target creature gets -1/-1 until end of turn.",,
Divergent Equation,{X}{X}{U},Instant,"Return up to X target instant and/or sorcery cards from your graveyard to your hand.
Exile Divergent Equation.",,
Dreamroot Cascade,,Land,"This land enters tapped unless you control two or more other lands.
{T}: Add {G} or {U}.",,
Duel Tactics,{R},Sorcery,"Duel Tactics deals 1 damage to target creature. It can't block this turn.
Flashback {1}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",,
Duty Beyond Death,{1}{W},Instant,"As an additional cost to cast this spell, sacrifice a creature.
Creatures you control gain indestructible until end of turn. Put a +1/+1 counter on each creature you control. (Damage and effects that say ""destroy"" don't destroy those creatures.)",,
Eager Glyphmage,{3}{W},Creature — Cat Cleric,"When this creature enters, create a 1/1 white and black Inkling creature token with flying.",3,3
Echocasting Symposium,{4}{U}{U},Sorcery — Lesson,"Target player creates a token that's a copy of target creature you control.
Paradigm (Then exile this spell. After you first resolve a spell with this name, you may cast a copy of it from exile without paying its mana cost at the beginning of each of your first main phases.)",,
Efflorescence,{2}{G},Instant,"Put two +1/+1 counters on target creature.
Infusion — If you gained life this turn, that creature also gains trample and indestructible until end of turn.",,
Elemental Mascot,{1}{U}{R},Creature — Elemental Bird,"Flying, vigilance
Opus — Whenever you cast an instant or sorcery spell, this creature gets +1/+0 until end of turn. If five or more mana was spent to cast that spell, exile the top card of your library. You may play that card until the end of your next turn.",1,4
Elite Interceptor // Rejoinder,{W} // {1}{W},Creature — Human Wizard // Sorcery,,1,2
Embrace the Paradox,{3}{G}{U},Instant,Draw three cards. You may put a land card from your hand onto the battlefield tapped.,,
Emeritus of Abundance // Regrowth,{2}{G} // {1}{G},Creature — Elf Druid // Sorcery,,3,4
Emeritus of Conflict // Lightning Bolt,{1}{R} // {R},Creature — Human Wizard // Instant,,2,2
Emeritus of Ideation // Ancestral Recall,{3}{U}{U} // {U},Creature — Human Wizard // Instant,,5,5
Emeritus of Truce // Swords to Plowshares,{1}{W}{W} // {W},Creature — Cat Cleric // Instant,,3,3
Emeritus of Woe // Demonic Tutor,{3}{B} // {1}{B},Creature — Vampire Warlock // Sorcery,,5,4
"Emil, Vastlands Roamer",{2}{G},Legendary Creature — Elf Druid,"Creatures you control with +1/+1 counters on them have trample.
{4}{G}, {T}: Create a 0/0 green and blue Fractal creature token. Put X +1/+1 counters on it, where X is the number of differently named lands you control.",3,3
Empty the Warrens,{3}{R},Sorcery,"Create two 1/1 red Goblin creature tokens.
Storm (When you cast this spell, copy it for each spell cast before it this turn.)",,
Encouraging Aviator // Jump,{2}{U} // {U},Creature — Bird Wizard // Instant,,2,3
End of the Hunt,{1}{B},Sorcery,Target opponent exiles a creature or planeswalker they control with the greatest mana value among creatures and planeswalkers they control.,,
"Ennis, Debate Moderator",{1}{W},Legendary Creature — Human Cleric,"When Ennis enters, exile up to one other target creature you control. Return that card to the battlefield under its owner's control at the beginning of the next end step.
At the beginning of your end step, if one or more cards were put into exile this turn, put a +1/+1 counter on Ennis.",1,1
Environmental Scientist,{1}{G},Creature — Human Druid,"When this creature enters, you may search your library for a basic land card, reveal it, put it into your hand, then shuffle.",2,2
Erode,{W},Instant,"Destroy target creature or planeswalker. Its controller may search their library for a basic land card, put it onto the battlefield tapped, then shuffle.",,
Essenceknit Scholar,{B}{B/G}{G},Creature — Dryad Warlock,"When this creature enters, create a 1/1 black and green Pest creature token with ""Whenever this token attacks, you gain 1 life.""
At the beginning of your end step, if a creature died under your control this turn, draw a card.",3,1
Essence Scatter,{1}{U},Instant,Counter target creature spell.,,
Eternal Student,{3}{B},Creature — Zombie Warlock,"{1}{B}, Exile this card from your graveyard: Create two 1/1 white and black Inkling creature tokens with flying.",4,2
Exhibition Tidecaller,{U},Creature — Djinn Wizard,"Opus — Whenever you cast an instant or sorcery spell, target player mills three cards. If five or more mana was spent to cast that spell, that player mills ten cards instead.",0,2
Expressive Firedancer,{1}{R},Creature — Human Sorcerer,"Opus — Whenever you cast an instant or sorcery spell, this creature gets +1/+1 until end of turn. If five or more mana was spent to cast that spell, this creature also gains double strike until end of turn.",2,2
Expressive Iteration,{U}{R},Sorcery,"Look at the top three cards of your library. Put one of them into your hand, put one of them on the bottom of your library, and exile one of them. You may play the exiled card this turn.",,
Feed the Swarm,{1}{B},Sorcery,Destroy target creature or enchantment an opponent controls. You lose life equal to that permanent's mana value.,,
Fields of Strife,,Land,"This land enters tapped.
{T}: Add {R} or {W}.
{2}{R}{W}, {T}: Surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",,
Fix What's Broken,{2}{W}{B},Sorcery,"As an additional cost to cast this spell, pay X life.
Return each artifact and creature card with mana value X from your graveyard to the battlefield.",,
Flashback,{R},Instant,Target instant or sorcery card in your graveyard gains flashback until end of turn. The flashback cost is equal to its mana cost. (You may cast that card from your graveyard for its flashback cost. Then exile it.),,
Flow State,{1}{U},Sorcery,"Look at the top three cards of your library. Put one of them into your hand and the rest on the bottom of your library in any order. If there is an instant card and a sorcery card in your graveyard, instead put two of them into your hand and the rest on the bottom of your library in any order.",,
Flusterstorm,{U},Instant,"Counter target instant or sorcery spell unless its controller pays {1}.
Storm (When you cast this spell, copy it for each spell cast before it this turn. You may choose new targets for the copies.)",,
Follow the Lumarets,{1}{G},Sorcery,"Infusion — Look at the top four cards of your library. You may reveal a creature or land card from among them and put it into your hand. If you gained life this turn, you may instead reveal two creature and/or land cards from among them and put them into your hand. Put the rest on the bottom of your library in a random order.",,
Foolish Fate,{2}{B},Instant,"Destroy target creature.
Infusion — If you gained life this turn, that creature's controller loses 3 life.",,
Force of Will,{3}{U}{U},Instant,"You may pay 1 life and exile a blue card from your hand rather than pay this spell's mana cost.
Counter target spell.",,
Forest,,Basic Land — Forest,({T}: Add {G}.),,
Forum Necroscribe,{5}{B},Creature — Troll Warlock,"Ward—Discard a card.
Repartee — Whenever you cast an instant or sorcery spell that targets a creature, return target creature card from your graveyard to the battlefield.",5,4
Forum of Amity,,Land,"This land enters tapped.
{T}: Add {W} or {B}.
{2}{W}{B}, {T}: Surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",,
Fractal Anomaly,{U},Instant,"Create a 0/0 green and blue Fractal creature token and put X +1/+1 counters on it, where X is the number of cards you've drawn this turn.",,
Fractalize,{X}{U},Instant,"Until end of turn, target creature becomes a green and blue Fractal with base power and toughness each equal to X plus 1. (It loses all other colors and creature types.)",,
Fractal Mascot,{4}{G}{U},Creature — Fractal Elk,"Trample
When this creature enters, tap target creature an opponent controls. Put a stun counter on it. (If a permanent with a stun counter would become untapped, remove one from it instead.)",6,6
Fractal Tender,{3}{G}{U},Creature — Elf Wizard,"Ward {2}
Increment (Whenever you cast a spell, if the amount of mana you spent is greater than this creature's power or toughness, put a +1/+1 counter on this creature.)
At the beginning of each end step, if you put a counter on this creature this turn, create a 0/0 green and blue Fractal creature token and put three +1/+1 counters on it.",3,3
Fracture,{W}{B},Instant,"Destroy target artifact, enchantment, or planeswalker.",,
Garrison Excavator,{3}{R},Creature — Orc Sorcerer,"Menace (This creature can't be blocked except by two or more creatures.)
Whenever one or more cards leave your graveyard, create a 2/2 red and white Spirit creature token.",3,4
Geometer's Arthropod,{G}{U},Creature — Fractal Crab,"Whenever you cast a spell with {X} in its mana cost, look at the top X cards of your library. Put one of them into your hand and the rest on the bottom of your library in a random order.",1,4
Germination Practicum,{3}{G}{G},Sorcery — Lesson,"Put two +1/+1 counters on each creature you control.
Paradigm (Then exile this spell. After you first resolve a spell with this name, you may cast a copy of it from exile without paying its mana cost at the beginning of each of your first main phases.)",,
Giant Growth,{G},Instant,Target creature gets +3/+3 until end of turn.,,
Glimpse of Nature,{G},Sorcery,"Whenever you cast a creature spell this turn, draw a card.",,
Glorious Decay,{1}{G},Instant,"Choose one —
• Destroy target artifact.
• Glorious Decay deals 4 damage to target creature with flying.
• Exile target card from a graveyard. Draw a card.",,
Goblin Glasswright // Craft with Pride,{1}{R} // {R},Creature — Goblin Sorcerer // Sorcery,,2,2
Graduation Day,{W},Enchantment,"Repartee — Whenever you cast an instant or sorcery spell that targets a creature, put a +1/+1 counter on target creature you control.",,
Grapple with Death,{1}{B}{G},Sorcery,Destroy target artifact or creature. You gain 1 life.,,
Grave Researcher // Reanimate,{2}{B} // {B},Creature — Troll Warlock // Sorcery,,3,3
Great Hall of the Biblioplex,,Land,"{T}: Add {C}.
{T}, Pay 1 life: Add one mana of any color. Spend this mana only to cast an instant or sorcery spell.
{5}: If this land isn't a creature, it becomes a 2/4 Wizard creature with ""Whenever you cast an instant or sorcery spell, this creature gets +1/+0 until end of turn."" It's still a land.",,
Group Project,{1}{W},Sorcery,"Create a 2/2 red and white Spirit creature token.
Flashback—Tap three untapped creatures you control. (You may cast this card from your graveyard for its flashback cost. Then exile it.)",,
Growth Curve,{G}{U},Sorcery,"Put a +1/+1 counter on target creature you control, then double the number of +1/+1 counters on that creature.",,
Hardened Academic,{R}{W},Creature — Bird Cleric,"Flying, haste
Discard a card: This creature gains lifelink until end of turn.
Whenever one or more cards leave your graveyard, put a +1/+1 counter on target creature you control.",2,1
Harmonized Trio // Brainstorm,{U} // {U},Creature — Merfolk Bard Wizard // Instant,,1,1
Harsh Annotation,{1}{W},Instant,Destroy target creature. Its controller creates a 1/1 white and black Inkling creature token with flying.,,
Heated Argument,{4}{R},Instant,"Heated Argument deals 6 damage to target creature. You may exile a card from your graveyard. If you do, Heated Argument also deals 2 damage to that creature's controller.",,
Helping Hand,{W},Sorcery,Return target creature card with mana value 3 or less from your graveyard to the battlefield tapped.,,
Homesickness,{4}{U}{U},Instant,"Target player draws two cards. Tap up to two target creatures. Put a stun counter on each of them. (If a permanent with a stun counter would become untapped, remove one from it instead.)",,
Honorbound Page // Forum's Favor,{3}{W} // {W},Creature — Cat Cleric // Sorcery,,3,3
Hop to It,{2}{W},Sorcery,Create three 1/1 white Rabbit creature tokens.,,
Hungry Graffalon,{3}{G},Creature — Giraffe,"Reach
Increment (Whenever you cast a spell, if the amount of mana you spent is greater than this creature's power or toughness, put a +1/+1 counter on this creature.)",3,4
Hydro-Channeler,{1}{U},Creature — Merfolk Wizard,"{T}: Add {U}. Spend this mana only to cast an instant or sorcery spell.
{1}, {T}: Add one mana of any color. Spend this mana only to cast an instant or sorcery spell.",1,3
Imperious Inkmage,{1}{W}{B},Creature — Orc Warlock,"Vigilance
When this creature enters, surveil 2. (Look at the top two cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)",3,3
Impractical Joke,{R},Sorcery,Damage can't be prevented this turn. Impractical Joke deals 3 damage to up to one target creature or planeswalker.,,
Improvisation Capstone,{5}{R}{R},Sorcery — Lesson,"Exile cards from the top of your library until you exile cards with total mana value 4 or greater. You may cast any number of spells from among them without paying their mana costs.
Paradigm (Then exile this spell. After you first resolve a spell with this name, you may cast a copy of it from exile without paying its mana cost at the beginning of each of your first main phases.)",,
Infirmary Healer // Stream of Life,{1}{G} // {X}{G},Creature — Cat Cleric // Sorcery,,2,3
Informed Inkwright,{1}{W},Creature — Human Wizard,"Vigilance
Repartee — Whenever you cast an instant or sorcery spell that targets a creature, create a 1/1 white and black Inkling creature token with flying.",2,2
Inkling Mascot,{W}{B},Creature — Inkling Cat,"Repartee — Whenever you cast an instant or sorcery spell that targets a creature, this creature gains flying until end of turn. Surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",2,2
Inkshape Demonstrator,{3}{W},Creature — Elephant Cleric,"Ward {2} (Whenever this creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays {2}.)
Repartee — Whenever you cast an instant or sorcery spell that targets a creature, this creature gets +1/+0 and gains lifelink until end of turn.",3,4
Interjection,{W},Instant,Target creature gets +2/+2 and gains first strike until end of turn.,,
Island,,Basic Land — Island,({T}: Add {U}.),,
"Jadzi, Steward of Fate // Oracle's Gift",{2}{U} // {X}{X}{U},Legendary Creature — Human Wizard // Sorcery,,2,4
Jeska's Will,{2}{R},Sorcery,"Choose one. If you control a commander as you cast this spell, you may choose both instead.
• Add {R} for each card in target opponent's hand.
• Exile the top three cards of your library. You may play them this turn.",,
Joined Researchers // Secret Rendezvous,{1}{W} // {1}{W}{W},Creature — Human Cleric Wizard // Sorcery,,2,2
Killian's Confidence,{W}{B},Sorcery,"Target creature gets +1/+1 until end of turn. Draw a card.
Whenever one or more creatures you control deal combat damage to a player, you may pay {W/B}. If you do, return this card from your graveyard to your hand.",,
"Kirol, History Buff // Pack a Punch",{R}{W} // {1}{R}{W},Legendary Creature — Vampire Cleric // Sorcery,,2,3
Knockout Maneuver,{2}{G},Sorcery,"Put a +1/+1 counter on target creature you control, then it deals damage equal to its power to target creature an opponent controls.",,
Landscape Painter // Vibrant Idea,{1}{U} // {4}{U},Creature — Merfolk Wizard // Sorcery,,2,1
Last Gasp,{1}{B},Instant,Target creature gets -3/-3 until end of turn.,,
Lecturing Scornmage,{B},Creature — Human Warlock,"Repartee — Whenever you cast an instant or sorcery spell that targets a creature, put a +1/+1 counter on this creature.",1,1
Leech Collector // Bloodletting,{1}{B} // {B},Creature — Human Warlock // Sorcery,,2,2
Living End,,Sorcery,"Suspend 3—{2}{B}{B}
Each player exiles all creature cards from their graveyard, then sacrifices all creatures they control, then puts all cards they exiled this way onto the battlefield.",,
Living History,{1}{R},Enchantment,"When this enchantment enters, create a 2/2 red and white Spirit creature token.
Whenever you attack, if a card left your graveyard this turn, target attacking creature gets +2/+0 until end of turn.",,
"Lluwen, Exchange Student // Pest Friend",{2}{B}{G} // {B/G},Legendary Creature — Elf Druid // Sorcery,,3,4
Locust Spray,{B},Instant,"Target creature gets -1/-1 until end of turn.
Cycling {B} ({B}, Discard this card: Draw a card.)",,
Lorehold Charm,{R}{W},Instant,"Choose one —
• Each opponent sacrifices a nontoken artifact of their choice.
• Return target artifact or creature card with mana value 2 or less from your graveyard to the battlefield.
• Creatures you control get +1/+1 and gain trample until end of turn.",,
"Lorehold, the Historian",{3}{R}{W},Legendary Creature — Elder Dragon,"Flying, haste
Each instant and sorcery card in your hand has miracle {2}. (You may cast a card for its miracle cost when you draw it if it's the first card you drew this turn.)
At the beginning of each opponent's upkeep, you may discard a card. If you do, draw a card.",5,5
Lumaret's Favor,{1}{G},Instant,"Infusion — When you cast this spell, copy it if you gained life this turn. You may choose new targets for the copy.
Target creature gets +2/+4 until end of turn.",,
Maelstrom Artisan // Rocket Volley,{1}{R}{R} // {1}{R},Creature — Minotaur Sorcerer // Sorcery,,3,2
Mage Tower Referee,{2},Artifact Creature — Construct,"Whenever you cast a multicolored spell, put a +1/+1 counter on this creature.",2,1
Magmablood Archaic,{2/R}{2/R}{2/R},Creature — Avatar,"Trample, reach
Converge — This creature enters with a +1/+1 counter on it for each color of mana spent to cast it.
Whenever you cast an instant or sorcery spell, creatures you control get +1/+0 until end of turn for each color of mana spent to cast that spell.",2,2
Mana Sculpt,{1}{U}{U},Instant,"Counter target spell. If you control a Wizard, add an amount of {C} equal to the amount of mana spent to cast that spell at the beginning of your next main phase.",,
Masterful Flourish,{B},Instant,"Target creature you control gets +1/+0 and gains indestructible until end of turn. (Damage and effects that say ""destroy"" don't destroy it.)",,
Mathemagics,{X}{X}{U}{U},Sorcery,"Target player draws 2ˣ cards. (2⁰ = 1, 2¹ = 2, 2² = 4, 2³ = 8, 2⁴ = 16, 2⁵ = 32, and so on.)",,
Matterbending Mage,{2}{U},Creature — Human Wizard,"When this creature enters, return up to one other target creature to its owner's hand.
Whenever you cast a spell with {X} in its mana cost, this creature can't be blocked this turn.",2,2
Melancholic Poet,{1}{B},Creature — Elf Bard,"Repartee — Whenever you cast an instant or sorcery spell that targets a creature, each opponent loses 1 life and you gain 1 life.",2,2
"Mica, Reader of Ruins",{3}{R},Legendary Creature — Human Artificer,"Ward—Pay 3 life. (Whenever this creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays 3 life.)
Whenever you cast an instant or sorcery spell, you may sacrifice an artifact. If you do, copy that spell and you may choose new targets for the copy.",4,4
Mindful Biomancer,{1}{G},Creature — Dryad Druid,"When this creature enters, you gain 1 life.
{2}{G}: This creature gets +2/+2 until end of turn. Activate only once each turn.",2,2
Mind into Matter,{X}{G}{U},Sorcery,Draw X cards. Then you may put a permanent card with mana value X or less from your hand onto the battlefield tapped.,,
Mind Roots,{1}{B}{G},Sorcery,Target player discards two cards. Put up to one land card discarded this way onto the battlefield tapped under your control.,,
Molten-Core Maestro,{1}{R},Creature — Goblin Bard,"Menace
Opus — Whenever you cast an instant or sorcery spell, put a +1/+1 counter on this creature. If five or more mana was spent to cast that spell, add an amount of {R} equal to this creature's power.",2,2
Molten Note,{X}{R}{W},Sorcery,"Molten Note deals damage to target creature equal to the amount of mana spent to cast this spell. Untap all creatures you control.
Flashback {6}{R}{W} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",,
Moment of Reckoning,{3}{W}{W}{B}{B},Sorcery,"Choose up to four. You may choose the same mode more than once.
• Destroy target nonland permanent.
• Return target nonland permanent card from your graveyard to the battlefield.",,
Monstrous Rage,{R},Instant,"Target creature gets +2/+0 until end of turn. Create a Monster Role token attached to it. (If you control another Role on it, put that one into the graveyard. Enchanted creature gets +1/+1 and has trample.)",,
"Moseo, Vein's New Dean",{2}{B},Legendary Creature — Bird Skeleton Warlock,"Flying
When Moseo enters, create a 1/1 black and green Pest creature token with ""Whenever this token attacks, you gain 1 life.""
Infusion — At the beginning of your end step, if you gained life this turn, return up to one target creature card with mana value X or less from your graveyard to the battlefield, where X is the amount of life you gained this turn.",2,1
Mountain,,Basic Land — Mountain,({T}: Add {R}.),,
Muse Seeker,{1}{U},Creature — Elf Wizard,"Opus — Whenever you cast an instant or sorcery spell, draw a card. Then discard a card unless five or more mana was spent to cast that spell.",1,2
Muse's Encouragement,{4}{U},Instant,"Create a 3/3 blue and red Elemental creature token with flying.
Surveil 2. (Look at the top two cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)",,
"Nita, Forum Conciliator",{1}{W}{B},Legendary Creature — Human Advisor,"Whenever you cast a spell you don't own, put a +1/+1 counter on each creature you control.
{2}, Sacrifice another creature: Exile target instant or sorcery card from an opponent's graveyard. You may cast it this turn, and mana of any type can be spent to cast that spell. If that spell would be put into a graveyard, exile it instead. Activate only as a sorcery.",2,3
Noxious Newt,{1}{G},Creature — Salamander,"Deathtouch
{T}: Add {G}.",1,2
Old-Growth Educator,{2}{B}{G},Creature — Treefolk Druid,"Vigilance, reach
Infusion — When this creature enters, put two +1/+1 counters on it if you gained life this turn.",4,4
Oracle's Restoration,{G},Sorcery,Target creature you control gets +1/+1 until end of turn. You draw a card and gain 1 life.,,
"Orysa, Tide Choreographer",{4}{U},Legendary Creature — Merfolk Bard,"This spell costs {3} less to cast if creatures you control have total toughness 10 or greater.
When Orysa enters, draw two cards.",2,2
Owlin Historian,{2}{W},Creature — Bird Cleric,"Flying
When this creature enters, surveil 1. (Look at the top card of your library. You may put it into your graveyard.)
Whenever one or more cards leave your graveyard, this creature gets +1/+1 until end of turn.",2,3
"Page, Loose Leaf",{2},Legendary Artifact Creature — Construct,"{T}: Add {C}.
Grandeur — Discard another card named Page, Loose Leaf: Reveal cards from the top of your library until you reveal an instant or sorcery card. Put that card into your hand and the rest on the bottom of your library in a random order.",0,2
Paradox Gardens,,Land,"This land enters tapped.
{T}: Add {G} or {U}.
{2}{G}{U}, {T}: Surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",,
Paradox Surveyor,{G}{G/U}{U},Creature — Elf Druid,"Reach
When this creature enters, look at the top five cards of your library. You may reveal a land card or a card with {X} in its mana cost from among them and put it into your hand. Put the rest on the bottom of your library in a random order.",3,3
Pensive Professor,{1}{U}{U},Creature — Human Wizard,"Increment (Whenever you cast a spell, if the amount of mana you spent is greater than this creature's power or toughness, put a +1/+1 counter on this creature.)
Whenever one or more +1/+1 counters are put on this creature, draw a card.",0,2
Pestbrood Sloth,{3}{G},Creature — Plant Sloth,"Reach
When this creature dies, create two 1/1 black and green Pest creature tokens with ""Whenever this token attacks, you gain 1 life.""",4,4
Pest Mascot,{1}{B}{G},Creature — Pest Ape,"Trample
Whenever you gain life, put a +1/+1 counter on this creature.",2,3
Petrified Hamlet,,Land,"When this land enters, choose a land card name.
Activated abilities of sources with the chosen name can't be activated unless they're mana abilities.
Lands with the chosen name have ""{T}: Add {C}.""
{T}: Add {C}.",,
Pick Your Poison,{G},Sorcery,"Choose one —
• Each opponent sacrifices an artifact of their choice.
• Each opponent sacrifices an enchantment of their choice.
• Each opponent sacrifices a creature with flying of their choice.",,
Pigment Wrangler // Striking Palette,{4}{R} // {R},Creature — Orc Sorcerer // Sorcery,,4,4
Plains,,Basic Land — Plains,({T}: Add {W}.),,
Planar Engineering,{3}{G},Sorcery,"Sacrifice two lands. Search your library for four basic land cards, put them onto the battlefield tapped, then shuffle.",,
Poisoner's Apprentice,{2}{B},Creature — Orc Warlock,"Infusion — When this creature enters, target creature an opponent controls gets -4/-4 until end of turn if you gained life this turn.",2,2
Pongify,{U},Instant,Destroy target creature. It can't be regenerated. Its controller creates a 3/3 green Ape creature token.,,
Postmortem Professor,{1}{B},Creature — Zombie Warlock,"This creature can't block.
Whenever this creature attacks, each opponent loses 1 life and you gain 1 life.
{1}{B}, Exile an instant or sorcery card from your graveyard: Return this card from your graveyard to the battlefield.",2,2
Potioner's Trove,{3},Artifact,"{T}: Add one mana of any color.
{T}: You gain 2 life. Activate only if you've cast an instant or sorcery spell this turn.",,
Pox Plague,{B}{B}{B}{B}{B},Sorcery,"Each player loses half their life, then discards half the cards in their hand, then sacrifices half the permanents they control of their choice. Round down each time.",,
Practiced Offense,{2}{W},Sorcery,"Put a +1/+1 counter on each creature target player controls. Target creature gains your choice of double strike or lifelink until end of turn.
Flashback {1}{W} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",,
Practiced Scrollsmith,{R}{R/W}{W},Creature — Dwarf Cleric,"First strike
When this creature enters, exile target noncreature, nonland card from your graveyard. Until the end of your next turn, you may cast that card.",3,2
Preordain,{U},Sorcery,"Scry 2, then draw a card. (To scry 2, look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)",,
Primary Research,{4}{W},Enchantment,"When this enchantment enters, return target nonland permanent card with mana value 3 or less from your graveyard to the battlefield.
At the beginning of your end step, if a card left your graveyard this turn, draw a card.",,
Prismari Charm,{U}{R},Instant,"Choose one —
• Surveil 2, then draw a card.
• Prismari Charm deals 1 damage to each of one or two targets.
• Return target nonland permanent to its owner's hand.",,
"Prismari, the Inspiration",{5}{U}{R},Legendary Creature — Elder Dragon,"Flying
Ward—Pay 5 life.
Instant and sorcery spells you cast have storm. (Whenever you cast an instant or sorcery spell, copy it for each spell cast before it this turn. You may choose new targets for the copies.)",7,7
Prismatic Ending,{X}{W},Sorcery,Converge — Exile target nonland permanent if its mana value is less than or equal to the number of colors of mana spent to cast this spell.,,
Procrastinate,{X}{U},Sorcery,"Tap target creature. Put twice X stun counters on it. (If a permanent with a stun counter would become untapped, remove one from it instead.)",,
Proctor's Gaze,{2}{G}{U},Instant,"Return up to one target nonland permanent to its owner's hand. Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",,
Professor Dellian Fel,{2}{B}{G},Legendary Planeswalker — Dellian,"+2: You gain 3 life.
0: You draw a card and lose 1 life.
−3: Destroy target creature.
−6: You get an emblem with ""Whenever you gain life, target opponent loses that much life.""",,
Pterafractyl,{X}{G}{U},Creature — Dinosaur Fractal,"Flying
This creature enters with X +1/+1 counters on it.
When this creature enters, you gain 2 life.",1,0
Pull from the Grave,{2}{B},Sorcery,Return up to two target creature cards from your graveyard to your hand. You gain 2 life.,,
Pursue the Past,{R}{W},Sorcery,"You gain 2 life. You may discard a card. If you do, draw two cards.
Flashback {2}{R}{W} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",,
Pyretic Ritual,{1}{R},Instant,Add {R}{R}{R}.,,
Quandrix Charm,{G}{U},Instant,"Choose one —
• Counter target spell unless its controller pays {2}.
• Destroy target enchantment.
• Target creature has base power and toughness 5/5 until end of turn.",,
"Quandrix, the Proof",{4}{G}{U},Legendary Creature — Elder Dragon,"Flying, trample
Cascade (When you cast this spell, exile cards from the top of your library until you exile a nonland card that costs less. You may cast it without paying its mana cost. Put the exiled cards on the bottom in a random order.)
Instant and sorcery spells you cast from your hand have cascade.",6,6
Quick Study,{2}{U},Instant,Draw two cards.,,
Quill-Blade Laureate // Twofold Intent,{1}{W} // {1}{W},Creature — Human Cleric // Sorcery,,1,1
Rabid Attack,{1}{B},Instant,"Until end of turn, any number of target creatures you control each get +1/+0 and gain ""When this creature dies, draw a card.""",,
"Ral Zarek, Guest Lecturer",{1}{B}{B},Legendary Planeswalker — Ral,"+1: Surveil 2.
−1: Any number of target players each discard a card.
−2: Return target creature card with mana value 3 or less from your graveyard to the battlefield.
−7: Flip five coins. Target opponent skips their next X turns, where X is the number of coins that came up heads.",,
Rancorous Archaic,{5},Creature — Avatar,"Trample, reach
Converge — This creature enters with a +1/+1 counter on it for each color of mana spent to cast it.",2,2
Rapier Wit,{1}{W},Instant,"Tap target creature. If it's your turn, put a stun counter on it. (If a permanent with a stun counter would become untapped, remove one from it instead.)
Draw a card.",,
Rapturous Moment,{4}{U}{R},Sorcery,"Draw three cards, then discard two cards. Add {U}{U}{R}{R}{R}.",,
Rearing Embermare,{4}{R},Creature — Horse Beast,"Reach, haste",4,5
Rehearsed Debater,{2}{W},Creature — Djinn Bard,"Vigilance
Repartee — Whenever you cast an instant or sorcery spell that targets a creature, this creature gets +1/+1 until end of turn.",3,3
Render Speechless,{2}{W}{B},Sorcery,"Target opponent reveals their hand. You choose a nonland card from it. That player discards that card.
Put two +1/+1 counters on up to one target creature.",,
Repel Calamity,{1}{W},Instant,Destroy target creature with power or toughness 4 or greater.,,
Reprieve,{1}{W},Instant,"Return target spell to its owner's hand.
Draw a card.",,
Requisition Raid,{W},Sorcery,"Spree (Choose one or more additional costs.)
+ {1} — Destroy target artifact.
+ {1} — Destroy target enchantment.
+ {1} — Put a +1/+1 counter on each creature target player controls.",,
Resonating Lute,{2}{U}{R},Artifact,"Lands you control have ""{T}: Add two mana of any one color. Spend this mana only to cast instant and sorcery spells.""
{T}: Draw a card. Activate only if you have seven or more cards in your hand.",,
Restoration Seminar,{5}{W}{W},Sorcery — Lesson,"Return target nonland permanent card from your graveyard to the battlefield.
Paradigm (Then exile this spell. After you first resolve a spell with this name, you may cast a copy of it from exile without paying its mana cost at the beginning of each of your first main phases.)",,
Return the Favor,{R}{R},Instant,"Spree (Choose one or more additional costs.)
+ {1} — Copy target instant spell, sorcery spell, activated ability, or triggered ability. You may choose new targets for the copy.
+ {1} — Change the target of target spell or ability with a single target.",,
Return to the Ranks,{X}{W}{W},Sorcery,"Convoke (Your creatures can help cast this spell. Each creature you tap while casting this spell pays for {1} or one mana of that creature's color.)
Return X target creature cards with mana value 2 or less from your graveyard to the battlefield.",,
Root Manipulation,{3}{B}{G},Sorcery,"Until end of turn, creatures you control get +2/+2 and gain menace and ""Whenever this creature attacks, you gain 1 life."" (A creature with menace can't be blocked except by two or more creatures.)",,
Royal Treatment,{G},Instant,"Target creature you control gains hexproof until end of turn. Create a Royal Role token attached to that creature. (If you control another Role on it, put that one into the graveyard. Enchanted creature gets +1/+1 and has ward {1}.)",,
Rubble Rouser,{2}{R},Creature — Dwarf Sorcerer,"When this creature enters, you may discard a card. If you do, draw a card.
{T}, Exile a card from your graveyard: Add {R}. When you do, this creature deals 1 damage to each opponent.",1,4
Run Behind,{3}{U},Instant,"This spell costs {1} less to cast if it targets an attacking creature.
Target creature's owner puts it on their choice of the top or bottom of their library.",,
"Sanar, Unfinished Genius // Wild Idea",{U}{R} // {3}{U}{R},Legendary Creature — Goblin Sorcerer // Sorcery,,0,4
Scathing Shadelock // Venomous Words,{4}{B} // {B},Creature — Snake Warlock // Sorcery,,4,6
Scheming Silvertongue // Sign in Blood,{1}{B} // {B}{B},Creature — Vampire Warlock // Sorcery,,1,3
Scolding Administrator,{W}{B},Creature — Dwarf Cleric,"Menace (This creature can't be blocked except by two or more creatures.)
Repartee — Whenever you cast an instant or sorcery spell that targets a creature, put a +1/+1 counter on this creature.
When this creature dies, if it had counters on it, put those counters on up to one target creature.",2,2
Seize the Spoils,{2}{R},Sorcery,"As an additional cost to cast this spell, discard a card.
Draw two cards and create a Treasure token. (It's an artifact with ""{T}, Sacrifice this token: Add one mana of any color."")",,
Send in the Pest,{1}{B},Sorcery,"Each opponent discards a card. You create a 1/1 black and green Pest creature token with ""Whenever this token attacks, you gain 1 life.""",,
Shamanic Revelation,{3}{G}{G},Sorcery,"Draw a card for each creature you control.
Ferocious — You gain 4 life for each creature you control with power 4 or greater.",,
Shared Roots,{1}{G},Sorcery — Lesson,"Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",,
Shattered Acolyte,{1}{W},Creature — Dwarf Warlock,"Lifelink
{1}, Sacrifice this creature: Destroy target artifact or enchantment.",2,2
Shattered Sanctum,,Land,"This land enters tapped unless you control two or more other lands.
{T}: Add {W} or {B}.",,
Sheoldred's Edict,{1}{B},Instant,"Choose one —
• Each opponent sacrifices a nontoken creature of their choice.
• Each opponent sacrifices a creature token of their choice.
• Each opponent sacrifices a planeswalker of their choice.",,
Shared Roots,{1}{G},Sorcery — Lesson,"Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",,
Shopkeeper's Bane,{2}{G},Creature — Badger Pest,"Trample
Whenever this creature attacks, you gain 2 life.",4,2
Silverquill Charm,{W}{B},Instant,"Choose one —
• Put two +1/+1 counters on target creature.
• Exile target creature with power 2 or less.
• Each opponent loses 3 life and you gain 3 life.",,
"Silverquill, the Disputant",{2}{W}{B},Legendary Creature — Elder Dragon,"Flying, vigilance
Each instant and sorcery spell you cast has casualty 1. (As you cast that spell, you may sacrifice a creature with power 1 or greater. When you do, copy the spell and you may choose new targets for the copy.)",4,4
Skycoach Conductor // All Aboard,{2}{U} // {U},Creature — Bird Pilot // Instant,,2,3
Skycoach Waypoint,,Land,"{T}: Add {C}.
{3}, {T}: Target creature becomes prepared. (Only creatures with prepare spells can become prepared.)",,
Sleight of Hand,{U},Sorcery,Look at the top two cards of your library. Put one of them into your hand and the other on the bottom of your library.,,
Slumbering Trudge,{X}{G},Creature — Plant Beast,"This creature enters with a number of stun counters on it equal to three minus X. If X is 2 or less, it enters tapped. (If a permanent with a stun counter would become untapped, remove one from it instead.)",6,6
Smallpox,{B}{B},Sorcery,"Each player loses 1 life, discards a card, sacrifices a creature of their choice, then sacrifices a land of their choice.",,
Snarl Song,{5}{G},Sorcery,"Converge — Create two 0/0 green and blue Fractal creature tokens. Put X +1/+1 counters on each of them and you gain X life, where X is the number of colors of mana spent to cast this spell.",,
Sneering Shadewriter,{4}{B},Creature — Vampire Warlock,"Flying
When this creature enters, each opponent loses 2 life and you gain 2 life.",3,3
Snooping Page,{1}{W}{B},Creature — Human Cleric,"Repartee — Whenever you cast an instant or sorcery spell that targets a creature, this creature can't be blocked this turn.
Whenever this creature deals combat damage to a player, you draw a card and lose 1 life.",2,3
Soaring Stoneglider,{2}{W},Creature — Elephant Cleric,"As an additional cost to cast this spell, exile two cards from your graveyard or pay {1}{W}.
Flying, vigilance",4,3
Social Snub,{1}{W}{B},Sorcery,"When you cast this spell while you control a creature, you may copy this spell.
Each player sacrifices a creature of their choice. Each opponent loses 1 life and you gain 1 life.",,
Spectacle Summit,,Land,"This land enters tapped.
{T}: Add {U} or {R}.
{2}{U}{R}, {T}: Surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",,
Spectacular Skywhale,{2}{U}{R},Creature — Elemental Whale,"Flying
Opus — Whenever you cast an instant or sorcery spell, this creature gets +3/+0 until end of turn. If five or more mana was spent to cast that spell, put three +1/+1 counters on this creature instead.",1,4
Spellbook Seeker // Careful Study,{3}{U} // {U},Creature — Bird Wizard // Sorcery,,3,3
Spell Pierce,{U},Instant,Counter target noncreature spell unless its controller pays {2}.,,
Spiritcall Enthusiast // Scrollboost,{2}{W} // {1}{W},Creature — Cat Cleric // Sorcery,,3,3
Spirit Mascot,{R}{W},Creature — Spirit Ox,"Whenever one or more cards leave your graveyard, put a +1/+1 counter on this creature.",2,2
Splatter Technique,{1}{U}{U}{R}{R},Sorcery,"Choose one —
• Draw four cards.
• Splatter Technique deals 4 damage to each creature and planeswalker.",,
Stadium Tidalmage,{2}{U}{R},Creature — Djinn Sorcerer,"Whenever this creature enters or attacks, you may draw a card. If you do, discard a card.",4,4
Stand Up for Yourself,{2}{W},Instant,Destroy target creature with power 3 or greater.,,
Stargaze,{X}{B}{B},Sorcery,Look at twice X cards from the top of your library. Put X cards from among them into your hand and the rest into your graveyard. You lose X life.,,
Startled Relic Sloth,{2}{R}{W},Creature — Sloth Beast,"Trample, lifelink
At the beginning of combat on your turn, exile up to one target card from a graveyard.",4,4
Steal the Show,{2}{R},Sorcery,"Choose one or both —
• Target player discards any number of cards, then draws that many cards.
• Steal the Show deals damage equal to the number of instant and sorcery cards in your graveyard to target creature or planeswalker.",,
Stirring Honormancer,{2}{W}{W/B}{B},Creature — Rhino Bard,"When this creature enters, look at the top X cards of your library, where X is the number of creatures you control. Put one of those cards into your hand and the rest into your graveyard.",4,5
Stirring Hopesinger,{2}{W},Creature — Bird Bard,"Flying, lifelink
Repartee — Whenever you cast an instant or sorcery spell that targets a creature, put a +1/+1 counter on each creature you control.",1,3
Stock Up,{2}{U},Sorcery,Look at the top five cards of your library. Put two of them into your hand and the rest on the bottom of your library in any order.,,
Stone Docent,{1}{W},Creature — Spirit Chimera,"{W}, Exile this card from your graveyard: You gain 2 life. Surveil 1. Activate only as a sorcery. (Look at the top card of your library. You may put it into your graveyard.)",3,1
Stormcarved Coast,,Land,"This land enters tapped unless you control two or more other lands.
{T}: Add {U} or {R}.",,
Stress Dream,{3}{U}{R},Instant,Stress Dream deals 5 damage to up to one target creature. Look at the top two cards of your library. Put one of those cards into your hand and the other on the bottom of your library.,,
Strife Scholar // Awaken the Ages,{2}{R} // {5}{R},Creature — Orc Sorcerer // Sorcery,,3,2
Strixhaven Skycoach,{3},Artifact — Vehicle,"Flying
When this Vehicle enters, you may search your library for a basic land card, reveal it, put it into your hand, then shuffle.
Crew 2 (Tap any number of creatures you control with total power 2 or more: This Vehicle becomes an artifact creature until end of turn.)",3,2
Studious First-Year // Rampant Growth,{G} // {1}{G},Creature — Bear Wizard // Sorcery,,1,1
Subterranean Tremors,{X}{R},Sorcery,"Subterranean Tremors deals X damage to each creature without flying. If X is 4 or more, destroy all artifacts. If X is 8 or more, create an 8/8 red Lizard creature token.",,
Summoned Dromedary,{3}{W},Creature — Spirit Camel,"Vigilance
{1}{W}: Return this card from your graveyard to your hand. Activate only as a sorcery.",4,3
Sundering Archaic,{6},Creature — Avatar,"Converge — When this creature enters, exile target nonland permanent an opponent controls with mana value less than or equal to the number of colors of mana spent to cast this creature.
{2}: Put target card from a graveyard on the bottom of its owner's library.",3,3
Sundown Pass,,Land,"This land enters tapped unless you control two or more other lands.
{T}: Add {R} or {W}.",,
Suspend Aggression,{1}{R}{W},Instant,"Exile target nonland permanent and the top card of your library. For each of those cards, its owner may play it until the end of their next turn.",,
Swamp,,Basic Land — Swamp,({T}: Add {B}.),,
Tablet of Discovery,{2}{R},Artifact,"When this artifact enters, mill a card. You may play that card this turn. (To mill a card, put the top card of your library into your graveyard.)
{T}: Add {R}.
{T}: Add {R}{R}. Spend this mana only to cast instant and sorcery spells.",,
Tackle Artist,{3}{R},Creature — Orc Sorcerer,"Trample
Opus — Whenever you cast an instant or sorcery spell, put a +1/+1 counter on this creature. If five or more mana was spent to cast that spell, put two +1/+1 counters on this creature instead.",4,3
"Tam, Observant Sequencer // Deep Sight",{2}{G}{U} // {G}{U},Legendary Creature — Gorgon Wizard // Sorcery,,4,3
Teacher's Pest,{B}{G},Creature — Skeleton Pest,"Menace (This creature can't be blocked except by two or more creatures.)
Whenever this creature attacks, you gain 1 life.
{B}{G}: Return this card from your graveyard to the battlefield tapped.",1,1
Tenured Concocter,{4}{G},Creature — Troll Druid,"Vigilance
Whenever this creature becomes the target of a spell or ability an opponent controls, you may draw a card.
Infusion — This creature gets +2/+0 as long as you gained life this turn.",4,5
Terramorphic Expanse,,Land,"{T}, Sacrifice this land: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",,
Tester of the Tangential,{1}{U},Creature — Djinn Wizard,"Increment (Whenever you cast a spell, if the amount of mana you spent is greater than this creature's power or toughness, put a +1/+1 counter on this creature.)
At the beginning of combat on your turn, you may pay {X}. When you do, move X +1/+1 counters from this creature onto another target creature.",1,1
Textbook Tabulator,{2}{U},Creature — Frog Wizard,"Increment (Whenever you cast a spell, if the amount of mana you spent is greater than this creature's power or toughness, put a +1/+1 counter on this creature.)
When this creature enters, surveil 2. (Look at the top two cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)",0,3
The Dawning Archaic,{10},Legendary Creature — Avatar,"This spell costs {1} less to cast for each instant and sorcery card in your graveyard.
Reach
Whenever The Dawning Archaic attacks, you may cast target instant or sorcery card from your graveyard without paying its mana cost. If that spell would be put into your graveyard, exile it instead.",7,7
Thornfist Striker,{2}{G},Creature — Elf Druid,"Ward {1} (Whenever this creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays {1}.)
Infusion — Creatures you control get +1/+0 and have trample as long as you gained life this turn.",3,3
Thunderdrum Soloist,{1}{R},Creature — Dwarf Bard,"Reach
Opus — Whenever you cast an instant or sorcery spell, this creature deals 1 damage to each opponent. If five or more mana was spent to cast that spell, this creature deals 3 damage to each opponent instead.",1,3
Titan's Grave,,Land,"This land enters tapped.
{T}: Add {B} or {G}.
{2}{B}{G}, {T}: Surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",,
Together as One,{6},Sorcery,"Converge — Target player draws X cards, Together as One deals X damage to any target, and you gain X life, where X is the number of colors of mana spent to cast this spell.",,
Tome Blast,{1}{R},Sorcery,"Tome Blast deals 2 damage to any target.
Flashback {4}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",,
Topiary Lecturer,{2}{G},Creature — Elf Druid,"Increment (Whenever you cast a spell, if the amount of mana you spent is greater than this creature's power or toughness, put a +1/+1 counter on this creature.)
{T}: Add an amount of {G} equal to this creature's power.",1,2
Tragedy Feaster,{2}{B}{B},Creature — Demon,"Trample
Ward—Discard a card.
Infusion — At the beginning of your end step, sacrifice a permanent unless you gained life this turn.",7,6
Transcendent Archaic,{7},Creature — Avatar,"Vigilance
Converge — When this creature enters, you may draw X cards, where X is the number of colors of mana spent to cast this spell. If you draw one or more cards this way, discard two cards.",6,6
Traumatic Critique,{X}{U}{R},Instant,"Traumatic Critique deals X damage to any target. Draw two cards, then discard a card.",,
Triumph of the Hordes,{2}{G}{G},Sorcery,"Until end of turn, creatures you control get +1/+1 and gain trample and infect. (Creatures with infect deal damage to creatures in the form of -1/-1 counters and to players in the form of poison counters.)",,
Ulna Alley Shopkeep,{2}{B},Creature — Goblin Warlock,"Menace (This creature can't be blocked except by two or more creatures.)
Infusion — This creature gets +2/+0 as long as you gained life this turn.",2,3
Unsubtle Mockery,{2}{R},Instant,Unsubtle Mockery deals 4 damage to target creature. Surveil 1. (Look at the top card of your library. You may put it into your graveyard.),,
Vampiric Tutor,{B},Instant,"Search your library for a card, then shuffle and put that card on top. You lose 2 life.",,
Vastlands Scavenger // Bind to Life,{1}{G}{G} // {4}{G},Creature — Bear Druid // Instant,,4,4
Veil of Summer,{G},Instant,Draw a card if an opponent has cast a blue or black spell this turn. Spells you control can't be countered this turn. You and permanents you control gain hexproof from blue and from black until end of turn. (You and they can't be the targets of blue or black spells or abilities your opponents control.),,
Vibrant Outburst,{U}{R},Instant,Vibrant Outburst deals 3 damage to any target. Tap up to one target creature.,,
Vicious Rivalry,{2}{B}{G},Sorcery,"As an additional cost to cast this spell, pay X life.
Destroy all artifacts and creatures with mana value X or less.",,
Visionary's Dance,{5}{U}{R},Sorcery,"Create two 3/3 blue and red Elemental creature tokens with flying.
{2}, Discard this card: Look at the top two cards of your library. Put one of them into your hand and the other into your graveyard.",,
Wander Off,{3}{B},Instant,Exile target creature.,,
Wildgrowth Archaic,{2/G}{2/G},Creature — Avatar,"Trample, reach
Converge — This creature enters with a +1/+1 counter on it for each color of mana spent to cast it.
Whenever you cast a creature spell, that creature enters with X additional +1/+1 counters on it, where X is the number of colors of mana spent to cast it.",0,0
Wild Hypothesis,{X}{G},Sorcery,"Create a 0/0 green and blue Fractal creature token. Put X +1/+1 counters on it.
Surveil 2. (Look at the top two cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)",,
Wilt in the Heat,{2}{R}{W},Instant,"This spell costs {2} less to cast if one or more cards left your graveyard this turn.
Wilt in the Heat deals 5 damage to target creature. If that creature would die this turn, exile it instead.",,
Winds of Abandon,{1}{W},Sorcery,"Exile target creature you don't control. For each creature exiled this way, its controller searches their library for a basic land card. Those players put those cards onto the battlefield tapped, then shuffle.
Overload {4}{W}{W} (You may cast this spell for its overload cost. If you do, change ""target"" in its text to ""each."")",,
Wisdom of Ages,{4}{U}{U}{U},Sorcery,"Return all instant and sorcery cards from your graveyard to your hand. You have no maximum hand size for the rest of the game.
Exile Wisdom of Ages.",,
Witherbloom Charm,{B}{G},Instant,"Choose one —
• You may sacrifice a permanent. If you do, draw two cards.
• You gain 5 life.
• Destroy target nonland permanent with mana value 2 or less.",,
"Witherbloom, the Balancer",{6}{B}{G},Legendary Creature — Elder Dragon,"Affinity for creatures (This spell costs {1} less to cast for each creature you control.)
Flying, deathtouch
Instant and sorcery spells you cast have affinity for creatures.",5,5
Withering Curse,{1}{B}{B},Sorcery,"All creatures get -2/-2 until end of turn.
Infusion — If you gained life this turn, destroy all creatures instead.",,
Zaffai and the Tempests,{5}{U}{R},Legendary Creature — Human Bard Sorcerer,"Once during each of your turns, you may cast an instant or sorcery spell from your hand without paying its mana cost.",5,7
Zealous Lorecaster,{5}{R},Creature — Giant Sorcerer,"When this creature enters, return target instant or sorcery card from your graveyard to your hand.",4,4
Zimone's Experiment,{3}{G},Sorcery,"Look at the top five cards of your library. You may reveal up to two creature and/or land cards from among them, then put the rest on the bottom of your library in a random order. Put all land cards revealed this way onto the battlefield tapped and put all creature cards revealed this way into your hand.",,
Zombify,{3}{B},Sorcery,Return target creature card from your graveyard to the battlefield.,,`;

// --- CSV parsing -----------------------------------------------------------

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\r') { /* ignore */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

// --- Mana cost parsing -----------------------------------------------------

// Parse a mana cost string like "{3}{G}{G}" into pip descriptors and totals.
function parseManaCost(costStr) {
  const pips = [];
  let generic = 0;
  let hasX = false;
  let cmc = 0;
  const colors = new Set();
  const re = /\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(costStr)) !== null) {
    const sym = m[1];
    if (/^\d+$/.test(sym)) {
      generic += parseInt(sym, 10);
      cmc += parseInt(sym, 10);
      pips.push({ type: 'generic', amount: parseInt(sym, 10) });
    } else if (sym === 'X') {
      hasX = true;
      pips.push({ type: 'x' });
    } else if (sym === 'C') {
      cmc += 1;
      pips.push({ type: 'colorless' });
    } else if (/^[WUBRG]$/.test(sym)) {
      cmc += 1;
      colors.add(sym);
      pips.push({ type: 'color', color: sym });
    } else if (/^[WUBRG]\/[WUBRG]$/.test(sym)) {
      // hybrid
      cmc += 1;
      const [a, b] = sym.split('/');
      colors.add(a); colors.add(b);
      pips.push({ type: 'hybrid', colors: [a, b] });
    } else if (/^[WUBRG]\/P$/.test(sym)) {
      // phyrexian
      cmc += 1;
      const a = sym[0];
      colors.add(a);
      pips.push({ type: 'phyrexian', color: a });
    } else if (/^2\/[WUBRG]$/.test(sym)) {
      // monocolor hybrid (2 or a color)
      cmc += 2;
      const a = sym.split('/')[1];
      colors.add(a);
      pips.push({ type: 'monohybrid', color: a });
    } else {
      pips.push({ type: 'other', sym });
    }
  }
  return { pips, generic, hasX, cmc, colors: [...colors], raw: costStr };
}

// --- Card enrichment -------------------------------------------------------

function buildCardDB() {
  const rows = parseCSV(CARD_CSV);
  const header = rows.shift();
  const idx = {};
  header.forEach((h, i) => { idx[h.trim()] = i; });

  const seen = new Set();
  const db = [];
  for (const r of rows) {
    if (r.length < 4) continue;
    const fullName = r[idx.name].trim();
    if (!fullName || seen.has(fullName)) continue; // de-dupe accidental repeats
    seen.add(fullName);

    const manaCostFull = (r[idx.mana_cost] || '').trim();
    const typeFull = (r[idx.type_line] || '').trim();
    const oracle = r[idx.oracle_text] || '';
    const powerStr = (r[idx.power] || '').trim();
    const toughStr = (r[idx.toughness] || '').trim();

    // Use the front face for double-faced cards.
    const frontCost = manaCostFull.split('//')[0].trim();
    const frontType = typeFull.split('//')[0].trim();

    const mana = parseManaCost(frontCost);
    const typeLower = frontType.toLowerCase();

    const card = {
      name: fullName,
      isDFC: fullName.includes('//') || typeFull.includes('//'),
      manaCostRaw: frontCost,
      manaCostFull,
      typeLine: frontType,
      typeLineFull: typeFull,
      oracle,
      power: powerStr === '' ? null : powerStr,
      toughness: toughStr === '' ? null : toughStr,
      mana,
      cmc: mana.cmc,
      colors: mana.colors,
      isLand: typeLower.includes('land'),
      isBasicLand: typeLower.includes('basic land'),
      isCreature: typeLower.includes('creature'),
      isInstant: typeLower.includes('instant'),
      isSorcery: typeLower.includes('sorcery'),
      isArtifact: typeLower.includes('artifact'),
      isEnchantment: typeLower.includes('enchantment'),
      isPlaneswalker: typeLower.includes('planeswalker'),
      isLegendary: typeLower.includes('legendary'),
    };
    card.isPermanent = card.isLand || card.isCreature || card.isArtifact ||
                       card.isEnchantment || card.isPlaneswalker;
    db.push(card);
  }
  return db;
}

const CARD_DB = buildCardDB();
const CARD_BY_NAME = {};
CARD_DB.forEach(c => { CARD_BY_NAME[c.name] = c; });

// Pretty-print a mana cost as colored pips (HTML).
function manaCostHTML(raw) {
  if (!raw) return '';
  return raw.replace(/\{([^}]+)\}/g, (full, sym) => {
    let cls = 'c';
    if (/^[WUBRG]$/.test(sym)) cls = sym;
    else if (sym === 'C') cls = 'c';
    return `<span class="pip pip-${cls}">${sym}</span>`;
  });
}
