import Link from "next/link";
import { latestUpdates } from "@/lib/data";
import { t, type Lang } from "@/lib/i18n";

export async function Ticker({ lang }: { lang: Lang }) {
  const items = await latestUpdates(14);
  if (!items.length) return null;
  const seen = new Set<string>();
  const row = items.filter((u) => (seen.has(u.events.slug) ? false : (seen.add(u.events.slug), true))).map((u) => (
    <Link key={u.id} href={`/event/${u.events.slug}`} className="inline-flex items-center gap-2 px-6 text-[13px] text-slate-700 hover:text-[#1560BD]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#1560BD]" />{lang === "zh" ? u.events.title_zh || u.events.title : u.content.text}
    </Link>
  ));
  return (
    <div className="border-b border-[#DDE6F1] bg-white">
      <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8">
        <span className="shrink-0 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1560BD]">{t(lang, "live")}</span>
        <div className="ticker relative overflow-hidden py-2.5 whitespace-nowrap">
          <div className="ticker-track inline-flex">{row}{row}</div>
        </div>
      </div>
    </div>
  );
}
