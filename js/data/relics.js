/* =========================================================================
   data/relics.js — "Gadgets & Juju": passive items that last the whole run.

   Hooks receive (g, relic, ...args); `relic` is the run's instance
   ({ id, counter }) so a relic can keep its own state between fights.
     onPickup(run, relic)      onCombatStart(g)       onTurnStart(g)
     onTurnEnd(g)              onCardPlayed(g, r, card, def)
     onCombatEnd(run, relic, info)   onEnemyDeath(g, r, enemy)
     onRest(run, relic)
   Modifiers (read by the engine):
     gingerPerTurn, drawPerTurn, hideIntents, noRestHeal, goldMult,
     applyBonus { statusId: +n }, modifyHpLoss(g, relic, amount, source)
   ========================================================================= */
window.HH = window.HH || {};
HH.Data = HH.Data || {};

HH.Data.RELICS = {
  /* ---- Starters ---------------------------------------------------- */
  ringLight: {
    name: 'Ring Light', icon: '💡', rarity: 'starter', pool: 'tech',
    desc: 'Start each fight with 2 Hype. Gain 1 Hype at the start of each turn.',
    flavor: 'Good lighting is 80% of a startup.',
    onCombatStart(g) { g.gainHype(2); },
    onTurnStart(g) { g.gainHype(1); }
  },
  creditBook: {
    name: 'Credit Book', icon: '📒', rarity: 'starter', pool: 'mama',
    desc: 'At the start of each fight, apply 2 Interest to ALL enemies.',
    flavor: 'Every name in Lagos is inside.',
    onCombatStart(g) { g.applyAll('interest', 2); }
  },

  /* ---- Common ------------------------------------------------------ */
  powerBank: {
    name: 'Power Bank', icon: '🔋', rarity: 'common',
    desc: 'Gain 1 extra Ginger on the first turn of each fight.',
    flavor: '20,000mAh. Charged during the 2 hours of light.',
    onTurnStart(g) { if (g.combat.turn === 1) g.gainGinger(1); }
  },
  agegeBread: {
    name: 'Agege Bread', icon: '🍞', rarity: 'common',
    desc: 'Heal 6 HP after each fight.',
    flavor: 'Soft. Sweet. Lasts a week. Suspicious.',
    onCombatEnd(run) { HH.Run.healPlayer(run, 6); }
  },
  generator: {
    name: 'I Better Pass My Neighbour', icon: '🔌', rarity: 'common',
    desc: 'Start each fight with 10 Vibe Check.',
    flavor: 'Small gen. Loud gen. Your gen.',
    onCombatStart(g) { g.gainBlock(g.player, 10); }
  },
  kolanut: {
    name: 'Kolanut', icon: '🌰', rarity: 'common',
    desc: 'Start each fight with 1 Clout.',
    flavor: 'He who brings kola brings life.',
    onCombatStart(g) { g.addStatus(g.player, 'clout', 1); }
  },
  ponmo: {
    name: 'Ponmo', icon: '🥩', rarity: 'common',
    desc: 'At the end of your turn, if you have no Vibe Check, gain 6.',
    flavor: 'Cow skin. Zero nutrients. Maximum resilience.',
    onTurnEnd(g) { if (g.player.block === 0) g.gainBlock(g.player, 6); }
  },
  jujuBead: {
    name: 'Juju Bead', icon: '🪬', rarity: 'common',
    desc: 'Start each fight with 3 Juju.',
    flavor: 'Grandma said don’t ask questions.',
    onCombatStart(g) { g.addStatus(g.player, 'juju', 3); }
  },
  pureWaterSack: {
    name: 'Bag of Pure Water', icon: '💧', rarity: 'common',
    desc: 'On pickup, raise your max HP by 8.',
    flavor: '20 sachets. Hydration security.',
    onPickup(run) { run.maxHp += 8; run.hp += 8; }
  },
  tintedGlasses: {
    name: 'Tinted Glasses', icon: '🕶️', rarity: 'common',
    desc: 'Whenever you apply Shaken, apply 1 more.',
    flavor: 'Nobody can see you crying.',
    applyBonus: { shaken: 1 }
  },
  chinChinJar: {
    name: 'Chin Chin Jar', icon: '🫙', rarity: 'common',
    desc: 'Draw 2 extra cards on the first turn of each fight.',
    flavor: 'Crunchy. Endless. From Christmas 2019.',
    onCombatStart(g) { g.addStatus(g.player, 'extraDraw', 2); }
  },

  /* ---- Uncommon ---------------------------------------------------- */
  vpnSub: {
    name: 'VPN Subscription', icon: '🛰️', rarity: 'uncommon',
    desc: 'Start each fight with 1 VPN (blocks the next debuff).',
    flavor: 'Location: Switzerland. Actually: Ikorodu.',
    onCombatStart(g) { g.addStatus(g.player, 'vpn', 1); }
  },
  whistle: {
    name: 'Conductor’s Whistle', icon: '📯', rarity: 'uncommon',
    desc: 'Every 10 cards you play, gain 1 Ginger.',
    flavor: 'Ojuelegba! Obalende! Enter with your change!',
    onCardPlayed(g, r) {
      r.counter = (r.counter || 0) + 1;
      if (r.counter >= 10) { r.counter = 0; g.gainGinger(1); g.log('Whistle: +1 Ginger.', 'relic'); }
    }
  },
  laptopSticker: {
    name: 'Laptop Sticker', icon: '🏷️', rarity: 'uncommon',
    desc: 'Whenever you play a Power, gain 4 Vibe Check.',
    flavor: '“Built in Lagos.” Bought in Dubai.',
    onCardPlayed(g, r, card, def) { if (def.type === 'power') g.gainBlock(g.player, 4); }
  },
  asoEbi: {
    name: 'Aso Ebi', icon: '👘', rarity: 'uncommon',
    desc: 'Start elite and boss fights with 2 Clout.',
    flavor: 'Same fabric as the whole family. Unity.',
    onCombatStart(g) { if (g.combat.tier !== 'normal') g.addStatus(g.player, 'clout', 2); }
  },
  okadaHelmet: {
    name: 'Okada Helmet', icon: '⛑️', rarity: 'uncommon',
    desc: 'The first time you would lose HP in each fight, lose only 1.',
    flavor: 'Two sizes too small. Still counts.',
    modifyHpLoss(g, r, amount) {
      if (amount > 1 && !g.combat.flags.helmetUsed) {
        g.combat.flags.helmetUsed = true;
        g.log('Okada Helmet absorbed the hit.', 'relic');
        return 1;
      }
      return amount;
    }
  },
  bitcoinWallet: {
    name: 'Crypto Wallet', icon: '🪙', rarity: 'uncommon',
    desc: 'Gain 25% more ₦ from fights.',
    flavor: 'Seed phrase written on a sachet.',
    goldMult: 1.25
  },
  apprentice: {
    name: 'Apprentice Papers', icon: '📜', rarity: 'uncommon',
    desc: 'Whenever you rest at a Buka, also upgrade a random card.',
    flavor: 'Seven years of service. Shop of your own.',
    onRest(run) { HH.Run.upgradeRandom(run, 1); }
  },
  weddingRing: {
    name: 'Wedding Ring', icon: '💍', rarity: 'uncommon',
    desc: 'At the end of your turn, heal 1 HP.',
    flavor: 'Owambe survivor.',
    onTurnEnd(g) { g.heal(1); }
  },

  /* ---- Rare -------------------------------------------------------- */
  coralBeads: {
    name: 'Coral Beads', icon: '📿', rarity: 'rare',
    desc: 'Start each fight with 1 Clout and 1 Steeze.',
    flavor: 'Royal energy. Market price.',
    onCombatStart(g) { g.addStatus(g.player, 'clout', 1); g.addStatus(g.player, 'steeze', 1); }
  },
  ofadaSauce: {
    name: 'Ofada Sauce', icon: '🥫', rarity: 'rare',
    desc: 'Whenever an enemy dies, gain 1 Ginger and draw 1 card.',
    flavor: 'Green pepper. Locust beans. Divine.',
    onEnemyDeath(g) { if (g.combat.phase === 'player') { g.gainGinger(1); g.draw(1); } }
  },
  talkingDrum: {
    name: 'Talking Drum', icon: '🪘', rarity: 'rare',
    desc: 'Every 3rd turn, deal 8 Gbese to ALL enemies.',
    flavor: 'The drum says: you’re finished.',
    onTurnStart(g) {
      if (g.combat.turn % 3 === 0) g.alive().forEach((e) => g.loseHp(e, 8, 'drum', g.player));
    }
  },
  owambeCooler: {
    name: 'Owambe Cooler', icon: '🧊', rarity: 'rare',
    desc: 'Your first Attack each fight is played twice.',
    flavor: 'Jollof for 300. Takeaway pack included.',
    onCardPlayed(g, r, card, def) {
      if (def.type === 'attack' && !g.combat.flags.coolerUsed) {
        g.combat.flags.coolerUsed = true;
        g.replayCard(card);
      }
    }
  },

  /* ---- Boss (powerful with a catch) ------------------------------- */
  starlink: {
    name: 'Starlink Dish', icon: '📡', rarity: 'boss',
    desc: '+1 Ginger each turn. You can no longer see enemy intents.',
    flavor: 'Fast internet. No idea what’s coming.',
    gingerPerTurn: 1, hideIntents: true
  },
  japaVisa: {
    name: 'Japa Visa', icon: '🛂', rarity: 'boss',
    desc: '+1 Ginger each turn. You can no longer heal at a Buka.',
    flavor: 'One foot in Lagos. One foot in Toronto.',
    gingerPerTurn: 1, noRestHeal: true
  },
  fuelSubsidy: {
    name: 'Fuel Subsidy', icon: '⛽', rarity: 'boss',
    desc: '+1 Ginger each turn. Each fight starts with 2 NEPA Took Light in your draw pile.',
    flavor: 'Cheap fuel. Expensive darkness.',
    gingerPerTurn: 1,
    onCombatStart(g) { g.addCard('nepa', 'draw', { count: 2 }); }
  },
  secondPhone: {
    name: 'Second Phone', icon: '📲', rarity: 'boss',
    desc: 'Draw 1 extra card each turn. Start each fight with 1 Exposed.',
    flavor: 'One for work. One for “work”.',
    drawPerTurn: 1,
    onCombatStart(g) { g.addStatus(g.player, 'exposed', 1); }
  },
  bigGen: {
    name: 'Big Generator', icon: '🏭', rarity: 'boss',
    desc: '+1 Ginger each turn. Lose 4 HP after each fight (fumes).',
    flavor: 'Powers the whole street. And your lungs.',
    gingerPerTurn: 1,
    onCombatEnd(run) { run.hp = Math.max(1, run.hp - 4); }
  }
};
Object.keys(HH.Data.RELICS).forEach((id) => (HH.Data.RELICS[id].id = id));

