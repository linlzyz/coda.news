import { orgLd } from "@/lib/site";
import type { Metadata } from "next";
import Link from "@/components/LLink";
import { notFound } from "next/navigation";
import { reportError, eventCorrections, companiesByIds, getArticles, getEvent, getFacts, getLatestSummary, getPerspectives, listEvents } from "@/lib/data";
import { alternates, langFrom, t } from "@/lib/i18n";
import { countryL, persp as perspL, summary, timeAgoL, title } from "@/lib/loc";
import { fmtDate, TONE } from "@/lib/ui";
import { Flag, Flags } from "@/components/Flag";
import { CategoryLabel, StatusPill } from "@/components/Pills";
import { Cover } from "@/components/Cover";
import { ReportError, ShareBar } from "@/components/EventTools";
import { AnatomyPromo } from "@/components/anatomy/Promo";
export const revalidate = 21600;
export async function generateStaticParams() { return []; }
export const dynamicParams = true;


export async function generateMetadata({ params }: PageProps<"/[lang]/event/[slug]">): Promise<Metadata> {
  const [e, l] = await Promise.all([getEvent((await params).slug), langFrom(params)]);
  if (!e) return {};
  const ti = (l === "zh" && e.title_zh) || e.title, de = (l === "zh" && e.summary_zh) || e.summary || undefined;
  return { title: ti, description: de, alternates: alternates(`/event/${e.slug}`, l),
    // one-source briefs stay out of search until a second source confirms the story
    ...(e.source_count < 2 || e.status === "archived" ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title: ti, description: de, locale: l === "zh" ? "zh_CN" : "en_AU", type: "article", publishedTime: e.started_at, modifiedTime: e.last_article_at, section: e.category, images: e.image_url ? [e.image_url] : ["/og.png"] },
    twitter: { card: "summary_large_image", title: ti, description: de, images: e.image_url ? [e.image_url] : ["/og.png"] } };
}

