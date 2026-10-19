/* =========================================================================
   data/cards.js — every card in the game.

   Card shape:
     name, pool ('tech' | 'mama' | 'neutral' | 'status' | 'curse'),
     type ('attack' | 'skill' | 'power' | 'status' | 'curse'),
     rarity ('starter' | 'common' | 'uncommon' | 'rare' | 'special'),
     cost (number, 'X', or null for Unplayable),
     target ('enemy' | 'all' | 'none'),
     art (emoji for the art panel), v (values), up (upgrade overrides),
     keys (exhaust | retain | fleeting | innate),
     text — {d}/{d2} show live damage, {b}/{b2} live Vibe Check, others raw
     play(g, target, v, x) — x is Ginger spent for X-cost cards.
     Optional: onEndTurnInHand(g), onDraw(g).
   ========================================================================= */
window.HH = window.HH || {};
HH.Data = HH.Data || {};

HH.Data.CARDS = {
  /* =================================================================
     TECH BRO — Hype combos, multi-hits, Ginger tricks
     ================================================================= */
  hotTake: {
    name: 'Hot Take', pool: 'tech', type: 'attack', rarity: 'starter', cost: 1, target: 'enemy',
    art: '🔥', v: { d: 6 }, up: { v: { d: 9 } },
    text: 'Deal {d} Gbese.',
    flavor: 'Ratio incoming. Your mentions go burst.',
    play(g, t, v) { g.attack(t, v.d); }
  },
  abegNoVex: {
    name: 'Abeg No Vex', pool: 'tech', type: 'skill', rarity: 'starter', cost: 1, target: 'none',
    art: '🙏🏾', v: { b: 5 }, up: { v: { b: 8 } },
    text: 'Gain {b} Vibe Check.',
    flavor: 'Soft apology. E dey work 60% of the time.',
    play(g, t, v) { g.block(v.b); }
  },
  pitchDeck: {
    name: 'Pitch Deck', pool: 'tech', type: 'attack', rarity: 'starter', cost: 2, target: 'enemy',
    art: '📊', v: { d: 10, n: 2 }, up: { v: { d: 13, n: 3 } },
    text: 'Deal {d} Gbese. Apply {n} Exposed.',
    flavor: 'Slide 14: “We are the Uber for agberos.”',
    play(g, t, v) { g.attack(t, v.d); g.apply(t, 'exposed', v.n); }
  },
  aspire: {
    name: 'Aspire to Perspire', pool: 'tech', type: 'skill', rarity: 'starter', cost: 0, target: 'none',
    art: '⏰', v: { n: 2, h: 1 }, up: { v: { n: 3, h: 1 } }, keys: ['exhaust'],
    text: 'Draw {n} cards. Gain {h} Hype. Exhaust.',
    flavor: '4:30am grind post. Three likes. Spirit high.',
    play(g, t, v) { g.draw(v.n); g.gainHype(v.h); }
  },

  cloutChase: {
    name: 'Clout Chase', pool: 'tech', type: 'attack', rarity: 'starter', cost: 1, target: 'enemy',
    art: '🎯', v: { d: 3, k: 4 }, up: { v: { d: 4, k: 5 } },
    text: 'Spend all Hype. Deal {d} Gbese + {k} per Hype.',
    flavor: 'Tag a celebrity. Pray.',
    play(g, t, v) { const h = g.spendHype(); g.attack(t, v.d + v.k * h); }
  },

  // ---- Common ----
  thread: {
    name: 'Thread', pool: 'tech', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
    art: '🧵', v: { d: 3, h: 1 }, up: { v: { d: 4, h: 2 } },
    text: 'Deal {d} Gbese twice. Gain {h} Hype.',
    flavor: '1/27. A thread on why I dropped out.',
    play(g, t, v) { g.attack(t, v.d, 2); g.gainHype(v.h); }
  },
  quoteTweet: {
    name: 'Quote Tweet', pool: 'tech', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
    art: '🔁', v: { d: 7, h: 2 }, up: { v: { d: 10, h: 2 } },
    text: 'Deal {d} Gbese. If target is Exposed, gain {h} Hype.',
    flavor: '“This you?”',
    play(g, t, v) {
      const wasExposed = g.status(t, 'exposed') > 0;
      g.attack(t, v.d);
      if (wasExposed) g.gainHype(v.h);
    }
  },
  ratio: {
    name: 'Ratio', pool: 'tech', type: 'attack', rarity: 'common', cost: 2, target: 'all',
    art: '📉', v: { d: 8 }, up: { v: { d: 11 } },
    text: 'Deal {d} Gbese to ALL enemies.',
    flavor: 'Replies: 2k. Likes: 14. Gone.',
    play(g, t, v) { g.attackAll(v.d); }
  },
  standup: {
    name: 'Daily Standup', pool: 'tech', type: 'skill', rarity: 'common', cost: 1, target: 'none',
    art: '🧍🏾', v: { b: 6, n: 1 }, up: { v: { b: 9, n: 1 } },
    text: 'Gain {b} Vibe Check. Draw {n} card.',
    flavor: 'Yesterday I networked. Today I network. Blockers: Sapa.',
    play(g, t, v) { g.block(v.b); g.draw(v.n); }
  },
  hustlePost: {
    name: 'Hustle Post', pool: 'tech', type: 'skill', rarity: 'common', cost: 0, target: 'none',
    art: '📸', v: { h: 2 }, up: { v: { h: 3 } },
    text: 'Gain {h} Hype.',
    flavor: 'Rented Benz. Borrowed watch. Original vibes.',
    play(g, t, v) { g.gainHype(v.h); }
  },
  coldDm: {
    name: 'Cold DM', pool: 'tech', type: 'attack', rarity: 'common', cost: 0, target: 'enemy',
    art: '📩', v: { d: 3, n: 1 }, up: { v: { d: 5, n: 1 } },
    text: 'Deal {d} Gbese. Apply {n} Shaken.',
    flavor: '“Hi dear. Quick one.”',
    play(g, t, v) { g.attack(t, v.d); g.apply(t, 'shaken', v.n); }
  },
  burnRate: {
    name: 'Burn Rate', pool: 'tech', type: 'skill', rarity: 'common', cost: 0, target: 'none',
    art: '🔥', v: { n: 1, l: 3 }, up: { v: { n: 2, l: 3 } },
    text: 'Gain {n} Ginger. Lose {l} HP.',
    flavor: 'Runway is a state of mind.',
    play(g, t, v) { g.gainGinger(v.n); g.loseHp(g.player, v.l, 'self'); }
  },
  debug: {
    name: 'Debug', pool: 'tech', type: 'skill', rarity: 'common', cost: 1, target: 'none',
    art: '🐛', v: { b: 6 }, up: { v: { b: 9 } },
    text: 'Gain {b} Vibe Check. Exhaust a Status or Curse in hand.',
    flavor: 'It works on my machine.',
    play(g, t, v) {
      g.block(v.b);
      const junk = g.combat.piles.hand.find((c) => ['status', 'curse'].includes(g.def(c).type));
      if (junk) g.exhaustCard(junk);
    }
  },
  hackathon: {
    name: 'Hackathon', pool: 'tech', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
    art: '💻', v: { d: 5, h: 1, n: 1 }, up: { v: { d: 7, h: 1, n: 1 } },
    text: 'Deal {d} Gbese. Gain {h} Hype. Draw {n} card.',
    flavor: '48 hours. 4 Red Bulls. 1 landing page.',
    play(g, t, v) { g.attack(t, v.d); g.gainHype(v.h); g.draw(v.n); }
  },
  remoteWork: {
    name: 'Remote Work', pool: 'tech', type: 'skill', rarity: 'common', cost: 1, target: 'none',
    art: '🏝️', v: { b: 8 }, up: { v: { b: 11 } }, keys: ['retain'],
    text: 'Gain {b} Vibe Check. Retain.',
    flavor: 'Camera off. Generator on.',
    play(g, t, v) { g.block(v.b); }
  },
  coffeeChat: {
    name: 'Coffee Chat', pool: 'tech', type: 'skill', rarity: 'common', cost: 1, target: 'none',
    art: '☕', v: { b: 5, h: 1 }, up: { v: { b: 7, h: 2 } },
    text: 'Gain {b} Vibe Check. Gain {h} Hype.',
    flavor: 'Let me pick your brain. You’re paying, right?',
    play(g, t, v) { g.block(v.b); g.gainHype(v.h); }
  },
  sprint: {
    name: 'Sprint', pool: 'tech', type: 'attack', rarity: 'common', cost: 1, target: 'random',
    art: '🏃🏾', v: { d: 3, n: 3 }, up: { v: { d: 3, n: 4 } },
    text: 'Deal {d} Gbese to a random enemy {n} times.',
    flavor: 'Two-week sprint. Six weeks later…',
    play(g, t, v) { for (let i = 0; i < v.n; i++) g.attack('random', v.d); }
  },

  // ---- Uncommon ----
  goViral: {
    name: 'Go Viral', pool: 'tech', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
    art: '🚀', v: { k: 5 }, up: { v: { k: 7 } },
    text: 'Spend all Hype. Deal {k} Gbese per Hype spent.',
    flavor: 'Blue tick loading.',
    play(g, t, v) {
      const h = g.spendHype();
      if (h > 0) g.attack(t, v.k * h);
      else g.log('No Hype to spend. Nobody saw the post.', 'warn');
    }
  },
  pivot: {
    name: 'Pivot', pool: 'tech', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    art: '🔄', v: { n: 1 }, up: { cost: 0, v: { n: 1 } },
    text: 'Discard your hand. Draw that many cards +{n}.',
    flavor: 'We’re now a fintech. And a dating app.',
    play(g, t, v) {
      const n = g.discardHand();
      g.draw(n + v.n);
    }
  },
  seedRound: {
    name: 'Seed Round', pool: 'tech', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    art: '🌱', v: { n: 2, h: 1 }, up: { v: { n: 2, h: 3 } },
    text: 'Next turn, gain {n} Ginger. Gain {h} Hype.',
    flavor: 'Friends & family round. Mostly family.',
    play(g, t, v) { g.addStatus(g.player, 'funding', v.n); g.gainHype(v.h); }
  },
  trendingCard: {
    name: 'Trending', pool: 'tech', type: 'power', rarity: 'uncommon', cost: 2, target: 'none',
    art: '📣', v: { n: 2 }, up: { cost: 1, v: { n: 2 } },
    text: 'When you gain Hype, gain {n} Vibe Check.',
    flavor: '#1 in Nigeria. For 11 minutes.',
    play(g, t, v) { g.addStatus(g.player, 'trending', v.n); }
  },
  algorithmCard: {
    name: 'Feed the Algorithm', pool: 'tech', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    art: '🤖', v: { n: 1 }, up: { v: { n: 1 }, keys: ['innate'] },
    text: 'Start of turn: gain {n} Hype.',
    flavor: 'Post at 7pm. Hashtag everything.',
    play(g, t, v) { g.addStatus(g.player, 'algorithm', v.n); }
  },
  doomscroll: {
    name: 'Doomscroll', pool: 'tech', type: 'skill', rarity: 'uncommon', cost: 0, target: 'none',
    art: '📱', v: { n: 3 }, up: { v: { n: 4 } },
    text: 'Draw {n} cards. Add a Brain Rot to your discard.',
    flavor: 'Just five minutes. It is now 3am.',
    play(g, t, v) { g.draw(v.n); g.addCard('brainRot', 'discard'); }
  },
  disrupt: {
    name: 'Disrupt', pool: 'tech', type: 'attack', rarity: 'uncommon', cost: 2, target: 'enemy',
    art: '💥', v: { d: 14, n: 2 }, up: { v: { d: 18, n: 2 } },
    text: 'Deal {d} Gbese. Apply {n} Shaken.',
    flavor: 'Move fast and break NEPA.',
    play(g, t, v) { g.attack(t, v.d); g.apply(t, 'shaken', v.n); }
  },
  deployProd: {
    name: 'Deploy to Prod', pool: 'tech', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
    art: '🚢', v: { d: 15 }, up: { v: { d: 20 } },
    text: 'Deal {d} Gbese. Shuffle a Bug into your draw pile.',
    flavor: 'Friday. 4:59pm. Yolo.',
    play(g, t, v) { g.attack(t, v.d); g.addCard('bug', 'draw'); }
  },
  scaleFast: {
    name: 'Scale Fast', pool: 'tech', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    art: '📈', v: {}, up: { cost: 0 }, keys: ['exhaust'],
    text: 'Double your Hype. Exhaust.',
    flavor: 'Growth at all costs. Mostly yours.',
    play(g) { const h = g.status(g.player, 'hype'); if (h > 0) g.gainHype(h); }
  },
  foundersMode: {
    name: 'Founder Mode', pool: 'tech', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    art: '🧢', v: { n: 2 }, up: { v: { n: 3 } },
    text: 'Gain {n} Clout.',
    flavor: 'Wears the same hoodie for 9 days. On purpose.',
    play(g, t, v) { g.addStatus(g.player, 'clout', v.n); }
  },
  growthHackCard: {
    name: 'Growth Hack', pool: 'tech', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    art: '🧪', v: { n: 1 }, up: { cost: 0, v: { n: 1 } },
    text: 'Every 3rd card each turn draws {n} card.',
    flavor: 'Referral code: HUSTLE10.',
    play(g, t, v) { g.addStatus(g.player, 'growthHack', v.n); }
  },
  firewall: {
    name: 'Firewall', pool: 'tech', type: 'skill', rarity: 'uncommon', cost: 2, target: 'none',
    art: '🧱', v: { b: 12, n: 1 }, up: { v: { b: 16, n: 1 } },
    text: 'Gain {b} Vibe Check. Gain {n} VPN.',
    flavor: 'Blocks scammers. And your landlord’s number.',
    play(g, t, v) { g.block(v.b); g.addStatus(g.player, 'vpn', v.n); }
  },

  // ---- Rare ----
  unicornCard: {
    name: 'Unicorn Status', pool: 'tech', type: 'power', rarity: 'rare', cost: 3, target: 'none',
    art: '🦄', v: { n: 1 }, up: { cost: 2, v: { n: 1 } },
    text: 'End of turn: deal Gbese equal to your Hype to ALL enemies.',
    flavor: '$1B valuation. ₦0 in the account.',
    play(g, t, v) { g.addStatus(g.player, 'unicorn', v.n); }
  },
  ipo: {
    name: 'IPO', pool: 'tech', type: 'attack', rarity: 'rare', cost: 'X', target: 'enemy',
    art: '🔔', v: { d: 7, h: 1 }, up: { v: { d: 9, h: 2 } },
    text: 'Deal {d} Gbese X times. +{h} Hype per hit.',
    flavor: 'Ring the bell. Sell everything.',
    play(g, t, v, x) { for (let i = 0; i < x; i++) { g.attack(t, v.d); g.gainHype(v.h); } }
  },
  tenxCard: {
    name: '10x Engineer', pool: 'tech', type: 'power', rarity: 'rare', cost: 1, target: 'none',
    art: '⌨️', v: { n: 1 }, up: { v: { n: 2 } },
    text: 'When you play a 0-cost card, gain {n} Hype.',
    flavor: 'Mechanical keyboard. Louder than generator.',
    play(g, t, v) { g.addStatus(g.player, 'tenx', v.n); }
  },
  blitzscale: {
    name: 'Blitzscale', pool: 'tech', type: 'skill', rarity: 'rare', cost: 0, target: 'none',
    art: '⚡', v: { n: 3, c: 0 }, up: { v: { n: 3, c: 2 } }, keys: ['exhaust'],
    text: 'Gain {n} Ginger. Draw {c} cards. Exhaust.',
    flavor: 'Hire 40 people. Fire 39 by Tuesday.',
    play(g, t, v) { g.gainGinger(v.n); if (v.c) g.draw(v.c); }
  },
  mainCharacter: {
    name: 'Main Character', pool: 'tech', type: 'attack', rarity: 'rare', cost: 2, target: 'enemy',
    art: '🎬', v: { d: 10, k: 3 }, up: { v: { d: 12, k: 4 } },
    text: 'Deal {d} Gbese + {k} per Hype. Keeps your Hype.',
    flavor: 'Everybody else is an NPC.',
    play(g, t, v) { g.attack(t, v.d + v.k * g.status(g.player, 'hype')); }
  },
  exitStrategy: {
    name: 'Exit Strategy', pool: 'tech', type: 'attack', rarity: 'rare', cost: 3, target: 'enemy',
    art: '🛫', v: { d: 32 }, up: { v: { d: 42 } }, keys: ['exhaust'],
    text: 'Deal {d} Gbese. Exhaust.',
    flavor: 'Acquired. Japa’d. Never posted again.',
    play(g, t, v) { g.attack(t, v.d); }
  },

  /* =================================================================
     MAMA PUT — Interest (stacking debt), sturdy Vibe Check, pepper
     ================================================================= */
  ladleKnock: {
    name: 'Ladle Knock', pool: 'mama', type: 'attack', rarity: 'starter', cost: 1, target: 'enemy',
    art: '🥄', v: { d: 6 }, up: { v: { d: 9 } },
    text: 'Deal {d} Gbese.',
    flavor: 'Same ladle. Stew and discipline.',
    play(g, t, v) { g.attack(t, v.d); }
  },
  mschew: {
    name: 'Mschew', pool: 'mama', type: 'skill', rarity: 'starter', cost: 1, target: 'none',
    art: '😒', v: { b: 5 }, up: { v: { b: 8 } },
    text: 'Gain {b} Vibe Check.',
    flavor: 'A hiss so strong it bends bullets.',
    play(g, t, v) { g.block(v.b); }
  },
  writeAmForBook: {
    name: 'Write Am for Book', pool: 'mama', type: 'skill', rarity: 'starter', cost: 1, target: 'enemy',
    art: '📒', v: { n: 5 }, up: { v: { n: 8 } },
    text: 'Apply {n} Interest.',
    flavor: 'Your name don enter the book.',
    play(g, t, v) { g.apply(t, 'interest', v.n); }
  },
  hotPepper: {
    name: 'Hot Pepper', pool: 'mama', type: 'attack', rarity: 'starter', cost: 1, target: 'enemy',
    art: '🌶️', v: { d: 4, n: 2 }, up: { v: { d: 6, n: 3 } },
    text: 'Deal {d} Gbese. Apply {n} Exposed.',
    flavor: 'Ata rodo in the eye. Diplomacy over.',
    play(g, t, v) { g.attack(t, v.d); g.apply(t, 'exposed', v.n); }
  },

  // ---- Common ----
  owoMiDa: {
    name: 'Owo Mi Da?', pool: 'mama', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
    art: '🫴🏾', v: { d: 5, n: 3 }, up: { v: { d: 7, n: 4 } },
    text: 'Deal {d} Gbese. Apply {n} Interest.',
    flavor: '“Where my money?” — with feeling.',
    play(g, t, v) { g.attack(t, v.d); g.apply(t, 'interest', v.n); }
  },
  ataRodo: {
    name: 'Ata Rodo', pool: 'mama', type: 'attack', rarity: 'common', cost: 1, target: 'all',
    art: '🔥', v: { d: 3, n: 2 }, up: { v: { d: 4, n: 3 } },
    text: 'Deal {d} Gbese to ALL enemies. Apply {n} Interest to ALL enemies.',
    flavor: 'Pepper in the air. Everybody dey cough.',
    play(g, t, v) { g.attackAll(v.d); g.applyAll('interest', v.n); }
  },
  bigSpoon: {
    name: 'Big Spoon', pool: 'mama', type: 'attack', rarity: 'common', cost: 2, target: 'enemy',
    art: '🍲', v: { d: 13 }, up: { v: { d: 17 } },
    text: 'Deal {d} Gbese.',
    flavor: 'Party jollof spoon. Industrial grade.',
    play(g, t, v) { g.attack(t, v.d); }
  },
  marketBanter: {
    name: 'Market Banter', pool: 'mama', type: 'skill', rarity: 'common', cost: 1, target: 'enemy',
    art: '🗯️', v: { b: 6, n: 1 }, up: { v: { b: 8, n: 2 } },
    text: 'Gain {b} Vibe Check. Apply {n} Shaken.',
    flavor: '“Is it your mate you’re talking to?”',
    play(g, t, v) { g.block(v.b); g.apply(t, 'shaken', v.n); }
  },
  smallChops: {
    name: 'Small Chops', pool: 'mama', type: 'skill', rarity: 'common', cost: 0, target: 'none',
    art: '🍢', v: { b: 3, n: 1 }, up: { v: { b: 5, n: 1 } },
    text: 'Gain {b} Vibe Check. Draw {n} card.',
    flavor: 'Puff-puff, samosa, one spring roll for the road.',
    play(g, t, v) { g.block(v.b); g.draw(v.n); }
  },
  longThroat: {
    name: 'Long Throat', pool: 'mama', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
    art: '🍗', v: { d: 7, h: 3 }, up: { v: { d: 9, h: 4 } },
    text: 'Deal {d} Gbese. If target has Interest, heal {h}.',
    flavor: 'Who chop the last meat?',
    play(g, t, v) {
      const owing = g.status(t, 'interest') > 0;
      g.attack(t, v.d);
      if (owing) g.heal(v.h);
    }
  },
  creditSales: {
    name: 'Credit Sales', pool: 'mama', type: 'skill', rarity: 'common', cost: 1, target: 'enemy',
    art: '🧾', v: { n: 7 }, up: { v: { n: 10 } },
    text: 'Apply {n} Interest.',
    flavor: 'Pay me month end. Which month? We go see.',
    play(g, t, v) { g.apply(t, 'interest', v.n); }
  },
  trayShield: {
    name: 'Tray Shield', pool: 'mama', type: 'skill', rarity: 'common', cost: 2, target: 'none',
    art: '🛡️', v: { b: 13 }, up: { v: { b: 17 } },
    text: 'Gain {b} Vibe Check.',
    flavor: 'Steel tray. Holds rice. Stops bullets.',
    play(g, t, v) { g.block(v.b); }
  },
  iruBomb: {
    name: 'Iru Bomb', pool: 'mama', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
    art: '💣', v: { d: 6, n: 1 }, up: { v: { d: 8, n: 2 } },
    text: 'Deal {d} Gbese. Apply {n} Exposed.',
    flavor: 'Locust beans. The smell na weapon.',
    play(g, t, v) { g.attack(t, v.d); g.apply(t, 'exposed', v.n); }
  },
  haggle: {
    name: 'Haggle', pool: 'mama', type: 'skill', rarity: 'common', cost: 1, target: 'enemy',
    art: '🤝🏾', v: { n: 2, c: 1 }, up: { v: { n: 3, c: 1 } },
    text: 'Apply {n} Shaken. Draw {c} card.',
    flavor: 'Last price? Add small thing.',
    play(g, t, v) { g.apply(t, 'shaken', v.n); g.draw(v.c); }
  },
  ladleCombo: {
    name: 'Ladle Combo', pool: 'mama', type: 'attack', rarity: 'common', cost: 1, target: 'enemy',
    art: '🥢', v: { d: 4 }, up: { v: { d: 5 } },
    text: 'Deal {d} Gbese twice.',
    flavor: 'Left ladle. Right ladle. Customer don pay.',
    play(g, t, v) { g.attack(t, v.d, 2); }
  },

  // ---- Uncommon ----
  compoundInterest: {
    name: 'Compound Interest', pool: 'mama', type: 'skill', rarity: 'uncommon', cost: 1, target: 'enemy',
    art: '✖️', v: {}, up: { cost: 0 },
    text: 'Double the target’s Interest.',
    flavor: 'The book no dey forget.',
    play(g, t) { const n = g.status(t, 'interest'); if (n > 0) g.apply(t, 'interest', n); }
  },
  collectDebt: {
    name: 'Collect Debt', pool: 'mama', type: 'attack', rarity: 'uncommon', cost: 2, target: 'enemy',
    art: '💰', v: { k: 2 }, up: { v: { k: 3 } },
    text: 'Deal {k}× the target’s Interest as Gbese. Remove it.',
    flavor: 'Today na today.',
    play(g, t, v) {
      const n = g.status(t, 'interest');
      g.removeStatus(t, 'interest');
      if (n > 0) g.attack(t, n * v.k);
      else g.log('Them no owe you anything. Yet.', 'warn');
    }
  },
  pepperGardenCard: {
    name: 'Pepper Garden', pool: 'mama', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    art: '🌶️', v: { n: 2 }, up: { v: { n: 3 } },
    text: 'When attacked, apply {n} Interest to the attacker.',
    flavor: 'Touch my garden, pay for am.',
    play(g, t, v) { g.addStatus(g.player, 'pepperGarden', v.n); }
  },
  agboBrew: {
    name: 'Agbo Brew', pool: 'mama', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    art: '🧉', v: { h: 6 }, up: { v: { h: 10 } }, keys: ['exhaust'],
    text: 'Heal {h} HP. Remove your debuffs. Exhaust.',
    flavor: 'Bitter like your ex. Works like magic.',
    play(g, t, v) { g.heal(v.h); g.cleanse(g.player); }
  },
  tieWrapper: {
    name: 'Tie Wrapper Tight', pool: 'mama', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    art: '🧣', v: { n: 2 }, up: { v: { n: 3 } },
    text: 'Gain {n} Steeze.',
    flavor: 'Double-knot. Ready for anything.',
    play(g, t, v) { g.addStatus(g.player, 'steeze', v.n); }
  },
  gossipCard: {
    name: 'Gossip Network', pool: 'mama', type: 'power', rarity: 'uncommon', cost: 1, target: 'none',
    art: '🗣️', v: { n: 2 }, up: { v: { n: 3 } },
    text: 'Start of turn: apply {n} Interest to a random enemy.',
    flavor: 'The market has ears. And WhatsApp.',
    play(g, t, v) { g.addStatus(g.player, 'gossip', v.n); }
  },
  soupPot: {
    name: 'Soup Pot', pool: 'mama', type: 'skill', rarity: 'uncommon', cost: 2, target: 'none',
    art: '🥘', v: { b: 10, n: 2 }, up: { v: { b: 13, n: 2 } },
    text: 'Gain {b} Vibe Check. Next turn, draw {n} more.',
    flavor: 'Egusi for the week. Planning.',
    play(g, t, v) { g.block(v.b); g.addStatus(g.player, 'extraDraw', v.n); }
  },
  marketDay: {
    name: 'Market Day', pool: 'mama', type: 'skill', rarity: 'uncommon', cost: 0, target: 'none',
    art: '🧺', v: { n: 1, c: 1 }, up: { v: { n: 1, c: 2 } }, keys: ['exhaust'],
    text: 'Gain {n} Ginger. Draw {c} card(s). Exhaust.',
    flavor: 'Èkó market opens at 5. You’re late.',
    play(g, t, v) { g.gainGinger(v.n); g.draw(v.c); }
  },
  spreadGist: {
    name: 'Spread The Gist', pool: 'mama', type: 'skill', rarity: 'uncommon', cost: 1, target: 'all',
    art: '📢', v: { n: 3 }, up: { v: { n: 5 } },
    text: 'Apply {n} Interest to ALL enemies.',
    flavor: 'By evening, the whole street don hear.',
    play(g, t, v) { g.applyAll('interest', v.n); }
  },
  bulkBuyCard: {
    name: 'Bulk Buy', pool: 'mama', type: 'power', rarity: 'uncommon', cost: 2, target: 'none',
    art: '📦', v: { n: 4 }, up: { v: { n: 6 } },
    text: 'Start of turn: gain {n} Vibe Check.',
    flavor: 'One bag of rice now. Ten bags of savings later.',
    play(g, t, v) { g.addStatus(g.player, 'bulkBuy', v.n); }
  },

  // ---- Rare ----
  shakaraCard: {
    name: 'Shakara', pool: 'mama', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    art: '💅🏾', v: {}, up: { cost: 1 },
    text: 'Your Vibe Check no longer resets each turn.',
    flavor: 'She no dey carry last. Ever.',
    play(g) { g.addStatus(g.player, 'shakara', 1); }
  },
  usuryCard: {
    name: 'Usury', pool: 'mama', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    art: '📕', v: {}, up: { cost: 1 },
    text: 'Interest on enemies no longer decreases.',
    flavor: 'The book is eternal.',
    play(g) { g.addStatus(g.player, 'usury', 1); }
  },
  marketQueenCard: {
    name: 'Market Queen', pool: 'mama', type: 'power', rarity: 'rare', cost: 2, target: 'none',
    art: '👑', v: { n: 2 }, up: { v: { n: 3 } },
    text: 'When you apply Interest, gain {n} Vibe Check.',
    flavor: 'Iyaloja of the whole Lagos.',
    play(g, t, v) { g.addStatus(g.player, 'marketQueen', v.n); }
  },
  settleDebt: {
    name: 'Settle Your Debt', pool: 'mama', type: 'attack', rarity: 'rare', cost: 2, target: 'enemy',
    art: '🧮', v: { d: 20, g: 25 }, up: { v: { d: 25, g: 35 } }, keys: ['exhaust'],
    text: 'Deal {d} Gbese. If it kills, gain {g} ₦. Exhaust.',
    flavor: 'Paid in full. With interest. With pepper.',
    play(g, t, v) { g.attack(t, v.d); if (t.dead) g.gainGold(v.g); }
  },
  massCredit: {
    name: 'Mass Credit', pool: 'mama', type: 'skill', rarity: 'rare', cost: 'X', target: 'all',
    art: '📚', v: { n: 3 }, up: { v: { n: 4 } },
    text: 'X times: apply {n} Interest to ALL enemies.',
    flavor: 'Everybody dey owe Mama.',
    play(g, t, v, x) { for (let i = 0; i < x; i++) g.applyAll('interest', v.n); }
  },
  jollofWar: {
    name: 'Jollof Wars', pool: 'mama', type: 'attack', rarity: 'rare', cost: 1, target: 'all',
    art: '🍛', v: { d: 6, n: 2 }, up: { v: { d: 8, n: 2 } },
    text: 'Deal {d} Gbese to ALL enemies. Gain {n} Steeze.',
    flavor: 'Ghana no try am.',
    play(g, t, v) { g.attackAll(v.d); g.addStatus(g.player, 'steeze', v.n); }
  },

  /* =================================================================
     NEUTRAL — events, shop and special rewards
     ================================================================= */
  shineYourEye: {
    name: 'Shine Your Eye', pool: 'neutral', type: 'skill', rarity: 'uncommon', cost: 0, target: 'none',
    art: '👁️', v: { n: 2 }, up: { v: { n: 3 } }, keys: ['exhaust'],
    text: 'Draw {n} cards. Exhaust.',
    flavor: 'Lagos rule number one.',
    play(g, t, v) { g.draw(v.n); }
  },
  lagosHustle: {
    name: 'Lagos Hustle', pool: 'neutral', type: 'skill', rarity: 'uncommon', cost: 0, target: 'none',
    art: '🛵', v: { n: 1 }, up: { v: { n: 2 } }, keys: ['exhaust'],
    text: 'Gain {n} Ginger. Exhaust.',
    flavor: 'Three jobs and a side hustle.',
    play(g, t, v) { g.gainGinger(v.n); }
  },
  agbadaSwing: {
    name: 'Agbada Swing', pool: 'neutral', type: 'attack', rarity: 'uncommon', cost: 2, target: 'all',
    art: '🌀', v: { d: 9 }, up: { v: { d: 12 } },
    text: 'Deal {d} Gbese to ALL enemies.',
    flavor: 'Five yards of fabric. Pure aerodynamics.',
    play(g, t, v) { g.attackAll(v.d); }
  },
  soroSoke: {
    name: 'Soro Soke', pool: 'neutral', type: 'skill', rarity: 'rare', cost: 1, target: 'all',
    art: '📯', v: { n: 2 }, up: { v: { n: 3 } }, keys: ['exhaust'],
    text: 'Apply {n} Exposed and {n} Shaken to ALL enemies. Exhaust.',
    flavor: 'Speak louder.',
    play(g, t, v) { g.applyAll('exposed', v.n); g.applyAll('shaken', v.n); }
  },
  sideHustleCard: {
    name: 'Side Hustle', pool: 'neutral', type: 'power', rarity: 'rare', cost: 1, target: 'none',
    art: '💼', v: { n: 5 }, up: { v: { n: 8 } },
    text: 'Start of turn: gain {n} ₦.',
    flavor: 'Selling perfume on WhatsApp status.',
    play(g, t, v) { g.addStatus(g.player, 'sideHustle', v.n); }
  },
  shakuShaku: {
    name: 'Shaku Shaku', pool: 'neutral', type: 'skill', rarity: 'uncommon', cost: 1, target: 'none',
    art: '💃🏾', v: { b: 7, n: 1 }, up: { v: { b: 10, n: 1 } },
    text: 'Gain {b} Vibe Check. Gain {n} Clout.',
    flavor: 'Arms crossed. Legs everywhere.',
    play(g, t, v) { g.block(v.b); g.addStatus(g.player, 'clout', v.n); }
  },
  wahalaBicycle: {
    name: 'Wahala Be Like Bicycle', pool: 'neutral', type: 'attack', rarity: 'uncommon', cost: 1, target: 'enemy',
    art: '🚲', v: { d: 9 }, up: { v: { d: 13 } }, keys: ['retain'],
    text: 'Deal {d} Gbese. Retain.',
    flavor: 'Once you start am, you no fit stop.',
    play(g, t, v) { g.attack(t, v.d); }
  },

  /* =================================================================
     STATUS & CURSE cards — clog your deck
     ================================================================= */
  nepa: {
    name: 'NEPA Took Light', pool: 'status', type: 'status', rarity: 'special', cost: null, target: 'none',
    art: '🕯️', v: {}, keys: ['fleeting'],
    text: 'Unplayable. Fleeting.',
    flavor: 'Up NEPA! …Never mind.'
  },
  spam: {
    name: 'Spam DM', pool: 'status', type: 'status', rarity: 'special', cost: 1, target: 'none',
    art: '📨', v: {}, keys: ['exhaust'],
    text: 'Does nothing. Exhaust.',
    flavor: '“Congratulations! You have won $5,000,000.”',
    play() {}
  },
  brainRot: {
    name: 'Brain Rot', pool: 'status', type: 'status', rarity: 'special', cost: null, target: 'none',
    art: '🫠', v: {}, keys: ['fleeting'],
    text: 'Unplayable. Fleeting.',
    flavor: 'Skibidi… what was I doing?'
  },
  bug: {
    name: 'Bug', pool: 'status', type: 'status', rarity: 'special', cost: null, target: 'none',
    art: '🪲', v: {},
    text: 'Unplayable. If held at end of turn, lose 2 HP.',
    flavor: 'It’s not a bug, it’s a feature.',
    onEndTurnInHand(g) { g.loseHp(g.player, 2, 'bug'); }
  },
  dilution: {
    name: 'Dilution', pool: 'status', type: 'status', rarity: 'special', cost: null, target: 'none',
    art: '💧', v: {}, keys: ['fleeting'],
    text: 'Unplayable. When drawn, lose 1 Ginger. Fleeting.',
    flavor: 'Your 30% is now 3%.',
    onDraw(g) { if (g.combat.ginger > 0) g.combat.ginger -= 1; }
  },
  asoEbiBill: {
    name: 'Aso Ebi Bill', pool: 'status', type: 'status', rarity: 'special', cost: 1, target: 'none',
    art: '👗', v: {}, keys: ['exhaust'],
    text: 'Costs 1 to clear. Exhaust. If held at end of turn, lose 3 HP.',
    flavor: '₦85k for fabric you’ll wear once.',
    play() {},
    onEndTurnInHand(g) { g.loseHp(g.player, 3, 'bill'); }
  },
  sapaCurse: {
    name: 'Sapa', pool: 'curse', type: 'curse', rarity: 'special', cost: null, target: 'none',
    art: '🕳️', v: {},
    text: 'Unplayable. Curse.',
    flavor: 'Empty pocket. Full heart. Mostly empty pocket.'
  },
  quitNotice: {
    name: 'Quit Notice', pool: 'curse', type: 'curse', rarity: 'special', cost: null, target: 'none',
    art: '📜', v: {},
    text: 'Unplayable. If held at end of turn, take 3 Gbese.',
    flavor: 'Seven days. Starting yesterday.',
    onEndTurnInHand(g) { g.loseHp(g.player, 3, 'curse'); }
  },
  efccWahala: {
    name: 'EFCC Wahala', pool: 'curse', type: 'curse', rarity: 'special', cost: null, target: 'none',
    art: '🚨', v: {}, keys: ['innate'],
    text: 'Unplayable. Innate. Curse.',
    flavor: 'They want to “ask you some questions”.'
  },
  heatRash: {
    name: 'Heat Rash', pool: 'curse', type: 'curse', rarity: 'special', cost: null, target: 'none',
    art: '🥵', v: {},
    text: 'Unplayable. When drawn, gain 1 Broke.',
    flavor: 'No light. No fan. No peace.',
    onDraw(g) { g.apply(g.player, 'broke', 1); }
  }
};

/* Fill in each card's id for convenience. */
Object.keys(HH.Data.CARDS).forEach((id) => (HH.Data.CARDS[id].id = id));
