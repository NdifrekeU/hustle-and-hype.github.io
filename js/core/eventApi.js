/* =========================================================================
   core/eventApi.js — the `api` object event choices receive.
   Interactive bits (picking a card, choosing a reward) are delegated to
   the UI through `ui` callbacks, which return Promises.
   ========================================================================= */
window.HH = window.HH || {};

HH.makeEventApi = function (run, ui) {
  const R = HH.Run;
  const D = HH.Data;
  return {
    rng: () => R.rng(run).next(),
    gold(n) { run.gold = Math.max(0, run.gold + n); if (n > 0) run.stats.goldEarned += n; },
    heal(n) { R.healPlayer(run, n); },
    damage(n) { run.hp = Math.max(1, run.hp - n); },
    maxHp(n) { run.maxHp += n; run.hp += n; },
    addCard(id) { R.addCard(run, id); return D.CARDS[id].name; },
    relic(rarity, id) {
      const rid = id || R.randomRelicId(run, rarity || R.rollRelicRarity(run));
      return R.addRelic(run, rid) || 'nothing new';
    },
    sachet() {
      const id = R.randomSachetId(run);
      return R.giveSachet(run, id) ? D.SACHETS[id].name : 'nothing (your pockets are full)';
    },
    upgradeRandom(n) { return R.upgradeRandom(run, n); },
    pickCard(mode) { return ui.pickCard(mode); },
    cardReward(opts) { return ui.cardReward(R.cardChoices(run, opts)); },
    fight(ids) { ui.fight(ids); }
  };
};
