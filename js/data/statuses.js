/* =========================================================================
   data/statuses.js — buffs, debuffs, powers and the keyword glossary.

   A status lives on a creature as   creature.statuses[id] = stacks.
   Hooks are called by the combat engine with (g, owner, stacks, ...args):
     onTurnStart, onTurnEnd           — owner's own turn
     onCardPlayed(card, def)          — player statuses, after a card resolves
     onPlayerCardPlayed(card, def)    — enemy statuses, after the player plays
     onAttacked(attacker, dmg)        — owner was hit by an attack
     onHypeGain(amount)               — player gained Hype
     onApplyStatus(target, id, n)     — owner applied a status to someone
     onExhaust(card)                  — a card was exhausted
   `decays: true` → loses 1 stack at the end of the owner's turn.
   ========================================================================= */
window.HH = window.HH || {};
HH.Data = HH.Data || {};

HH.Data.STATUSES = {
  /* ---- Core buffs & debuffs ---------------------------------------- */
  clout: {
    name: 'Clout', icon: '📈', kind: 'buff', canGoNegative: true,
    desc: 'Attacks deal {n} more Gbese.'
  },
  steeze: {
    name: 'Steeze', icon: '🕶️', kind: 'buff', canGoNegative: true,
    desc: 'Gain {n} more Vibe Check from cards.'
  },
  shaken: {
    name: 'Shaken', icon: '😰', kind: 'debuff', decays: true,
    desc: 'Attacks deal 25% less Gbese. {n} turn(s).'
  },
  exposed: {
    name: 'Exposed', icon: '👀', kind: 'debuff', decays: true,
    desc: 'Dem don see your levels. Takes 50% more Gbese from attacks. {n} turn(s).'
  },
  broke: {
    name: 'Broke', icon: '🪫', kind: 'debuff', decays: true,
    desc: 'Gain 25% less Vibe Check from cards. {n} turn(s).'
  },
  interest: {
    name: 'Interest', icon: '🧾', kind: 'debuff',
    desc: 'At the start of its turn, loses {n} HP, then Interest drops by 1.',
    hooks: {
      onTurnStart(g, owner, n) {
        g.loseHp(owner, n, 'interest');
        if (!g.playerHas('usury') || owner.isPlayer) g.addStatus(owner, 'interest', -1);
      }
    }
  },
  juju: {
    name: 'Juju', icon: '🪬', kind: 'buff',
    desc: 'Whenever attacked, deals {n} Gbese back to the attacker.',
    hooks: {
      onAttacked(g, owner, n, attacker) {
        if (attacker && attacker !== owner) g.loseHp(attacker, n, 'juju', owner);
      }
    }
  },
  vpn: {
    name: 'VPN', icon: '🛰️', kind: 'buff',
    desc: 'Blocks the next {n} debuff(s) applied to this creature.'
  },
  hype: {
    name: 'Hype', icon: '⚡', kind: 'resource',
    desc: 'Your Hype. Some cards spend it for big plays. Lasts the whole fight.'
  },
  drained: {
    name: 'Drained', icon: '🔋', kind: 'debuff',
    desc: 'Next turn, start with {n} less Ginger.'
  },
  funding: {
    name: 'Funding', icon: '💸', kind: 'buff',
    desc: 'Next turn, gain {n} extra Ginger.'
  },
  extraDraw: {
    name: 'Prepared', icon: '🗂️', kind: 'buff',
    desc: 'Next turn, draw {n} extra card(s).'
  },

  /* ---- Tech Bro powers --------------------------------------------- */
  trending: {
    name: 'Trending', icon: '📣', kind: 'power',
    desc: 'Whenever you gain Hype, gain {n} Vibe Check.',
    hooks: { onHypeGain(g, owner, n) { g.gainBlock(owner, n); } }
  },
  algorithm: {
    name: 'Algorithm', icon: '🤖', kind: 'power',
    desc: 'At the start of your turn, gain {n} Hype.',
    hooks: { onTurnStart(g, owner, n) { g.gainHype(n); } }
  },
  unicorn: {
    name: 'Unicorn', icon: '🦄', kind: 'power',
    desc: 'At the end of your turn, deal Gbese equal to your Hype ×{n} to ALL enemies.',
    hooks: {
      onTurnEnd(g, owner, n) {
        const h = g.status(owner, 'hype');
        if (h > 0) g.alive().forEach((e) => g.loseHp(e, h * n, 'unicorn', owner));
      }
    }
  },
  tenx: {
    name: '10x Engineer', icon: '⌨️', kind: 'power',
    desc: 'Whenever you play a 0-cost card, gain {n} Hype.',
    hooks: {
      onCardPlayed(g, owner, n, card) {
        if (card.paid === 0) g.gainHype(n);
      }
    }
  },
  growthHack: {
    name: 'Growth Hack', icon: '🧪', kind: 'power',
    desc: 'Every 3rd card you play each turn draws {n} card(s).',
    hooks: {
      onCardPlayed(g, owner, n) {
        if (g.combat.cardsThisTurn % 3 === 0) g.draw(n);
      }
    }
  },

  /* ---- Mama Put powers --------------------------------------------- */
  pepperGarden: {
    name: 'Pepper Garden', icon: '🌶️', kind: 'power',
    desc: 'Whenever you are attacked, apply {n} Interest to the attacker.',
    hooks: {
      onAttacked(g, owner, n, attacker) {
        if (attacker && !attacker.dead) g.apply(attacker, 'interest', n);
      }
    }
  },
  gossip: {
    name: 'Gossip Network', icon: '🗣️', kind: 'power',
    desc: 'At the start of your turn, apply {n} Interest to a random enemy.',
    hooks: {
      onTurnStart(g, owner, n) {
        const t = g.randomEnemy();
        if (t) g.apply(t, 'interest', n);
      }
    }
  },
  shakara: {
    name: 'Shakara', icon: '💅🏾', kind: 'power',
    desc: 'Your Vibe Check no longer resets at the start of your turn.'
  },
  usury: {
    name: 'Usury', icon: '📕', kind: 'power',
    desc: 'Interest on enemies no longer decreases.'
  },
  marketQueen: {
    name: 'Market Queen', icon: '👑', kind: 'power',
    desc: 'Whenever you apply Interest, gain {n} Vibe Check.',
    hooks: {
      onApplyStatus(g, owner, n, target, id) {
        if (id === 'interest' && target !== owner) g.gainBlock(owner, n);
      }
    }
  },
  bulkBuy: {
    name: 'Bulk Buy', icon: '🧺', kind: 'power',
    desc: 'At the start of your turn, gain {n} Vibe Check.',
    hooks: { onTurnStart(g, owner, n) { g.gainBlock(owner, n); } }
  },

  /* ---- Neutral powers ---------------------------------------------- */
  sideHustle: {
    name: 'Side Hustle', icon: '🛵', kind: 'power',
    desc: 'At the start of your turn, gain {n} ₦.',
    hooks: { onTurnStart(g, owner, n) { g.gainGold(n); } }
  },

  /* ---- Enemy specials ---------------------------------------------- */
  voltage: {
    name: 'Voltage', icon: '⚡', kind: 'special',
    desc: 'At 3 Voltage the Transformer explodes for massive Gbese.'
  },
  monthEnd: {
    name: 'Month End', icon: '📅', kind: 'special',
    desc: 'At the end of its turn, gains {n} Clout. Sapa only gets stronger.',
    hooks: { onTurnEnd(g, owner, n) { g.addStatus(owner, 'clout', n); } }
  },
  gridlock: {
    name: 'Gridlock', icon: '🚗', kind: 'special',
    desc: 'Every 4th card you play in a turn, Go-Slow gains {n} Vibe Check and you lose 1 Ginger.',
    hooks: {
      onPlayerCardPlayed(g, owner, n) {
        if (g.combat.cardsThisTurn % 4 === 0) {
          g.gainBlock(owner, n);
          if (g.combat.ginger > 0) g.combat.ginger -= 1;
          g.log('Go-Slow: traffic don hold you. -1 Ginger.', 'enemy');
        }
      }
    }
  },
  enrage: {
    name: 'Vex', icon: '😤', kind: 'special',
    desc: 'Whenever you play a Skill, gains {n} Clout.',
    hooks: {
      onPlayerCardPlayed(g, owner, n, card, def) {
        if (def.type === 'skill') g.addStatus(owner, 'clout', n);
      }
    }
  },
  thickSkin: {
    name: 'Thick Skin', icon: '🧱', kind: 'special',
    desc: 'At the end of its turn, gains {n} Vibe Check.',
    hooks: { onTurnEnd(g, owner, n) { g.gainBlock(owner, n); } }
  },
  stolen: {
    name: 'Holding Your ₦', icon: '💰', kind: 'special',
    desc: 'Is holding {n} ₦ of your money. Defeat it to get it back.'
  }
};