export default async function EventPage({ params }: PageProps<"/[lang]/event/[slug]">) {
  const e = await getEvent((await params).slug);
  if (!e || !e.summary) notFound();
  const [l, perspMap, latest, facts, articles, companies, fixes] = await Promise.all([
    langFrom(params), getPerspectives([e.id]), getLatestSummary(e.id), getFacts(e.id), getArticles(e.id), companiesByIds(e.company_ids), eventCorrections(e.id),
  ]);
  const perspectives = perspMap.get(e.id) ?? [];
  const inCards = new Set(perspectives.map((p) => p.country));
  const outlets = new Set(articles.map((a) => a.sources.name.split(" ")[0] + a.sources.country)).size;
  // show only companies that the recorded facts actually involve (matching can attach loosely related names)
  const factText = facts.map((f) => `${f.content.subject} ${f.content.object} ${f.content.text}`).join(" ").toLowerCase();
  const keyCos = companies.filter((c) => factText.includes(c.name.toLowerCase())).slice(0, 5);
  const shownCos = keyCos.length ? keyCos : companies.slice(0, 2);
  const timeline = dedupeFacts(facts).slice(0, 10);
  const related = shownCos[0] ? (await listEvents({ companyId: shownCos[0].id, limit: 6 })).filter((r) => r.id !== e.id).slice(0, 4) : [];
  const byCountry = new Map<string, typeof articles>();
  for (const a of articles) byCountry.set(a.sources.country, [...(byCountry.get(a.sources.country) ?? []), a]);
  const agreed = (l === "zh" && latest?.agreed_zh?.length ? latest.agreed_zh : latest?.agreed) ?? [];
  // where the coverage differs: the model's own points when it wrote them, else each country's emphasis from its card
  const differ = (l === "zh" && latest?.differ_zh?.length ? latest.differ_zh : latest?.differ) ?? [];
  const emphases = differ.length ? [] : perspectives.filter((p) => perspL(p, l).emphasis).slice(0, 4).map((p) => ({ c: p.country, t: perspL(p, l).emphasis as string }));
  // only takes written with the newer, less formulaic prompt (older ones just listed the countries again)
  const freshTake = latest?.created_at && Date.parse(latest.created_at) > Date.parse("2026-09-19T05:00:00Z");
  const analysis = freshTake ? (l === "zh" && latest?.analysis_zh) || latest?.analysis : null;
  const n = (k: number, one: "source" | "country" | "article", many: "sources" | "countries" | "articles") => `${k} ${t(l, k === 1 ? one : many)}`;
  async function report(fd: FormData) {
    "use server";
    await reportError(e!.id, String(fd.get("kind") ?? "other"), String(fd.get("note") ?? ""), l);
  }
  const jsonLd = { "@context": "https://schema.org", "@type": "NewsArticle", headline: e.title, description: e.summary, image: e.image_url ? [e.image_url] : undefined,
    datePublished: e.started_at, dateModified: e.last_article_at, articleSection: e.category, isAccessibleForFree: true,
    mainEntityOfPage: `https://coda.news/event/${e.slug}`, author: { "@type": "Organization", name: "coda.news", url: "https://coda.news" },
    publisher: orgLd,
    citation: articles.slice(0, 20).map((a) => ({ "@type": "CreativeWork", name: a.title, url: a.url, publisher: a.sources.name })) };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 text-[13px] text-neutral-500"><Link href="/" className="hover:text-[#16181D]">{t(l, "home")}</Link><span className="mx-1.5">/</span><Link href={`/${e.category}`} className="hover:text-[#16181D]">{t(l, e.category as "technology")}</Link></nav>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-8">
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-[12px]"><CategoryLabel category={e.category} lang={l} /><StatusPill status={e.status} lang={l} /><span className="text-neutral-500">{t(l, "updated")} {timeAgoL(e.last_article_at, l)} · {t(l, "since")} {fmtDate(e.started_at, l)}</span></div>
            <h1 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[44px]">{title(e, l)}</h1>
            <p className="max-w-3xl text-[17px] leading-relaxed text-neutral-600">{summary(e, l)}</p>
            <div><ShareBar url={`https://coda.news${l === "zh" ? "/zh" : ""}/event/${e.slug}`} card={`${l === "zh" ? "/zh" : ""}/event/${e.slug}/card`} slug={e.slug} zh={l === "zh"} title={title(e, l)} t={{ share: t(l, "share"), copied: t(l, "copied"), image: t(l, "shareImage"), making: t(l, "making"), igHint: t(l, "igHint"), copy: t(l, "copyLink"), email: t(l, "email"), qr: t(l, "qr"), qrHint: t(l, "qrHint"), qrSave: t(l, "qrSave"), more: t(l, "moreShare"), wxHint: t(l, "wxHint") }} /></div>
            <div className="flex flex-wrap gap-2 text-[13px]">
              <Chip>{n(e.source_count, "source", "sources")}</Chip><Chip>{n(e.countries.length, "country", "countries")}</Chip><Chip>{n(e.article_count, "article", "articles")}</Chip>
              <Chip>{outlets} {t(l, "outlets")}</Chip><Link href="/about#method" className="rounded-full bg-[#F4F5F7] px-3 py-1 text-neutral-700 hover:bg-[#ECEEF1]" title={t(l, "howJudge")}>{t(l, "confidence")} {e.confidence}/100 ⓘ</Link>{e.has_official && <Chip strong>{t(l, "official")}</Chip>}
              {shownCos.map((c) => <Link key={c.id} href={`/company/${c.slug}`} className="rounded-full bg-[#FFF1EA] px-3 py-1 font-medium text-[#C2410C] hover:bg-[#FFE3D4]">{c.name}</Link>)}
            </div>
          </header>

          <AnatomyPromo companyIds={e.company_ids} zh={l === "zh"} />

          {e.image_url && <Cover e={e} credit priority className="aspect-[21/9] w-full rounded-3xl" />}

          {(analysis || agreed.length > 0) && (
            <section className="rounded-2xl bg-[#FFF1EA] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#C2410C]">{t(l, "analysis")}</div>
              {analysis && <p className="mt-3 text-[17px] leading-relaxed text-neutral-800">{analysis}</p>}
              {/* the two things a reader wants from a comparison: what every report shares, and where they put the weight differently */}
              <div className={`${analysis ? "mt-5 border-t border-[#F5D0BE] pt-4" : "mt-3"} grid gap-6 ${perspectives.length >= 2 && (differ.length || emphases.length) ? "md:grid-cols-2" : ""}`}>
                {agreed.length > 0 && (
                  <div>
                    <h2 className="text-[14px] font-semibold text-[#16181D]">{perspectives.length >= 2 ? t(l, "common") : t(l, "keyFacts")}</h2>
                    <ol className="mt-3 space-y-2.5">
                      {agreed.map((f, i) => <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-neutral-800"><span className="font-semibold text-[#C2410C]">{String(i + 1).padStart(2, "0")}</span><span>{f}</span></li>)}
                    </ol>
                  </div>
                )}
                {perspectives.length >= 2 && (differ.length > 0 || emphases.length > 0) && (
                  <div>
                    <h2 className="text-[14px] font-semibold text-[#16181D]">{t(l, "differs")}</h2>
                    <ul className="mt-3 space-y-2.5">
                      {differ.length > 0
                        ? differ.map((d, i) => <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-neutral-800"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#C2410C]" /><span>{d}</span></li>)
                        : emphases.map((d) => <li key={d.c} className="flex gap-3 text-[15px] leading-relaxed text-neutral-800"><span className="mt-1.5 shrink-0"><Flag code={d.c} size={11} /></span><span><b className="font-semibold">{countryL(d.c, l)}</b>{l === "zh" ? "：" : ": "}{d.t}</span></li>)}
                    </ul>
                  </div>
                )}
              </div>
              <p className="mt-4 text-[12px] text-neutral-600">{t(l, "aiNote")}</p>
            </section>
          )}

          {perspectives.length >= 2 && (
            <section className="rounded-2xl bg-[#1F2328] p-6 text-white">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-[18px] font-semibold">{t(l, "spectrum")}</h2><span className="text-[13px] text-neutral-400">{t(l, "spectrumSub")} <Link href="/about#method" className="underline underline-offset-2 hover:text-white">{t(l, "howJudge")}</Link></span></div>
              <div className="relative mt-5">
                <div className="absolute inset-x-0 top-[9px] h-1 rounded-full bg-gradient-to-r from-emerald-400/70 via-white/25 to-rose-400/70" />
                <div className="relative grid grid-cols-3 gap-3">
                  {(["positive", "neutral", "negative"] as const).map((tone, i) => {
                    const group = perspectives.filter((p) => p.tone === tone);
                    return (
                      <div key={tone} className={`flex flex-col ${i === 0 ? "items-start" : i === 1 ? "items-center" : "items-end"}`}>
                        <span className={`h-[22px] w-[22px] rounded-full border-4 border-[#1F2328] ${group.length ? "bg-[#EA5514]" : "bg-neutral-600"}`} />
                        <span className="mt-2 text-[12px] font-semibold text-neutral-300">{t(l, tone === "negative" ? "cautious" : tone)}</span>
                        <div className={`mt-2 flex flex-wrap gap-1.5 ${i === 0 ? "justify-start" : i === 1 ? "justify-center" : "justify-end"}`}>
                          {group.map((p) => (
                            <span key={p.country} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-medium" title={countryL(p.country, l)}>
                              <Flag code={p.country} size={10} />{p.country}
                            </span>
                          ))}
                          {!group.length && <span className="text-[12px] text-neutral-500">–</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em]">{t(l, "howEach")}</h2>
            {perspectives.length === 0 && <p className="text-neutral-500">{t(l, "oneCountry")}</p>}
            <div className="grid gap-4 md:grid-cols-2">
              {perspectives.map((p) => {
                const v = perspL(p, l);
                return (
                  <article key={p.country} className="flex flex-col gap-3 rounded-2xl border border-[#E5E7EB] p-5">
                    <div className="flex items-center gap-2.5"><Flag code={p.country} size={16} /><span className="font-semibold">{countryL(p.country, l)}</span>
                      <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${TONE[p.tone]?.cls ?? ""}`}>{v.framing ?? t(l, p.tone === "negative" ? "cautious" : p.tone)}</span></div>
                    {v.headline && <div className="rounded-xl bg-[#F4F5F7] p-4"><div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">{t(l, "typicalHeadline")}</div><div className="mt-1 text-[17px] font-semibold leading-snug">{v.headline}</div></div>}
                    {v.emphasis && <div><div className="text-[12px] font-semibold text-emerald-700">{t(l, "emphasises")}</div><p className="mt-1 text-[14px] leading-relaxed text-neutral-700">{v.emphasis}</p></div>}
                    {v.downplayed && <div><div className="text-[12px] font-semibold text-rose-700">{t(l, "mentionsLess")}</div><p className="mt-1 text-[14px] leading-relaxed text-neutral-700">{v.downplayed}</p></div>}
                    <details className="group mt-auto border-t border-[#F0F1F3] pt-3 text-[12px] text-neutral-500">
                      <summary className="flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">
                        {p.article_count === 1 && <span className="mr-1 rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-800">{t(l, "limited")}</span>}
                        <span className="truncate">{n((byCountry.get(p.country) ?? []).length || p.article_count, "article", "articles")} · {[...new Set((byCountry.get(p.country) ?? []).map((a) => a.sources.name))].join(", ")}</span>
                        <svg className="ml-auto h-3.5 w-3.5 shrink-0 transition group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
                      </summary>
                      <ul className="mt-2.5 space-y-2">
                        {(byCountry.get(p.country) ?? []).map((a) => (
                          <li key={a.id} className="text-[13px] leading-snug">
                            <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-[#16181D] hover:text-[#C2410C]">{a.title}</a>
                            <span className="text-neutral-500"> · {a.sources.name}{a.sources.type === "official" ? ` (${t(l, "official")})` : ""}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </article>
                );
              })}
            </div>
          </section>


          <section className="space-y-3">
            {[...byCountry.keys()].some((c) => !inCards.has(c)) && <h2 className="text-[20px] font-semibold tracking-[-0.015em]">{t(l, "sourcesH")}</h2>}
            <p className="text-[12px] text-neutral-500">{t(l, "disclaimer")}</p>
            {/* countries with a perspective card list their sources inside the card; only the rest are listed here */}
            {[...byCountry].filter(([c]) => !inCards.has(c)).map(([c, list]) => (
              <div key={c} className="rounded-2xl border border-[#E5E7EB] p-4">
                <div className="flex items-center gap-2 text-[14px] font-semibold"><Flag code={c} size={13} />{countryL(c, l)}</div>
                <ul className="mt-2 space-y-1.5">
                  {list.map((a) => (
                    <li key={a.id} className="text-[14px] leading-snug">
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#C2410C]">{a.title}</a>
                      <span className="text-neutral-500"> · {a.sources.name}{a.sources.type === "official" ? ` (${t(l, "official")})` : ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
          {fixes.length > 0 && (
            <section className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFB] p-4">
              <h2 className="text-[14px] font-semibold">{l === "zh" ? "更正记录" : "Corrections"}</h2>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-neutral-600">
                {fixes.map((c) => <li key={c.id}><time className="text-neutral-400">{new Date(c.created_at).toLocaleDateString(l === "zh" ? "zh-CN" : "en-AU", { timeZone: "Australia/Melbourne", day: "numeric", month: "short" })}</time> · {l === "zh" ? c.detail_zh ?? c.detail_en : c.detail_en}</li>)}
              </ul>
              <Link href="/corrections" className="mt-2 inline-block text-[12px] text-[#C2410C] underline underline-offset-2">{l === "zh" ? "全部更正记录" : "All corrections"}</Link>
            </section>
          )}
          <ReportError action={report} t={Object.fromEntries((["report", "reportKind", "rMerge", "rTrans", "rCountry", "rAi", "rOther", "rNote", "rSend", "rThanks"] as const).map((k) => [k, t(l, k)]))} />
        </div>

        <aside className="space-y-5">
          {timeline.length > 0 && (
            <section className="rounded-2xl border border-[#E5E7EB] p-5">
              <h2 className="text-[17px] font-semibold">{t(l, "timeline")}</h2>
              <ol className="mt-4">
                {timeline.map((f, i) => (
                  <li key={f.id} className="grid grid-cols-[12px_minmax(0,1fr)] gap-3">
                    <div className="flex flex-col items-center"><span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-[#EA5514]" : "bg-neutral-300"}`} /><span className="w-px flex-1 bg-[#E5E7EB]" /></div>
                    <div className="pb-4"><div className="text-[12px] text-neutral-500">{fmtDate(f.occurred_at, l)}{f.source_ids.length > 1 ? ` · ${n(f.source_ids.length, "source", "sources")}` : ""}</div><div className="text-[14px] leading-snug">{(l === "zh" && f.content.text_zh) || f.content.text || `${f.content.subject} ${f.content.predicate} ${f.content.object}`}</div></div>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {related.length > 0 && (
            <section className="rounded-2xl border border-[#E5E7EB] p-5">
              <h2 className="text-[17px] font-semibold">{t(l, "moreOn")} {shownCos[0].name}</h2>
              <div className="mt-2 divide-y divide-[#F0F1F3]">
                {related.map((r) => (
                  <Link key={r.id} href={`/event/${r.slug}`} className="block py-3">
                    <div className="text-[14px] font-semibold leading-snug hover:text-[#C2410C]">{title(r, l)}</div>
                    <div className="mt-1.5 flex items-center gap-2 text-[12px] text-neutral-500"><Flags codes={r.countries} max={6} size={11} />{n(r.source_count, "source", "sources")}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function Chip({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return <span className={`rounded-full px-3 py-1 ${strong ? "bg-[#1F2328] text-white" : "bg-[#F4F5F7] text-neutral-700"}`}>{children}</span>;
}

/** Drop facts that repeat an earlier one in different words (word-overlap check). */
function dedupeFacts<T extends { content: { text: string }; source_ids: number[] }>(facts: T[]): T[] {
  const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9.%\s]/g, " ").split(/\s+/).filter((w) => w.length > 2));
  const sorted = [...facts].sort((a, b) => b.source_ids.length - a.source_ids.length);
  const kept: { f: T; w: Set<string> }[] = [];
  for (const f of sorted) {
    const w = words(f.content.text || "");
    if (kept.some((k) => { const inter = [...w].filter((x) => k.w.has(x)).length; return inter / Math.min(w.size || 1, k.w.size || 1) > 0.6; })) continue;
    kept.push({ f, w });
  }
  const set = new Set(kept.map((k) => k.f));
  return facts.filter((f) => set.has(f));
}
