import { dayLabel } from "@/lib/loc";
import { orgLd } from "@/lib/site";
import Link from "@/components/LLink";
import { allTopics, hotness, newProducts, pinnedEvents, officialPicks, companyMap, indices, getPerspectives, listEvents, oneUsePerImage, trendingCompanies, type EventRow, type Perspective } from "@/lib/data";
import { crypto, fx } from "@/lib/markets";
import { Cover } from "@/components/Cover";
import { Flag, Flags } from "@/components/Flag";
import { Icon } from "@/components/Icons";
import { Markets } from "@/components/Markets";
import { FeaturedCards, NewsItem, pickFeatured } from "@/components/NewsItem";
import { HeroCarousel } from "@/components/HeroCarousel";
import { Newsletter } from "@/components/Newsletter";
import { TopicsGrid } from "@/components/TopicsGrid";
import { NewProducts } from "@/components/NewProducts";
import { AnatomyBox } from "@/components/anatomy/Promo";
import { Ticker } from "@/components/Ticker";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Feed } from "@/components/Feed";
import { alternates, langFrom, t, type Lang } from "@/lib/i18n";
import { countryL, persp as perspL, summary, timeAgoL, title } from "@/lib/loc";
import { CategoryLabel } from "@/components/Pills";


export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  return { alternates: alternates("/", l), ...(l === "zh" ? { title: "coda.news · 一件事，每一种视角", description: "科技与经济大事，以及世界各国媒体如何报道。" } : {}) };
}

export const revalidate = 3600;

