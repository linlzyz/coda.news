import type { Status } from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import { STATUS } from "@/lib/ui";

const STATUS_ZH: Record<string, string> = { rumor: "传闻", breaking: "突发", developing: "进展中", confirmed: "已证实", resolved: "已结束", archived: "已归档" };

export function StatusPill({ status, lang = "en" }: { status: Status; lang?: Lang }) {
  const s = STATUS[status];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${s.cls}`}>{lang === "zh" ? STATUS_ZH[status] : s.label}</span>;
}
const CAT: Record<string, [string, string]> = {
  technology: ["科技", "bg-[#F3F0FF] text-[#6D28D9]"], economy: ["经济", "bg-[#ECFDF5] text-[#0F766E]"],
  sport: ["体育", "bg-[#EFF6FF] text-[#1D4ED8]"], entertainment: ["娱乐", "bg-[#FDF2F8] text-[#BE185D]"], fashion: ["时尚", "bg-[#FEF3C7] text-[#92400E]"], travel: ["旅行", "bg-[#E0F2FE] text-[#0369A1]"], automotive: ["汽车", "bg-[#F1F5F9] text-[#334155]"], gaming: ["游戏", "bg-[#EEF2FF] text-[#4338CA]"],
};
export function CategoryLabel({ category, lang = "en" }: { category: string; lang?: Lang }) {
  const [zh, cls] = CAT[category] ?? CAT.technology;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${cls}`}>{lang === "zh" ? zh : category}</span>;
}
