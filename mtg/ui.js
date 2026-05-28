// ui.js — rendering and interaction for the MtG MVP client.
// Both players are human-controlled. The UI shows the full game state and
// exposes the engine's primitives so players can play any card, resolving
// complex text manually where the engine doesn't automate it.

const UI = {
  selected: null,     // uid of currently selected card
  blockMode: false,   // when assigning blockers
  pendingBlocker: null,

  // ---- top-level render --------------------------------------------------

  render() {
    const G = Engine.G;
    if (!G) return;
    document.getElementById('phase-bar').innerHTML = this.renderPhaseBar();
    document.getElementById('player-top').innerHTML = this.renderPlayer(1);
    document.getElementById('player-bottom').innerHTML = this.renderPlayer(0);
    document.getElementById('stack-zone').innerHTML = this.renderStack();
    document.getElementById('detail-zone').innerHTML = this.renderDetail();
    document.getElementById('log-zone').innerHTML = this.renderLog();
    this.renderGameOver();
  },

  renderGameOver() {
    const banner = document.getElementById('gameover');
    if (Engine.G.gameOver != null) {
      banner.style.display = 'flex';
      banner.querySelector('.go-text').textContent =
        `${Engine.player(Engine.G.gameOver).name} wins!`;
    } else {
      banner.style.display = 'none';
    }
  },

  renderPhaseBar() {
    const G = Engine.G;
    const ap = Engine.player(G.active).name;
    let html = `<div class="turn-info"><b>Turn ${G.turn}</b> — ${ap}'s turn</div>`;
    html += '<div class="phases">';
    PHASES.forEach((ph, i) => {
      const cls = i === G.phaseIdx ? 'phase active' : 'phase';
      html += `<span class="${cls}" onclick="UI.jumpPhase('${ph}')">${ph}</span>`;
    });
    html += '</div>';
    html += `<div class="phase-actions">
      <button class="btn" onclick="UI.nextPhase()">Next Phase ▶</button>
      <button class="btn" onclick="UI.endTurn()">End Turn ⏭</button>`;
    if (Engine.phaseName() === 'Combat Damage') {
      html += `<button class="btn btn-red" onclick="UI.dealCombat()">⚔ Deal Combat Damage</button>`;
    }
    html += `</div>`;
    return html;
  },

  // ---- player area -------------------------------------------------------

  renderPlayer(pi) {
    const p = Engine.player(pi);
    const G = Engine.G;
    const isActive = G.active === pi;
    const bf = G.battlefield.map(u => Engine.inst(u)).filter(i => i.controller === pi);
    const lands = bf.filter(i => Engine.isLand(i));
    const creatures = bf.filter(i => i.card.isCreature && !i.card.isLand);
    const others = bf.filter(i => !Engine.isLand(i) && !i.card.isCreature);

    let html = `<div class="player ${isActive ? 'active-player' : ''}">`;
    // header
    html += `<div class="p-header">
      <span class="p-name">${p.name} ${isActive ? '◀ active' : ''}</span>
      <span class="p-life">
        <button class="life-btn" onclick="UI.life(${pi},-1)">−</button>
        ❤ ${p.life}
        <button class="life-btn" onclick="UI.life(${pi},1)">+</button>
      </span>
      <span class="p-pool">${this.renderPool(p)}</span>
      <span class="p-zones">
        <button class="zbtn" onclick="UI.viewZone(${pi},'library')">📚 ${p.library.length}</button>
        <button class="zbtn" onclick="UI.viewZone(${pi},'graveyard')">⚰ ${p.graveyard.length}</button>
        <button class="zbtn" onclick="UI.viewZone(${pi},'exile')">✦ ${p.exile.length}</button>
      </span>
    </div>`;

    // player tools
    html += `<div class="p-tools">
      <button class="tbtn" onclick="UI.draw(${pi})">Draw</button>
      <button class="tbtn" onclick="UI.lookTop(${pi})">Look Top</button>
      <button class="tbtn" onclick="UI.millPrompt(${pi})">Mill</button>
      <button class="tbtn" onclick="UI.shuffle(${pi})">Shuffle</button>
      <button class="tbtn" onclick="UI.tokenPalette(${pi})">＋Token</button>
      <button class="tbtn" onclick="UI.addCardPrompt(${pi})">＋Card</button>
      <button class="tbtn" onclick="UI.manaPrompt(${pi})">＋Mana</button>
      <button class="tbtn" onclick="UI.untapAll(${pi})">Untap All</button>
    </div>`;

    // battlefield
    html += '<div class="battlefield">';
    html += '<div class="bf-row bf-lands">' + (lands.length ? lands.map(i => this.renderPermanent(i)).join('') : '<span class="empty">no lands</span>') + '</div>';
    html += '<div class="bf-row bf-creatures">' + (creatures.length ? creatures.map(i => this.renderPermanent(i)).join('') : '<span class="empty">no creatures</span>') + '</div>';
    if (others.length) html += '<div class="bf-row bf-other">' + others.map(i => this.renderPermanent(i)).join('') + '</div>';
    html += '</div>';

    // hand
    html += `<div class="hand-label">Hand (${p.hand.length})</div>`;
    html += '<div class="hand">' + p.hand.map(u => this.renderHandCard(u)).join('') + '</div>';

    html += '</div>';
    return html;
  },

  renderPool(p) {
    const parts = [];
    COLORS.forEach(c => { if (p.manaPool[c] > 0) parts.push(`<span class="pip pip-${c}">${p.manaPool[c]}${c}</span>`); });
    return parts.length ? parts.join('') : '<span class="pool-empty">no mana</span>';
  },

  // a card on the battlefield
  renderPermanent(inst) {
    const sel = this.selected === inst.uid ? 'sel' : '';
    const tapped = inst.tapped ? 'tapped' : '';
    const attacking = inst.attacking ? 'attacking' : '';
    const blocking = inst.blockingUid ? 'blocking' : '';
    let pt = '';
    if (inst.card.isCreature) pt = `<span class="pt">${Engine.power(inst)}/${Engine.toughness(inst)}</span>`;
    let badges = '';
    if (inst.damage > 0) badges += `<span class="badge dmg">${inst.damage}🩸</span>`;
    const ctr = Object.entries(inst.counters).filter(([k, v]) => v > 0)
      .map(([k, v]) => `<span class="badge ctr">${v} ${k}</span>`).join('');
    badges += ctr;
    if (inst.summoningSick && inst.card.isCreature) badges += '<span class="badge sick">💤</span>';
    const colorCls = this.colorClass(inst.card);
    return `<div class="card perm ${sel} ${tapped} ${attacking} ${blocking} ${colorCls}"
        onclick="UI.clickPermanent(${inst.uid})">
      <div class="card-name">${this.escape(inst.name)}</div>
      <div class="card-type">${this.escape(inst.card.typeLine)}</div>
      <div class="card-badges">${badges}</div>
      ${pt}
    </div>`;
  },

  renderHandCard(uid) {
    const inst = Engine.inst(uid);
    const c = inst.card;
    const sel = this.selected === uid ? 'sel' : '';
    const colorCls = this.colorClass(c);
    const pt = c.isCreature ? `<span class="pt">${c.power}/${c.toughness}</span>` : '';
    return `<div class="card hand-card ${sel} ${colorCls}" onclick="UI.clickHand(${uid})">
      <div class="card-top"><span class="card-name">${this.escape(c.name.split('//')[0])}</span>
        <span class="card-cost">${manaCostHTML(c.manaCostRaw)}</span></div>
      <div class="card-type">${this.escape(c.typeLine)}</div>
      ${pt}
    </div>`;
  },

  colorClass(c) {
    if (c.isLand) return 'col-land';
    if (!c.colors || c.colors.length === 0) return 'col-c';
    if (c.colors.length > 1) return 'col-multi';
    return 'col-' + c.colors[0];
  },

  // ---- stack & detail panels ---------------------------------------------

  renderStack() {
    const st = Engine.G.stack;
    let html = '<h3>Stack</h3>';
    if (st.length === 0) { html += '<div class="empty">empty</div>'; return html; }
    html += '<div class="stack-items">';
    st.slice().reverse().forEach((item, ri) => {
      const idx = st.length - 1 - ri;
      const top = idx === st.length - 1 ? 'top' : '';
      html += `<div class="stack-item ${top}">
        <div class="si-name">${this.escape(item.name)} <small>(${Engine.player(item.controller).name})</small></div>
        <div class="si-text">${this.escape(item.text || '').replace(/\n/g, '<br>')}</div>
      </div>`;
    });
    html += '</div>';
    html += `<div class="stack-actions">
      <button class="btn" onclick="UI.resolveTop()">Resolve Top</button>
      <button class="btn btn-red" onclick="UI.counterTop()">Counter/Remove Top</button>
    </div>`;
    return html;
  },

  renderDetail() {
    if (this.blockMode) {
      return `<div class="detail-help"><b>Blocking mode.</b> Click a defending creature, then click the attacker it blocks. <button class="btn" onclick="UI.endBlockMode()">Done</button></div>`;
    }
    if (!this.selected) return '<div class="detail-help">Click a card to see actions. During combat, use the phase buttons.</div>';
    const inst = Engine.inst(this.selected);
    if (!inst) { this.selected = null; return ''; }
    const c = inst.card;
    let html = `<div class="detail-card">
      <div class="dc-head"><span class="dc-name">${this.escape(c.name)}</span>
        <span class="dc-cost">${manaCostHTML(c.manaCostFull)}</span></div>
      <div class="dc-type">${this.escape(c.typeLineFull || c.typeLine)}</div>`;
    if (c.isCreature) html += `<div class="dc-pt">${c.power}/${c.toughness}</div>`;
    html += `<div class="dc-text">${this.escape(c.oracle).replace(/\n/g, '<br>')}</div>`;
    html += '<div class="dc-actions">' + this.actionsFor(inst).join('') + '</div>';
    html += '</div>';
    return html;
  },

  actionsFor(inst) {
    const a = [];
    const u = inst.uid;
    if (inst.zone === 'hand') {
      if (inst.card.isLand) a.push(`<button class="btn" onclick="UI.playLand(${u})">Play Land</button>`);
      if (!inst.card.isLand) a.push(`<button class="btn" onclick="UI.castCard(${u})">Cast</button>`);
      a.push(`<button class="btn" onclick="UI.discard(${u})">Discard</button>`);
      a.push(`<button class="btn" onclick="UI.toLib(${u},false)">→Top of Library</button>`);
      a.push(`<button class="btn" onclick="UI.toLib(${u},true)">→Bottom</button>`);
      a.push(`<button class="btn" onclick="UI.exileCard(${u})">Exile</button>`);
    } else if (inst.zone === 'battlefield') {
      a.push(`<button class="btn" onclick="UI.toggleTap(${u})">${inst.tapped ? 'Untap' : 'Tap'}</button>`);
      if (Engine.isLand(inst) || /Add \{|Add one mana/i.test(inst.card.oracle)) {
        Engine.landManaOptions(inst).forEach(col => {
          a.push(`<button class="btn pip-btn pip-${col}" onclick="UI.tapMana(${u},'${col}')">Tap: {${col}}</button>`);
        });
      }
      if (inst.card.isCreature) {
        a.push(`<button class="btn" onclick="UI.counter(${u},'+1/+1',1)">+1/+1</button>`);
        a.push(`<button class="btn" onclick="UI.counter(${u},'+1/+1',-1)">−(+1/+1)</button>`);
        a.push(`<button class="btn" onclick="UI.counter(${u},'-1/-1',1)">−1/−1</button>`);
        a.push(`<button class="btn" onclick="UI.tempBuff(${u})">Temp +X/+X</button>`);
        a.push(`<button class="btn" onclick="UI.setDamage(${u})">Set Damage</button>`);
        a.push(`<button class="btn" onclick="UI.grantKeyword(${u})">Grant Keyword</button>`);
        if (Engine.phaseName() === 'Declare Attackers' && inst.controller === Engine.G.active) {
          a.push(`<button class="btn btn-red" onclick="UI.toggleAttack(${u})">${inst.attacking ? 'Cancel Attack' : 'Attack'}</button>`);
        }
        if (Engine.phaseName() === 'Declare Blockers' && inst.controller !== Engine.G.active) {
          a.push(`<button class="btn btn-red" onclick="UI.startBlock(${u})">Block with this</button>`);
        }
      }
      a.push(`<button class="btn" onclick="UI.counterCustom(${u})">Other Counter</button>`);
      a.push(`<button class="btn btn-red" onclick="UI.destroy(${u})">Destroy (→GY)</button>`);
      a.push(`<button class="btn" onclick="UI.sacrifice(${u})">Sacrifice</button>`);
      a.push(`<button class="btn" onclick="UI.bounce(${u})">Bounce (→Hand)</button>`);
      a.push(`<button class="btn" onclick="UI.exileCard(${u})">Exile</button>`);
      a.push(`<button class="btn" onclick="UI.toLib(${u},false)">→Top Lib</button>`);
    } else if (inst.zone === 'graveyard') {
      if (inst.card.isPermanent) a.push(`<button class="btn" onclick="UI.reanimate(${u})">→Battlefield</button>`);
      if (inst.card.isInstant || inst.card.isSorcery) a.push(`<button class="btn" onclick="UI.castFromGY(${u})">Cast (flashback/manual)</button>`);
      a.push(`<button class="btn" onclick="UI.toHand(${u})">→Hand</button>`);
      a.push(`<button class="btn" onclick="UI.exileCard(${u})">Exile</button>`);
      a.push(`<button class="btn" onclick="UI.toLib(${u},false)">→Top Lib</button>`);
    } else if (inst.zone === 'exile') {
      a.push(`<button class="btn" onclick="UI.castFromGY(${u})">Cast (manual)</button>`);
      a.push(`<button class="btn" onclick="UI.toHand(${u})">→Hand</button>`);
      a.push(`<button class="btn" onclick="UI.reanimate(${u})">→Battlefield</button>`);
    } else if (inst.zone === 'library') {
      a.push(`<button class="btn" onclick="UI.toHand(${u})">→Hand</button>`);
      a.push(`<button class="btn" onclick="UI.reanimate(${u})">→Battlefield</button>`);
    }
    return a;
  },

  renderLog() {
    return '<h3>Log</h3>' + Engine.log.slice(-40).reverse().map(l => `<div class="log-line">${this.escape(l)}</div>`).join('');
  },

  // ---- click handlers ----------------------------------------------------

  clickHand(uid) { this.selected = uid; this.render(); },

  clickPermanent(uid) {
    const inst = Engine.inst(uid);
    if (this.blockMode && this.pendingBlocker) {
      // assigning a block: pendingBlocker blocks this attacker
      if (inst.attacking) {
        Engine.declareBlock(this.pendingBlocker, uid);
        this.pendingBlocker = null;
        this.render();
        return;
      }
    }
    this.selected = uid;
    this.render();
  },

  // ---- phase control -----------------------------------------------------

  nextPhase() { Engine.advancePhase(); this.afterAction(); },
  endTurn() { Engine.goToPhase('Cleanup'); Engine.advancePhase(); this.afterAction(); },
  jumpPhase(name) { Engine.goToPhase(name); this.afterAction(); },
  dealCombat() { Engine.combatDamage(); this.afterAction(); },

  // ---- player tools ------------------------------------------------------

  life(pi, d) { Engine.player(pi).life += d; Engine.checkLife(); this.render(); },
  draw(pi) { Engine.draw(pi, 1); this.afterAction(); },
  shuffle(pi) { Engine.shuffle(Engine.player(pi)); Engine.logMsg(`${Engine.player(pi).name} shuffles.`); this.afterAction(); },
  untapAll(pi) {
    Engine.G.battlefield.forEach(u => { const i = Engine.inst(u); if (i.controller === pi) i.tapped = false; });
    this.afterAction();
  },
  millPrompt(pi) {
    const n = parseInt(prompt('Mill how many?', '1'), 10);
    if (n > 0) { Engine.mill(pi, n); this.afterAction(); }
  },
  manaPrompt(pi) {
    this.modal(`<h3>Add mana to ${Engine.player(pi).name}'s pool</h3>
      <div class="mana-buttons">
      ${['W', 'U', 'B', 'R', 'G', 'C'].map(c => `<button class="btn pip-btn pip-${c}" onclick="UI.addManaManual(${pi},'${c}')">{${c}}</button>`).join('')}
      </div>
      <button class="btn" onclick="UI.emptyPool(${pi})">Empty Pool</button>
      <button class="btn" onclick="UI.closeModal()">Close</button>`);
  },
  addManaManual(pi, c) { Engine.addMana(pi, c, 1); this.render(); },
  emptyPool(pi) { Engine.emptyPool(pi); this.render(); },

  // ---- card actions ------------------------------------------------------

  playLand(uid) {
    const inst = Engine.inst(uid);
    if (Engine.player(inst.controller).landPlayedThisTurn) {
      if (!confirm('A land was already played this turn. Play anyway?')) return;
    }
    Engine.playLand(uid);
    this.selected = null;
    this.afterAction();
  },

  castCard(uid) {
    const inst = Engine.inst(uid);
    const c = inst.card;
    let xValue = 0;
    if (c.mana.hasX) {
      xValue = parseInt(prompt('Value of X?', '0'), 10) || 0;
    }
    const pi = inst.controller;
    const dry = Engine.payManaCost(pi, c, { xValue, dryRun: true });
    let manaSpent;
    if (dry.ok) {
      const res = Engine.payManaCost(pi, c, { xValue });
      manaSpent = res.spent + (res.lifePaid ? res.lifePaid : 0);
    } else {
      if (!confirm('Not enough mana in your pool. Tap lands first, or cast anyway (manual payment)?')) return;
      manaSpent = c.cmc + xValue * (c.mana.pips.filter(p => p.type === 'x').length);
    }
    Engine.pushSpell(uid, { manaSpent, xValue });
    this.selected = null;
    this.afterAction();
  },

  castFromGY(uid) {
    if (!confirm('Cast this from graveyard/exile (manual cost)? It will go on the stack.')) return;
    Engine.pushSpell(uid, { manaSpent: Engine.inst(uid).card.cmc });
    this.selected = null;
    this.afterAction();
  },

  discard(uid) { Engine.moveTo(uid, 'graveyard'); this.selected = null; this.afterAction(); },
  exileCard(uid) { Engine.moveTo(uid, 'exile'); this.selected = null; this.afterAction(); },
  toLib(uid, bottom) { Engine.moveTo(uid, 'library', { bottom }); this.selected = null; this.afterAction(); },
  toHand(uid) { Engine.moveTo(uid, 'hand'); this.selected = null; this.afterAction(); },
  destroy(uid) {
    const inst = Engine.inst(uid);
    if (Engine.hasKeyword(inst, 'indestructible')) { if (!confirm('This is indestructible. Destroy anyway?')) return; }
    Engine.moveTo(uid, 'graveyard'); this.selected = null; this.afterAction();
  },
  sacrifice(uid) { Engine.moveTo(uid, 'graveyard'); this.selected = null; this.afterAction(); },
  bounce(uid) { Engine.moveTo(uid, 'hand'); this.selected = null; this.afterAction(); },
  reanimate(uid) { Engine.moveTo(uid, 'battlefield'); this.selected = null; this.afterAction(); },

  toggleTap(uid) { const i = Engine.inst(uid); i.tapped = !i.tapped; this.afterAction(); },
  tapMana(uid, color) {
    const i = Engine.inst(uid);
    if (i.tapped) { if (!confirm('Already tapped. Add mana anyway?')) return; Engine.addMana(i.controller, color, 1); }
    else Engine.tapForMana(uid, color);
    this.afterAction();
  },
  counter(uid, kind, n) { Engine.addCounter(uid, kind, n); this.afterAction(); },
  counterCustom(uid) {
    const kind = prompt('Counter type (e.g., stun, page, growth):', 'stun');
    if (!kind) return;
    const n = parseInt(prompt('How many? (negative to remove)', '1'), 10) || 0;
    Engine.addCounter(uid, kind, n);
    if (kind === 'stun' && n > 0) Engine.inst(uid).tapped = true;
    this.afterAction();
  },
  tempBuff(uid) {
    const p = parseInt(prompt('Power bonus until end of turn (+X):', '0'), 10) || 0;
    const t = parseInt(prompt('Toughness bonus until end of turn (+X):', '0'), 10) || 0;
    const i = Engine.inst(uid); i.tempP += p; i.tempT += t; this.afterAction();
  },
  setDamage(uid) {
    const d = parseInt(prompt('Marked damage:', String(Engine.inst(uid).damage)), 10) || 0;
    Engine.inst(uid).damage = d; Engine.stateBasedActions(); this.afterAction();
  },
  grantKeyword(uid) {
    const kw = prompt('Grant keyword until end of turn (flying, trample, deathtouch, first strike, double strike, lifelink, vigilance, menace, reach, indestructible, haste):', 'flying');
    if (!kw) return;
    Engine.inst(uid).tempKeywords[kw.toLowerCase().trim()] = true;
    this.afterAction();
  },

  // ---- combat ------------------------------------------------------------

  toggleAttack(uid) {
    const inst = Engine.inst(uid);
    if (inst.attacking) { Engine.unDeclareAttacker(uid); }
    else {
      if (!Engine.canAttack(inst)) {
        if (!confirm('This creature can\'t normally attack (tapped / sick / stunned). Force attack?')) return;
        inst.tapped = true;
      }
      inst.attacking = true;
      inst.attackTarget = Engine.opp(Engine.G.active);
      if (!Engine.hasKeyword(inst, 'vigilance')) inst.tapped = true;
      Engine.logMsg(`${inst.name} attacks.`);
    }
    this.afterAction();
  },
  startBlock(uid) {
    this.blockMode = true;
    this.pendingBlocker = uid;
    this.selected = null;
    Engine.logMsg(`Choose an attacker for ${Engine.inst(uid).name} to block.`);
    this.render();
  },
  endBlockMode() { this.blockMode = false; this.pendingBlocker = null; this.render(); },

  // ---- stack -------------------------------------------------------------

  resolveTop() { Engine.resolveTop(); this.afterAction(); },
  counterTop() { Engine.counterTop(); this.afterAction(); },

  // ---- zone viewers ------------------------------------------------------

  viewZone(pi, zone) {
    const p = Engine.player(pi);
    const uids = p[zone];
    const ordered = zone === 'library' ? uids : uids;
    let html = `<h3>${p.name}'s ${zone} (${uids.length})</h3>`;
    if (zone === 'library') html += `<p class="hint">Top is first. Click a card to act on it.</p>`;
    html += '<div class="zone-list">';
    if (uids.length === 0) html += '<div class="empty">empty</div>';
    ordered.forEach(u => {
      const c = Engine.inst(u).card;
      html += `<div class="zone-card ${this.colorClass(c)}" onclick="UI.zonePick(${u})">
        <span class="zc-name">${this.escape(c.name)}</span>
        <span class="zc-type">${this.escape(c.typeLine)}</span></div>`;
    });
    html += '</div><button class="btn" onclick="UI.closeModal()">Close</button>';
    this.modal(html);
  },
  zonePick(uid) { this.selected = uid; this.closeModal(); this.render(); },

  lookTop(pi) {
    const n = parseInt(prompt('Look at top how many? (scry/surveil/dig)', '2'), 10) || 0;
    if (n <= 0) return;
    const p = Engine.player(pi);
    this._lookSet = { pi, uids: p.library.slice(0, n) };
    this.renderLook();
  },
  renderLook() {
    const { pi, uids } = this._lookSet;
    const p = Engine.player(pi);
    let html = `<h3>Top of ${p.name}'s library</h3>
      <p class="hint">Choose a destination for each card. Cards left untouched stay on top in shown order.</p><div class="zone-list">`;
    uids.forEach(u => {
      const inst = Engine.inst(u);
      const c = inst.card;
      const moved = inst.zone !== 'library' ? `<span class="zc-type">→ ${inst.zone}</span>` : `<span class="zc-acts">
          <button class="btn xs" onclick="UI.topAct(${u},'hand')">Hand</button>
          <button class="btn xs" onclick="UI.topAct(${u},'graveyard')">GY</button>
          <button class="btn xs" onclick="UI.topAct(${u},'bottom')">Bottom</button>
          <button class="btn xs" onclick="UI.topAct(${u},'battlefield')">BF</button>
        </span>`;
      html += `<div class="zone-card ${this.colorClass(c)}">
        <span class="zc-name">${this.escape(c.name)}</span>
        <span class="zc-type">${this.escape(c.typeLine)}</span>${moved}</div>`;
    });
    html += '</div><button class="btn" onclick="UI.closeModal()">Done</button>';
    this.modal(html);
  },
  topAct(uid, dest) {
    if (dest === 'bottom') Engine.moveTo(uid, 'library', { bottom: true });
    else Engine.moveTo(uid, dest);
    this.render();
    this.renderLook();
  },

  // ---- add card / tokens -------------------------------------------------

  addCardPrompt(pi) {
    let html = `<h3>Add any card to ${Engine.player(pi).name}</h3>
      <input id="card-search" class="search" placeholder="type to filter..." oninput="UI.filterCards(${pi})">
      <div id="card-results" class="zone-list">${this.cardResults(pi, '')}</div>
      <button class="btn" onclick="UI.closeModal()">Close</button>`;
    this.modal(html);
    setTimeout(() => { const el = document.getElementById('card-search'); if (el) el.focus(); }, 50);
  },
  filterCards(pi) {
    const q = document.getElementById('card-search').value.toLowerCase();
    document.getElementById('card-results').innerHTML = this.cardResults(pi, q);
  },
  cardResults(pi, q) {
    const matches = CARD_DB.filter(c => c.name.toLowerCase().includes(q)).slice(0, 60);
    return matches.map(c => `<div class="zone-card ${this.colorClass(c)}">
      <span class="zc-name">${this.escape(c.name)}</span>
      <span class="zc-acts">
        <button class="btn xs" onclick="UI.addCard(${pi},'${this.attr(c.name)}','hand')">Hand</button>
        <button class="btn xs" onclick="UI.addCard(${pi},'${this.attr(c.name)}','battlefield')">BF</button>
        <button class="btn xs" onclick="UI.addCard(${pi},'${this.attr(c.name)}','library')">Lib</button>
        <button class="btn xs" onclick="UI.addCard(${pi},'${this.attr(c.name)}','graveyard')">GY</button>
      </span></div>`).join('') || '<div class="empty">no matches</div>';
  },
  addCard(pi, name, zone) {
    const card = CARD_BY_NAME[name];
    if (!card) return;
    const inst = Engine.makeInstance(card, pi);
    inst.controller = pi;
    if (zone === 'battlefield') { inst.zone = 'battlefield'; Engine.G.battlefield.push(inst.uid); if (card.isCreature) inst.summoningSick = true; }
    else { inst.zone = zone; Engine.player(pi)[zone].push(inst.uid); }
    Engine.logMsg(`${Engine.player(pi).name} adds ${name} to ${zone}.`);
    this.render();
  },

  tokenPalette(pi) {
    const tokens = TOKEN_PRESETS;
    let html = `<h3>Create token for ${Engine.player(pi).name}</h3><div class="zone-list">`;
    tokens.forEach((t, i) => {
      html += `<div class="zone-card">
        <span class="zc-name">${this.escape(t.name)}</span>
        <span class="zc-type">${t.power != null ? t.power + '/' + t.toughness + ' ' : ''}${this.escape(t.typeLine)}</span>
        <button class="btn xs" onclick="UI.createToken(${pi},${i})">Create</button></div>`;
    });
    html += `</div>
      <h4>Custom token</h4>
      <input id="tk-name" class="search" placeholder="name" value="Token">
      <input id="tk-p" class="search small" placeholder="power" value="1">
      <input id="tk-t" class="search small" placeholder="toughness" value="1">
      <input id="tk-type" class="search" placeholder="type line" value="Creature">
      <button class="btn" onclick="UI.createCustomToken(${pi})">Create Custom</button>
      <button class="btn" onclick="UI.closeModal()">Close</button>`;
    this.modal(html);
  },
  createToken(pi, idx) {
    Engine.makeToken({ ...TOKEN_PRESETS[idx] }, pi);
    this.closeModal(); this.render();
  },
  createCustomToken(pi) {
    const name = document.getElementById('tk-name').value || 'Token';
    const power = document.getElementById('tk-p').value;
    const tough = document.getElementById('tk-t').value;
    const typeLine = document.getElementById('tk-type').value || 'Creature';
    Engine.makeToken({ name, power: power === '' ? null : parseInt(power, 10), toughness: tough === '' ? null : parseInt(tough, 10), typeLine, colors: [] }, pi);
    this.closeModal(); this.render();
  },

  // ---- modal infra -------------------------------------------------------

  modal(html) {
    const m = document.getElementById('modal');
    m.querySelector('.modal-body').innerHTML = html;
    m.style.display = 'flex';
  },
  closeModal() { document.getElementById('modal').style.display = 'none'; },

  afterAction() { this.render(); },

  // ---- util --------------------------------------------------------------

  escape(s) {
    return (s == null ? '' : String(s))
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },
  attr(s) { return String(s).replace(/'/g, "\\'").replace(/"/g, '&quot;'); },
};

// Common SNC/STX-style token presets referenced by the card list.
const TOKEN_PRESETS = [
  { name: 'Fractal', power: 0, toughness: 0, typeLine: 'Creature — Fractal', colors: ['G', 'U'], oracle: '' },
  { name: 'Pest', power: 1, toughness: 1, typeLine: 'Creature — Pest', colors: ['B', 'G'], oracle: 'Whenever this token attacks, you gain 1 life.' },
  { name: 'Inkling', power: 1, toughness: 1, typeLine: 'Creature — Inkling', colors: ['W', 'B'], oracle: 'Flying' },
  { name: 'Spirit', power: 2, toughness: 2, typeLine: 'Creature — Spirit', colors: ['R', 'W'], oracle: '' },
  { name: 'Elemental', power: 3, toughness: 3, typeLine: 'Creature — Elemental', colors: ['U', 'R'], oracle: 'Flying' },
  { name: 'Goblin', power: 1, toughness: 1, typeLine: 'Creature — Goblin', colors: ['R'], oracle: '' },
  { name: 'Rabbit', power: 1, toughness: 1, typeLine: 'Creature — Rabbit', colors: ['W'], oracle: '' },
  { name: 'Ape', power: 3, toughness: 3, typeLine: 'Creature — Ape', colors: ['G'], oracle: '' },
  { name: 'Lizard', power: 8, toughness: 8, typeLine: 'Creature — Lizard', colors: ['R'], oracle: '' },
  { name: 'Dryad', power: 1, toughness: 1, typeLine: 'Land Creature — Forest Dryad', colors: ['G'], oracle: '({T}: Add {G}.)' },
  { name: 'Treasure', power: null, toughness: null, typeLine: 'Artifact — Treasure', colors: [], oracle: '{T}, Sacrifice this token: Add one mana of any color.' },
  { name: 'Clue', power: null, toughness: null, typeLine: 'Artifact — Clue', colors: [], oracle: '{2}, Sacrifice this token: Draw a card.' },
];
