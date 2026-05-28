// app.js — bootstrap, deck generation, and screen control for the MtG MVP.

const App = {
  start(mode) {
    const names = ['Player 1', 'Player 2'];
    const decks = [this.buildDeck(), this.buildDeck()];
    Engine.newGame(decks, names);
    document.getElementById('screen-start').style.display = 'none';
    document.getElementById('screen-game').style.display = 'block';
    UI.render();
  },

  // Build a ~40-card 5-color sandbox deck: 20 basics (4 of each) + 20 spells
  // drawn at random from the non-land card pool. Plenty of mana of every color
  // so any listed card can actually be cast.
  buildDeck() {
    const deck = [];
    const basics = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest'];
    basics.forEach(b => { for (let i = 0; i < 4; i++) deck.push(b); });

    const spells = CARD_DB.filter(c => !c.isLand && !c.isBasicLand);
    const pool = spells.slice();
    for (let i = 0; i < 20 && pool.length; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      deck.push(pool[idx].name);
      pool.splice(idx, 1);
    }
    return deck;
  },
};

window.addEventListener('DOMContentLoaded', () => {
  // wire up start button
  const btn = document.getElementById('btn-start');
  if (btn) btn.addEventListener('click', () => App.start('quick'));
  // close modal on backdrop click
  const m = document.getElementById('modal');
  if (m) m.addEventListener('click', e => { if (e.target === m) UI.closeModal(); });
});
