import "server-only";
export type Lang = "en" | "zh";
/** Language comes from the URL segment: /zh/... is Chinese, everything else is served from /en/ internally (see proxy.ts). */
export async function langFrom(params: Promise<{ lang: string }> | { lang: string }): Promise<Lang> {
  return (await params).lang === "zh" ? "zh" : "en";
}
/** Path in the reader's language. */
export const lp = (lang: Lang, path: string) => (lang === "zh" ? `/zh${path === "/" ? "" : path}` : path);
/** hreflang alternates for a path. */
export const alternates = (path: string, lang: Lang = "en") => ({
  canonical: lp(lang, path),
  languages: { en: path, "zh-CN": lp("zh", path), "x-default": path },
});

const D = {
  tagline: ["One story. Every perspective.", "一件事，全世界怎么看。"],
  home: ["Home", "首页"], economy: ["Economy", "经济"], technology: ["Technology", "科技"], sport: ["Sport", "体育"], entertainment: ["Entertainment", "娱乐"], fashion: ["Fashion", "时尚"], australia: ["Australia", "澳洲"], companies: ["Companies", "公司"], topics: ["Topics", "话题"],
  newsletter: ["Newsletter", "每日简报"], about: ["About", "关于"],
  promoTitle: ["See every side of the story.", "看见一件事的每一面。"],
  promoText: ["The day's news, compared across countries and languages.", "每天的新闻，按国家和语言对比呈现。"],
  joinFree: ["Join for free", "免费订阅"], search: ["Search events, companies, topics…", "搜索事件、公司、话题…"],
  dailyBrief: ["Get the daily brief", "订阅每日简报"], live: ["Live", "实时"], topStory: ["Top story", "头条"],
  compare: ["Compare the coverage", "对比各国报道"], sources: ["sources", "个来源"], source: ["source", "个来源"],
  countries: ["countries", "个国家"], country: ["country", "个国家"], trending: ["Trending", "热门"], latest: ["Latest news", "最新"],
  all: ["All", "全部"], markets: ["Markets", "行情"], crypto: ["Crypto", "加密货币"], indices: ["Indices", "股指"], rates: ["Rates & Oil", "利率与原油"], indicesNote: ["Daily close, FRED", "每日收盘价，FRED"], fx: ["FX", "汇率"],
  cryptoNote: ["7-day trend, CoinGecko", "7 日走势，CoinGecko"], fxNote: ["ECB reference rates", "欧洲央行参考汇率"],
  marketsDown: ["Market data is temporarily unavailable.", "行情数据暂时无法获取。"],
  topTopics: ["Top topics", "热门话题"], viewAll: ["View all", "查看全部"], featured: ["Featured insight", "精选"],
  compareN: ["Compare {n} countries", "对比 {n} 个国家"], disagree: ["Where the world disagrees", "各国分歧最大"],
  nlTitle: ["coda.news Daily Brief", "coda.news 每日简报"], nlText: ["The day's biggest stories, and how each side of the world told them.", "每天最重要的新闻，以及世界各地如何报道。"],
  nlPlaceholder: ["Your email address", "你的邮箱"], subscribe: ["Subscribe", "订阅"], nlOk: ["You're on the list. The first brief is on its way soon.", "订阅成功，第一期简报很快送到。"],
  nlErr: ["Please check the email address and try again.", "请检查邮箱地址后重试。"],
  footer: ["Summaries are AI-generated from the linked sources and may contain errors; always check the originals. We summarise and link; we never republish articles. Photos come from openly licensed libraries (Pexels, Unsplash, Pixabay, Wikimedia Commons), credited to their authors.", "摘要由 AI 根据所链接的来源生成，可能有误，请以原文为准。我们只做摘要和链接，从不转载原文。图片来自开放授权图库（Pexels、Unsplash、Pixabay、Wikimedia Commons），并注明作者。"],
  terms: ["Terms of Use", "使用条款"], privacy: ["Privacy Policy", "隐私政策"], cookies: ["Cookie Policy", "Cookie 政策"],
  updated: ["Updated", "更新于"], since: ["since", "始于"], agreed: ["What everyone agrees on", "各方共识"],
  spectrum: ["The framing spectrum", "报道倾向"], spectrumSub: ["Overall tone of each country's coverage of this event, judged from the articles listed below.", "各国媒体报道这件事的整体语气，依据下方列出的文章判断。"],
  positive: ["Supportive", "支持性"], neutral: ["Descriptive", "描述性"], cautious: ["Cautious", "审慎性"],
  howEach: ["How each country tells it", "各国怎么说"], oneCountry: ["So far one country has covered this event. Perspectives appear when media in a second country report it.", "目前只有一个国家报道了这件事。第二个国家的媒体报道后，这里会出现各国视角对比。"],
  typicalHeadline: ["Typical headline, translated", "代表性标题（译）"], emphasises: ["Emphasises", "侧重"], mentionsLess: ["Mentions less", "较少提及"],
  analysis: ["coda.news analysis", "coda.news 分析"], whyDiffers: ["Why the coverage differs", "为什么报道不同"], aiNote: ["AI-generated from the sources below. Always check the originals.", "由 AI 根据下方来源生成，请以原文为准。"],
  sourcesH: ["Sources", "来源"], timeline: ["Timeline", "时间线"], moreOn: ["More on", "更多："], confidence: ["Source strength", "来源强度"], howJudge: ["How we judge", "判断方法"], limited: ["Limited coverage: 1 article", "报道有限：仅 1 篇"], outlets: ["independent outlets", "家独立媒体"],
  report: ["Report an error", "报告错误"], reportKind: ["What is wrong?", "哪里有问题？"], rMerge: ["Unrelated stories mixed together", "混入了不相关的新闻"], rTrans: ["Translation error", "翻译错误"], rCountry: ["Wrong country or source", "国家或来源标错"], rAi: ["AI summary or analysis is wrong", "AI 摘要或分析有误"], rOther: ["Other", "其他"], rNote: ["Details (optional)", "补充说明（可选）"], rSend: ["Send", "提交"], rThanks: ["Thank you. We will review it.", "谢谢，我们会尽快核查。"],
  share: ["Share", "分享"], copied: ["Link copied", "链接已复制"], shareImage: ["Save as image", "一键生成图片"], making: ["Making…", "生成中…"], copyLink: ["Copy", "复制"], email: ["Email", "邮件"], qr: ["QR code", "二维码"], qrHint: ["Scan to open on a phone, or share in WeChat.", "手机扫码打开，也可以用微信扫一扫分享。"], qrSave: ["Save QR code", "保存二维码"], moreShare: ["More options", "更多分享方式"], wxHint: ["Link copied. Paste it in WeChat, or scan the QR code.", "链接已复制，可粘贴到微信，或用微信扫二维码。"], igHint: ["Image saved. Post it on Instagram from your phone.", "图片已保存，可在手机上发到 Instagram。"], loadMore: ["Load more", "加载更多"],
  official: ["Official source", "官方来源"], articles: ["articles", "篇报道"], article: ["article", "篇报道"], noEvents: ["No events yet.", "暂无事件。"],
  resultsFor: ["Results for", "搜索结果："], searchH: ["Search", "搜索"], mostActive: ["Most active in the news over the last three days.", "过去三天新闻中最活跃的公司。"],
  techIntro: ["AI, chips, big tech and startups, compared across countries.", "AI、芯片、科技巨头与创业公司，按国家对比。"],
  sportIntro: ["Matches, transfers and tournaments, and how each country's media tell them.", "比赛、转会与赛事，以及各国媒体的不同讲法。"],
  entIntro: ["Film, music, TV and games, compared across countries.", "电影、音乐、电视与游戏，按国家对比。"],
  fashionIntro: ["Collections, brands and design, compared across countries.", "时装系列、品牌与设计，按国家对比。"],
  auIntro: ["Australian business, technology, sport and culture, and how the world reports Australia.", "澳洲的商业、科技、体育与文化，以及世界如何报道澳洲。"],
  econIntro: ["Rates, trade, markets and companies, compared across countries.", "利率、贸易、市场与公司，按国家对比。"],
  disclaimer: ["Summaries are AI-generated from the linked sources and may contain errors; always check the originals. We summarise and link; we never republish articles. Photos come from openly licensed libraries (Pexels, Unsplash, Pixabay, Wikimedia Commons), credited to their authors.", "摘要由 AI 根据所链接的来源生成，可能有误，请以原文为准。我们只做摘要和链接，从不转载原文。图片来自开放授权图库（Pexels、Unsplash、Pixabay、Wikimedia Commons），并注明作者。"],
  first: ["The first events are being assembled. Check back in a few minutes.", "首批事件正在生成，请几分钟后再来。"],
} as const;

