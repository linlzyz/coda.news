import type { Status } from "@/lib/data";
import type { Lang } from "@/lib/i18n";

const STATUS_EN: Record<string, string> = { rumor: "Rumor", breaking: "Breaking", developing: "Developing", confirmed: "Confirmed", resolved: "Resolved", archived: "Archived" };
const STATUS_ZH: Record<string, string> = { rumor: "传闻", breaking: "突发", developing: "进展中", confirmed: "已证实", resolved: "已结束", archived: "已归档" };

/** Status as plain small text, no badge. Breaking gets the accent colour. */
export function StatusPill({ status, lang = "en" }: { status: Status; lang?: Lang }) {
  return <span className={`text-[12px] ${status === "breaking" ? "font-semibold text-[#C2410C]" : "text-neutral-500"}`}>{(lang === "zh" ? STATUS_ZH : STATUS_EN)[status]}</span>;
}
/** Category capsule (outline). */
export function CategoryLabel({ category, lang = "en" }: { category: string; lang?: Lang }) {
  const label = lang === "zh" ? (category === "economy" ? "经济" : "科技") : category;
  return <span className="inline-flex items-center rounded-full border border-[#111111] px-2.5 py-[1px] text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#111111]">{label}</span>;
}
