import Link from "next/link";
import type { EventRow } from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import { summary, timeAgoL, title } from "@/lib/loc";
import { Cover } from "./Cover";
import { Flags } from "./Flag";
import { CategoryLabel, StatusPill } from "./Pills";

export function Meta({ e, lang }: { e: EventRow; lang: Lang }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-neutral-500">
      <CategoryLabel category={e.category} lang={lang} />
      <span>{timeAgoL(e.last_article_at, lang)}</span>
      <StatusPill status={e.status} lang={lang} />
    </div>
  );
}

export function Coverage({ e, lang }: { e: EventRow; lang: Lang }) {
  if (!e.countries.length) return null;
  return (
    <div className="flex items-center gap-2 text-[12px] text-neutral-500">
      <Flags codes={e.countries} max={6} size={10} />
      <span>{e.countries.length} {lang === "zh" ? "个国家" : e.countries.length === 1 ? "country" : "countries"} · {e.source_count} {lang === "zh" ? "个来源" : e.source_count === 1 ? "source" : "sources"}</span>
    </div>
  );
}

/** Grid story: image on top, text below. */
export function StoryCard({ e, lang, iconName }: { e: EventRow; lang: Lang; iconName?: string }) {
  return (
    <article className="group">
      <Link href={`/event/${e.slug}`} className="block"><Cover e={e} iconName={iconName} className="aspect-[3/2] w-full" /></Link>
      <div className="mt-3"><Meta e={e} lang={lang} /></div>
      <h3 className="mt-2 text-[17px] font-semibold leading-snug tracking-[-0.015em]">
        <Link href={`/event/${e.slug}`} className="hover:text-[#C2410C]">{title(e, lang)}</Link>
      </h3>
      {summary(e, lang) && <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-neutral-600">{summary(e, lang)}</p>}
      <div className="mt-2.5"><Coverage e={e} lang={lang} /></div>
    </article>
  );
}

/** List row: text left, small image right. */
export function StoryRow({ e, lang, iconName }: { e: EventRow; lang: Lang; iconName?: string }) {
  return (
    <article className="grid grid-cols-[minmax(0,1fr)_120px] gap-5 border-b border-[#E6E6E6] py-5 sm:grid-cols-[minmax(0,1fr)_200px]">
      <div className="min-w-0">
        <Meta e={e} lang={lang} />
        <h3 className="mt-2 text-[18px] font-semibold leading-snug tracking-[-0.015em]">
          <Link href={`/event/${e.slug}`} className="hover:text-[#C2410C]">{title(e, lang)}</Link>
        </h3>
        {summary(e, lang) && <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-neutral-600">{summary(e, lang)}</p>}
        <div className="mt-2.5"><Coverage e={e} lang={lang} /></div>
      </div>
      <Link href={`/event/${e.slug}`} className="block"><Cover e={e} iconName={iconName} className="aspect-[3/2] w-full" /></Link>
    </article>
  );
}
