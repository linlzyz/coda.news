import Link from "@/components/LLink";
import type { Company, EventRow, Topic } from "@/lib/data";
import { hotness } from "@/lib/data";
import { type Lang } from "@/lib/i18n";
import { summary, timeAgoL, title } from "@/lib/loc";
import { Cover } from "./Cover";
import { Flag, Flags } from "./Flag";
import { CategoryLabel } from "./Pills";

const oneSource = (e: EventRow) => e.source_count < 2 && !!e.lead_url && !!e.lead_source;

/** One row of the Latest list. Every row has the same shape: one sentence, then category · time on the left and flags + source on the right.
 *  One-source stories open in place; stories with more sources open our comparison page. */
export function NewsItem({ e, companies, lang }: { e: EventRow; companies?: Map<number, Company>; topics?: Map<number, Topic>; lang: Lang }) {
  const single = oneSource(e);
  const sum = summary(e, lang);
  // one-source rows: title opens the original, our picture and key points sit in the row; multi-source rows open our comparison page
  if (single) return <SingleItem e={e} companies={companies} lang={lang} sum={sum} />;
  return (
    <article className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-[#E5E7EB] py-4">
      <div className="min-w-0">
        <h3 className="text-[16px] font-semibold leading-snug text-[#16181D]">
          <Link href={`/event/${e.slug}`} className="hover:text-[#C2410C]">{title(e, lang)}</Link>
        </h3>
        {sum && <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-neutral-600">{sum}</p>}
        <div className="mt-2 flex items-center gap-2 text-[12px] text-neutral-500">
          <CategoryLabel category={e.category} lang={lang} />
          <span>{timeAgoL(e.last_article_at, lang)}</span>
        </div>
      </div>
      <Source e={e} lang={lang} />
    </article>
  );
}

/** One-source stories have no page of their own: the title opens the original, and whatever we have (picture, AI key points) sits right in the row.
 *  Same right-hand column as every other row, so all rows line up. */
function SingleItem({ e, companies, lang, sum }: { e: EventRow; companies?: Map<number, Company>; lang: Lang; sum: string | null }) {
  const zh = lang === "zh";
  const pts = (zh ? e.points?.zh : e.points?.en)?.filter(Boolean) ?? [];
  const cos = e.company_ids.map((id) => companies?.get(id)).filter(Boolean) as Company[];
  const logo = e.image_focus === "logo";
  const photo = !!e.image_url && !logo;
  return (
    <article className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-[#E5E7EB] py-4">
      <div className="min-w-0">
        <h3 className="text-[16px] font-semibold leading-snug text-[#16181D]">
          <a href={e.lead_url!} target="_blank" rel="noopener noreferrer" className="hover:text-[#C2410C]">{title(e, lang)}</a>
        </h3>
        {!pts.length && sum && <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-neutral-600">{sum}</p>}
        <div className="mt-2 flex items-center gap-2 text-[12px] text-neutral-500">
          <CategoryLabel category={e.category} lang={lang} />
          <span>{timeAgoL(e.last_article_at, lang)}</span>
        </div>
        {photo && (
          <a href={e.lead_url!} target="_blank" rel="noopener noreferrer" className="mt-3 block overflow-hidden rounded-xl">
            <Cover e={e} credit className="aspect-[16/9] w-full" />
          </a>
        )}
        {pts.length > 0 && (
          <div className={`mt-3 ${logo && e.image_url ? "flex items-start gap-3" : ""}`}>
            {logo && e.image_url && <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#E5E7EB] sm:h-16 sm:w-16"><Cover e={e} className="h-full w-full" /></div>}
            {/* our own AI summary, boxed and labelled so it is never mistaken for the outlet's text */}
            <div className="min-w-0 flex-1 rounded-xl border border-[#FBD9C6] bg-[#FFF6F0] px-4 py-3">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#C2410C]">{zh ? "coda.news AI 摘要" : "coda.news AI summary"}</div>
              <ul className="space-y-1 text-[14px] leading-relaxed text-neutral-800">
                {pts.map((p, k) => <li key={k} className="flex gap-2"><span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-neutral-400" />{p}</li>)}
              </ul>
            </div>
          </div>
        )}
        {cos.length > 0 && (pts.length > 0 || photo) && (
          <div className="mt-2.5 flex flex-wrap gap-1.5 text-[12px]">
            {cos.map((c) => <Link key={c.id} href={`/company/${c.slug}`} className="rounded-full bg-[#FFF1EA] px-2.5 py-0.5 font-medium text-[#C2410C] hover:bg-[#FFE3D4]">{c.name}</Link>)}
          </div>
        )}
      </div>
      <Source e={e} lang={lang} />
    </article>
  );
}

/** Right-hand column, the same on every card: flags on top, then the source line. */
function Source({ e, lang }: { e: EventRow; lang: Lang }) {
  const zh = lang === "zh";
  const single = oneSource(e);
  return (
    <div className="flex w-[108px] shrink-0 flex-col items-end gap-1.5 pt-1 text-right text-[12px] text-neutral-500">
      <span className="flex h-3 items-center">{single ? (e.countries[0] && <Flag code={e.countries[0]} size={11} />) : e.countries.length > 0 && <Flags codes={e.countries} max={4} size={11} />}</span>
      {single ? (
        <>
          <span className="max-w-full truncate">{e.lead_source}</span>
          <a href={e.lead_url!} target="_blank" rel="noopener noreferrer" className="font-medium text-[#C2410C] hover:underline">{zh ? "阅读原文" : "Read original"} ↗</a>
        </>
      ) : (
        <Link href={`/event/${e.slug}`} className="font-medium text-[#C2410C] hover:underline">{e.source_count} {zh ? "个来源" : "sources"} →</Link>
      )}
    </div>
  );
}

function Meta({ e, lang }: { e: EventRow; lang: Lang }) {
  return (
    <div className="mt-2 flex items-end justify-between gap-3 text-[12px] text-neutral-500">
      <span className="flex items-center gap-2"><CategoryLabel category={e.category} lang={lang} /><span>{timeAgoL(e.last_article_at, lang)}</span></span>
      <Source e={e} lang={lang} />
    </div>
  );
}

/** Picks: the most important stories covered by several sources (a photo helps but is not required),
 *  plus a couple of magazine reads (travel, fashion, design) so the picks are not all hard news. */
export function pickFeatured(events: EventRow[], n: number, skip: Set<number> = new Set()): EventRow[] {
  const fresh = (e: EventRow, h: number) => Date.now() - Date.parse(e.last_article_at) < h * 3600_000;
  // pinned by the editor: always first, as long as the pin is under 3 days old
  const pinned = events.filter((e) => !skip.has(e.id) && e.pinned_at && Date.now() - Date.parse(e.pinned_at) < 72 * 3600_000)
    .sort((a, b) => Date.parse(b.pinned_at!) - Date.parse(a.pinned_at!));
  pinned.forEach((e) => skip.add(e.id));
  const broke = (e: EventRow, h: number) => Date.now() - Date.parse(e.started_at) < h * 3600_000;
  const news = events
    .filter((e) => !skip.has(e.id) && e.source_count >= 2 && broke(e, 48) && !!e.image_url && e.image_focus !== "logo")   // no picture, no Picks slot
    .sort((a, b) => hotness(b) - hotness(a) || b.countries.length - a.countries.length || b.source_count - a.source_count)
    .slice(0, n);
  const mags = events
    .filter((e) => !skip.has(e.id) && !news.includes(e) && ["travel", "fashion"].includes(e.category) && e.summary && fresh(e, 72) && !!e.image_url && e.image_focus !== "logo")
    .sort((a, b) => Number(!!b.image_url) - Number(!!a.image_url) || (b.importance ?? 0) - (a.importance ?? 0))
    .slice(0, Math.max(1, Math.round(n / 2)));
  // one-source stories with an official picture (the publisher's own image or game art, not a logo) are worth a look too
  const official = events
    .filter((e) => !skip.has(e.id) && !news.includes(e) && !mags.includes(e) && oneSource(e) && !!e.image_url && e.image_focus !== "logo" && fresh(e, 36))
    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0) || Date.parse(b.last_article_at) - Date.parse(a.last_article_at));
  return [...pinned, ...news, ...mags].slice(0, Math.max(n + Math.round(n / 2), pinned.length)).concat(official);
}

export function FeaturedCards({ events, lang, heading }: { events: EventRow[]; lang: Lang; heading: string }) {
  if (!events.length) return null;
  return (
    <section>
      <h2 className="border-b border-[#E5E7EB] py-3 text-[22px] font-semibold tracking-[-0.02em]">{heading}</h2>
      <div>
        {events.map((e) => { const Go = ({ children, className }: { children: React.ReactNode; className?: string }) => oneSource(e)
            ? <a href={e.lead_url!} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
            : <Link href={`/event/${e.slug}`} className={className}>{children}</Link>;
          return (
          e.image_url ? <article key={e.id} className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 border-b border-[#E5E7EB] py-4 sm:grid-cols-[240px_minmax(0,1fr)] sm:gap-5 sm:py-5">
            <Go className="block"><Cover e={e} className="aspect-[4/3] w-full rounded-xl sm:aspect-auto sm:h-[150px] sm:rounded-2xl" /></Go>
            <div className="flex min-w-0 flex-col">
              <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.015em] text-[#16181D] sm:text-[19px]">
                <Go className="hover:text-[#C2410C]">{title(e, lang)}</Go>
              </h3>
              {summary(e, lang) && <p className="mt-1.5 hidden text-[14px] leading-relaxed text-neutral-600 sm:line-clamp-2">{summary(e, lang)}</p>}
              <div className="mt-auto"><Meta e={e} lang={lang} /></div>
            </div>
          </article> : (
          // no suitable picture: a text card, same weight, orange rule instead of a photo
          <article key={e.id} className="border-b border-[#E5E7EB] py-4 sm:py-5">
            <div className="border-l-4 border-[#EA5514] pl-4 sm:pl-5">
              <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.015em] text-[#16181D] sm:text-[19px]"><Go className="hover:text-[#C2410C]">{title(e, lang)}</Go></h3>
              {summary(e, lang) && <p className="mt-1.5 line-clamp-3 text-[14px] leading-relaxed text-neutral-600">{summary(e, lang)}</p>}
              <Meta e={e} lang={lang} />
            </div>
          </article>
        )); })}
      </div>
    </section>
  );
}

/** Magazine layout (travel): every story as a picture card in a grid. */
export function MagazineGrid({ events, lang }: { events: EventRow[]; lang: Lang }) {
  const zh = lang === "zh";
  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((e) => {
        const single = oneSource(e);
        const href = `/event/${e.slug}`;
        return (
          <article key={e.id} className="group min-w-0">
            <Link href={href} className="block"><Cover e={e} className="aspect-[4/3] w-full rounded-2xl" /></Link>
            <div className="mt-3 flex items-center gap-2 text-[12px] text-neutral-500">
              {e.countries[0] && <Flag code={e.countries[0]} size={10} />}
              <span className="truncate">{single ? e.lead_source : zh ? `${e.source_count} 个来源` : `${e.source_count} sources`}</span>
              <span aria-hidden>·</span><span className="shrink-0">{timeAgoL(e.last_article_at, lang)}</span>
            </div>
            <h3 className="mt-1.5 text-[19px] font-semibold leading-snug tracking-[-0.015em] text-[#16181D]"><Link href={href} className="hover:text-[#C2410C]">{title(e, lang)}</Link></h3>
            {summary(e, lang) && <p className="mt-1.5 line-clamp-3 text-[14px] leading-relaxed text-neutral-600">{summary(e, lang)}</p>}
            {single && <a href={e.lead_url!} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[13px] font-medium text-[#C2410C] hover:underline">{zh ? "查看原文" : "Read original"} ↗</a>}
          </article>
        );
      })}
    </div>
  );
}
