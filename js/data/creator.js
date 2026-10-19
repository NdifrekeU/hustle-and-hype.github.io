/* =========================================================================
   data/creator.js — The Creator: third playable hustler.

   Mechanic: FOLLOWERS. Cards add Followers to your feed (max 5 slots).
   • At the end of each of your turns, every Follower does its passive.
   • "Cash in" (evoke) removes a Follower for a bigger one-time effect.
   • Feed full? Gaining a new Follower cashes in your oldest one.
   • Take HP damage from an attack and your oldest Follower UNFOLLOWS you
     (no cash-in). Keep your Vibe Check up to keep your audience.
   • Reach adds to every Follower's numbers.
   This file adds its statuses, cards, relics and character to the
   shared tables, so the engine needs no Creator-specific code paths.
   ========================================================================= */
window.HH = window.HH || {};
HH.Data = HH.Data || {};

(function (D) {
  /* ---- Follower types -------------------------------------------- */
  // passive(g, reach) at end of your turn · evoke(g, reach) when cashed in
  D.FOLLOWERS = {
    stan: {
      name: 'Stan', icon: '⚔️', color: '#e2553a',
      art: { body: 'tee', top: '#e2553a', bottom: '#2b2b33', skin: '#6b3e24', hair: 'lowcut', face: 'none', prop: 'phone', expr: 'shout' },
      desc: (r) => `End of turn: deal ${3 + r} Gbese to a random enemy. Cash in: deal ${8 + r} to a random enemy.`,
      passive(g, r) { const t = g.randomEnemy(); if (t) g.dealDamage(g.player, t, 3 + r, { raw: true }); },
      evoke(g, r) { const t = g.randomEnemy(); if (t) g.dealDamage(g.player, t, 8 + r, { raw: true }); }
    },
    bestie: {
      name: 'Bestie', icon: '🛡️', color: '#5fb2dc',
      art: { body: 'dress', top: '#5fb2dc', bottom: '#5fb2dc', skin: '#8a5a3b', hair: 'braids', face: 'lashes', prop: 'none', expr: 'happy' },
      desc: (r) => `End of turn: you gain ${3 + r} Vibe Check. Cash in: gain ${7 + r}.`,
      passive(g, r) { g.gainBlock(g.player, 3 + r); },
      evoke(g, r) { g.gainBlock(g.player, 7 + r); }
    },
    troll: {
      name: 'Troll', icon: '💢', color: '#9a5cc6',
      art: { body: 'hoodie', top: '#5b3a7a', bottom: '#222', skin: '#5a3420', hair: 'cap', capColor: '#222', face: 'shades', prop: 'phone', expr: 'grin' },
      desc: (r) => `End of turn: deal ${1 + r} Gbese and apply 1 Shaken to a random enemy. Cash in: apply 2 Exposed to ALL enemies.`,
      passive(g, r) { const t = g.randomEnemy(); if (t) { g.dealDamage(g.player, t, 1 + r, { raw: true }); g.apply(t, 'shaken', 1); } },
      evoke(g) { g.applyAll('exposed', 2); }
    },
    brandDeal: {
      name: 'Brand Deal', icon: '💰', color: '#f2b705',
      art: { body: 'suit', top: '#2c3e50', bottom: '#2c3e50', skin: '#7a4a2c', hair: 'waves', face: 'none', prop: 'cash', expr: 'smug' },
      desc: (r) => `End of turn: gain ${3 + r} ₦. Cash in: gain 1 Ginger and draw 1 card.`,
      passive(g, r) { g.gainGold(3 + r); },
      evoke(g) { g.gainGinger(1); g.draw(1); }
    }
  };

  /* ---- Statuses & powers ------------------------------------------ */
  Object.assign(D.STATUSES, {
    reach: {
      name: 'Reach', icon: '📶', kind: 'buff', canGoNegative: true,
      desc: 'Followers’ effects are {n} stronger.'
    },
    fanPage: {
      name: 'Fan Page', icon: '📰', kind: 'power',
      desc: 'At the start of your turn, gain {n} Stan(s).',
      hooks: { onTurnStart(g, owner, n) { for (let i = 0; i < n; i++) g.gainFollower('stan'); } }
    },
    verified: {
      name: 'Verified', icon: '☑️', kind: 'power',
      desc: 'Followers no longer unfollow you when you take damage.'
    },
    blueTick: {
      name: 'Blue Tick', icon: '🔵', kind: 'power',
      desc: 'At the end of your turn, Followers do their passive {n} extra time(s).'
    },
    ambassador: {
      name: 'Brand Ambassador', icon: '🤳🏾', kind: 'power',
      desc: 'Whenever you cash in a Follower, gain {n} Vibe Check.',
      hooks: { onEvoke(g, owner, n) { g.gainBlock(owner, n); } }
    },
    superfan: {
      name: 'Superfan', icon: '🫶🏾', kind: 'power',
      desc: 'Whenever a Follower unfollows you, deal {n} Gbese to ALL enemies.',
      hooks: { onUnfollow(g, owner, n) { g.alive().forEach((e) => g.dealDamage(owner, e, n, { raw: true })); } }
    },
    extraSlots: {
      name: 'Big Feed', icon: '📲', kind: 'power',
      desc: 'You can hold {n} more Follower(s).'
    }
  });
  D.KEYWORDS['Follower'] = 'Creator allies. Each does its passive at the end of your turn. Max 5. If you lose HP to an attack, your oldest Follower unfollows you.';
  D.KEYWORDS['Cash in'] = 'Remove a Follower for its bigger one-time effect.';
  D.KEYWORDS['Reach'] = 'Makes every Follower’s numbers bigger.';

  /* ---- Cards -------------------------------------------------------- */
  const F = (type) => (g) => g.gainFollower(type);
  const cards = {
    // Starters
    clapback: {
      name: 'Clapback', pool: 'creator', type: 'attack', rarity: 'starter', cost: 1, target: 'enemy',
      art: '👏🏾', v: { d: 6 }, up: { v: { d: 9 } },
      text: 'Deal {d} Gbese.', flavor: 'Screenshot. Caption. Post.',
      play(g, t, v) { g.attack(t, v.d); }
    },
    filter: {
      name: 'Filter', pool: 'creator', type: 'skill', rarity: 'starter', cost: 1, target: 'none',
      art: '🪞', v: { b: 5 }, up: { v: { b: 8 } },
      text: 'Gain {b} Vibe Check.', flavor: 'Flawless. Allegedly.',
      play(g, t, v) { g.block(v.b); }
    },
    shoutout: {
      name: 'Shoutout', pool: 'creator', type: 'skill', rarity: 'starter', cost: 1, target: 'none',
      art: '📢', v: {}, up: { cost: 0 },
      text: 'Gain a Stan Follower.', flavor: '“Go and follow my guy!”',
      play: F('stan')
    },
    bestieDuet: {
      name: 'Bestie Duet', pool: 'creator', type: 'skill', rarity: 'starter', cost: 1, target: 'none',
      art: '👯🏾‍♀️', v: { b: 4 }, up: { v: { b: 7 } },
      text: 'Gain {b} Vibe Check. Gain a Bestie Follower.', flavor: 'Same outfit. Different angles.',
      play(g, t, v) { g.block(v.b); g.gainFollower('bestie'); }
    },

    // Common
    haterComments: {
      name: 'Hater Comments', pool: 'creator', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
      art: '💬', v: { d: 6 }, up: { v: { d: 9 } },
      text: 'Deal {d} Gbese. Gain a Troll Follower.', flavor: 'Engagement is engagement.',
      play(g, t, v) { g.attack(t, v.d); g.gainFollower('troll'); }
    },
    viralDance: {
      name: 'Viral Dance', pool: 'creator', type: 'attack', rarity: 'common', cost: 2, target: 'all',
      art: '🕺🏾', v: { d: 6 }, up: { v: { d: 9 } },
      text: 'Deal {d} Gbese to ALL enemies. Gain a Stan Follower.', flavor: 'Everybody dey do am. Even your aunty.',
      play(g, t, v) { g.attackAll(v.d); g.gainFollower('stan'); }
    },
    unboxing: {
      name: 'Unboxing', pool: 'creator', type: 'skill', rarity: 'common', cost: 1, target: 'none',
      art: '📦', v: { b: 5 }, up: { v: { b: 8 } },
      text: 'Gain {b} Vibe Check. Gain a Brand Deal Follower.', flavor: '“This is NOT sponsored.” (It is.)',
      play(g, t, v) { g.block(v.b); g.gainFollower('brandDeal'); }
    },
    blockUser: {
      name: 'Block User', pool: 'creator', type: 'skill', rarity: 'common', cost: 1, target: 'none',
      art: '🚫', v: { b: 8 }, up: { v: { b: 11 } },
      text: 'Gain {b} Vibe Check.', flavor: 'Bye.',
      play(g, t, v) { g.block(v.b); }
    },
    dragThem: {
      name: 'Drag Them', pool: 'creator', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
      art: '🧹', v: { d: 4, k: 2 }, up: { v: { d: 5, k: 3 } },
      text: 'Deal {d} Gbese + {k} per Follower.', flavor: 'A 14-slide carousel. With receipts.',
      play(g, t, v) { g.attack(t, v.d + v.k * g.followers.length); }
    },
    storyPost: {
      name: 'Story Post', pool: 'creator', type: 'skill', rarity: 'common', cost: 0, target: 'none',
      art: '⭕', v: { n: 1 }, up: { v: { n: 2 } },
      text: 'Your newest Follower acts {n} time(s).', flavor: 'Disappears in 24 hours. Screenshots last forever.',
      play(g, t, v) { g.triggerNewest(v.n); }
    },
    pinComment: {
      name: 'Pin Comment', pool: 'creator', type: 'skill', rarity: 'common', cost: 0, target: 'none',
      art: '📌', v: { b: 4 }, up: { v: { b: 6 } }, keys: ['retain'],
      text: 'Gain {b} Vibe Check. Retain.', flavor: 'Pinned: “Read before you comment.”',
      play(g, t, v) { g.block(v.b); }
    },
    thirstTrap: {
      name: 'Thirst Trap', pool: 'creator', type: 'skill', rarity: 'common', cost: 1, target: 'none',
      art: '📸', v: { n: 1 }, up: { v: { n: 2 } },
      text: 'Gain a random Follower. Draw {n} card(s).', flavor: 'Golden hour. Posted at 9pm.',
      play(g, t, v) { g.gainFollower(g.rng.pick(['stan', 'bestie', 'troll', 'brandDeal'])); g.draw(v.n); }
    },
    mutuals: {
      name: 'Mutuals', pool: 'creator', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
      art: '🔁', v: { d: 5, d2: 5 }, up: { v: { d: 7, d2: 7 } },
      text: 'Deal {d} Gbese. With 3+ Followers, deal {d2} more.', flavor: 'You follow me, I follow you. Business.',
      play(g, t, v) { g.attack(t, v.d); if (g.followers.length >= 3) g.attack(t, v.d2); }
    },

    // Uncommon
    goLive: {
      name: 'Go Live', pool: 'creator', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
      art: '🔴', v: {}, up: { cost: 0 },
      text: 'All your Followers act now.', flavor: '“Is it working? Can you hear me?”',
      play(g) { g.triggerFollowers(1); }
    },
    cancelCulture: {
      name: 'Cancel Culture', pool: 'creator', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
      art: '❌', v: { n: 2 }, up: { v: { n: 3 } },
      text: 'Cash in your oldest Follower. Its effect happens {n} times.', flavor: 'Thread drop at midnight.',
      play(g, t, v) { g.evokeFollower(0, v.n); }
    },
    giveaway: {
      name: 'Giveaway', pool: 'creator', type: 'skill', rarity: 'uncommon', cost: 2, target: 'none',
      art: '🎁', v: {}, up: { cost: 1 },
      text: 'Cash in ALL your Followers.', flavor: 'Like, share, tag 3 friends.',
      play(g) { while (g.followers.length) g.evokeFollower(0); }
    },
    engagementPod: {
      name: 'Engagement Pod', pool: 'creator', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
      art: '🫂', v: { n: 1 }, up: { v: { n: 2 } },
      text: 'Gain {n} Reach.', flavor: 'We like each other’s posts. That’s the deal.',
      play(g, t, v) { g.addStatus(g.player, 'reach', v.n); }
    },
    fanPageCard: {
      name: 'Fan Page', pool: 'creator', type: 'power', rarity: 'uncommon', cost: 2, target: 'none',
      art: '📰', v: { n: 1 }, up: { cost: 1, v: { n: 1 } },
      text: 'Start of turn: gain a Stan Follower.', flavor: '@CreatorUpdates247',
      play(g, t, v) { g.addStatus(g.player, 'fanPage', v.n); }
    },
    verifiedCard: {
      name: 'Get Verified', pool: 'creator', type: 'power', rarity: 'uncommon', cost: 2, target: 'none',
      art: '☑️', v: {}, up: { cost: 1 },
      text: 'Followers no longer unfollow you.', flavor: 'Paid ₦12k. Worth it.',
      play(g) { g.addStatus(g.player, 'verified', 1); }
    },
    stanArmy: {
      name: 'Stan Army', pool: 'creator', type: 'skill', rarity: 'uncommon', cost: 2, target: 'none',
      art: '🪖', v: { n: 3 }, up: { cost: 1, v: { n: 3 } }, keys: ['exhaust'],
      text: 'Gain {n} Stan Followers. Exhaust.', flavor: 'They have notifications ON.',
      play(g, t, v) { for (let i = 0; i < v.n; i++) g.gainFollower('stan'); }
    },
    pileOn: {
      name: 'Pile On', pool: 'creator', type: 'attack', rarity: 'uncommon', cost: 1, target: 'all',
      art: '🗯️', v: { k: 2 }, up: { v: { k: 3 } },
      text: 'Deal {k} Gbese to ALL enemies per Follower.', flavor: 'Quote tweets: 4.2k.',
      play(g, t, v) { const n = g.followers.length; if (n) g.attackAll(v.k * n); }
    },
    ambassadorCard: {
      name: 'Brand Ambassador', pool: 'creator', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
      art: '🤳🏾', v: { n: 4 }, up: { v: { n: 6 } },
      text: 'When you cash in a Follower, gain {n} Vibe Check.', flavor: 'Use my code for 5% off.',
      play(g, t, v) { g.addStatus(g.player, 'ambassador', v.n); }
    },
    liveQA: {
      name: 'Live Q&A', pool: 'creator', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
      art: '🎙️', v: { n: 2 }, up: { v: { n: 3 } },
      text: 'Draw {n} cards. Gain a Troll Follower.', flavor: '“Next question… no, I’m not answering that.”',
      play(g, t, v) { g.draw(v.n); g.gainFollower('troll'); }
    },

    // Rare
    blueTickCard: {
      name: 'Blue Tick', pool: 'creator', type: 'power', rarity: 'rare', cost: 3, target: 'none',
      art: '🔵', v: { n: 1 }, up: { cost: 2, v: { n: 1 } },
      text: 'End of turn: Followers act an extra time.', flavor: 'The algorithm loves you now.',
      play(g, t, v) { g.addStatus(g.player, 'blueTick', v.n); }
    },
    bigFeed: {
      name: 'Big Feed', pool: 'creator', type: 'power', rarity: 'rare', cost: 1, target: 'none',
      art: '📲', v: { n: 2 }, up: { v: { n: 3 } },
      text: 'You can hold {n} more Followers.', flavor: 'Second account. Third account.',
      play(g, t, v) { g.addStatus(g.player, 'extraSlots', v.n); }
    },
    superfanCard: {
      name: 'Superfan', pool: 'creator', type: 'power', rarity: 'rare', cost: 1, target: 'none',
      art: '🫶🏾', v: { n: 6 }, up: { v: { n: 9 } },
      text: 'When a Follower unfollows you, deal {n} Gbese to ALL enemies.', flavor: 'They left. Their rage stayed.',
      play(g, t, v) { g.addStatus(g.player, 'superfan', v.n); }
    },
    trendingTopic: {
      name: 'Trending Topic', pool: 'creator', type: 'attack', rarity: 'rare', cost: 2, target: 'enemy',
      art: '🔥', v: { d: 6, k: 4 }, up: { v: { d: 8, k: 5 } },
      text: 'Deal {d} Gbese + {k} per Follower.', flavor: '#1 in Lagos. #3 in Accra.',
      play(g, t, v) { g.attack(t, v.d + v.k * g.followers.length); }
    },
    comeback: {
      name: 'Comeback Era', pool: 'creator', type: 'skill', rarity: 'rare', cost: 'X', target: 'none',
      art: '🦋', v: { b: 3 }, up: { v: { b: 5 } },
      text: 'X times: gain a random Follower and {b} Vibe Check.', flavor: 'New hair. New niche. Same drama.',
      play(g, t, v, x) { for (let i = 0; i < x; i++) { g.gainFollower(g.rng.pick(['stan', 'bestie', 'troll', 'brandDeal'])); g.block(v.b); } }
    }
  };
  Object.keys(cards).forEach((id) => { cards[id].id = id; });
  Object.assign(D.CARDS, cards);

  /* ---- Relics -------------------------------------------------------- */
  const relics = {
    phoneTripod: {
      name: 'Phone Tripod', icon: '🤳🏾', rarity: 'starter', pool: 'creator',
      desc: 'Start each fight with a Stan Follower.',
      flavor: 'Bendy legs. Unshakeable ambition.',
      onCombatStart(g) { g.gainFollower('stan'); }
    },
    selfieStick: {
      name: 'Selfie Stick', icon: '🪄', rarity: 'uncommon', pool: 'creator',
      desc: 'Start each fight with 1 Reach.',
      flavor: 'Extends your arm. And your audience.',
      onCombatStart(g) { g.addStatus(g.player, 'reach', 1); }
    },
    contentCalendar: {
      name: 'Content Calendar', icon: '🗓️', rarity: 'rare', pool: 'creator',
      desc: 'Start each fight with a Bestie and a Brand Deal Follower.',
      flavor: 'Monday: motivation. Tuesday: drama. Every day: posting.',
      onCombatStart(g) { g.gainFollower('bestie'); g.gainFollower('brandDeal'); }
    }
  };
  Object.keys(relics).forEach((id) => { relics[id].id = id; });
  Object.assign(D.RELICS, relics);

  /* ---- Character ---------------------------------------------------- */
  D.CHARACTERS.creator = {
    id: 'creator',
    name: 'The Creator',
    tagline: 'Link in bio. Stay till the end.',
    blurb: 'Builds an audience of Followers who act every turn. Cash them in for big plays, but take a hit and they unfollow.',
    style: 'Summons · Allies · Snowball',
    maxHp: 68,
    gold: 99,
    relic: 'phoneTripod',
    deck: [['clapback', 4], ['filter', 4], ['shoutout', 1], ['bestieDuet', 1]],
    art: { body: 'jacket', top: '#7b5cff', bottom: '#1d1d2b', skin: '#7a4a2c', hair: 'braids', face: 'lashes', prop: 'phone', back: 'ringlight', expr: 'smug', extra: 'airpods' }
  };
})(HH.Data);
