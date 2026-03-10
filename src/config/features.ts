export type LocalizedText = {
  en: string;
  zh: string;
};

export type FeatureItem = {
  title: string;
  desc: string;
};

export type FeatureFaq = {
  question: string;
  answer: string;
};

export type FeatureContent = {
  slug: string;
  iconColor: string;
  title: LocalizedText;
  h1: LocalizedText;
  description: LocalizedText;
  imageUrl: string;
  heroText: LocalizedText;
  metaTitle: LocalizedText;
  metaDescription: LocalizedText;
  keywords: {
    en: string[];
    zh: string[];
  };
  intro: {
    en: string[];
    zh: string[];
  };
  benefitsHeading: LocalizedText;
  benefits: {
    en: FeatureItem[];
    zh: FeatureItem[];
  };
  useCasesHeading: LocalizedText;
  useCases: {
    en: FeatureItem[];
    zh: FeatureItem[];
  };
  faqHeading: LocalizedText;
  faqs: {
    en: FeatureFaq[];
    zh: FeatureFaq[];
  };
  relatedSlugs: string[];
  trendingExamples?: {
    en: { title: string; description: string; date: string }[];
    zh: { title: string; description: string; date: string }[];
  };
  layoutType?: 'default' | 'case-archive' | 'hot-billboard' | 'leaked-chat' | 'breaking-news' | 'cyber-gallery' | 'code-sequencer';
};

function dual(value: string): LocalizedText {
  return { en: value, zh: value };
}

