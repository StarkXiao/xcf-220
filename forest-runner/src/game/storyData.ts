import type { StoryEvent, CodexEntry } from './types'

export const STORY_EVENTS: StoryEvent[] = [
  {
    id: 'forest_spirit_encounter',
    type: 'encounter',
    name: '森林精灵的考验',
    icon: '🧚',
    description: '在森林深处遇到了一位神秘的精灵，她似乎想要考验你...',
    triggerDistance: 500,
    triggerChance: 0.4,
    applicableThemes: ['forest'],
    startDialogueId: 'fse_d1',
    dialogues: [
      {
        id: 'fse_d1',
        speaker: '森林精灵',
        speakerAvatar: '🧚',
        text: '勇敢的旅者啊...你已在我的森林中奔跑了许久。告诉我，你追求的是什么？',
        choices: [
          {
            id: 'fse_c1',
            text: '我追求无尽的财富！',
            nextDialogueId: 'fse_d2_wealth',
            effects: [{ type: 'coin_bonus', value: 0.5, duration: 600, description: '金币获取提升50%，持续10秒' }],
            rewards: { coins: 50 },
            unlocksCodex: 'codex_spirit_greed',
            consequenceText: '精灵微微一笑，将一小袋金币赠予你。'
          },
          {
            id: 'fse_c2',
            text: '我追求超越自我的力量！',
            nextDialogueId: 'fse_d2_power',
            effects: [{ type: 'speed_boost', value: 0.2, duration: 480, description: '速度提升20%，持续8秒' }],
            rewards: { score: 200 },
            unlocksCodex: 'codex_spirit_ambition',
            consequenceText: '精灵眼中闪过赞赏，赐予你疾风的祝福。'
          },
          {
            id: 'fse_c3',
            text: '我只是享受奔跑的快乐...',
            nextDialogueId: 'fse_d2_joy',
            effects: [
              { type: 'invincible', value: 1, duration: 360, description: '获得无敌状态，持续6秒' },
              { type: 'score_boost', value: 0.3, duration: 600, description: '分数提升30%，持续10秒' }
            ],
            rewards: { coins: 30, score: 100 },
            unlocksCodex: 'codex_spirit_pure',
            consequenceText: '精灵开怀大笑，将最纯净的祝福赐予你！'
          }
        ]
      },
      {
        id: 'fse_d2_wealth',
        speaker: '森林精灵',
        speakerAvatar: '🧚',
        text: '财富...是许多人梦寐以求的东西。但愿你能用它做些好事。拿着吧，这是我的一点心意。',
        nextDialogueId: 'fse_d3_end',
        autoReward: { coins: 30 }
      },
      {
        id: 'fse_d2_power',
        speaker: '森林精灵',
        speakerAvatar: '🧚',
        text: '力量...只有不断超越自己的人才能真正获得。愿风与你同在！',
        nextDialogueId: 'fse_d3_end',
        autoReward: { score: 150 }
      },
      {
        id: 'fse_d2_joy',
        speaker: '森林精灵',
        speakerAvatar: '🧚',
        text: '哈哈哈！很久没遇到像你这样纯粹的人了。保持这份初心，你会走得更远的！',
        nextDialogueId: 'fse_d3_end',
        autoReward: { coins: 20, score: 80, resources: { herb: 3 } }
      },
      {
        id: 'fse_d3_end',
        speaker: '森林精灵',
        speakerAvatar: '🧚',
        text: '去吧，勇敢的旅者。我们还会再见的...',
        isEnd: true
      }
    ]
  },
  {
    id: 'ancient_shrine_discovery',
    type: 'mystery',
    name: '古老神殿的秘密',
    icon: '🏛️',
    description: '你发现了一座被藤蔓覆盖的古老神殿，里面似乎藏着什么秘密...',
    triggerDistance: 1200,
    triggerChance: 0.3,
    startDialogueId: 'asd_d1',
    dialogues: [
      {
        id: 'asd_d1',
        speaker: '旁白',
        speakerAvatar: '📖',
        text: '你停下脚步，眼前是一座被藤蔓和苔藓覆盖的古老神殿。石门上刻着神秘的符文...',
        choices: [
          {
            id: 'asd_c1',
            text: '小心地推开石门进入',
            nextDialogueId: 'asd_d2_enter',
            effects: [{ type: 'score_boost', value: 0.5, duration: 900, description: '分数提升50%，持续15秒' }],
            rewards: { resources: { crystal: 2 }, score: 300 },
            unlocksCodex: 'codex_ancient_shrine'
          },
          {
            id: 'asd_c2',
            text: '在入口处祈祷后离开',
            nextDialogueId: 'asd_d2_pray',
            effects: [{ type: 'invincible', value: 1, duration: 480, description: '获得无敌状态，持续8秒' }],
            rewards: { coins: 80 },
            unlocksCodex: 'codex_blessing'
          },
          {
            id: 'asd_c3',
            text: '绕开神殿，继续赶路',
            nextDialogueId: 'asd_d2_skip',
            effects: [{ type: 'speed_boost', value: 0.3, duration: 300, description: '速度提升30%，持续5秒' }]
          }
        ]
      },
      {
        id: 'asd_d2_enter',
        speaker: '旁白',
        speakerAvatar: '📖',
        text: '神殿内部灯火通明，中央的祭坛上放着一颗闪烁的水晶。你拿起它，感受到一股古老的力量注入体内...',
        nextDialogueId: 'asd_d3_end',
        autoReward: { resources: { crystal: 3 }, score: 250, coins: 100 }
      },
      {
        id: 'asd_d2_pray',
        speaker: '旁白',
        speakerAvatar: '📖',
        text: '你虔诚地祈祷，突然一阵温暖的光芒包围了你。你感到前所未有的平静与力量...',
        nextDialogueId: 'asd_d3_end',
        autoReward: { coins: 60, resources: { herb: 2 } }
      },
      {
        id: 'asd_d2_skip',
        speaker: '旁白',
        speakerAvatar: '📖',
        text: '你选择了谨慎，绕过神殿继续前行。但不知为何，你总觉得错过了什么重要的东西...',
        nextDialogueId: 'asd_d3_end'
      },
      {
        id: 'asd_d3_end',
        speaker: '旁白',
        speakerAvatar: '📖',
        text: '不管选择如何，这次经历都成为了你旅程中难忘的一部分。',
        isEnd: true
      }
    ]
  },
  {
    id: 'merchant_caravan',
    type: 'dialogue',
    name: '流浪商人的车队',
    icon: '🐪',
    description: '一支商队停在路边，商人热情地向你招手...',
    triggerDistance: 800,
    triggerChance: 0.5,
    startDialogueId: 'mc_d1',
    dialogues: [
      {
        id: 'mc_d1',
        speaker: '流浪商人',
        speakerAvatar: '🧔',
        text: '嘿，年轻人！跑得这么急，要不要看看我的好货？价格公道，童叟无欺！',
        choices: [
          {
            id: 'mc_c1',
            text: '购买神秘药水（花费30金币）',
            nextDialogueId: 'mc_d2_potion',
            effects: [{ type: 'invincible', value: 1, duration: 420, description: '获得无敌状态，持续7秒' }],
            rewards: { score: 150 },
            unlocksCodex: 'codex_merchant_potion'
          },
          {
            id: 'mc_c2',
            text: '用5块木头换取稀有草药',
            nextDialogueId: 'mc_d2_trade',
            rewards: { resources: { herb: 5 } },
            unlocksCodex: 'codex_merchant_trade'
          },
          {
            id: 'mc_c3',
            text: '谢谢，我只是路过',
            nextDialogueId: 'mc_d2_skip'
          }
        ]
      },
      {
        id: 'mc_d2_potion',
        speaker: '流浪商人',
        speakerAvatar: '🧔',
        text: '好眼光！这可是我独家秘方，保证让你神清气爽！',
        nextDialogueId: 'mc_d3_end'
      },
      {
        id: 'mc_d2_trade',
        speaker: '流浪商人',
        speakerAvatar: '🧔',
        text: '嗯...好木头！成交！这些草药你拿去吧，都是上好的货色。',
        nextDialogueId: 'mc_d3_end',
        autoEffects: [{ type: 'coin_penalty', value: 30, description: '花费30金币' }]
      },
      {
        id: 'mc_d2_skip',
        speaker: '流浪商人',
        speakerAvatar: '🧔',
        text: '好吧好吧，下次路过别忘了来看我啊！祝你一路顺风！',
        nextDialogueId: 'mc_d3_end'
      },
      {
        id: 'mc_d3_end',
        speaker: '流浪商人',
        speakerAvatar: '🧔',
        text: '生意嘛，就是这样！下次见，年轻人！',
        isEnd: true
      }
    ]
  },
  {
    id: 'divine_blessing',
    type: 'blessing',
    name: '天降祝福',
    icon: '✨',
    description: '一道神圣的光柱照耀着你...',
    triggerDistance: 1500,
    triggerChance: 0.2,
    startDialogueId: 'db_d1',
    exclusiveRewards: true,
    dialogues: [
      {
        id: 'db_d1',
        speaker: '神秘之声',
        speakerAvatar: '✨',
        text: '你已证明了自己的坚韧与勇气。选择一项祝福吧，勇敢的灵魂...',
        choices: [
          {
            id: 'db_c1',
            text: '🌟 财富祝福：大量金币与宝石',
            nextDialogueId: 'db_d2_end',
            rewards: { coins: 200, resources: { crystal: 5 }, score: 500 },
            unlocksCodex: 'codex_blessing_wealth'
          },
          {
            id: 'db_c2',
            text: '⚡ 速度祝福：永久提升奔跑速度',
            nextDialogueId: 'db_d2_end',
            effects: [
              { type: 'buff_speed', value: 0.1, description: '永久提升10%基础速度（本次旅程）' },
              { type: 'speed_boost', value: 0.5, duration: 900, description: '速度大幅提升，持续15秒' }
            ],
            rewards: { score: 300 },
            unlocksCodex: 'codex_blessing_speed'
          },
          {
            id: 'db_c3',
            text: '🛡️ 守护祝福：全程护盾与资源',
            nextDialogueId: 'db_d2_end',
            effects: [
              { type: 'invincible', value: 1, duration: 720, description: '获得长时间无敌，持续12秒' },
              { type: 'resource_bonus', value: 1, duration: 900, description: '资源获取翻倍，持续15秒' }
            ],
            rewards: { resources: { wood: 10, stone: 10, herb: 5, berry: 5, crystal: 2 }, coins: 100 },
            unlocksCodex: 'codex_blessing_protection'
          }
        ]
      },
      {
        id: 'db_d2_end',
        speaker: '神秘之声',
        speakerAvatar: '✨',
        text: '祝福已降临。愿它指引你走向更远的未来...',
        isEnd: true
      }
    ]
  },
  {
    id: 'hidden_trap',
    type: 'trap',
    name: '隐藏的陷阱',
    icon: '⚠️',
    description: '前方地面上有可疑的痕迹...',
    triggerDistance: 600,
    triggerChance: 0.35,
    startDialogueId: 'ht_d1',
    dialogues: [
      {
        id: 'ht_d1',
        speaker: '旁白',
        speakerAvatar: '📖',
        text: '你注意到前方地面有些异常，似乎有什么东西被隐藏了...',
        choices: [
          {
            id: 'ht_c1',
            text: '小心地绕过去',
            nextDialogueId: 'ht_d2_avoid',
            effects: [{ type: 'score_boost', value: 0.2, duration: 300, description: '机敏的反应获得分数加成' }],
            rewards: { score: 100 },
            unlocksCodex: 'codex_trap_survivor'
          },
          {
            id: 'ht_c2',
            text: '大胆地跳过去！',
            nextDialogueId: 'ht_d2_jump',
            effects: [{ type: 'jump_boost', value: 0.3, duration: 360, description: '跳跃力提升30%，持续6秒' }],
            rewards: { score: 200 },
            unlocksCodex: 'codex_daredevil'
          },
          {
            id: 'ht_c3',
            text: '一脚踩上去看看是什么！',
            nextDialogueId: 'ht_d2_step',
            effects: [{ type: 'slow_down', value: 0.3, duration: 300, description: '减速30%，持续5秒' }],
            unlocksCodex: 'codex_curious_cat'
          }
        ]
      },
      {
        id: 'ht_d2_avoid',
        speaker: '旁白',
        speakerAvatar: '📖',
        text: '你小心翼翼地绕过了陷阱，原来是一个隐藏的捕兽夹。好险！',
        nextDialogueId: 'ht_d3_end',
        autoReward: { score: 80 }
      },
      {
        id: 'ht_d2_jump',
        speaker: '旁白',
        speakerAvatar: '📖',
        text: '你一个漂亮的跳跃，稳稳地落在陷阱的另一侧！帅气！',
        nextDialogueId: 'ht_d3_end',
        autoReward: { score: 150 }
      },
      {
        id: 'ht_d2_step',
        speaker: '旁白',
        speakerAvatar: '📖',
        text: '砰！你踩中了陷阱，被弹了起来...虽然有点晕，但好像没受什么伤，只是速度慢了下来。',
        nextDialogueId: 'ht_d3_end'
      },
      {
        id: 'ht_d3_end',
        speaker: '旁白',
        speakerAvatar: '📖',
        text: '不管怎样，这次经历让你学到了宝贵的一课。',
        isEnd: true
      }
    ]
  },
  {
    id: 'lost_traveler',
    type: 'encounter',
    name: '迷路的旅人',
    icon: '🧳',
    description: '一位旅人坐在路边，看起来很疲惫...',
    triggerDistance: 1000,
    triggerChance: 0.45,
    startDialogueId: 'lt_d1',
    dialogues: [
      {
        id: 'lt_d1',
        speaker: '迷路的旅人',
        speakerAvatar: '🧳',
        text: '唉...我已经在这片森林里迷路好几天了。年轻人，你能帮帮我吗？',
        choices: [
          {
            id: 'lt_c1',
            text: '分享你的浆果和草药给他',
            nextDialogueId: 'lt_d2_give',
            rewards: { score: 300 },
            unlocksCodex: 'codex_kind_heart',
            effects: [{ type: 'score_boost', value: 0.4, duration: 600, description: '善有善报，分数提升40%' }]
          },
          {
            id: 'lt_c2',
            text: '指引他正确的方向',
            nextDialogueId: 'lt_d2_guide',
            rewards: { coins: 50, score: 150 },
            unlocksCodex: 'codex_guide'
          },
          {
            id: 'lt_c3',
            text: '抱歉，我赶时间',
            nextDialogueId: 'lt_d2_leave',
            effects: [{ type: 'score_penalty', value: 0.1, duration: 300, description: '良心的谴责让你有些分心' }]
          }
        ]
      },
      {
        id: 'lt_d2_give',
        speaker: '迷路的旅人',
        speakerAvatar: '🧳',
        text: '你真是个好人！等等，让我给你一些东西作为感谢...这是我路上捡到的宝物，送给你！',
        nextDialogueId: 'lt_d3_end',
        autoReward: { coins: 100, resources: { crystal: 2, berry: 5 } }
      },
      {
        id: 'lt_d2_guide',
        speaker: '迷路的旅人',
        speakerAvatar: '🧳',
        text: '太好了！终于有希望了！这些金币是我的一点心意，请收下。',
        nextDialogueId: 'lt_d3_end',
        autoReward: { coins: 80 }
      },
      {
        id: 'lt_d2_leave',
        speaker: '迷路的旅人',
        speakerAvatar: '🧳',
        text: '唉...好吧，祝你好运...',
        nextDialogueId: 'lt_d3_end'
      },
      {
        id: 'lt_d3_end',
        speaker: '旁白',
        speakerAvatar: '📖',
        text: '这次相遇，让你对这个世界有了更深的认识。',
        isEnd: true
      }
    ]
  }
]

