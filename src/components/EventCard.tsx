import Link from "@/components/LLink";
import type { EventRow } from "@/lib/data";
import { timeAgo } from "@/lib/ui";
import { Flags } from "./Flag";
import { CategoryLabel, StatusPill } from "./Pills";

export function EventMeta({ e, dark }: { e: EventRow; dark?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs ${dark ? "text-neutral-300" : "text-neutral-500"}`}>
      <StatusPill status={e.status} />
      <span>{e.source_count} {e.source_count === 1 ? "source" : "sources"}</span>
      {e.countries.length > 0 && <span className="inline-flex items-center gap-1.5">{e.countries.length} {e.countries.length === 1 ? "country" : "countries"} <Flags codes={e.countries} max={6} /></span>}
      {e.has_official && <span className={`font-medium ${dark ? "text-white" : "text-neutral-700"}`}>Official source</span>}
    </div>
  );
}

/** Text-first card. The image is decoration, shown only when a legal one exists. */
export function EventCard({ e }: { e: EventRow }) {
  return (
    <article className="group grid grid-cols-[minmax(0,1fr)_auto] gap-5 border-b border-[#E5E7EB] py-5">
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-2 text-xs text-neutral-500"><CategoryLabel category={e.category} /><span>· {timeAgo(e.last_article_at)}</span></div>
        <h3 className="text-[19px] font-semibold leading-snug tracking-[-0.01em] text-[#16181D]">
          <Link href={`/event/${e.slug}`} className="hover:text-[#EA5514]">{e.title}</Link>
        </h3>
        {e.summary && <p className="line-clamp-2 text-[15px] leading-relaxed text-neutral-600">{e.summary}</p>}
        <EventMeta e={e} />
      </div>
      {e.image_url && (
        <Link href={`/event/${e.slug}`} className="hidden sm:block"><img src={e.image_url} alt="" className="h-28 w-44 rounded-xl object-cover" loading="lazy" /></Link>
      )}
    </article>
  );
}

export function EventMini({ e }: { e: EventRow }) {
  return (
    <Link href={`/event/${e.slug}`} className="block rounded-xl p-3 hover:bg-neutral-50">
      <div className="text-[15px] font-semibold leading-snug text-[#16181D]">{e.title}</div>
      <div className="mt-1.5 flex items-center gap-2 text-xs text-neutral-500"><Flags codes={e.countries} max={6} size={11} /><span>{e.source_count} sources</span></div>
    </Link>
  );
}