export type Key = keyof typeof D;
export function t(lang: Lang, key: Key, vars: Record<string, string | number> = {}) {
  let s: string = D[key][lang === "zh" ? 1 : 0];
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

export const TOPIC_ZH: Record<string, string> = {
  celebrity: "明星",
  "artificial-intelligence": "人工智能", semiconductors: "半导体", "big-tech": "科技巨头", economy: "宏观经济", markets: "市场",
  trade: "贸易", "electric-vehicles": "电动车", energy: "能源", startups: "创业公司", crypto: "加密货币",
  football: "足球", tennis: "网球", cricket: "板球", basketball: "篮球", motorsport: "赛车", "olympic-sports": "奥运项目",
  film: "电影", music: "音乐", "tv-streaming": "电视与流媒体", gaming: "游戏", luxury: "奢侈品", "fashion-week": "时装周", "fashion-retail": "时尚零售", design: "设计",
};
export const CATEGORY_ZH: Record<string, string> = { technology: "科技", economy: "经济", sport: "体育", entertainment: "娱乐", fashion: "时尚" };
export const STATUS_ZH: Record<string, string> = { rumor: "传闻", breaking: "突发", developing: "进展中", confirmed: "已证实", resolved: "已结束", archived: "已归档" };
export const COUNTRY_ZH: Record<string, string> = {
  US: "美国", CN: "中国", HK: "中国香港", TW: "中国台湾", JP: "日本", KR: "韩国", GB: "英国", DE: "德国", FR: "法国", ES: "西班牙", IT: "意大利",
  EU: "欧盟", IN: "印度", AU: "澳大利亚", SG: "新加坡", AE: "阿联酋", QA: "卡塔尔", CA: "加拿大",
};
