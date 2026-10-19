/* =========================================================================
   core/combat.js — one fight. Pure rules, no DOM.

   The Combat instance is the `g` object that card, status, relic and enemy
   code receives. Everything a data file can do in a fight is a method here.
   The UI plugs in:  onChange()  — redraw
                     wait(ms)    — pacing for enemy turns (Promise)
                     onEnd(res)  — 'win' | 'lose'
   Visual events are queued in `events` for the UI to drain.
   ========================================================================= */
window.HH = window.HH || {};

(function () {
  const D = HH.Data;
  const BASE_GINGER = 3;
  const BASE_DRAW = 5;
  const HAND_LIMIT = 10;
  const MAX_ENEMIES = 4;
  const DECAYING = ['shaken', 'exposed', 'broke'];

  /* AI helpers given to enemy ai() functions */
  function makeAI(g) {
    return {
      cycle: (me, keys) => keys[me.turns % keys.length],
      last: (me) => me.history[me.history.length - 1],
      turn: (me) => me.turns,
      weighted(me, g2, pairs, opts) {
        const max = (opts && opts.max) || 99;
        const recent = me.history.slice(-max);
        let options = pairs.filter(([k]) => !(recent.length === max && recent.every((h) => h === k)));
        if (!options.length) options = pairs;
        return g.rng.weighted(options);
      }
    };
  }

  class Combat {
    constructor(run, enemyIds, tier) {
      this.run = run;
      this.rng = HH.Run.rng(run);
      this.combat = this; // data code reads g.combat.*
      this.tier = tier || 'normal';
      this.turn = 0;
      this.ginger = 0;
      this.phase = 'start'; // start | player | enemy | won | lost
      this.result = null;
      this.cardsThisTurn = 0;
      this.flags = {};
      this.events = [];
      this.messages = [];
      this.uid = 0;
      this.logId = 0;
      this.stats = { dealt: 0, taken: 0, biggestHit: 0, cardsPlayed: 0 };
      this.AI = makeAI(this);

      this.onChange = () => {};
      this.onEnd = () => {};
      this.wait = () => Promise.resolve();

      this.player = {
        uid: 'p', isPlayer: true, name: D.CHARACTERS[run.char].name,
        hp: run.hp, maxHp: run.maxHp, block: 0, statuses: {}, dead: false
      };
      this.enemies = [];
      this.followers = []; // The Creator's allies: { uid, type }
      this.enemyIds = enemyIds;

      // Build the draw pile from the run deck; Innate cards go on top
      const cards = run.deck.map((c) => ({ uid: ++this.uid, id: c.id, up: c.up, deckUid: c.uid }));
      const shuffled = this.rng.shuffle(cards);
      const innate = shuffled.filter((c) => this.keys(c).includes('innate'));
      const rest = shuffled.filter((c) => !this.keys(c).includes('innate'));
      this.piles = { draw: rest.concat(innate), hand: [], discard: [], exhaust: [] };
    }

    /* ================= Setup & turn flow ================= */
    start() {
      this.enemyIds.forEach((id) => this.spawnEnemy(id, true));
      this.fireRelics('onCombatStart');
      this.enemies.forEach((e) => this.chooseIntent(e));
      this.log(`${this.enemies.filter((e) => !e.dead).map((e) => e.name).join(' & ')} don block your road!`, 'system');
      this.startPlayerTurn();
      this.onChange();
    }

    spawnEnemy(id, initial) {
      const def = D.ENEMIES[id];
      if (this.alive().length >= MAX_ENEMIES) return null;
      const wahala = this.run.wahala;
      let hp = this.rng.int(def.hp[0], def.hp[1]);
      if (wahala >= 1) hp = Math.round(hp * 1.1);
      const e = {
        uid: 'e' + ++this.uid, id, name: def.name, tier: def.tier, size: def.size || 1,
        hp, maxHp: hp, block: 0, statuses: {}, dead: false,
        turns: 0, history: [], data: { stolen: 0 }, move: null, summoned: !initial,
        dmgMult: wahala >= 2 && def.tier !== 'normal' ? 1.2 : 1
      };
      this.enemies.push(e);
      if (def.start) def.start(this, e);
      if (!initial) {
        this.chooseIntent(e);
        this.emit('spawn', e.uid);
      }
      return e;
    }

    startPlayerTurn() {
      if (this.isOver()) return;
      this.turn++;
      this.phase = 'player';
      this.cardsThisTurn = 0;
      const P = this.player;

      if (!this.playerHas('shakara')) P.block = 0;

      let ginger = BASE_GINGER + this.relicSum('gingerPerTurn');
      ginger += this.status(P, 'funding') - this.status(P, 'drained');
      this.removeStatus(P, 'funding');
      this.removeStatus(P, 'drained');
      this.ginger = Math.max(0, ginger);

      const draw = BASE_DRAW + this.relicSum('drawPerTurn') + this.status(P, 'extraDraw');
      this.removeStatus(P, 'extraDraw');

      this.fireStatuses(P, 'onTurnStart');
      if (this.checkEnd()) return;
      this.fireRelics('onTurnStart');
      if (this.checkEnd()) return;

      this.draw(draw);
      this.log(`Turn ${this.turn}. Make your move.`, 'turn');
      this.emit('turnStart');
    }

    async endTurn() {
      if (this.phase !== 'player') return;
      this.endPlayerTurn();
      this.onChange();
      if (this.isOver()) return;
      await this.wait(350);
      await this.enemyPhase();
    }

    endPlayerTurn() {
      this.phase = 'enemy';
      const P = this.player;

      // Cards left in hand
      for (const card of this.piles.hand.slice()) {
        const def = this.def(card);
        if (def.onEndTurnInHand) def.onEndTurnInHand(this);
        if (this.checkEnd()) return;
      }
      const keep = [];
      for (const card of this.piles.hand) {
        const keys = this.keys(card);
        card.costTurn = null;
        if (keys.includes('retain')) keep.push(card);
        else if (keys.includes('fleeting')) this.moveToExhaust(card);
        else this.piles.discard.push(card);
      }
      this.piles.hand = keep;

      if (this.followers.length) {
        this.triggerFollowers(1 + this.status(P, 'blueTick'));
        if (this.checkEnd()) return;
      }

      this.fireStatuses(P, 'onTurnEnd');
      if (this.checkEnd()) return;
      this.fireRelics('onTurnEnd');
      if (this.checkEnd()) return;
      this.decay(P);
      this.log('You end your turn.', 'system');
    }

    async enemyPhase() {
      const acting = this.alive().slice();
      for (const e of acting) {
        if (e.dead || this.isOver()) continue;
        e.block = 0;
        this.fireStatuses(e, 'onTurnStart');
        this.onChange();
        if (this.checkEnd()) return;
        if (e.dead) continue;

        await this.executeMove(e);
        if (this.isOver()) return;

        this.fireStatuses(e, 'onTurnEnd');
        if (this.checkEnd()) return;
        this.decay(e);
        e.turns++;
        this.chooseIntent(e);
        this.onChange();
        await this.wait(380);
        if (this.isOver()) return;
      }
      this.startPlayerTurn();
      this.onChange();
    }

    async executeMove(e) {
      const def = D.ENEMIES[e.id];
      const move = def.moves[e.move];
      if (!move) return;
      const P = this.player;

      this.emit('enemyAct', e.uid);
      this.log(`${e.name}: “${move.bark || move.name}”`, 'enemy');
      this.onChange();
      await this.wait(420);

      if (move.block) this.gainBlock(e, move.block);
      if (move.blockAll) this.alive().forEach((a) => this.gainBlock(a, move.blockAll));
      (move.buff || []).forEach(([id, n]) => this.addStatus(e, id, n));
      (move.buffAll || []).forEach(([id, n]) => this.alive().forEach((a) => this.addStatus(a, id, n)));
      if (move.block || move.blockAll || move.buff || move.buffAll) { this.onChange(); await this.wait(250); }

      if (move.d) {
        const hits = move.hits || 1;
        for (let i = 0; i < hits; i++) {
          if (P.dead || e.dead) break;
          this.dealDamage(e, P, move.d, { attack: true });
          this.onChange();
          if (this.isOver()) return;
          await this.wait(hits > 1 ? 200 : 260);
        }
      }
      (move.debuff || []).forEach(([id, n]) => this.apply(P, id, n, e));
      (move.addCards || []).forEach(([id, n, where]) => {
        this.addCard(id, where, { count: n });
        this.log(`${n}× ${D.CARDS[id].name} added to your ${where === 'draw' ? 'draw pile' : where}.`, 'warn');
      });
      if (move.steal) this.stealGold(e, move.steal);
      if (move.heal) this.healCreature(e, move.heal);
      if (move.summon) {
        const s = this.spawnEnemy(move.summon, false);
        if (s) this.log(`${s.name} don join the fight!`, 'enemy');
      }
      if (move.special) move.special(this, e);
      e.history.push(e.move);
      this.onChange();
      this.checkEnd();
    }

    chooseIntent(e) {
      if (e.dead) return;
      const def = D.ENEMIES[e.id];
      e.move = def.ai(e, this, this.AI);
    }

    /* Intent preview for the UI */
    intentOf(e) {
      if (e.dead || !e.move) return null;
      const move = D.ENEMIES[e.id].moves[e.move];
      const items = [];
      if (move.d) items.push({ type: 'attack', value: this.calcDamage(e, this.player, move.d), hits: move.hits || 1 });
      if (move.block || move.blockAll) items.push({ type: 'block', value: move.block || move.blockAll });
      if (move.buff || move.buffAll) items.push({ type: 'buff' });
      if (move.debuff || move.addCards || move.steal) items.push({ type: 'debuff', steal: move.steal });
      if (move.summon) items.push({ type: 'summon' });
      if (move.heal) items.push({ type: 'heal', value: move.heal });
      if (!items.length) items.push({ type: 'special' });
      return { name: move.name, items, hidden: !!this.relicFlag('hideIntents') };
    }

    /* ================= Cards ================= */
    def(card) { return D.CARDS[card.id]; }

    values(card) {
      const def = this.def(card);
      return card.up && def.up && def.up.v ? Object.assign({}, def.v, def.up.v) : Object.assign({}, def.v);
    }

    keys(card) {
      const def = this.def(card);
      if (card.up && def.up && def.up.keys) return def.up.keys;
      return def.keys || [];
    }

    cost(card) {
      const def = this.def(card);
      if (def.cost === null) return null;
      if (card.costTurn != null) return card.costTurn;
      if (card.up && def.up && def.up.cost !== undefined) return def.up.cost;
      return def.cost;
    }

    canPlay(card) {
      if (this.phase !== 'player') return false;
      const c = this.cost(card);
      if (c === null) return false;
      if (c === 'X') return true;
      return this.ginger >= c;
    }

    needsTarget(card) { return this.def(card).target === 'enemy'; }

    /* Returns true if the card was played */
    playCard(uid, targetUid) {
      if (this.phase !== 'player') return false;
      const idx = this.piles.hand.findIndex((c) => c.uid === uid);
      if (idx === -1) return false;
      const card = this.piles.hand[idx];
      const def = this.def(card);
      const cost = this.cost(card);

      if (cost === null) { this.log(`${def.name} cannot be played.`, 'warn'); this.emit('nope', card.uid); this.onChange(); return false; }
      if (cost !== 'X' && this.ginger < cost) { this.log('You no get ginger for this one.', 'warn'); this.emit('nope', card.uid); this.onChange(); return false; }

      let target = null;
      if (def.target === 'enemy') {
        target = this.enemies.find((e) => e.uid === targetUid && !e.dead);
        if (!target) {
          const alive = this.alive();
          if (alive.length === 1) target = alive[0];
          else return false;
        }
      }

      let x = 0;
      if (cost === 'X') { x = this.ginger; card.paid = x; this.ginger = 0; }
      else { card.paid = cost; this.ginger -= cost; }

      this.piles.hand.splice(idx, 1);
      this.cardsThisTurn++;
      this.stats.cardsPlayed++;
      this.run.stats.cardsPlayed++;
      this.lastTarget = target;
      this.lastX = x;
      this.emit('cardPlayed', { uid: card.uid, type: def.type });

      def.play(this, target, this.values(card), x);

      if (def.type === 'power') { /* powers vanish once played */ }
      else if (this.keys(card).includes('exhaust')) this.moveToExhaust(card);
      else this.piles.discard.push(card);

      this.log(`You played ${def.name}${card.up ? '+' : ''}${target ? ' on ' + target.name : ''}.`, 'player');

      if (!this.isOver()) {
        this.fireStatuses(this.player, 'onCardPlayed', card, def);
        this.fireRelics('onCardPlayed', card, def);
        this.alive().forEach((e) => this.fireStatuses(e, 'onPlayerCardPlayed', card, def));
      }
      this.checkEnd();
      this.onChange();
      return true;
    }

    replayCard(card) {
      const def = this.def(card);
      let t = this.lastTarget;
      if (def.target === 'enemy' && (!t || t.dead)) t = this.randomEnemy();
      if (def.target === 'enemy' && !t) return;
      this.log(`${def.name} plays again!`, 'relic');
      def.play(this, t, this.values(card), this.lastX);
    }

    draw(n) {
      let drawn = 0;
      for (let i = 0; i < n; i++) {
        if (this.piles.draw.length === 0) {
          if (this.piles.discard.length === 0) break;
          this.piles.draw = this.rng.shuffle(this.piles.discard);
          this.piles.discard = [];
          this.emit('reshuffle');
        }
        const card = this.piles.draw.pop();
        if (this.piles.hand.length >= HAND_LIMIT) {
          this.piles.discard.push(card);
          continue;
        }
        this.piles.hand.push(card);
        drawn++;
        const def = this.def(card);
        if (def.onDraw) def.onDraw(this);
      }
      if (drawn) this.emit('draw', drawn);
      return drawn;
    }

    discardHand() {
      const n = this.piles.hand.length;
      this.piles.discard.push(...this.piles.hand);
      this.piles.hand = [];
      return n;
    }

    addCard(id, where, opts) {
      const count = (opts && opts.count) || 1;
      for (let i = 0; i < count; i++) {
        const card = { uid: ++this.uid, id, up: !!(opts && opts.up), temp: true };
        if (where === 'hand' && this.piles.hand.length < HAND_LIMIT) this.piles.hand.push(card);
        else if (where === 'draw') {
          const pos = this.rng.int(0, this.piles.draw.length);
          this.piles.draw.splice(pos, 0, card);
        } else this.piles.discard.push(card);
      }
      this.emit('cardAdded', where);
    }

    exhaustCard(card) {
      const i = this.piles.hand.indexOf(card);
      if (i !== -1) this.piles.hand.splice(i, 1);
      this.moveToExhaust(card);
    }

    moveToExhaust(card) {
      this.piles.exhaust.push(card);
      this.emit('exhaust', card.uid);
      this.fireStatuses(this.player, 'onExhaust', card);
    }

    exhaustRandomFromHand() {
      if (!this.piles.hand.length) return;
      const card = this.rng.pick(this.piles.hand);
      this.exhaustCard(card);
      this.log(`${this.def(card).name} was seized and exhausted.`, 'warn');
    }

    /* ================= Damage, block, HP ================= */
    calcDamage(source, target, base) {
      let d = base + this.status(source, 'clout');
      if (source.dmgMult && source.dmgMult !== 1) d = Math.floor(d * source.dmgMult);
      if (this.status(source, 'shaken') > 0) d = Math.floor(d * 0.75);
      if (target && this.status(target, 'exposed') > 0) d = Math.floor(d * 1.5);
      return Math.max(0, d);
    }

    calcBlock(base) {
      let b = base + this.status(this.player, 'steeze');
      if (this.status(this.player, 'broke') > 0) b = Math.floor(b * 0.75);
      return Math.max(0, b);
    }

    /* Player attacks: target can be a creature, 'random' or 'all' */
    attack(target, base, hits) {
      hits = hits || 1;
      for (let i = 0; i < hits; i++) {
        if (this.isOver()) return;
        if (target === 'all') { this.attackAll(base); continue; }
        const t = target === 'random' ? this.randomEnemy() : target;
        if (!t || t.dead) return;
        this.dealDamage(this.player, t, base, { attack: true });
      }
    }

    attackAll(base) {
      this.alive().forEach((e) => this.dealDamage(this.player, e, base, { attack: true }));
    }

    dealDamage(source, target, base, opts) {
      opts = opts || {};
      if (!target || target.dead) return { dmg: 0, blocked: 0, hpLoss: 0 };
      const dmg = opts.raw ? base : this.calcDamage(source, target, base);
      const blocked = Math.min(target.block, dmg);
      target.block -= blocked;
      let hpLoss = dmg - blocked;
      if (target.isPlayer && hpLoss > 0) hpLoss = this.modifyHpLoss(hpLoss);
      target.hp = Math.max(0, target.hp - hpLoss);

      if (source && source.isPlayer) {
        this.stats.dealt += hpLoss;
        this.run.stats.dealt += hpLoss;
        if (dmg > this.stats.biggestHit) this.stats.biggestHit = dmg;
        if (dmg > this.run.stats.biggestHit) this.run.stats.biggestHit = dmg;
      }
      if (target.isPlayer) this.stats.taken += hpLoss;
      if (target.isPlayer && hpLoss > 0 && opts.attack && this.followers.length && !this.playerHas('verified')) this.unfollow();

      this.emit('hit', { uid: target.uid, dmg, blocked, hpLoss, big: dmg >= 20 });
      if (opts.attack && !target.dead && source) this.fireStatuses(target, 'onAttacked', source, dmg);
      this.checkDeath(target);
      if (source && source.hp <= 0) this.checkDeath(source);
      return { dmg, blocked, hpLoss };
    }

    /* Direct HP loss — ignores Vibe Check (Interest, Juju, self-damage) */
    loseHp(target, n, reason) {
      if (!target || target.dead || n <= 0) return;
      let loss = n;
      if (target.isPlayer) loss = this.modifyHpLoss(loss);
      target.hp = Math.max(0, target.hp - loss);
      if (!target.isPlayer) { this.stats.dealt += loss; this.run.stats.dealt += loss; }
      else this.stats.taken += loss;
      this.emit('hpLoss', { uid: target.uid, n: loss, reason });
      this.checkDeath(target);
    }

    modifyHpLoss(amount) {
      let n = amount;
      this.run.relics.forEach((r) => {
        const def = D.RELICS[r.id];
        if (def.modifyHpLoss) n = def.modifyHpLoss(this, r, n);
      });
      return n;
    }

    gainBlock(c, n) {
      if (n <= 0 || c.dead) return;
      c.block += n;
      this.emit('block', { uid: c.uid, n });
    }

    block(base) { this.gainBlock(this.player, this.calcBlock(base)); }

    heal(n) { this.healCreature(this.player, n); }

    healCreature(c, n) {
      if (c.dead) return;
      const before = c.hp;
      c.hp = Math.min(c.maxHp, c.hp + n);
      if (c.hp > before) this.emit('heal', { uid: c.uid, n: c.hp - before });
    }

    checkDeath(c) {
      if (c.hp > 0 || c.dead) return;
      if (c.isPlayer) {
        c.dead = true;
        this.finish('lose');
        return;
      }
      c.dead = true;
      c.block = 0;
      this.run.stats.kills++;
      if (c.data.stolen > 0) {
        this.run.gold += c.data.stolen;
        this.log(`You got back ₦${c.data.stolen} from ${c.name}.`, 'win');
        c.data.stolen = 0;
      }
      this.log(`${c.name} is down!`, 'win');
      this.emit('death', c.uid);
      this.fireRelics('onEnemyDeath', c);
      // Minions flee when the leader falls? Followers stay; fight ends when all are down.
      this.checkEnd();
    }

    checkEnd() {
      if (this.isOver()) return true;
      if (this.player.hp <= 0) { this.finish('lose'); return true; }
      if (this.alive().length === 0) { this.finish('win'); return true; }
      return false;
    }

    finish(result) {
      if (this.result) return;
      this.result = result;
      this.phase = result === 'win' ? 'won' : 'lost';
      this.log(result === 'win' ? 'Fight over. You Scaled!' : 'You Don Cast.', result);
      this.emit('end', result);
      Promise.resolve().then(() => this.onEnd(result));
    }

    isOver() { return !!this.result; }

    /* ================= Statuses ================= */
    status(c, id) { return (c && c.statuses[id]) || 0; }

    playerHas(id) { return this.status(this.player, id) > 0; }

    addStatus(c, id, n) {
      if (!c || c.dead || !n) return;
      const def = D.STATUSES[id];
      const next = (c.statuses[id] || 0) + n;
      if (next === 0 || (next < 0 && !(def && def.canGoNegative))) delete c.statuses[id];
      else c.statuses[id] = next;
      this.emit('status', { uid: c.uid, id, n });
    }

    removeStatus(c, id) { if (c) delete c.statuses[id]; }

    /* Apply with VPN checks and relic bonuses; fires onApplyStatus. */
    apply(target, id, n, source) {
      source = source || this.player;
      if (!target || target.dead || n <= 0) return;
      const def = D.STATUSES[id];
      if (def.kind === 'debuff' && this.status(target, 'vpn') > 0 && source !== target) {
        this.addStatus(target, 'vpn', -1);
        this.log(`VPN blocked ${def.name}.`, 'system');
        this.emit('blockedDebuff', target.uid);
        return;
      }
      if (source.isPlayer && !target.isPlayer) n += this.relicApplyBonus(id);
      this.addStatus(target, id, n);
      if (source.isPlayer && target !== source) this.fireStatuses(source, 'onApplyStatus', target, id, n);
    }

    applyAll(id, n) { this.alive().forEach((e) => this.apply(e, id, n)); }

    cleanse(c) {
      Object.keys(c.statuses).forEach((id) => {
        const def = D.STATUSES[id];
        if (def.kind === 'debuff' || ((id === 'clout' || id === 'steeze') && c.statuses[id] < 0)) delete c.statuses[id];
      });
    }

    decay(c) {
      DECAYING.forEach((id) => { if (c.statuses[id]) this.addStatus(c, id, -1); });
    }

    gainHype(n) {
      if (n <= 0) return;
      this.addStatus(this.player, 'hype', n);
      this.emit('hype', n);
      this.fireStatuses(this.player, 'onHypeGain', n);
    }

    spendHype() {
      const h = this.status(this.player, 'hype');
      this.removeStatus(this.player, 'hype');
      if (h) this.emit('hypeSpent', h);
      return h;
    }

    gainGinger(n) { this.ginger += n; this.emit('ginger', n); }

    gainGold(n) {
      this.run.gold += n;
      this.run.stats.goldEarned += n;
      this.emit('gold', n);
    }

    stealGold(e, n) {
      const take = Math.min(this.run.gold, n);
      if (take <= 0) return;
      this.run.gold -= take;
      e.data.stolen += take;
      this.addStatus(e, 'stolen', take);
      this.log(`${e.name} took ₦${take} from you!`, 'enemy');
      this.emit('steal', { uid: e.uid, n: take });
    }

    /* ================= Hooks ================= */
    fireStatuses(c, hook, ...args) {
      if (!c || c.dead) return;
      Object.keys(c.statuses).forEach((id) => {
        const def = D.STATUSES[id];
        const n = c.statuses[id];
        if (def && def.hooks && def.hooks[hook] && n) def.hooks[hook](this, c, n, ...args);
      });
    }

    fireRelics(hook, ...args) {
      this.run.relics.forEach((r) => {
        const def = D.RELICS[r.id];
        if (def[hook]) def[hook](this, r, ...args);
      });
    }

    relicSum(key) {
      return this.run.relics.reduce((s, r) => s + (D.RELICS[r.id][key] || 0), 0);
    }

    relicFlag(key) { return this.run.relics.some((r) => D.RELICS[r.id][key]); }

    relicApplyBonus(id) {
      return this.run.relics.reduce((s, r) => {
        const b = D.RELICS[r.id].applyBonus;
        return s + ((b && b[id]) || 0);
      }, 0);
    }

    /* ================= Followers (The Creator) ================= */
    followerSlots() { return 5 + this.status(this.player, 'extraSlots'); }
    reach() { return this.status(this.player, 'reach'); }

    gainFollower(type) {
      if (this.isOver()) return;
      if (this.followers.length >= this.followerSlots()) this.evokeFollower(0);
      const f = { uid: 'f' + ++this.uid, type };
      this.followers.push(f);
      this.emit('follower', { uid: f.uid, type });
      this.log(`${D.FOLLOWERS[type].name} followed you!`, 'player');
    }

    /* Cash in the follower at `index`; its evoke runs `times` times */
    evokeFollower(index, times) {
      const f = this.followers[index || 0];
      if (!f) return;
      this.followers.splice(index || 0, 1);
      const def = D.FOLLOWERS[f.type];
      this.emit('evoke', { uid: f.uid, type: f.type });
      this.log(`You cashed in ${def.name}.`, 'player');
      for (let i = 0; i < (times || 1); i++) { if (this.isOver()) break; def.evoke(this, this.reach()); }
      this.fireStatuses(this.player, 'onEvoke', f.type);
      this.checkEnd();
    }

    triggerFollowers(times) {
      for (let t = 0; t < (times || 1); t++) {
        this.followers.slice().forEach((f) => {
          if (this.isOver() || !this.followers.includes(f)) return;
          this.emit('passive', { uid: f.uid, type: f.type });
          D.FOLLOWERS[f.type].passive(this, this.reach());
        });
      }
      this.checkEnd();
    }

    triggerNewest(times) {
      const f = this.followers[this.followers.length - 1];
      if (!f) return;
      for (let t = 0; t < (times || 1); t++) {
        if (this.isOver()) return;
        this.emit('passive', { uid: f.uid, type: f.type });
        D.FOLLOWERS[f.type].passive(this, this.reach());
      }
      this.checkEnd();
    }

    unfollow() {
      const f = this.followers.shift();
      if (!f) return;
      this.emit('unfollow', { uid: f.uid, type: f.type });
      this.log(`${D.FOLLOWERS[f.type].name} unfollowed you!`, 'warn');
      this.fireStatuses(this.player, 'onUnfollow', f.type);
    }

    /* ================= Queries & helpers ================= */
    alive() { return this.enemies.filter((e) => !e.dead); }
    allies(me) { return this.alive().filter((e) => e !== me); }
    randomEnemy() { const a = this.alive(); return a.length ? this.rng.pick(a) : null; }
    summon(id) { return this.spawnEnemy(id, false); }

    useSachet(index) {
      if (this.phase !== 'player') return false;
      const id = this.run.sachets[index];
      if (!id) return false;
      const def = D.SACHETS[id];
      this.run.sachets[index] = null;
      def.use(this, null, this.run);
      this.log(`You used ${def.name}.`, 'player');
      this.emit('sachet', id);
      this.checkEnd();
      this.onChange();
      return true;
    }

    log(text, kind) {
      this.messages.unshift({ id: ++this.logId, text, kind: kind || 'info' });
      if (this.messages.length > 100) this.messages.pop();
    }
    emit(type, data) { this.events.push({ type, data }); }
  }

  HH.Combat = Combat;
})();
