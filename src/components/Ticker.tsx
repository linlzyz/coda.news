import Link from "next/link";
import { latestUpdates } from "@/lib/data";
import { t, type Lang } from "@/lib/i18n";

export async function Ticker({ lang }: { lang: Lang }) {
  const items = await latestUpdates(14);
  if (!items.length) return null;
  const seen = new Set<string>();
  const row = items.filter((u) => (seen.has(u.events.slug) ? false : (seen.add(u.events.slug), true))).map((u) => (
    <Link key={u.id} href={`/event/${u.events.slug}`} className="inline-flex items-center gap-2 px-5 text-[13px] text-neutral-700 hover:text-[#C2410C]">
      <span className="text-neutral-300">/</span>{lang === "zh" ? u.events.title_zh || u.events.title : u.content.text}
    </Link>
  ));
  return (
    <div className="border-b border-[#E6E6E6]">
      <div className="mx-auto flex max-w-[1240px] items-center gap-2 px-4 sm:px-6">
        <span className="inline-flex shrink-0 items-center gap-1.5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C2410C]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#EA5514]" />{t(lang, "live")}</span>
        <div className="ticker relative overflow-hidden py-2 whitespace-nowrap">
          <div className="ticker-track inline-flex">{row}{row}</div>
        </div>
      </div>
    </div>
  );
}
