/* =========================================================================
   core/run.js — everything between fights: the run state, map generation,
   node outcomes, rewards, shop stock, deck changes, saving and meta stats.
   No DOM. The UI reads `run.screen` and calls these functions.
   ========================================================================= */
window.HH = window.HH || {};

HH.Run = (function () {
  const D = HH.Data;
  const FLOORS = 9; // floors 0..8, then the boss
  const LANES = 5;
  const SAVE_KEY = 'hh-run-v2';
  const META_KEY = 'hh-meta-v2';
  const rngCache = new WeakMap();

  /* ---------------- RNG bound to a run ---------------- */
  function rng(run) {
    let r = rngCache.get(run);
    if (!r) {
      r = HH.RNG.create(run.rngState);
      const next = r.next;
      r.next = function () { const v = next(); run.rngState = r.state; return v; };
      rngCache.set(run, r);
    }
    return r;
  }

  /* ---------------- New run ---------------- */
  function newRun(charId, wahala, seedStr, opts) {
    const ch = D.CHARACTERS[charId];
    const seed = (seedStr || HH.RNG.randomSeedString()).toUpperCase().trim();
    const run = {
      version: 2, seed, rngState: HH.RNG.hash(seed), char: charId, wahala: wahala || 0,
      hp: ch.maxHp, maxHp: ch.maxHp, gold: ch.gold,
      deck: [], relics: [], sachets: [null, null, null], uid: 0,
      act: 0, map: null, pos: null, floor: -1, fightsThisAct: 0,
      bosses: [], screen: 'map', removeCost: 75, seenEvents: [], lastEncounter: null,
      stats: { kills: 0, elites: 0, bosses: 0, dealt: 0, cardsPlayed: 0, goldEarned: 0, biggestHit: 0, floors: 0 },
      startedAt: Date.now()
    };
    ch.deck.forEach(([id, n]) => { for (let i = 0; i < n; i++) addCard(run, id); });
    addRelic(run, ch.relic);
    if (run.wahala >= 3) addCard(run, 'sapaCurse');
    if (run.wahala >= 5) { run.maxHp = Math.round(run.maxHp * 0.9); run.hp = run.maxHp; run.gold = 50; }
    if (opts && opts.daily) {
      run.daily = { date: opts.daily.date, twist: opts.daily.twist, ranked: !!opts.daily.ranked };
      HH.Daily.applyTwist(run, opts.daily.twist);
    }
    startAct(run, 0);
    return run;
  }

  function startAct(run, act) {
    run.act = act;
    run.floor = -1;
    run.pos = null;
    run.path = [];
    run.fightsThisAct = 0;
    run.map = genMap(run);
    run.boss = rng(run).pick(D.ACTS[act].bosses);
    run.screen = 'map';
  }

  /* ---------------- Map generation ---------------- */
  function genMap(run) {
    const r = rng(run);
    const grid = [];
    for (let f = 0; f < FLOORS; f++) grid.push(new Array(LANES).fill(null));
    const node = (f, l) => (grid[f][l] = grid[f][l] || { id: f + '-' + l, f, l, type: null, next: [], jx: r.next() * 0.5 - 0.25, jy: r.next() * 0.4 - 0.2 });

    let firstLane = -1;
    for (let p = 0; p < 6; p++) {
      let lane = r.int(0, LANES - 1);
      if (p === 1 && lane === firstLane) lane = (lane + 2) % LANES;
      if (p === 0) firstLane = lane;
      let cur = node(0, lane);
      for (let f = 0; f < FLOORS - 1; f++) {
        let nl = Math.max(0, Math.min(LANES - 1, lane + r.int(-1, 1)));
        // Avoid crossing edges
        if (nl !== lane) {
          const side = grid[f][nl];
          if (side && side.next.includes((f + 1) + '-' + lane)) nl = lane;
        }
        const nxt = node(f + 1, nl);
        if (!cur.next.includes(nxt.id)) cur.next.push(nxt.id);
        cur = nxt;
        lane = nl;
      }
    }

    const nodes = {};
    grid.forEach((row) => row.forEach((n) => { if (n) nodes[n.id] = n; }));
    const parents = {};
    Object.values(nodes).forEach((n) => n.next.forEach((id) => (parents[id] = parents[id] || []).push(n)));

    // Room types
    const special = ['elite', 'rest', 'shop'];
    for (let f = 0; f < FLOORS; f++) {
      grid[f].forEach((n) => {
        if (!n) return;
        if (f === 0) n.type = 'fight';
        else if (f === 4) n.type = 'treasure';
        else if (f === FLOORS - 1) n.type = 'rest';
        else {
          const pool = [['fight', 46], ['event', 22]];
          if (f >= 2) pool.push(['shop', 9]);
          if (f >= 3) pool.push(['elite', 14]);
          if (f >= 3 && f !== FLOORS - 2) pool.push(['rest', 10]);
          let t = r.weighted(pool);
          for (let tries = 0; tries < 6; tries++) {
            const clash = special.includes(t) && (parents[n.id] || []).some((p) => p.type === t);
            if (!clash) break;
            t = r.weighted(pool);
          }
          n.type = t;
        }
        if (f === FLOORS - 1) n.next = ['boss'];
      });
    }
    nodes.boss = { id: 'boss', f: FLOORS, l: 2, type: 'boss', next: [], jx: 0, jy: 0 };
    return { nodes, floors: FLOORS, lanes: LANES };
  }

  function reachable(run) {
    const nodes = run.map.nodes;
    if (!run.pos) return Object.values(nodes).filter((n) => n.f === 0).map((n) => n.id);
    return nodes[run.pos].next.slice();
  }

  /* ---------------- Entering a node ---------------- */
  function enterNode(run, nodeId) {
    if (!reachable(run).includes(nodeId)) return false;
    const n = run.map.nodes[nodeId];
    run.pos = nodeId;
    run.path = run.path || [];
    run.path.push(nodeId);
    run.floor = n.f;
    run.stats.floors++;
    const r = rng(run);
    const act = D.ACTS[run.act];

    switch (n.type) {
      case 'fight': {
        const pool = run.fightsThisAct < 2 ? act.easy : act.normal;
        let enc = r.pick(pool);
        if (pool.length > 1 && JSON.stringify(enc) === JSON.stringify(run.lastEncounter)) enc = r.pick(pool);
        run.lastEncounter = enc;
        run.fightsThisAct++;
        run.combatInfo = { enemies: enc, tier: 'normal' };
        run.screen = 'combat';
        break;
      }
      case 'elite':
        run.combatInfo = { enemies: r.pick(act.elites), tier: 'elite' };
        run.screen = 'combat';
        break;
      case 'boss':
        run.combatInfo = { enemies: run.boss, tier: 'boss' };
        run.screen = 'combat';
        break;
      case 'event': {
        let options = D.EVENTS.filter((e) => !run.seenEvents.includes(e.id));
        if (!options.length) { run.seenEvents = []; options = D.EVENTS; }
        const ev = r.pick(options);
        run.seenEvents.push(ev.id);
        run.event = { id: ev.id, result: null };
        run.screen = 'event';
        break;
      }
      case 'rest':
        run.rest = { done: false };
        run.screen = 'rest';
        break;
      case 'shop':
        run.shop = genShop(run);
        run.screen = 'shop';
        break;
      case 'treasure':
        run.treasure = { relic: randomRelicId(run, rollRelicRarity(run)), gold: r.int(25, 45), opened: false };
        run.screen = 'treasure';
        break;
    }
    save(run);
    return true;
  }

  /* Events can start a fight */
  function startEventFight(run, enemies) {
    run.combatInfo = { enemies, tier: 'normal', fromEvent: true };
    run.screen = 'combat';
  }

  /* ---------------- After a fight ---------------- */
  function finishCombat(run, combat, result) {
    run.hp = Math.max(0, combat.player.hp);
    if (result === 'lose') {
      run.screen = 'end';
      run.outcome = 'lose';
      recordEnd(run, false);
      clearSave();
      return;
    }
    run.relics.forEach((rel) => { const def = D.RELICS[rel.id]; if (def.onCombatEnd) def.onCombatEnd(run, rel, { tier: combat.tier }); });

    const tier = run.combatInfo.tier;
    if (tier === 'elite') run.stats.elites++;
    if (tier === 'boss') run.stats.bosses++;
    run.reward = genRewards(run, tier);
    run.screen = 'reward';
    save(run);
  }

  function genRewards(run, tier) {
    const r = rng(run);
    const mult = run.relics.reduce((m, x) => m * (D.RELICS[x.id].goldMult || 1), 1);
    const base = tier === 'boss' ? r.int(90, 110) : tier === 'elite' ? r.int(30, 42) : r.int(14, 24);
    const items = [{ kind: 'gold', amount: Math.round(base * mult) }];
    items.push({ kind: 'card', choices: cardChoices(run, { tier }) });
    const sachetChance = tier === 'normal' ? 0.4 : 0.6;
    if (r.next() < sachetChance) items.push({ kind: 'sachet', id: randomSachetId(run) });
    if (tier === 'elite') items.push({ kind: 'relic', id: randomRelicId(run, rollRelicRarity(run)) });
    return { tier, items, claimed: [] };
  }

  function rollRarity(run, tier) {
    const r = rng(run);
    if (tier === 'boss') return 'rare';
    const pairs = tier === 'elite' ? [['common', 45], ['uncommon', 40], ['rare', 15]] : [['common', 60], ['uncommon', 33], ['rare', 7]];
    return r.weighted(pairs);
  }

  function cardPool(run, rarity, includeNeutral) {
    return Object.values(D.CARDS).filter((c) =>
      (c.pool === run.char || (includeNeutral && c.pool === 'neutral')) &&
      (!rarity || c.rarity === rarity) && ['common', 'uncommon', 'rare'].includes(c.rarity));
  }

  function cardChoices(run, opts) {
    const r = rng(run);
    const count = (opts && opts.count) || 3;
    const picked = [];
    let guard = 0;
    while (picked.length < count && guard++ < 50) {
      const rarity = (opts && opts.rarity) || rollRarity(run, opts && opts.tier);
      const pool = cardPool(run, rarity, opts && opts.neutral).filter((c) => !picked.includes(c.id));
      if (!pool.length) continue;
      picked.push(r.pick(pool).id);
    }
    return picked;
  }

  function claimReward(run, index, choiceId) {
    const item = run.reward.items[index];
    if (!item || run.reward.claimed.includes(index)) return false;
    if (item.kind === 'gold') { run.gold += item.amount; run.stats.goldEarned += item.amount; }
    if (item.kind === 'card') { if (!choiceId) return false; addCard(run, choiceId); }
    if (item.kind === 'sachet') { if (!giveSachet(run, item.id)) return false; }
    if (item.kind === 'relic') addRelic(run, item.id);
    run.reward.claimed.push(index);
    save(run);
    return true;
  }

  function leaveReward(run) {
    const tier = run.reward && run.reward.tier;
    run.reward = null;
    if (tier === 'boss') {
      if (run.act >= D.ACTS.length - 1) {
        run.screen = 'end';
        run.outcome = 'win';
        recordEnd(run, true);
        clearSave();
        return;
      }
      run.bossRelics = threeBossRelics(run);
      run.screen = 'bossRelic';
    } else {
      run.screen = 'map';
    }
    save(run);
  }

  function chooseBossRelic(run, id) {
    if (id) addRelic(run, id);
    // Heal most of the way between acts
    const missing = run.maxHp - run.hp;
    run.hp += Math.round(missing * 0.75);
    startAct(run, run.act + 1);
    save(run);
  }

  function threeBossRelics(run) {
    const r = rng(run);
    const owned = run.relics.map((x) => x.id);
    const pool = Object.values(D.RELICS).filter((x) => x.rarity === 'boss' && !owned.includes(x.id)).map((x) => x.id);
    return r.shuffle(pool).slice(0, 3);
  }

  /* ---------------- Relics & sachets ---------------- */
  function rollRelicRarity(run) {
    return rng(run).weighted([['common', 50], ['uncommon', 35], ['rare', 15]]);
  }

  function randomRelicId(run, rarity) {
    const r = rng(run);
    const owned = run.relics.map((x) => x.id);
    let pool = Object.values(D.RELICS).filter((x) => x.rarity === rarity && !owned.includes(x.id) && (!x.pool || x.pool === run.char));
    if (!pool.length) pool = Object.values(D.RELICS).filter((x) => ['common', 'uncommon', 'rare'].includes(x.rarity) && !owned.includes(x.id));
    if (!pool.length) return null;
    return r.pick(pool).id;
  }

  function addRelic(run, id) {
    if (!id || run.relics.some((x) => x.id === id)) return null;
    const rel = { id, counter: 0 };
    run.relics.push(rel);
    const def = D.RELICS[id];
    if (def.onPickup) def.onPickup(run, rel);
    return def.name;
  }

  function randomSachetId(run) {
    const r = rng(run);
    const rarity = r.weighted([['common', 60], ['uncommon', 30], ['rare', 10]]);
    const pool = Object.values(D.SACHETS).filter((s) => s.rarity === rarity);
    return r.pick(pool).id;
  }

  function giveSachet(run, id) {
    const slot = run.sachets.indexOf(null);
    if (slot === -1) return false;
    run.sachets[slot] = id;
    return true;
  }

  function useSachetOutside(run, index) {
    const id = run.sachets[index];
    if (!id) return false;
    const def = D.SACHETS[id];
    if (!def.anywhere) return false;
    def.use(null, null, run);
    run.sachets[index] = null;
    save(run);
    return true;
  }

  /* ---------------- Deck changes ---------------- */
  function addCard(run, id, up) {
    const card = { uid: ++run.uid, id, up: !!up };
    run.deck.push(card);
    return card;
  }

  function canUpgrade(card) {
    const def = D.CARDS[card.id];
    return !card.up && !!def.up && ['attack', 'skill', 'power'].includes(def.type);
  }

  function upgradeCard(run, uid) {
    const c = run.deck.find((x) => x.uid === uid);
    if (!c || !canUpgrade(c)) return null;
    c.up = true;
    return D.CARDS[c.id].name + '+';
  }

  function upgradeRandom(run, n) {
    const r = rng(run);
    const names = [];
    for (let i = 0; i < n; i++) {
      const options = run.deck.filter(canUpgrade);
      if (!options.length) break;
      const c = r.pick(options);
      c.up = true;
      names.push(D.CARDS[c.id].name + '+');
    }
    return names.length ? names.join(' and ') : 'nothing (all upgraded!)';
  }

  function removeCard(run, uid) {
    const i = run.deck.findIndex((x) => x.uid === uid);
    if (i === -1) return null;
    const [c] = run.deck.splice(i, 1);
    return D.CARDS[c.id].name;
  }

  function transformCard(run, uid) {
    const i = run.deck.findIndex((x) => x.uid === uid);
    if (i === -1) return null;
    const old = run.deck[i];
    const pool = cardPool(run, null, false).filter((c) => c.id !== old.id);
    const nc = rng(run).pick(pool);
    run.deck[i] = { uid: ++run.uid, id: nc.id, up: false };
    return nc.name;
  }

  function healPlayer(run, n) {
    run.hp = Math.min(run.maxHp, run.hp + n);
  }

  /* ---------------- Rest (Buka) ---------------- */
  function restHealAmount(run) {
    const pct = run.wahala >= 4 ? 0.2 : 0.3;
    return Math.round(run.maxHp * pct);
  }

  function canRestHeal(run) {
    return !run.relics.some((r) => D.RELICS[r.id].noRestHeal);
  }

  function doRest(run, choice, uid) {
    if (run.rest.done) return null;
    let msg = '';
    if (choice === 'heal') {
      if (!canRestHeal(run)) return null;
      const before = run.hp;
      healPlayer(run, restHealAmount(run));
      msg = `You chopped amala and gbegiri. +${run.hp - before} HP.`;
    } else if (choice === 'upgrade') {
      const name = upgradeCard(run, uid);
      if (!name) return null;
      msg = `You upskilled. ${name} is ready.`;
    }
    run.relics.forEach((rel) => { const def = D.RELICS[rel.id]; if (def.onRest) def.onRest(run, rel); });
    run.rest.done = true;
    run.rest.msg = msg;
    save(run);
    return msg;
  }

  /* ---------------- Shop (Computer Village) ---------------- */
  const PRICES = { common: [45, 55], uncommon: [68, 82], rare: [135, 165] };
  const RELIC_PRICES = { common: [140, 160], uncommon: [190, 225], rare: [250, 290] };

  function genShop(run) {
    const r = rng(run);
    const cards = [];
    const seen = [];
    [['common', 2], ['uncommon', 2], ['rare', 1]].forEach(([rarity, n]) => {
      for (let i = 0; i < n; i++) {
        const pool = cardPool(run, rarity, false).filter((c) => !seen.includes(c.id));
        if (!pool.length) continue;
        const c = r.pick(pool);
        seen.push(c.id);
        cards.push({ id: c.id, price: r.int(...PRICES[rarity]), sold: false });
      }
    });
    const neutral = Object.values(D.CARDS).filter((c) => c.pool === 'neutral');
    const nc = r.pick(neutral);
    cards.push({ id: nc.id, price: r.int(...PRICES[nc.rarity]), sold: false });
    // One random card is on sale
    const sale = r.int(0, cards.length - 1);
    cards[sale].price = Math.round(cards[sale].price / 2);
    cards[sale].sale = true;

    const relics = [];
    ['common', 'uncommon', 'rare'].forEach((rarity) => {
      const id = randomRelicId(run, rarity);
      if (id && !relics.some((x) => x.id === id)) relics.push({ id, price: r.int(...RELIC_PRICES[D.RELICS[id].rarity] || [150, 200]), sold: false });
    });
    const sachets = [];
    for (let i = 0; i < 3; i++) {
      const id = randomSachetId(run);
      const rar = D.SACHETS[id].rarity;
      sachets.push({ id, price: rar === 'common' ? r.int(45, 55) : rar === 'uncommon' ? r.int(68, 80) : r.int(90, 110), sold: false });
    }
    return { cards, relics, sachets, removed: false };
  }

  function buy(run, kind, index) {
    const item = run.shop[kind][index];
    if (!item || item.sold || run.gold < item.price) return false;
    if (kind === 'cards') addCard(run, item.id);
    if (kind === 'relics') addRelic(run, item.id);
    if (kind === 'sachets' && !giveSachet(run, item.id)) return false;
    run.gold -= item.price;
    item.sold = true;
    save(run);
    return true;
  }

  function buyRemoval(run, uid) {
    if (run.shop.removed || run.gold < run.removeCost) return null;
    const name = removeCard(run, uid);
    if (!name) return null;
    run.gold -= run.removeCost;
    run.removeCost += 25;
    run.shop.removed = true;
    save(run);
    return name;
  }

  function leaveNode(run) {
    run.screen = 'map';
    run.event = null; run.rest = null; run.shop = null; run.treasure = null;
    save(run);
  }

  /* ---------------- Saving & meta ---------------- */
  function save(run) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(run)); } catch (e) { /* storage unavailable */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const run = JSON.parse(raw);
      return run && run.version === 2 && run.screen !== 'end' ? run : null;
    } catch (e) { return null; }
  }

  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
  }

  function meta() {
    const empty = { runs: 0, wins: 0, unlocked: { tech: 0, mama: 0 }, best: {} };
    try {
      const m = JSON.parse(localStorage.getItem(META_KEY) || 'null');
      return m ? Object.assign(empty, m) : empty;
    } catch (e) { return empty; }
  }

  function saveMeta(m) {
    try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) { /* ignore */ }
  }

  function recordEnd(run, won) {
    const m = meta();
    m.runs++;
    if (won) {
      m.wins++;
      const max = D.WAHALA.length - 1;
      if (run.wahala >= (m.unlocked[run.char] || 0)) m.unlocked[run.char] = Math.min(max, run.wahala + 1);
    }
    const best = m.best[run.char] || { floors: 0 };
    const total = run.act * (FLOORS + 1) + run.floor + 1;
    if (total > best.floors) m.best[run.char] = { floors: total, act: run.act + 1, wahala: run.wahala, won };
    saveMeta(m);
    run.metaAfter = m;
    run.score = HH.Daily.score(run);
  }

  function abandon(run) {
    run.outcome = 'lose';
    recordEnd(run, false);
    clearSave();
  }

  return {
    FLOORS, LANES, rng, newRun, startAct, reachable, enterNode, startEventFight,
    finishCombat, genRewards, cardChoices, claimReward, leaveReward, chooseBossRelic,
    addRelic, randomRelicId, rollRelicRarity, randomSachetId, giveSachet, useSachetOutside,
    addCard, canUpgrade, upgradeCard, upgradeRandom, removeCard, transformCard, healPlayer,
    restHealAmount, canRestHeal, doRest, genShop, buy, buyRemoval, leaveNode,
    save, load, clearSave, meta, abandon
  };
})();
