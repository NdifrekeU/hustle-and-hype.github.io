/* =========================================================================
   data/events.js — "?" nodes on the map: little Lagos stories with choices.

   Each choice has:
     label, detail (shown under the label), cond(run) (optional, greys it out)
     run(run, api) → result text (may be async when it opens a picker)
   api: gold(n) heal(n) damage(n) maxHp(n) addCard(id) cardReward(opts)
        pickCard(mode) [upgrade|remove|transform] relic(rarity?) curse(id)
        sachet() upgradeRandom(n) fight(enemyIds) rng()
   ========================================================================= */
window.HH = window.HH || {};
HH.Data = HH.Data || {};

HH.Data.EVENTS = [
  {
    id: 'owambe',
    title: 'Owambe on the Street',
    art: '🎉',
    text: 'A whole street is closed for somebody’s 60th birthday. The DJ is loud. The jollof smells like smoke and victory. Nobody asks who invited you.',
    choices: [
      { label: 'Spray money', detail: 'Lose ₦50. Gain a random Gadget.', cond: (r) => r.gold >= 50,
        run: (r, api) => { api.gold(-50); const n = api.relic(); return `You sprayed like a Lekki big boy. An aunty handed you ${n} as a thank-you.`; } },
      { label: 'Eat the party jollof', detail: 'Heal 15 HP.',
        run: (r, api) => { api.heal(15); return 'Party jollof. Smoky bottom. Spiritual experience.'; } },
      { label: 'Join the dance floor', detail: 'Add Shaku Shaku to your deck.',
        run: (r, api) => { api.addCard('shakuShaku'); return 'Arms crossed, legs everywhere. The DJ gave you a shoutout.'; } }
    ]
  },
  {
    id: 'nepa',
    title: 'NEPA Took Light',
    art: '🕯️',
    text: 'Midnight. Heat. Mosquitoes holding a conference in your ear. Your neighbour’s generator roars. Yours is empty.',
    choices: [
      { label: 'Buy fuel for the gen', detail: 'Lose ₦40. Upgrade 2 random cards.', cond: (r) => r.gold >= 40,
        run: (r, api) => { api.gold(-40); const names = api.upgradeRandom(2); return `Light! You grinded all night and polished ${names}.`; } },
      { label: 'Sleep in the heat', detail: 'Heal 10 HP. Add Heat Rash (curse) to your deck.',
        run: (r, api) => { api.heal(10); api.addCard('heatRash'); return 'You slept. Kind of. Your back did not forgive you.'; } },
      { label: 'Go to your neighbour’s side', detail: 'Lose 6 HP. Gain a Sachet.',
        run: (r, api) => { api.damage(6); const s = api.sachet(); return `His dog had opinions. But you left with ${s}.`; } }
    ]
  },
  {
    id: 'yahoo',
    title: 'An Offer You Should Refuse',
    art: '💻',
    text: 'A guy in a Gucci slide whispers: “Bros, I get one client for you. Small work. Big money. No questions.”',
    choices: [
      { label: 'Take the deal', detail: 'Gain ₦150. Add EFCC Wahala (curse) to your deck.',
        run: (r, api) => { api.gold(150); api.addCard('efccWahala'); return 'Alert don land. So did a strange feeling that someone is watching.'; } },
      { label: 'Report him', detail: 'Gain 6 max HP.',
        run: (r, api) => { api.maxHp(6); return 'Integrity. It doesn’t pay rent, but you sleep well.'; } },
      { label: 'Walk away', detail: 'Nothing happens.',
        run: () => 'You walked away. He’s already messaging someone else.' }
    ]
  },
  {
    id: 'mechanic',
    title: 'Mechanic Village',
    art: '🔧',
    text: 'Your laptop is acting up. Oga Mechanic says he can fix anything. He has fixed nothing in 30 years, but he is very confident.',
    choices: [
      { label: 'Proper repair', detail: 'Lose ₦60. Remove a card from your deck.', cond: (r) => r.gold >= 60,
        run: async (r, api) => { api.gold(-60); const n = await api.pickCard('remove'); return n ? `He removed ${n}. It somehow works better now.` : 'You changed your mind. He kept the money.'; } },
      { label: 'Let him “manage” am', detail: 'Lose 6 HP. Transform a card into a random one.',
        run: async (r, api) => { api.damage(6); const n = await api.pickCard('transform'); return n ? `He opened it with a cutlass. It became ${n}.` : 'Nothing changed. Except your finger.'; } },
      { label: 'Leave', detail: 'Nothing happens.', run: () => 'Wise.' }
    ]
  },
  {
    id: 'danfoBreakdown',
    title: 'Danfo Breakdown',
    art: '🚌',
    text: 'The danfo coughs, shudders, and dies on Third Mainland Bridge. The conductor turns to the passengers: “Make una come push.”',
    choices: [
      { label: 'Push the bus', detail: 'Lose 7 HP. Gain ₦45.',
        run: (r, api) => { api.damage(7); api.gold(45); return 'It started! The driver refunded you, with a speech.'; } },
      { label: 'Trek the rest', detail: 'Lose 10 HP. Upgrade a card.',
        run: async (r, api) => { api.damage(10); const n = await api.pickCard('upgrade'); return n ? `Long walk. Lots of thinking. ${n} got better.` : 'Long walk. No thoughts.'; } },
      { label: 'Wait inside', detail: 'Heal 5 HP.', run: (r, api) => { api.heal(5); return 'You napped. Lagos waited.'; } }
    ]
  },
  {
    id: 'seminar',
    title: 'LinkedIn Influencer Seminar',
    art: '🎤',
    text: '“How I made ₦10M in 30 days (and how you can too)” — ₦75 entry. The speaker’s ring light is brighter than his future.',
    choices: [
      { label: 'Attend', detail: 'Lose ₦75. Choose a rare card.', cond: (r) => r.gold >= 75,
        run: async (r, api) => { api.gold(-75); const n = await api.cardReward({ rarity: 'rare' }); return n ? `Surprisingly, one slide was useful: ${n}.` : 'You took notes. Then lost them.'; } },
      { label: 'Heckle from the back', detail: 'Fight an Influencer for a reward.',
        run: (r, api) => { api.fight(['influencer']); return 'He went live to “address the haters”.'; } },
      { label: 'Leave', detail: 'Nothing happens.', run: () => 'You saved ₦75 and your dignity.' }
    ]
  },
  {
    id: 'mamaCooking',
    title: 'Mama’s Kitchen',
    art: '🍲',
    text: 'A stranger’s mother sees you looking tired. “Ah ah! You don chop? Sit down.” Resistance is impossible.',
    choices: [
      { label: 'Eat everything', detail: 'Heal 25% of max HP. Gain 4 max HP.',
        run: (r, api) => { api.heal(Math.round(r.maxHp * 0.25)); api.maxHp(4); return 'Pounded yam, egusi, and unsolicited life advice. Nourished.'; } },
      { label: 'Take some home', detail: 'Gain 2 Sachets.',
        run: (r, api) => { const a = api.sachet(); const b = api.sachet(); return `She packed ${a} and ${b}. In an ice cream bucket.`; } }
    ]
  },
  {
    id: 'twitterSpace',
    title: 'Twitter Space at 2am',
    art: '🎧',
    text: 'You join a space titled “Are Lagos men scammers?” There are 4,000 listeners and 2 brain cells.',
    choices: [
      { label: 'Request to speak', detail: 'Lose 5 HP. Choose an uncommon card.',
        run: async (r, api) => { api.damage(5); const n = await api.cardReward({ rarity: 'uncommon' }); return n ? `You went viral. Mostly negatively. You learned ${n}.` : 'You were never unmuted.'; } },
      { label: 'Just listen', detail: 'Upgrade a random card.',
        run: (r, api) => { const n = api.upgradeRandom(1); return `Free knowledge. ${n} improved.`; } }
    ]
  },
  {
    id: 'computerVillage',
    title: 'Computer Village Hustle',
    art: '📱',
    text: 'A guy sells you a “brand new UK used” phone for half the price. It’s still warm. Too warm.',
    choices: [
      { label: 'Buy it', detail: 'Lose ₦35. Gain a random Gadget. 50% chance: lose 8 HP.', cond: (r) => r.gold >= 35,
        run: (r, api) => { api.gold(-35); const n = api.relic(); if (api.rng() < 0.5) { api.damage(8); return `Got ${n}. It also exploded a little.`; } return `Got ${n}. It works!`; } },
      { label: 'Haggle hard', detail: 'Gain ₦25.',
        run: (r, api) => { api.gold(25); return 'You haggled so hard he paid you to leave.'; } }
    ]
  },
  {
    id: 'babalawo',
    title: 'The Herbalist’s Shop',
    art: '🪬',
    text: 'Bottles of agbo line the shelf. The herbalist looks at you and says, “Your enemies are many. Your money is small.”',
    choices: [
      { label: 'Buy protection', detail: 'Lose ₦80. Gain Juju Bead.', cond: (r) => r.gold >= 80 && !r.relics.some((x) => x.id === 'jujuBead'),
        run: (r, api) => { api.gold(-80); api.relic(null, 'jujuBead'); return 'He tied a bead on your wrist and said, “Don’t ask.”'; } },
      { label: 'Drink the agbo', detail: 'Remove a card. Lose 8 HP.',
        run: async (r, api) => { api.damage(8); const n = await api.pickCard('remove'); return n ? `Bitter. Powerful. ${n} is gone from your life.` : 'You spat it out.'; } },
      { label: 'Run', detail: 'Nothing happens.', run: () => 'You ran. Very fast.' }
    ]
  },
  {
    id: 'oldFriend',
    title: 'Old Friend From Secondary School',
    art: '🤝🏾',
    text: '“Guy! Long time!” It’s Chuka from JSS2. He is doing very well. He wants you to join his network marketing business.',
    choices: [
      { label: 'Join the “business”', detail: 'Lose ₦40. Gain Side Hustle card.', cond: (r) => r.gold >= 40,
        run: (r, api) => { api.gold(-40); api.addCard('sideHustleCard'); return 'You are now a Diamond Executive Partner. It’s a pyramid.'; } },
      { label: 'Borrow money', detail: 'Gain ₦60. Add Sapa (curse).',
        run: (r, api) => { api.gold(60); api.addCard('sapaCurse'); return 'He gave you. With a look you’ll remember forever.'; } },
      { label: 'Catch up', detail: 'Heal 8 HP.', run: (r, api) => { api.heal(8); return 'Good gist. Better suya.'; } }
    ]
  }
];