/* ---- Sachets: single-use consumables (max 3 held) ------------------ */
HH.Data.SACHETS = {
  pureWater: {
    name: 'Pure Water', icon: '💧', rarity: 'common', target: 'none',
    desc: 'Gain 12 Vibe Check.',
    use(g) { g.gainBlock(g.player, 12); }
  },
  zobo: {
    name: 'Zobo', icon: '🍷', rarity: 'common', target: 'none', anywhere: true,
    desc: 'Heal 20% of your max HP.',
    use(g, t, run) {
      const r = run || g.run;
      const n = Math.round(r.maxHp * 0.2);
      if (g) g.heal(n); else HH.Run.healPlayer(r, n);
    }
  },
  kunu: {
    name: 'Kunu', icon: '🥛', rarity: 'common', target: 'none',
    desc: 'Gain 2 Ginger.',
    use(g) { g.gainGinger(2); }
  },
  yaji: {
    name: 'Yaji Spice', icon: '🌶️', rarity: 'uncommon', target: 'none',
    desc: 'Gain 2 Clout.',
    use(g) { g.addStatus(g.player, 'clout', 2); }
  },
  agbo: {
    name: 'Agbo Jedi', icon: '🧉', rarity: 'uncommon', target: 'none',
    desc: 'Heal 8 HP and remove all your debuffs.',
    use(g) { g.heal(8); g.cleanse(g.player); }
  },
  ataBomb: {
    name: 'Ata Bomb', icon: '💣', rarity: 'common', target: 'none',
    desc: 'Deal 10 Gbese to ALL enemies.',
    use(g) { g.alive().forEach((e) => g.dealDamage(g.player, e, 10, { raw: true })); }
  },
  chinChin: {
    name: 'Chin Chin', icon: '🍪', rarity: 'common', target: 'none',
    desc: 'Draw 3 cards.',
    use(g) { g.draw(3); }
  },
  palmWine: {
    name: 'Palm Wine', icon: '🥥', rarity: 'uncommon', target: 'none',
    desc: 'Apply 5 Interest to ALL enemies.',
    use(g) { g.applyAll('interest', 5); }
  },
  ogogoro: {
    name: 'Ogogoro', icon: '🍶', rarity: 'rare', target: 'none',
    desc: 'Gain 4 Clout. Gain 2 Exposed.',
    use(g) { g.addStatus(g.player, 'clout', 4); g.addStatus(g.player, 'exposed', 2); }
  }
};
Object.keys(HH.Data.SACHETS).forEach((id) => (HH.Data.SACHETS[id].id = id));

