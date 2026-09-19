import Link from "@/components/LLink";
import type { Company, EventRow, Topic } from "@/lib/data";
import { type Lang } from "@/lib/i18n";
import { timeAgoL, title } from "@/lib/loc";
import { Cover } from "./Cover";
import { Flag, Flags } from "./Flag";
import { CategoryLabel } from "./Pills";

const oneSource = (e: EventRow) => e.source_count < 2 && !!e.lead_url && !!e.lead_source;

/** One row of the Latest list. Every row has the same shape: one sentence, then category · time on the left and flags + source on the right.
 *  One-source stories link straight to the original; stories with more sources open our comparison page. */
export function NewsItem({ e, lang }: { e: EventRow; companies?: Map<number, Company>; topics?: Map<number, Topic>; lang: Lang }) {
  const zh = lang === "zh";
  const single = oneSource(e);
  const t = title(e, lang).replace(/[。.]$/, "");
  return (
    <article className="border-b border-[#E5E7EB] py-4">
      <p className="text-[16px] leading-snug text-[#16181D]">
        {single ? (
          <a href={e.lead_url!} target="_blank" rel="noopener noreferrer" className="hover:text-[#C2410C]">
            {zh ? <>据 <span className="font-semibold">{e.lead_source}</span> 报道，{t}。</> : <><span className="font-semibold">{e.lead_source}</span> reports: {t}.</>}
          </a>
        ) : (
          <Link href={`/event/${e.slug}`} className="font-semibold hover:text-[#C2410C]">{t}</Link>
        )}
      </p>
      <Meta e={e} lang={lang} />
    </article>
  );
}

function Meta({ e, lang }: { e: EventRow; lang: Lang }) {
  const zh = lang === "zh";
  const single = oneSource(e);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-neutral-500">
      <CategoryLabel category={e.category} lang={lang} />
      <span>{timeAgoL(e.last_article_at, lang)}</span>
      <span className="ml-auto inline-flex items-center gap-2">
        {single ? (
          <>
            {e.countries[0] && <Flag code={e.countries[0]} size={11} />}
            <span>{e.lead_source}</span><span aria-hidden>·</span>
            <a href={e.lead_url!} target="_blank" rel="noopener noreferrer" className="font-medium text-[#C2410C] hover:underline">{zh ? "查看原文" : "Read original"} ↗</a>
          </>
        ) : (
          <>
            {e.countries.length > 0 && <Flags codes={e.countries} max={5} size={11} />}
            <Link href={`/event/${e.slug}`} className="font-medium text-[#C2410C] hover:underline">{e.source_count} {zh ? "个来源" : "sources"} →</Link>
          </>
        )}
      </span>
    </div>
  );
}

/** The few stories worth a picture: several sources, important, with a proper image. */
export function pickFeatured(events: EventRow[], n: number, skip: Set<number> = new Set()): EventRow[] {
  return events
    .filter((e) => !skip.has(e.id) && e.source_count >= 2 && e.image_url && Date.now() - Date.parse(e.last_article_at) < 48 * 3600_000)
    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0) || b.countries.length - a.countries.length || b.source_count - a.source_count)
    // the top few by importance, then real photos ahead of logos so the row is not four logos
    .slice(0, n * 3)
    .sort((a, b) => Number(a.image_focus === "logo") - Number(b.image_focus === "logo"))
    .slice(0, n);
}

export function FeaturedCards({ events, lang, heading }: { events: EventRow[]; lang: Lang; heading: string }) {
  if (!events.length) return null;
  return (
    <section>
      <h2 className="border-b border-[#E5E7EB] py-3 text-[22px] font-semibold tracking-[-0.02em]">{heading}</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        {events.map((e) => (
          <article key={e.id} className="min-w-0">
            <Link href={`/event/${e.slug}`} className="group block">
              <Cover e={e} className="aspect-[16/9] w-full rounded-2xl" />
              <h3 className="mt-3 text-[18px] font-semibold leading-snug tracking-[-0.015em] text-[#16181D] group-hover:text-[#C2410C]">{title(e, lang)}</h3>
            </Link>
            <Meta e={e} lang={lang} />
          </article>
        ))}
      </div>
    </section>
  );
}