export const featuresContent: Record<string, FeatureContent> = {
  'absurd-social-phenomena': {
    slug: 'absurd-social-phenomena',
    iconColor: 'text-purple-300',
    title: dual('Absurd Social Phenomena'),
    h1: dual('Absurd Social Phenomena Rap Songs'),
    description: dual('Bizarre public behavior and weird social stories turned into sharper rap commentary.'),
    imageUrl: '/images/features/absurd-social-phenomena.webp',
    heroText: dual('Turn bizarre reality into sharp, shareable roast and parody rap.'),
    metaTitle: dual('Absurd Social Phenomena Rap Songs | ScoopRYM'),
    metaDescription: dual(
      'Turn bizarre public behavior, weird social stories, and absurd real-world situations into satirical rap with stronger social commentary.'
    ),
    keywords: {
      en: ['absurd social phenomena rap', 'weird social behavior rap', 'public behavior rap songs', 'social commentary rap', 'social chaos rap'],
      zh: ['absurd social phenomena rap', 'weird social behavior rap', 'public behavior rap songs', 'social commentary rap', 'social chaos rap'],
    },
    intro: {
      en: [
        'This page focuses on stories that already feel absurd before any rewriting.',
        'Use it when your angle is social contradiction, weird behavior, and reality-driven satire.',
      ],
      zh: [
        'This page focuses on stories that already feel absurd before any rewriting.',
        'Use it when your angle is social contradiction, weird behavior, and reality-driven satire.',
      ],
    },
    benefitsHeading: dual('Western Absurdity Archive (2025-2026)'),
    layoutType: 'case-archive',
    benefits: {
      en: [
        { title: 'The Kentucky Bourbon Raccoon (2025)', desc: 'A raccoon broke into a world-famous distillery, got blitzed on grain alcohol, and had to be resuscitated by paramedics.' },
        { title: 'Molly-Mae’s "Pasta Crime" (2025)', desc: 'A UK national scandal erupted after an influencer was caught putting dry pasta in a pot before the water was boiling.' },
        { title: 'The "IBPOOPN" Legal Saga (2025)', desc: 'A US state supreme court spent hours of taxpayer time debating whether "IBPOOPN" license plates qualify as free speech.' },
      ],
      zh: [
        { title: '肯塔基州的“波本酒鬼浣熊”', desc: '一只浣熊闯入世界名酒厂把自己喝得烂醉，最后竟然需要急救人员现场进行人工呼吸才捡回一条命。' },
        { title: '全英公敌：Molly-Mae的煮面罪', desc: '英国网红因在水烧开前就丢入干面条，引发了整个推特长达一周的“烹饪道德”大讨论，甚至惊动了专业厨师。' },
        { title: '“IBPOOPN”车牌的宪法危机', desc: '美国某州最高法院花费数小时严肃辩论“我看我在拉屎”字样的车牌是否受言论自由保护，法律的尊严在这一刻彻底抽象。' },
      ],
    },
    useCasesHeading: dual('The Florida Man Chronicles & Beyond'),
    useCases: {
      en: [
        { title: 'The "Prosthetic Combat" Gear', desc: 'A man arrested wearing a loaded gun hidden under prosthetic breasts while trespassing in Florida.' },
        { title: 'NY Rooftop Urinator (2025)', desc: 'A Brooklyn resident went viral for creating a "gravity-fed" irrigation system that turned out to be just him urinating off his roof.' },
        { title: 'Ambulance Beer Thief (2025)', desc: 'A suspect stole an ambulance, led police on a slow-speed chase, and was found calmly finishing a beer when finally stopped.' },
      ],
      zh: [
        { title: '“义乳武装”佛州男', desc: '一名男子穿着迷幻胸罩，并在假乳下藏着一把上了膛的手枪试图闯入工地，在佛州被捕。' },
        { title: '布鲁克林“重力灌溉”神话', desc: '一名纽约客因发明“重力驱动灌溉系统”走红，最后被邻居拆穿其实只是他在房顶往下撒尿。' },
        { title: '开救护车偷啤酒的贼', desc: '一名嫌疑人盗窃了一辆救护车并与警方展开低速对峙，被截停时他正坐在车里悠闲地喝完最后一口啤酒。' },
      ],
    },
    faqHeading: dual('FAQ'),
    faqs: {
      en: [
        { question: 'What stories belong here?', answer: 'Bizarre public behavior, strange social incidents, and real-world contradictions.' },
        { question: 'How is this different from News Parody?', answer: 'News Parody is headline-framed. This page is behavior-framed and commentary-first.' },
        { question: 'Is this satire or meme content?', answer: 'Primarily satire and social commentary.' },
      ],
      zh: [
        { question: 'What stories belong here?', answer: 'Bizarre public behavior, strange social incidents, and real-world contradictions.' },
        { question: 'How is this different from News Parody?', answer: 'News Parody is headline-framed. This page is behavior-framed and commentary-first.' },
        { question: 'Is this satire or meme content?', answer: 'Primarily satire and social commentary.' },
      ],
    },
    relatedSlugs: ['news-parody', 'meme-culture', 'comedy-drill'],
    trendingExamples: {
      en: [
        {
          date: 'Feb 2026',
          title: 'The US Airport Pajama Ban',
          description: 'A major US airport triggered a social media firestorm after a joke post about "banning pajamas" was taken as a serious policy change.',
        },
        {
          date: 'Early 2025',
          title: 'The Rise of "Italian Brainrot"',
          description: 'A surreal internet phenomenon of AI-generated creatures with nonsensical Italian voiceovers—the peak of post-ironic decay.',
        },
        {
          date: 'Aug 2025',
          title: 'Oklahoma’s Robot Cockfighting',
          description: 'A surreal law allowing chickens to fight robot opponents as long as the birds were wearing "protective sports gear."',
        },
      ],
      zh: [
        {
          date: '2026年2月',
          title: '2026全美机场“睡衣禁令”',
          description: '某大牌机场在官推发布“禁止穿睡衣登机”的玩笑帖，引发全美社交媒体集体破防。',
        },
        {
          date: '2025年初',
          title: '“意大利式精神污染”席卷全网',
          description: '一种被称为“Italian Brainrot”的超现实AI迷因：各种奇形怪状的生物配上毫无意义的意语独白。',
        },
        {
          date: '2025年8月',
          title: '俄克拉荷马州的“鸡斗机器人”',
          description: '一项超现实法案，允许公鸡在穿戴“运动护具”的前提下与机器人对手格斗。',
        },
      ],
    },
  },
  'entertainment-topics': {
    slug: 'entertainment-topics',
    iconColor: 'text-orange-300',
    title: dual('Entertainment Topics'),
    h1: dual('Entertainment Topic Rap Songs'),
    description: dual('Celebrity stories and pop culture moments remixed into rap songs.'),
    imageUrl: '/images/features/entertainment-topics.webp',
    heroText: dual('Remix celebrity moments and pop culture chaos into viral rap songs.'),
    metaTitle: dual('Entertainment Topic Rap Songs | ScoopRYM'),
    metaDescription: dual(
      'Turn celebrity stories, entertainment gossip, interviews, and pop culture moments into parody rap and funny commentary songs.'
    ),
    keywords: {
      en: ['entertainment gossip rap', 'celebrity gossip rap', 'pop culture rap songs', 'celebrity rumor rap', 'celebrity interview parody rap'],
      zh: ['entertainment gossip rap', 'celebrity gossip rap', 'pop culture rap songs', 'celebrity rumor rap', 'celebrity interview parody rap'],
    },
    layoutType: 'hot-billboard',
    intro: {
      en: ['Classified pop culture moments.', 'Do not leak.'],
      zh: ['绝密娱乐档案。', '禁止外泄。'],
    },
    benefitsHeading: dual('Hits on the Billboard (2025)'),
    benefits: {
      en: [
        { title: 'The Coldplay Kiss-Cam Disaster (2025)', desc: 'A stadium jumbotron catches two married colleagues embracing, sparking a massive HR scandal and internet debate.' },
        { title: 'Kendrick’s ‘Bootcut Celine’ Halftime (2025)', desc: 'Kendrick Lamar performs the Super Bowl in questionable jeans while throwing subs at Drake, shutting down X.' },
        { title: 'Katy Perry’s Tone-Deaf Space Trip (2025)', desc: 'A luxury ride to space on Blue Origin generates millions of memes about disconnected billionaires.' },
      ],
      zh: [
        { title: 'Coldplay “死亡镜头”事件 (2025)', desc: '体育场接吻镜头意外捕捉到两名已婚同事拥吻，引发全网史诗级 HR 灾难和吃瓜狂欢。' },
        { title: 'Kendrick 穿着“微喇裤”炸场 (2025)', desc: 'Kendrick Lamar 穿着充满争议的 Celine 微喇牛仔裤登上超级碗中场秀，顺便又 Diss 了 Drake。' },
        { title: 'Katy Perry 的太空“炫富游” (2025)', desc: '搭乘蓝色起源上太空，一场脱离群众的豪华奢靡之旅，被全网做成成千上万个嘲讽梗图。' },
      ],
    },
    useCasesHeading: dual('Red Carpet & Awards Drama'),
    useCases: {
      en: [
        { title: 'Zendaya’s Silent Ring Reveal (2025)', desc: 'Zendaya casually flashes an engagement ring at the Golden Globes, breaking the internet without saying a word.' },
        { title: 'The "It Ends With Us" Press Chaos (2025)', desc: 'Blake Lively and Justin Baldoni’s passive-aggressive feud overshadows their movie, spawning infinite TikTok lore.' },
        { title: 'Timothée’s "Ballet" Backlash (2026)', desc: '"Nobody cares about ballet," says the actor, accidentally triggering a massive feud with the global classical arts community.' },
      ],
      zh: [
        { title: 'Zendaya 的“无声官宣” (2025)', desc: '在金球奖红毯上轻描淡写地展示订婚戒指，一言未发却让整个外网服务器陷入瘫痪。' },
        { title: '《终结》剧组宣发大内讧 (2025)', desc: '男女主的阴阳怪气宫斗大戏彻底盖过了电影本身，被 TikTok 网友像看悬疑剧一样逐帧分析。' },
        { title: '甜茶的“芭蕾舞”风波 (2026)', desc: '“根本没人关心芭蕾舞。”—— 男星一句随口吐槽，不小心惹怒了全球古典艺术圈，掀起一场大乱斗。' },
      ],
    },
    trendingExamples: {
      en: [
        { date: 'Feb 2026', title: 'The "Big Four" Leak (2026)', description: 'A massive explicit video leak involving prominent actors dominates pop culture forensics on Reddit and TikTok.' },
        { date: 'Mid 2025', title: 'Taylor & Travis Crash IG (2025)', description: 'The most anticipated engagement of the decade finally happens, causing Instagram servers to crash for two hours.' },
        { date: 'Late 2025', title: 'The "Snow White" Culture War (2025)', description: 'Endless internet discourse over the live-action movie’s box office performance turns into a two-month-long digital battlefield.' },
      ],
      zh: [
        { date: '2026年2月', title: '好莱坞“Big Four”泄露门 (2026)', description: '几位当红演员的私密视频疑云，让 Reddit 和 TikTok 上的吃瓜群众化身为赛博福尔摩斯。' },
        { date: '2025年中', title: 'Taylor 订婚搞崩 IG (2025)', description: '十年内最受期待的订婚终于发生，引发的巨大流量直接让 Instagram 宕机了整整两个小时。' },
        { date: '2025年末', title: '《白雪公主》票房引发的文化战争 (2025)', description: '真人版电影的票房表现，直接演变成了一场持续两个月的互联网阵营对骂战。' },
      ],
    },
    faqHeading: dual('FAQ'),
    faqs: {
      en: [
        { question: 'What belongs here?', answer: 'Celebrity news, interviews, and pop culture stories.' },
        { question: 'How is this different from Gossip Roast?', answer: 'This page is broader and less aggressive.' },
        { question: 'Only for celebrities?', answer: 'No, it also works for broader entertainment trends.' },
      ],
      zh: [
        { question: 'What belongs here?', answer: 'Celebrity news, interviews, and pop culture stories.' },
        { question: 'How is this different from Gossip Roast?', answer: 'This page is broader and less aggressive.' },
        { question: 'Only for celebrities?', answer: 'No, it also works for broader entertainment trends.' },
      ],
    },
    relatedSlugs: ['gossip-roast', 'news-parody', 'meme-culture'],
  },
  'gossip-roast': {
    slug: 'gossip-roast',
    iconColor: 'text-pink-300',
    title: dual('Gossip Roast'),
    h1: dual('Gossip Roast Rap Songs'),
    description: dual('Gossip drama turned into roast-style rap songs.'),
    imageUrl: '/images/features/gossip-roast.webp',
    heroText: dual('Serve the tea with sharper bars and harder punchlines.'),
    metaTitle: dual('Gossip Roast Rap Songs | ScoopRYM'),
    metaDescription: dual(
      'Turn celebrity gossip, influencer meltdowns, apology videos, and public feuds into roast rap with harder punchlines and diss-track energy.'
    ),
    keywords: {
      en: ['gossip roast rap songs', 'celebrity gossip rap', 'celebrity scandal rap', 'diss track for gossip', 'roast rap songs'],
      zh: ['gossip roast rap songs', 'celebrity gossip rap', 'celebrity scandal rap', 'diss track for gossip', 'roast rap songs'],
    },
    intro: {
      en: [
        'Celebrities apologize, influencers feud, and the internet watches it all burn.',
        'Turn these viral meltdowns and leaked chats into unskippable diss tracks.'
      ],
      zh: [
        '明星塌房、网红互撕、公关灾难，互联网永远在吃最热的瓜。',
        '把这些全网疯传的危机公关和“聊天记录泄露”做成一首字字珠玑的 Diss 舞曲。'
      ],
    },
    benefitsHeading: dual('The Blueprint of a Public Meltdown'),
    benefits: {
      en: [
        { title: 'The "Toxic Gossip Train" Apology (2025)', desc: 'Instead of saying sorry, an influencer busts out a ukulele and sings a condescending 10-minute song that instantly becomes a global PR disaster meme.' },
        { title: 'Delayed Accountability (2025)', desc: 'A top beauty influencer issues an apology for past resurfaced slurs that critics deem "too little, too late," leading to canceled brand deals.' },
        { title: 'The Podcast Persona Break (2026)', desc: 'A celebrity’s producer boyfriend goes on a new podcast and exhibits shockingly "gross" on-air behavior, forcing fans to beg the celeb to dump him immediately.' },
      ],
      zh: [
        { title: '尤克里里公关灾难 (2025)', desc: '某顶流网红面对指控，非但不道歉，反而掏出尤克里里唱了一首长达10分钟的傲慢神曲，瞬间成为全网公关反面教材。' },
        { title: '迟来的“赛博忏悔” (2025)', desc: '顶级美妆博主因过往不当言论发表长篇道歉，却被全网群嘲“太晚、太假”，导致无数品牌连夜解约。' },
        { title: '播客上的“现原形” (2026)', desc: '某巨星制作人男友在播客首秀中表现极其猥琐，引发全网热议，粉丝们疯狂在评论区留言求女方“快逃”。' },
      ],
    },
    useCasesHeading: dual('Exposing the Drama'),
    useCases: {
      en: [
        { title: 'The Press Tour Cold War (2025)', desc: 'Co-stars of a major romantic drama refuse to stand near each other, sparking intense forensic body-language analysis on TikTok.' },
        { title: 'The Billionaire Vlog Backlash (2026)', desc: 'A prominent political family member faces intense heat after vlogging their Secret Service detail at a local grocery store for clout.' },
        { title: 'Defamation Lawsuit Era (2025)', desc: 'A reality TV mogul sues her ex for defamation after he publicly links the family to a notorious celebrity criminal enterprise.' },
      ],
      zh: [
        { title: '《终结》剧组宣发冷战 (2025)', desc: '浪漫剧情片男女主在红毯上全程零交流，激发了 TikTok 网友逐帧进行微表情和肢体语言的“赛博法医”级分析。' },
        { title: '特勤局 VLOG 炫耀翻车 (2026)', desc: '某政要家族千金仅仅是为了涨粉，竟然带着特勤保镖去逛超市拍 VLOG，引发全网仇富与批评声浪。' },
        { title: '名媛名誉权大战 (2025)', desc: '顶级真人秀女星以诽谤罪起诉前男友，只因男方在直播中口嗨，将她的家族与某臭名昭著的帮派大佬强行绑定。' },
      ],
    },
    trendingExamples: {
      en: [
        { date: 'Dec 2025', title: 'The Miss Universe Mutiny (2025)', description: 'The 2025 pageant descends into pure chaos following dramatic contestant walkouts, rigging accusations, and mass judges\' resignations on live TV.' },
        { date: 'Early 2026', title: 'Resurfaced TikTok Shade (2026)', description: 'An actress uses a viral "fixing a man" sound, which the internet immediately weaponizes as a direct attack on her famous ex-boyfriend from a decade ago.' },
        { date: 'Late 2025', title: 'The Jeans Campaign Uproar (2025)', description: 'A massive online debate erupts over an actress’s controversial denim ad, sparking think-pieces on genetics, beauty standards, and modern feminism.' },
      ],
      zh: [
        { date: '2025年12月', title: '环球小姐“叛变”事件 (2025)', description: '2025年选美大赛演变成一场史诗级闹剧，伴随着佳丽愤然退赛、黑幕指控以及评委在直播中集体辞职的大戏。' },
        { date: '2026年初', title: 'TikTok 前任刺杀事件 (2026)', description: '某女星使用了一段热门的“改造渣男”音频，立刻被全网认定为是对十年前红毯前男友的一记精准绝杀。' },
        { date: '2025年末', title: '牛仔裤广告文化战 (2025)', description: '一条引发争议的女星牛仔裤广告，在网络上激起了关于外貌焦虑、基因彩票和现代女权主义的无休止混战。' },
      ],
    },
    layoutType: 'leaked-chat',
    faqHeading: dual('FAQ'),
    faqs: {
      en: [
        { question: 'When to use this instead of Entertainment Topics?', answer: 'Use it when conflict and takedown energy are central.' },
        { question: 'Is this for diss-style songs?', answer: 'Yes, this page best fits diss and roast tone.' },
        { question: 'Only for celebrity gossip?', answer: 'No, it also works for influencer and community drama.' },
      ],
      zh: [
        { question: 'When to use this instead of Entertainment Topics?', answer: 'Use it when conflict and takedown energy are central.' },
        { question: 'Is this for diss-style songs?', answer: 'Yes, this page best fits diss and roast tone.' },
        { question: 'Only for celebrity gossip?', answer: 'No, it also works for influencer and community drama.' },
      ],
    },
    relatedSlugs: ['entertainment-topics', 'news-parody', 'comedy-drill'],
  },
  'news-parody': {
    slug: 'news-parody',
    iconColor: 'text-yellow-300',
    title: dual('News Parody'),
    h1: dual('News Parody Rap Songs'),
    description: dual('Headlines and media moments turned into parody rap songs.'),
    imageUrl: '/images/features/news-parody.webp',
    heroText: dual('Take the headline, flip the framing, and turn it into parody rap.'),
    metaTitle: dual('News Parody Rap Songs | ScoopRYM'),
    metaDescription: dual(
      'Turn absurd news, awkward interviews, local news clips, and corporate blunders into parody rap with strong replay value.'
    ),
    keywords: {
      en: ['absurd news rap', 'weird news rap', 'news parody rap songs', 'corporate blunder rap', 'local news rap songs'],
      zh: ['absurd news rap', 'weird news rap', 'news parody rap songs', 'corporate blunder rap', 'local news rap songs'],
    },

    intro: {
      en: [
        'Local broadcast mishaps, absurd political satire, and headlines that sound like a simulation glitch.',
        'Turn these bizarre internet moments into a hard-hitting breaking news rap report.'
      ],
      zh: [
        '地方新闻播报翻车、荒谬的政治讽刺，以及那些看起来像地球Online出Bug的离谱头条。',
        '把这些怪诞现象爆改成火力全开的“突发新闻”说唱报道。'
      ],
    },
    benefitsHeading: dual('The Simulation is Broken'),
    benefits: {
      en: [
        { title: 'The Eiffel Tower Demolition Hoax (2026)', desc: 'A satire news site somehow convinces millions of internet users that Paris is intentionally tearing down the Eiffel Tower.' },
        { title: 'The "Doomsday Fish" Panic (2026)', desc: 'A rare deep-sea oarfish washes ashore, causing TikTok to universally and hysterically declare the immediate end of the world.' },
        { title: 'Marjorie Taylor Greene Resignation Prank (2025)', desc: 'A highly coordinated internet prank surrounding a fake resignation letter that fooled major platform algorithms for a full day.' },
      ],
      zh: [
        { title: '埃菲尔铁塔“强拆”恶搞 (2026)', desc: '一家整活新闻网站凭空捏造了巴黎要拆除埃菲尔铁塔的消息，竟然奇迹般地骗过了全网数百万名网友。' },
        { title: '“末日海怪”引发的恐慌 (2026)', desc: '一条极其罕见的深海皇带鱼被冲上岸，导致整个 TikTok 陷入疯狂，集体宣布世界末日即刻来临。' },
        { title: 'MTG 辞职信恶作剧 (2025)', desc: '一场蓄谋已久的互联网恶搞行动，一封伪造的政客辞职信硬生生骗过了全球各大社交平台的推荐算法长达一整天。' },
      ],
    },
    useCasesHeading: dual('Unbelievable Headlines'),
    useCases: {
      en: [
        { title: 'The "Year of the Bizarre" Hotel Seal (2025)', desc: 'A massive coastal seal finds its way into a luxury hotel room and falls asleep on the bed, immediately becoming a local news legend.' },
        { title: 'The "Birds Aren\'t Real" AI Expansion (2026)', desc: 'The satirical movement reaches new heights by dropping hyper-realistic AI war footage of drones disguised as pigeons.' },
        { title: 'Gen Z "Heterosexual" Fashion Satire (2026)', desc: 'A wildly popular satirical article praises the "bold and revolutionary" fashion choices of painfully average straight college students.' },
      ],
      zh: [
        { title: '豪华酒店的“海豹奇袭” (2025)', desc: '一头巨大的海岸海豹不知道怎么跑进了海滨奢华酒店的客房，还在大床上呼呼大睡，瞬间制霸地方新闻头版。' },
        { title: '“鸟类不真实”运动的 AI 进化 (2026)', desc: '这个著名的讽刺阴谋论团体发布了极其逼真的“机器鸽子伪装监控空战”AI大片，把整活推向了赛博朋克新高度。' },
        { title: 'Z世代“异性恋”穿搭群嘲 (2026)', desc: '一篇火爆全网的讽刺评论文章，阴阳怪气地赞美那些毫无亮点的普通直男大学生穿搭是“大胆且革命性的”。' },
      ],
    },
    trendingExamples: {
      en: [
        { date: 'Mid 2025', title: 'The Jet2Holiday Jingle Obsession (2025)', description: 'A mundane corporate airline commercial jingle inexplicably morphs into a massive, bizarre club anthem across Europe.' },
        { date: 'Aug 2025', title: 'The Great "IBPOOPN" Debate (2025)', description: 'An actual state government legislature wastes hours of official bureaucratic debate trying to ban potty humor vanity license plates.' },
        { date: 'Early 2026', title: '"250 Years of Trump" Comedy Tour (2026)', description: 'A political satire show pushes the limits of absurd dystopia, treating the timeline as an endless loop of a single presidency.' },
      ],
      zh: [
        { date: '2025年中', title: '廉价航空洗脑广告歌 (2025)', description: '一首极其平庸的 Jet2Holiday 航空公司广告配乐，莫名其妙地在欧洲各大夜店变成了万人蹦迪的神曲。' },
        { date: '2025年8月', title: '州政府对阵“低级趣味”车牌 (2025)', description: '美国某州的新闻焦点：庄严的政府立法机构竟然浪费了数小时的时间，只为了讨论如何封杀“我在拉屎”这样的谐音梗车牌。' },
        { date: '2026年初', title: '“川普250年”讽刺大赏 (2026)', description: '一场脑洞大开的政治讽刺喜剧秀，将时间线设定为毫无尽头的单一总统任期循环，荒诞反乌托邦拉满。' },
      ],
    },
    layoutType: 'breaking-news',
    faqHeading: dual('FAQ'),
    faqs: {
      en: [
        { question: 'How is this different from Absurd Social Phenomena?', answer: 'This page is headline-framed and media-driven.' },
        { question: 'Good for PR disasters?', answer: 'Yes, especially statement-led stories.' },
        { question: 'Works for local clips?', answer: 'Yes, local interviews are high-performing inputs.' },
      ],
      zh: [
        { question: 'How is this different from Absurd Social Phenomena?', answer: 'This page is headline-framed and media-driven.' },
        { question: 'Good for PR disasters?', answer: 'Yes, especially statement-led stories.' },
        { question: 'Works for local clips?', answer: 'Yes, local interviews are high-performing inputs.' },
      ],
    },
    relatedSlugs: ['absurd-social-phenomena', 'entertainment-topics', 'meme-culture'],
  },
  'meme-culture': {
    slug: 'meme-culture',
    iconColor: 'text-cyan-300',
    title: dual('Meme Culture'),
    h1: dual('Meme Culture Rap Songs'),
    description: dual('Internet-native jokes and trends turned into fast, shareable rap songs.'),
    imageUrl: '/images/features/meme-culture.webp',
    heroText: dual('Soundtrack internet jokes before the trend goes cold.'),
    metaTitle: dual('Meme Culture Rap Songs | ScoopRYM'),
    metaDescription: dual(
      'Turn memes, viral trends, copypasta, and chaotic internet culture into funny rap built for replay, remixing, and short-form sharing.'
    ),
    keywords: {
      en: ['meme culture rap songs', 'funny rap songs', 'viral trend rap songs', 'copypasta rap songs', 'parody rap songs'],
      zh: ['meme culture rap songs', 'funny rap songs', 'viral trend rap songs', 'copypasta rap songs', 'parody rap songs'],
    },
    intro: {
      en: [
        'The internet moves fast, and its inside jokes move faster. From AI slop panics to existential animals.',
        'Turn the brainrot and viral chaos of 2025-2026 into fast, replayable rap anthems.'
      ],
      zh: [
        '互联网的烂梗迭代速度永远超乎你的想象，从 AI 垃圾图恐慌到充满存在主义危机的企鹅。',
        '把这些 2025-2026 年的赛博精神污染和洗脑迷因，全部爆改成节奏洗脑的说唱神曲。'
      ],
    },
    benefitsHeading: dual('The Great Meme Reset'),
    benefits: {
      en: [
        { title: 'The "6-7" Meme Chaos (2025)', desc: 'A kid yelling "six seven" goes so insanely viral that In-N-Out is forced to ban the number 67 from orders to stop customer outbursts.' },
        { title: 'The "Nihilist Penguin" (2026)', desc: 'A Werner Herzog clip of a lone penguin walking to its icy doom becomes the global internet symbol for severe workplace burnout.' },
        { title: 'The "Shrimp Jesus" Epidemic (2025)', desc: 'Bizarre, hyper-surreal AI-generated images flood social platforms, accelerating the eerie "Dead Internet Theory" panic.' },
      ],
      zh: [
        { title: '“6-7” 洗脑梗爆发 (2025)', desc: '一个男孩大喊“六七”的视频离谱爆红，直接导致 In-N-Out 汉堡店不得不封杀 67 号订单以阻止顾客发长条大叫。' },
        { title: '“虚无主义企鹅” (2026)', desc: '赫尔佐格纪录片中一只走向死亡的孤傲企鹅，莫名成为了全网打工人表达“重度职场倦怠”的超级图腾。' },
        { title: '“虾仁耶稣”效应 (2025)', desc: '荒诞怪异的劣质 AI 图像（如虾拼凑的耶稣）淹没脸书，彻底引爆了大众对“互联网已死理论”的赛博恐慌。' },
      ],
    },
    useCasesHeading: dual('Peak Brainrot Engines'),
    useCases: {
      en: [
        { title: 'Labubu Blind Box Madness (2025)', desc: 'An "ugly-cute" fluffy gremlin doll inexplicably transcends logic to become a multi-million-dollar celebrity status symbol across TikTok.' },
        { title: 'Reality Show "Brainrot" Edits (2026)', desc: 'Gen Z aggressively edits mundane daily tasks—like making toast—with chaotic reality-TV jump cuts and booming sound effects.' },
        { title: 'Punch the Monkey (2026)', desc: 'A newly born Japanese macaque instantaneously hijacks the algorithm, becoming the emotional core of animal internet culture.' },
      ],
      zh: [
        { title: 'Labubu 盲盒疯潮 (2025)', desc: '一只“丑萌”的毛绒小怪兽玩偶无视一切市场逻辑，莫名其妙横扫发音圈，成为无数顶流明星疯抢的流量密码。' },
        { title: '“真人秀式”日常剪辑 (2026)', desc: 'Z世代迷上了给烤面包这种极度无聊的日常，配上如同美国撕逼真人秀般的夸张音效和闪瞎眼的转场。' },
        { title: '猴子重拳 (2026)', desc: '一只刚出生的日本猕猴瞬间劫持了全网推荐算法，莫名成为了 2026 年动物界互联网文化的情感核心。' },
      ],
    },
    trendingExamples: {
      en: [
        { date: 'Late 2025', title: 'The Spanish Copypasta', description: 'Massive, bizarre multi-paragraph inside jokes cross language barriers, spamming comment sections as fake breaking news alerts.' },
        { date: 'Early 2026', title: '"Do you actually want..." Audio', description: 'A hyper-dramatic argument audio clip juxtaposed against laughably low-stakes situations absolutely dominates reels.' },
        { date: 'Mid 2026', title: '"Because here\'s my thing..."', description: 'An endless trend of people restarting conversations that were obviously already over, purely to add one last unhinged point.' },
      ],
      zh: [
        { date: '2025年末', title: '跨语种 Copypasta 垃圾话', description: '长篇大论的离奇外国段子跨越了语言壁垒，以“伪造突发新闻”的形式在各大评论区指数级地复制粘贴蔓延。' },
        { date: '2026年初', title: '“你到底干不干” 强原生伴奏', description: '一段极其歇斯底里的吵架原声，被网友们配上了比如“猫咪不想吃猫粮”这种极度缺乏戏剧性的日常画面。' },
        { date: '2026年中', title: '“因为我跟你说啊...”', description: '全网都在模仿一种诡异的交流状态：明明谈话已经彻底结束，却必须强行重启并补上一句毫无逻辑的暴论。' },
      ],
    },
    layoutType: 'cyber-gallery',
    faqHeading: dual('FAQ'),
    faqs: {
      en: [
        { question: 'What belongs here?', answer: 'Memes, viral phrases, copypasta, and trend jokes.' },
        { question: 'How is this different from News Parody?', answer: 'This page is platform-native, not headline-framed.' },
        { question: 'Best for speed over depth?', answer: 'Yes, speed and replayability are the priority.' },
      ],
      zh: [
        { question: 'What belongs here?', answer: 'Memes, viral phrases, copypasta, and trend jokes.' },
        { question: 'How is this different from News Parody?', answer: 'This page is platform-native, not headline-framed.' },
        { question: 'Best for speed over depth?', answer: 'Yes, speed and replayability are the priority.' },
      ],
    },
    relatedSlugs: ['absurd-social-phenomena', 'entertainment-topics', 'comedy-drill'],
  },
  'comedy-drill': {
    slug: 'comedy-drill',
    iconColor: 'text-green-300',
    title: dual('Comedy Drill'),
    h1: dual('Comedy Drill Rap Songs'),
    description: dual('Hard drill energy aimed at tiny annoyances for maximum contrast.'),
    imageUrl: '/images/features/comedy-drill.webp',
    heroText: dual('Use hard beats on soft targets for maximum contrast.'),
    metaTitle: dual('Comedy Drill Rap Songs | ScoopRYM'),
    metaDescription: dual(
      'Create comedy drill rap from petty complaints, minor inconveniences, and exaggerated everyday annoyances.'
    ),
    keywords: {
      en: ['comedy drill rap songs', 'funny drill rap', 'petty complaint rap songs', 'minor inconvenience rap', 'funny rap songs'],
      zh: ['comedy drill rap songs', 'funny drill rap', 'petty complaint rap songs', 'minor inconvenience rap', 'funny rap songs'],
    },
    intro: {
      en: [
        'Because sometimes the only way to deal with mild inconveniences is by dropping the hardest drill beat possible.',
        'Turn everyday frustrations, minor tech glitches, and first-world problems into aggressive, ironically hyped rap tracks.'
      ],
      zh: [
        '对付生活中那些微小但致命烦恼的唯一方法，就是给它们配上最狠的 Drill/Trap 伴奏。',
        '把日常破防瞬间、电子产品背刺和第一世界的矫情烦恼，全部写成极具攻击性又贼搞笑的说唱狠歌。'
      ],
    },
    benefitsHeading: dual('System Failure Rap'),
    benefits: {
      en: [
        { title: 'The "Forgot Password" Loop', desc: 'That moment you reset your password, only for it to tell you "New password cannot be the same as old password."' },
        { title: 'The 1% Battery Panic', desc: 'When your phone hits 1% right as you need to scan a mobile ticket or show a QR code.' },
        { title: 'Phantom Notifications', desc: 'Feeling your phone vibrate in your pocket, checking it, and realizing absolutely no one has messaged you.' },
      ],
      zh: [
        { title: '“忘记密码”死循环', desc: '千辛万苦重置密码，系统却冷冷地提示你：“新密码不能与旧密码相同”。气血疯狂上涌。' },
        { title: '1% 电量的极限挣扎', desc: '在地铁闸机或演唱会检票口，眼看着手机电量在打开二维码的瞬间掉到 1% 并自动关机。' },
        { title: '幻影震动症', desc: '大腿明显感觉到手机震动，掏出来一看屏幕空空如也，根本没人找你。' },
      ],
    },
    useCasesHeading: dual('Everyday Glitches'),
    useCases: {
      en: [
        { title: 'Subscription Traps', desc: 'Creating an account is a one-click button format, but canceling requires a phone call to customer service during a full moon.' },
        { title: 'The USB Paradox', desc: 'Inserting a USB drive the wrong way, flipping it, still wrong, then flipping it back to original position and it works perfectly.' },
        { title: 'Unskippable Ads on 10s Videos', desc: 'Being forced to watch two 15-second unskippable ads for a 10-second video of a dog falling off a couch.' },
      ],
      zh: [
        { title: '互联网订阅刺客', desc: '开通连续包月只需要无脑点一下，但想要取消订阅，你得像个黑客一样在层层嵌套的后台菜单里找按钮。' },
        { title: 'USB 薛定谔定理', desc: '插 USB 永远插不进，反过来还是插不进，再反过来一次莫名其妙就进去了，彻底违背物理法则。' },
        { title: '为了看10秒视频而看30秒广告', desc: '为了看一条 10 秒钟猫猫后空翻的视频，被迫完整看完两段极其大声、根本跳不开的 15 秒劣质传奇广告。' },
      ],
    },
    trendingExamples: {
      en: [
        { date: 'Always', title: 'The "Reply All" Disaster', description: 'When someone replies all to a 500-person corporate email chain to say "Thanks."' },
        { date: 'Every Monday', title: 'The Windows Update Ambush', description: 'Your PC deciding it absolutely must restart for a critical update exactly 2 minutes before your Zoom presentation.' },
        { date: 'Routine', title: 'The Verification Captcha Insanity', description: 'Failing to identify all the crosswalks and wondering if you actually are a robot.' },
      ],
      zh: [
        { date: '职场高发', title: '“回复所有人”惨案', description: '在包含五百人的全司群发邮件里，那个毫无眼力见的同事点了“回复所有人”，只为了说一句“收到谢谢”。' },
        { date: '每个周一', title: 'Windows 强制更新的背刺', description: '距离极其重要的线上会议开始还有 2 分钟，你的电脑屏幕突然变蓝，显示“正在准备 Windows，请勿关闭您的计算机”。' },
        { date: '日常破防', title: '验证码找茬地狱', description: '被迫连续三次挑出图片里的“斑马线”和“红绿灯”都失败后，开始严肃怀疑自己是不是个 AI。' },
      ],
    },
    layoutType: 'code-sequencer',
    faqHeading: dual('FAQ'),
    faqs: {
      en: [
        { question: 'What belongs here?', answer: 'Petty complaints and tiny annoyances with exaggerated delivery.' },
        { question: 'How is this different from Meme Culture?', answer: 'This page is tone-contrast driven, not trend-driven.' },
        { question: 'Good for serious topics?', answer: 'No, this page works best for unserious targets.' },
      ],
      zh: [
        { question: 'What belongs here?', answer: 'Petty complaints and tiny annoyances with exaggerated delivery.' },
        { question: 'How is this different from Meme Culture?', answer: 'This page is tone-contrast driven, not trend-driven.' },
        { question: 'Good for serious topics?', answer: 'No, this page works best for unserious targets.' },
      ],
    },
    relatedSlugs: ['meme-culture', 'gossip-roast', 'absurd-social-phenomena'],
  },
};