/* ---- Playable characters ----------------------------------------- */
HH.Data.CHARACTERS = {
  tech: {
    id: 'tech',
    name: 'Tech Bro',
    tagline: 'Pre-seed. Pre-revenue. Pre-breakfast.',
    blurb: 'Builds Hype with fast, cheap cards, then cashes it all in with one viral blow-up.',
    style: 'Combo · Hype · Multi-hit',
    maxHp: 75,
    gold: 99,
    relic: 'ringLight',
    deck: [['hotTake', 4], ['abegNoVex', 4], ['pitchDeck', 1], ['aspire', 1], ['cloutChase', 1]],
    art: { body: 'hoodie', top: '#2f6bd8', bottom: '#2b2b33', skin: '#8a5a3b', hair: 'lowcut', face: 'glasses', extra: 'airpods', prop: 'laptop', expr: 'smug' }
  },
  mama: {
    id: 'mama',
    name: 'Mama Put',
    tagline: 'Feeds the street. Owns the street.',
    blurb: 'Writes everybody into her credit book. Interest stacks up turn after turn, while her Vibe Check holds firm.',
    style: 'Interest · Defense · Pressure',
    maxHp: 80,
    gold: 99,
    relic: 'creditBook',
    deck: [['ladleKnock', 4], ['mschew', 4], ['writeAmForBook', 1], ['hotPepper', 1]],
    art: { body: 'wrapper', top: '#d94a2b', bottom: '#1f8a57', pattern: 'ankara', skin: '#6b4026', hair: 'gele', geleColor: '#f2b705', face: 'none', prop: 'ladle', expr: 'stern', size: 1.05 }
  }
};
