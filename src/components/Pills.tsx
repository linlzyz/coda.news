import type { Status } from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import { STATUS } from "@/lib/ui";

const STATUS_ZH: Record<string, string> = { rumor: "传闻", breaking: "突发", developing: "进展中", confirmed: "已证实", resolved: "已结束", archived: "已归档" };

export function StatusPill({ status, lang = "en" }: { status: Status; lang?: Lang }) {
  const s = STATUS[status];
  return <span className={`text-[12px] ${status === "breaking" ? "font-semibold text-[#C2410C]" : "text-neutral-500"}`}>{lang === "zh" ? STATUS_ZH[status] : s.label}</span>;
}
export function CategoryLabel({ category, lang = "en" }: { category: string; lang?: Lang }) {
  const zh = category === "economy" ? "经济" : "科技";
  return <span className="inline-flex items-center rounded-full border border-[#16181D] px-2.5 py-[1px] text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#16181D]">{lang === "zh" ? zh : category}</span>;
}