/* Keyword glossary: matched in card text and shown as tooltips. */
HH.Data.KEYWORDS = {
  'Ginger': 'Your energy. Cards cost Ginger. Refills every turn.',
  'Vibe Check': 'Block. Absorbs Gbese before it hits HP. Resets at the start of your turn.',
  'Gbese': 'Damage. Reduces HP.',
  'Clout': HH.Data.STATUSES.clout.desc.replace('{n}', 'X'),
  'Steeze': HH.Data.STATUSES.steeze.desc.replace('{n}', 'X'),
  'Shaken': 'Attacks deal 25% less Gbese.',
  'Exposed': 'Takes 50% more Gbese from attacks.',
  'Broke': 'Gains 25% less Vibe Check from cards.',
  'Interest': 'Loses that much HP at the start of its turn, then Interest drops by 1.',
  'Juju': 'Deals Gbese back to whoever attacks it.',
  'Hype': 'Tech Bro resource that builds up during a fight. Spent by Viral cards.',
  'Exhaust': 'Removed from play until the fight ends.',
  'Retain': 'Stays in your hand at the end of the turn.',
  'Fleeting': 'If still in hand at the end of turn, it Exhausts.',
  'Innate': 'Always in your opening hand.',
  'Unplayable': 'Cannot be played.',
  'Power': 'Stays in effect for the rest of the fight.'
};
