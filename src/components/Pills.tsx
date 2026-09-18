import type { Status } from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import { STATUS } from "@/lib/ui";

const STATUS_ZH: Record<string, string> = { rumor: "传闻", breaking: "突发", developing: "进展中", confirmed: "已证实", resolved: "已结束", archived: "已归档" };

export function StatusPill({ status, lang = "en" }: { status: Status; lang?: Lang }) {
  const s = STATUS[status];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${s.cls}`}>{lang === "zh" ? STATUS_ZH[status] : s.label}</span>;
}
export function CategoryLabel({ category, lang = "en" }: { category: string; lang?: Lang }) {
  const zh = category === "economy" ? "经济" : "科技";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${category === "economy" ? "bg-[#ECFDF5] text-[#0F766E]" : "bg-[#F3F0FF] text-[#6D28D9]"}`}>{lang === "zh" ? zh : category}</span>;
}
