import type { EventRow, Perspective } from "./data";
import type { Lang } from "./i18n";
import { COUNTRY_ZH } from "./i18n";
import { COUNTRY } from "./ui";

export const title = (e: EventRow, l: Lang) => (l === "zh" && e.title_zh) || e.title;
export const summary = (e: EventRow, l: Lang) => (l === "zh" && e.summary_zh) || e.summary;
export const countryL = (c: string, l: Lang) => (l === "zh" ? COUNTRY_ZH[c] : COUNTRY[c]) ?? c;
export const persp = (p: Perspective, l: Lang) => l === "zh"
  ? { headline: p.headline_zh || p.headline, framing: p.framing_zh || p.framing, emphasis: p.emphasis_zh || p.emphasis, downplayed: p.downplayed_zh || p.downplayed }
  : { headline: p.headline, framing: p.framing, emphasis: p.emphasis, downplayed: p.downplayed };
export function timeAgoL(iso: string, l: Lang) {
  const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
  if (l === "zh") return s < 3600 ? `${Math.round(s / 60)} 分钟前` : s < 86400 ? `${Math.round(s / 3600)} 小时前` : `${Math.round(s / 86400)} 天前`;
  return s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} d ago`;
}
