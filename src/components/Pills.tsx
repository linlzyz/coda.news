import type { Status } from "@/lib/data";
import { STATUS } from "@/lib/ui";

export function StatusPill({ status }: { status: Status }) {
  const s = STATUS[status];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${s.cls}`}>{s.label}</span>;
}
export function CategoryLabel({ category }: { category: string }) {
  return <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${category === "economy" ? "text-[#9A5B00]" : "text-[#5B3FD9]"}`}>{category}</span>;
}