export const CODEX_ENTRIES: Record<string, CodexEntry> = {
  codex_spirit_greed: {
    id: 'codex_spirit_greed',
    name: '财富的选择',
    icon: '💰',
    description: '森林精灵眼中，追求财富并非罪恶，但需善用。',
    category: 'lore',
    rarity: 'common',
    unlocked: false,
    backgroundStory: '古老的森林精灵见证了无数旅者的选择。她深知财富能带来舒适，也可能带来毁灭。只愿每位选择财富的人，都能用它去做有意义的事。'
  },
  codex_spirit_ambition: {
    id: 'codex_spirit_ambition',
    name: '超越的意志',
    icon: '⚡',
    description: '渴望力量的人，终将获得精灵的疾风祝福。',
    category: 'lore',
    rarity: 'rare',
    unlocked: false,
    backgroundStory: '那些不断挑战自我极限的旅者，总能获得森林精灵最真挚的祝福。因为她知道，只有拥有超越之心的人，才能真正守护这片森林。'
  },
  codex_spirit_pure: {
    id: 'codex_spirit_pure',
    name: '纯粹之心',
    icon: '✨',
    description: '拥有纯粹初心的人，是精灵最珍贵的朋友。',
    category: 'lore',
    rarity: 'epic',
    unlocked: false,
    backgroundStory: '在这个充满欲望的世界里，能保持一颗纯粹奔跑的心，是多么难能可贵。森林精灵会永远记住这样的旅者，并将最深厚的祝福赠予他们。'
  },
  codex_ancient_shrine: {
    id: 'codex_ancient_shrine',
    name: '远古神殿',
    icon: '🏛️',
    description: '一座被遗忘的古老神殿，蕴藏着远古的力量。',
    category: 'location',
    rarity: 'rare',
    unlocked: false,
    backgroundStory: '这座神殿建于千年之前，是远古文明祭祀自然之神的圣地。传说中，神殿内的水晶蕴含着创世之力，只有勇敢且纯净的灵魂才能安全取走它。'
  },
  codex_blessing: {
    id: 'codex_blessing',
    name: '祈祷的力量',
    icon: '🙏',
    description: '诚心祈祷，神明自会回应。',
    category: 'lore',
    rarity: 'common',
    unlocked: false,
    backgroundStory: '古老神殿的神灵从未离开，他们只是在等待一位懂得敬畏的旅者。诚心祈祷者，必将获得庇护。'
  },
  codex_merchant_potion: {
    id: 'codex_merchant_potion',
    name: '商人的秘药',
    icon: '🧪',
    description: '流浪商人独家配方的神奇药水。',
    category: 'item',
    rarity: 'rare',
    unlocked: false,
    backgroundStory: '据说这种药水是流浪商人的祖传秘方，由十余种珍贵草药精炼而成。服下后可在短时间内刀枪不入，是旅途中不可多得的宝物。'
  },
  codex_merchant_trade: {
    id: 'codex_merchant_trade',
    name: '以物易物',
    icon: '🔄',
    description: '古老的交易方式，有时比金币更有用。',
    category: 'lore',
    rarity: 'common',
    unlocked: false,
    backgroundStory: '流浪商人走南闯北，深知不同地方的物资价值。在他这里，用合适的材料交换，往往能获得比商店更好的东西。'
  },
  codex_blessing_wealth: {
    id: 'codex_blessing_wealth',
    name: '财富祝福',
    icon: '💎',
    description: '神明赐予的财富，足以让人衣食无忧。',
    category: 'lore',
    rarity: 'legendary',
    unlocked: false,
    backgroundStory: '这是神明对勤劳者的奖赏。获得这份祝福的人，将在短时间内获得大量财富，但神明也在注视着——看你将如何使用这份幸运。'
  },
  codex_blessing_speed: {
    id: 'codex_blessing_speed',
    name: '疾风祝福',
    icon: '🌪️',
    description: '风之神的眷顾，让你超越极限。',
    category: 'lore',
    rarity: 'legendary',
    unlocked: false,
    backgroundStory: '风之神欣赏那些追求速度的灵魂。获得这份祝福的人，将在短时间内达到凡人无法企及的速度，甚至能超越时间的流逝。'
  },
  codex_blessing_protection: {
    id: 'codex_blessing_protection',
    name: '守护祝福',
    icon: '🛡️',
    description: '大地之神的庇护，无人能伤你分毫。',
    category: 'lore',
    rarity: 'legendary',
    unlocked: false,
    backgroundStory: '大地之神关爱所有勇敢的旅者。这份祝福不仅能保护你免受伤害，还能让你在旅途中收获更多自然的馈赠。'
  },
  codex_trap_survivor: {
    id: 'codex_trap_survivor',
    name: '机敏幸存者',
    icon: '👁️',
    description: '善于观察危险的人，总能化险为夷。',
    category: 'lore',
    rarity: 'common',
    unlocked: false,
    backgroundStory: '在危机四伏的冒险之路上，观察力是最重要的武器之一。那些能敏锐察觉危险的人，往往能活得更久，也走得更远。'
  },
  codex_daredevil: {
    id: 'codex_daredevil',
    name: '无畏勇者',
    icon: '🦸',
    description: '敢于直面危险，一跃而过的勇士。',
    category: 'character',
    rarity: 'rare',
    unlocked: false,
    backgroundStory: '有人说谨慎是美德，但有时候，勇气才是突破困境的关键。这些无畏的勇者，用行动证明——只要敢跳，就没有跨越不了的障碍。'
  },
  codex_curious_cat: {
    id: 'codex_curious_cat',
    name: '好奇宝宝',
    icon: '🐱',
    description: '好奇心害死猫，但幸好你有九条命。',
    category: 'character',
    rarity: 'common',
    unlocked: false,
    backgroundStory: '总有一些人，对未知充满了无法抑制的好奇。虽然偶尔会吃亏，但这份好奇心，也让他们发现了许多别人错过的秘密。'
  },
  codex_kind_heart: {
    id: 'codex_kind_heart',
    name: '善良之心',
    icon: '❤️',
    description: '愿意帮助他人的人，终将获得善报。',
    category: 'character',
    rarity: 'epic',
    unlocked: false,
    backgroundStory: '在这个艰难的世界里，愿意为陌生人伸出援手的人越来越少了。但正是这些善良的人，让旅途充满了温暖和希望。他们的善意，终将以某种形式回馈。'
  },
  codex_guide: {
    id: 'codex_guide',
    name: '指路人',
    icon: '🧭',
    description: '为迷途者指明方向的人，自己也不会迷路。',
    category: 'character',
    rarity: 'rare',
    unlocked: false,
    backgroundStory: '每一位旅人都曾迷路过，所以为他人指路，也是为自己积福。那些乐于分享方向的人，冥冥之中自有神明护佑。'
  },
  codex_forest_spirit: {
    id: 'codex_forest_spirit',
    name: '森林精灵',
    icon: '🧚',
    description: '守护古老森林的神秘存在。',
    category: 'creature',
    rarity: 'epic',
    unlocked: false,
    backgroundStory: '森林精灵是这片森林最古老的守护者，她已经在这里生活了数千年。她见证了无数文明的兴衰，也见过各种各样的旅者。只有真正尊重自然的人，才能见到她的真容。'
  },
  codex_wandering_merchant: {
    id: 'codex_wandering_merchant',
    name: '流浪商人',
    icon: '🧔',
    description: '走南闯北的神秘商人，贩卖着稀奇古怪的宝物。',
    category: 'character',
    rarity: 'rare',
    unlocked: false,
    backgroundStory: '没有人知道这位流浪商人从哪里来，要到哪里去。他的马车上永远装满了各种神奇的物品，据说他甚至能弄到一些传说中的宝物。和他交易，你永远不会吃亏。'
  }
}

export const CODEX_CATEGORIES: Record<string, { name: string; icon: string }> = {
  character: { name: '人物', icon: '👤' },
  creature: { name: '生物', icon: '🐉' },
  location: { name: '地点', icon: '🗺️' },
  item: { name: '物品', icon: '🎒' },
  lore: { name: '传说', icon: '📜' }
}
