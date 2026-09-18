import "server-only";
import { cookies } from "next/headers";

export type Lang = "en" | "zh";
export async function getLang(): Promise<Lang> {
  return (await cookies()).get("lang")?.value === "zh" ? "zh" : "en";
}

const D = {
  tagline: ["One story. Every perspective.", "一件事，全世界怎么看。"],
  home: ["Home", "首页"], economy: ["Economy", "经济"], technology: ["Technology", "科技"], companies: ["Companies", "公司"], topics: ["Topics", "话题"],
  newsletter: ["Newsletter", "每日简报"], about: ["About", "关于"],
  promoTitle: ["See every side of the story.", "看见一件事的每一面。"],
  promoText: ["Tech and economy news, compared across countries and languages.", "科技与经济新闻，按国家和语言对比呈现。"],
  joinFree: ["Join for free", "免费订阅"], search: ["Search events, companies, topics…", "搜索事件、公司、话题…"],
  dailyBrief: ["Get the daily brief", "订阅每日简报"], live: ["Live", "实时"], topStory: ["Top story", "头条"],
  compare: ["Compare the coverage", "对比各国报道"], sources: ["sources", "个来源"], source: ["source", "个来源"],
  countries: ["countries", "个国家"], country: ["country", "个国家"], trending: ["Trending", "热门"], latest: ["Latest news", "最新"],
  all: ["All", "全部"], markets: ["Markets", "行情"], crypto: ["Crypto", "加密货币"], fx: ["FX", "汇率"],
  cryptoNote: ["7-day trend, CoinGecko", "7 日走势，CoinGecko"], fxNote: ["ECB reference rates", "欧洲央行参考汇率"],
  marketsDown: ["Market data is temporarily unavailable.", "行情数据暂时无法获取。"],
  topTopics: ["Top topics", "热门话题"], viewAll: ["View all", "查看全部"], featured: ["Featured insight", "精选"],
  compareN: ["Compare {n} countries", "对比 {n} 个国家"], disagree: ["Where the world disagrees", "各国分歧最大"],
  nlTitle: ["The Daily Coda", "Coda 每日简报"], nlText: ["The day's biggest tech and economy events, and how each side of the world told them.", "每天最重要的科技与经济事件，以及世界各地如何报道。"],
  nlPlaceholder: ["Your email address", "你的邮箱"], subscribe: ["Subscribe", "订阅"], nlOk: ["You're on the list. The first brief is on its way soon.", "订阅成功，第一期简报很快送到。"],
  nlErr: ["Please check the email address and try again.", "请检查邮箱地址后重试。"],
  footer: ["Summaries are AI-generated from linked sources. We summarise and link; we never republish articles. Stock photos via Pexels.", "摘要由 AI 根据所链接的来源生成。我们只做摘要和链接，从不转载原文。图库照片来自 Pexels。"],
  terms: ["Terms of Use", "使用条款"], privacy: ["Privacy Policy", "隐私政策"], cookies: ["Cookie Policy", "Cookie 政策"],
  updated: ["Updated", "更新于"], since: ["since", "始于"], agreed: ["What everyone agrees on", "各方共识"],
  spectrum: ["The framing spectrum", "报道倾向"], spectrumSub: ["Tone of each country's coverage", "各国报道的整体基调"],
  positive: ["Positive", "积极"], neutral: ["Neutral", "中性"], cautious: ["Cautious", "谨慎"],
  howEach: ["How each country tells it", "各国怎么说"], oneCountry: ["So far one country has covered this event. Perspectives appear when media in a second country report it.", "目前只有一个国家报道了这件事。第二个国家的媒体报道后，这里会出现各国视角对比。"],
  typicalHeadline: ["Typical headline, translated", "代表性标题（译）"], emphasises: ["Emphasises", "侧重"], mentionsLess: ["Mentions less", "较少提及"],
  analysis: ["Coda analysis", "Coda 分析"], whyDiffers: ["Why the coverage differs", "为什么报道不同"], aiNote: ["AI-generated from the sources below. Always check the originals.", "由 AI 根据下方来源生成，请以原文为准。"],
  sourcesH: ["Sources", "来源"], timeline: ["Timeline", "时间线"], moreOn: ["More on", "更多："], confidence: ["Confidence", "可信度"],
  official: ["Official source", "官方来源"], articles: ["articles", "篇报道"], article: ["article", "篇报道"], noEvents: ["No events yet.", "暂无事件。"],
  resultsFor: ["Results for", "搜索结果："], searchH: ["Search", "搜索"], mostActive: ["Most active in the news over the last three days.", "过去三天新闻中最活跃的公司。"],
  techIntro: ["AI, chips, big tech and startups, compared across countries.", "AI、芯片、科技巨头与创业公司，按国家对比。"],
  econIntro: ["Rates, trade, markets and companies, compared across countries.", "利率、贸易、市场与公司，按国家对比。"],
  first: ["The first events are being assembled. Check back in a few minutes.", "首批事件正在生成，请几分钟后再来。"],
} as const;

export type Key = keyof typeof D;
export function t(lang: Lang, key: Key, vars: Record<string, string | number> = {}) {
  let s: string = D[key][lang === "zh" ? 1 : 0];
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

export const TOPIC_ZH: Record<string, string> = {
  "artificial-intelligence": "人工智能", semiconductors: "半导体", "big-tech": "科技巨头", economy: "宏观经济", markets: "市场",
  trade: "贸易", "electric-vehicles": "电动车", energy: "能源", startups: "创业公司", crypto: "加密货币",
};
export const CATEGORY_ZH: Record<string, string> = { technology: "科技", economy: "经济" };
export const STATUS_ZH: Record<string, string> = { rumor: "传闻", breaking: "突发", developing: "进展中", confirmed: "已证实", resolved: "已结束", archived: "已归档" };
export const COUNTRY_ZH: Record<string, string> = {
  US: "美国", CN: "中国", HK: "中国香港", TW: "中国台湾", JP: "日本", KR: "韩国", GB: "英国", DE: "德国", FR: "法国", ES: "西班牙",
  EU: "欧盟", IN: "印度", AU: "澳大利亚", SG: "新加坡", AE: "阿联酋", QA: "卡塔尔", CA: "加拿大",
};