export default async function Home({ params }: PageProps<"/[lang]">) {
  const CATS = ["economy", "technology", "sport", "entertainment", "fashion", "automotive", "gaming"] as const;
  const [events, pinnedList, official, topics, trending, cq, fq, ...byCat] = await Promise.all([
    listEvents({ limit: 60, sinceHours: 72 }), pinnedEvents(), officialPicks(), allTopics(), trendingCompanies(10), crypto(), fx(),
    // each tab gets its own list, same as its section page (the main list is dominated by the biggest economy/tech stories)
    ...CATS.map((c) => listEvents({ category: c, limit: 6 })),   // only for the picks (magazine reads)
  ]);
  const [iq, rq, cnq] = await Promise.all([indices("indices"), indices("rates"), indices("cn")]);
  const launches = await newProducts().catch(() => [] as EventRow[]);
  const l = await langFrom(params);
  const persp = await getPerspectives(events.map((e) => e.id));
  const companies = await companyMap(events);
  const topicMap = new Map(topics.map((t) => [t.id, t]));
  // ranked by importance that halves every day since the story broke, so the top changes day to day
  const multi = events.filter((e) => (persp.get(e.id)?.length ?? 0) >= 2).sort((a, b) => hotness(b) - hotness(a));
  // headline: multi-country stories that broke in the last 36 hours come first
  // today's stories (Melbourne) first; only if there are none yet (just after midnight) the last 36 hours
  const melDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });
  // a story also counts as today's when an editor pinned it today, or when an older story breaks again in a big way
  // (e.g. a teaser from last week becomes today's launch: 8+ sources, 4+ countries, new reports in the last 24 h)
  const today = melDay(new Date());
  const breaksToday = (e: EventRow) => melDay(new Date(e.started_at)) === today || (!!e.pinned_at && melDay(new Date(e.pinned_at)) === today)
    || (Date.now() - Date.parse(e.last_article_at) < 24 * 3600_000 && e.source_count >= 8 && e.countries.length >= 4);
  const todays = [...multi.filter((e) => e.pinned_at && melDay(new Date(e.pinned_at)) === today), ...multi.filter(breaksToday)].filter((e, k, a) => a.findIndex((x) => x.id === e.id) === k);
  const fresh = todays.length ? todays : multi.filter((e) => Date.now() - Date.parse(e.started_at) < 36 * 3600_000);
  const top = fresh[0] ?? multi[0] ?? events[0];
  // the headline slot turns through up to five multi-country stories (the ones that show what coda.news is for)
  // a mix of sections: one story per section first, then a second from any section, never all football on a Sunday
  // only stories with a real picture go up here; the rest stay in the Latest list
  const pic = (e?: EventRow) => !!e?.image_url && e.image_focus !== "logo";
  const all = [top, ...[...fresh, ...(todays.length ? [] : multi)].filter((e, k, a) => e.id !== top?.id && a.findIndex((x) => x.id === e.id) === k)].filter(Boolean) as EventRow[];
  const pool = all.some(pic) ? all.filter(pic) : all;
  const tops: EventRow[] = [];
  for (const cap of [1, 2]) for (const e of pool) {
    if (tops.length >= 5) break;
    if (!tops.includes(e) && tops.filter((x) => x.category === e.category).length < cap) tops.push(e);
  }
  const divided = multi.filter((e) => !tops.some((x) => x.id === e.id))
    .sort((a, b) => new Set((persp.get(b.id) ?? []).map((p) => p.tone)).size - new Set((persp.get(a.id) ?? []).map((p) => p.tone)).size).slice(0, 4);
  // 4 key stories with pictures up top (picked for importance and sources, not for having a photo); everything else is the uniform Latest list
  const topImages = new Set(tops.map((e) => e.image_url).filter(Boolean) as string[]);
  const key = pickFeatured(oneUsePerImage([...pinnedList, ...events, ...byCat.flat(), ...official].filter((e, i, a) => a.findIndex((x) => x.id === e.id) === i), topImages), 4, new Set(tops.map((e) => e.id)));   // 4 news + 2 magazine reads
  const keyIds = new Set([...tops.map((e) => e.id), ...key.map((e) => e.id)]);
  const list = events.filter((e) => !keyIds.has(e.id)).sort((a, b) => Date.parse(b.last_article_at) - Date.parse(a.last_article_at)).slice(0, 30);
  const regionTags = (e: { regions?: string[] }) => (e.regions?.length ?? 0) > 2 ? [] : [...(e.regions?.includes("AU") ? ["australia"] : []), ...(e.regions?.includes("CN") ? ["china"] : [])];
  const updated = "";

  const siteLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebSite", name: "coda.news", url: "https://coda.news", publisher: { "@id": "https://coda.news/#org" },
      potentialAction: { "@type": "SearchAction", target: "https://coda.news/search?q={q}", "query-input": "required name=q" } },
    { "@id": "https://coda.news/#org", ...orgLd },
  ] };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }} />
      <AutoRefresh />
      <Ticker lang={l} />
      <div className="grid gap-8 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-7">
          {top ? <HeroCarousel label={t(l, "topStory")}>{tops.map((e) => <Hero key={e.id} e={e} perspectives={persp.get(e.id) ?? []} l={l} />)}</HeroCarousel> : <p className="rounded-3xl border border-dashed border-[#E5E7EB] p-10 text-center text-neutral-500">{t(l, "first")}</p>}

          {trending.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#FFF0EB] px-3.5 py-2 text-[13px] font-semibold text-[#C2410C]"><Icon name="flame" size={15} />{t(l, "trending")}</span>
              {trending.map((c) => <Link key={c.id} href={`/company/${c.slug}`} className="shrink-0 rounded-full border border-[#E5E7EB] bg-white px-3.5 py-2 text-[13px] font-medium hover:border-[#F0A57F]">{c.name}</Link>)}
            </div>
          )}

          <FeaturedCards events={key} lang={l} heading={t(l, "keyStories")} />

          <NewProducts events={launches.filter((e) => !tops.some((x) => x.id === e.id) && !key.some((x) => x.id === e.id))} lang={l} />

          <Feed title={t(l, "latest")} note={t(l, "updateNote")} more={t(l, "loadMore")} disclaimer={t(l, "disclaimer")}
            tabs={(["all", "australia", "china", "economy", "technology", "sport", "entertainment", "fashion", "automotive", "gaming"] as const).map((k) => [t(l, k), k === "all" ? undefined : k])}
            links
            items={list.map((e) => ({ tags: [e.category, ...regionTags(e)], node: <NewsItem e={e} companies={companies} topics={topicMap} lang={l} />, day: dayLabel(e.last_article_at, l), at: Date.parse(e.last_article_at) }))} />
        </div>

        <aside className="space-y-5">
          <Markets zh={l === "zh"} title={t(l, "markets")} empty={t(l, "marketsDown")} updated={updated} tabs={[{ label: t(l, "indices"), quotes: iq, note: `${t(l, "indicesNote")}${iq[0] ? " · " + iq[0].as_of : ""}` }, { label: l === "zh" ? "中港股" : "China & HK", quotes: cnq, note: `${l === "zh" ? "每日收盘价，新浪财经" : "Daily close, Sina Finance"}${cnq[0] ? " · " + cnq[0].as_of : ""}` }, { label: t(l, "crypto"), quotes: cq, note: t(l, "cryptoNote") }, { label: t(l, "fx"), quotes: fq, note: t(l, "fxNote") }, { label: t(l, "rates"), quotes: rq, note: `${t(l, "indicesNote")}${rq[0] ? " · " + rq[0].as_of : ""}` }]} />
          <AnatomyBox zh={l === "zh"} />
          <TopicsGrid topics={topics} lang={l} />
          {divided.length > 0 && (
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
              <h2 className="text-[17px] font-semibold tracking-[-0.015em]">{t(l, "disagree")}</h2>
              <div className="mt-2 divide-y divide-[#E5E7EB]">
                {divided.map((e) => (
                  <Link key={e.id} href={`/event/${e.slug}`} className="block py-3">
                    <div className="text-[14px] font-semibold leading-snug hover:text-[#C2410C]">{title(e, l)}</div>
                    <div className="mt-1.5 flex items-center gap-2 text-[12px] text-neutral-500"><Flags codes={e.countries} max={6} size={11} />{e.countries.length} {t(l, "countries")}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          <Newsletter lang={l} t={Object.fromEntries((["nlTitle", "nlText", "nlOk", "nlPlaceholder", "subscribe", "nlErr", "privacy"] as const).map((k) => [k, t(l, k)])) as Record<"nlTitle" | "nlText" | "nlOk" | "nlPlaceholder" | "subscribe" | "nlErr" | "privacy", string>} />
        </aside>
      </div>
    </>
  );
}

function Hero({ e, perspectives, l }: { e: EventRow; perspectives: Perspective[]; l: Lang }) {
  return (
    <section className="relative grid h-full overflow-hidden rounded-3xl bg-[#F4F5F7] md:h-[420px] md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="relative z-10 order-2 flex flex-col gap-3 p-5 sm:gap-4 sm:p-9 md:order-1">
        <div className="flex items-center gap-2"><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C2410C]">{t(l, "topStory")}</span><CategoryLabel category={e.category} lang={l} /></div>
        <h1 className="line-clamp-3 text-[26px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#16181D] sm:text-[36px]">
          <Link href={`/event/${e.slug}`} className="hover:text-[#C2410C]">{title(e, l)}</Link>
        </h1>
        {summary(e, l) && <p className="line-clamp-2 text-[15px] leading-relaxed text-neutral-600">{summary(e, l)}</p>}
        {perspectives.length > 0 && (
          <div className="hidden max-h-[34px] flex-wrap gap-2 overflow-hidden sm:flex">
            {perspectives.slice(0, 4).map((p) => (
              <span key={p.country} className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[12px] shadow-[0_1px_2px_rgba(22,24,29,.06)]" title={countryL(p.country, l)}>
                <Flag code={p.country} size={11} /><span className="font-medium text-neutral-700">{perspL(p, l).framing}</span>
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center gap-4 pt-2">
          <Link href={`/event/${e.slug}`} className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-[#EA5514] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#D24A0F]">{t(l, "compare")} <Icon name="arrow" size={15} /></Link>
          <span className="text-[12px] text-neutral-500">{e.source_count} {t(l, "sources")} · {e.countries.length} {t(l, "countries")} · {timeAgoL(e.last_article_at, l)}</span>
        </div>
      </div>
      <Cover e={e} credit priority className="order-1 aspect-[16/9] w-full md:order-2 md:aspect-auto md:min-h-full" />
    </section>
  );
}
