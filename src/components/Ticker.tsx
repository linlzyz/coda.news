import Link from "next/link";
import { latestUpdates } from "@/lib/data";

/** Scrolling strip of the newest facts added to the knowledge base. */
export async function Ticker() {
  const items = await latestUpdates(12);
  if (!items.length) return null;
  const row = items.map((u) => (
    <Link key={u.id} href={`/event/${u.events.slug}`} className="inline-flex items-center gap-2 px-6 text-sm text-slate-700 hover:text-[#EA5514]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#EA5514]" />{u.content.text}
    </Link>
  ));
  return (
    <div className="border-b border-[#D6E2F5] bg-[#FFFFFF]">
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 sm:px-6">
        <span className="shrink-0 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#EA5514]">Live</span>
        <div className="ticker relative overflow-hidden py-2.5 whitespace-nowrap">
          <div className="ticker-track inline-flex">{row}{row}</div>
        </div>
      </div>
    </div>
  );
}
