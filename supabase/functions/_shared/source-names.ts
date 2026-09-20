// English names for outlets whose own name is in Chinese, Japanese or Korean. Used in every English text we write
// ("According to Huxiu, ...") and on the English site, so English readers never see 虎嗅 or 매일경제.
// Shared with the website (imported from src/). Add a line when a new CJK-named source is added.
export const SOURCE_EN: Record<string, string> = {
  "36氪": "36Kr", "爱范儿": "ifanr", "机核": "Gcores", "极客公园": "GeekPark", "钛媒体": "TMTPost", "新浪体育": "Sina Sports",
  "游研社": "YYSTV", "量子位": "QbitAI", "澎湃新闻": "The Paper", "中国新闻网 文化": "China News Service", "中国新闻网": "China News Service",
  "国家统计局": "National Bureau of Statistics of China", "虎嗅": "Huxiu", "界面新闻 商业": "Jiemian", "21世纪经济报道": "21st Century Business Herald",
  "界面新闻 财经": "Jiemian", "界面新闻": "Jiemian", "中国新闻网 体育": "China News Service", "中国新闻网 财经": "China News Service",
  "财富中文网 商业": "Fortune China", "财富中文网": "Fortune China", "财新": "Caixin", "雷峰网": "Leiphone", "华尔街见闻": "Wallstreetcn",
  "央视财经": "CCTV Finance", "经济日报": "Economic Daily", "人民网": "People's Daily Online", "新华社": "Xinhua", "IT之家": "IT Home",
  "BBC 中文": "BBC Chinese", "NHK 経済": "NHK", "日经中文网": "Nikkei Chinese", "任天堂 (Nintendo)": "Nintendo", "매일경제": "Maeil Business Newspaper",
  "联合早报": "Lianhe Zaobao", "华尔街日报中文网": "WSJ Chinese", "纽约时报中文网": "NYT Chinese",
};

export const sourceEn = (name?: string | null) => (name ? SOURCE_EN[name] ?? name : name ?? "");

/** Swap outlet names in English text for their English names (longest first, so "中国新闻网 财经" beats "中国新闻网"). */
export function enSources(text: string): string {
  let t = text;
  for (const k of Object.keys(SOURCE_EN).sort((a, b) => b.length - a.length)) if (t.includes(k)) t = t.split(k).join(SOURCE_EN[k]);
  return t;
}
