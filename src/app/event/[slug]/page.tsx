import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { companiesByIds, getArticles, getEvent, getFacts, getLatestSummary, getPerspectives, listEvents } from "@/lib/data";
import { getLang, t } from "@/lib/i18n";
import { countryL, persp as perspL, summary, timeAgoL, title } from "@/lib/loc";
import { fmtDate, TONE } from "@/lib/ui";
import { Flag, Flags } from "@/components/Flag";
import { CategoryLabel, StatusPill } from "@/components/Pills";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Cover } from "@/components/Cover";


export async function generateMetadata({ params }: PageProps<"/event/[slug]">): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  if (!e) return {};
  return { title: e.title, description: e.summary ?? undefined, openGraph: { title: e.title, description: e.summary ?? undefined, type: "article", images: e.image_url ? [e.image_url] : undefined } };
}

export default async function EventPage({ params }: PageProps<"/event/[slug]">) {
  const e = await getEvent((await params).slug);
  if (!e || !e.summary) notFound();
  const [l, perspMap, latest, facts, articles, companies] = await Promise.all([
    getLang(), getPerspectives([e.id]), getLatestSummary(e.id), getFacts(e.id), getArticles(e.id), companiesByIds(e.company_ids),
  ]);
  const perspectives = perspMap.get(e.id) ?? [];
  // show only companies that the recorded facts actually involve (matching can attach loosely related names)
  const factText = facts.map((f) => `${f.content.subject} ${f.content.object} ${f.content.text}`).join(" ").toLowerCase();
  const keyCos = companies.filter((c) => factText.includes(c.name.toLowerCase())).slice(0, 5);
  const shownCos = keyCos.length ? keyCos : companies.slice(0, 2);
  const timeline = dedupeFacts(facts).slice(0, 10);
  const related = shownCos[0] ? (await listEvents({ companyId: shownCos[0].id, limit: 6 })).filter((r) => r.id !== e.id).slice(0, 4) : [];
  const byCountry = new Map<string, typeof articles>();
  for (const a of articles) byCountry.set(a.sources.country, [...(byCountry.get(a.sources.country) ?? []), a]);
  const agreed = (l === "zh" && latest?.agreed_zh?.length ? latest.agreed_zh : latest?.agreed) ?? [];
  const analysis = (l === "zh" && latest?.analysis_zh) || latest?.analysis;
  const n = (k: number, one: "source" | "country" | "article", many: "sources" | "countries" | "articles") => `${k} ${t(l, k === 1 ? one : many)}`;
  const jsonLd = { "@context": "https://schema.org", "@type": "NewsArticle", headline: e.title, description: e.summary, image: e.image_url ?? undefined,
    datePublished: e.started_at, dateModified: e.last_article_at, publisher: { "@type": "Organization", name: "coda.news" } };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <AutoRefresh />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 text-[13px] text-slate-500"><Link href="/" className="hover:text-[#0E1A2B]">{t(l, "home")}</Link><span className="mx-1.5">/</span><Link href={`/${e.category}`} className="hover:text-[#0E1A2B]">{t(l, e.category)}</Link></nav>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-8">
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-[12px]"><CategoryLabel category={e.category} lang={l} /><StatusPill status={e.status} lang={l} /><span className="text-slate-500">{t(l, "updated")} {timeAgoL(e.last_article_at, l)} · {t(l, "since")} {fmtDate(e.started_at)}</span></div>
            <h1 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[44px]">{title(e, l)}</h1>
            <p className="max-w-3xl text-[17px] leading-relaxed text-slate-600">{summary(e, l)}</p>
            <div className="flex flex-wrap gap-2 text-[13px]">
              <Chip>{n(e.source_count, "source", "sources")}</Chip><Chip>{n(e.countries.length, "country", "countries")}</Chip><Chip>{n(e.article_count, "article", "articles")}</Chip>
              <Chip>{t(l, "confidence")} {e.confidence}</Chip>{e.has_official && <Chip strong>{t(l, "official")}</Chip>}
              {shownCos.map((c) => <Link key={c.id} href={`/company/${c.slug}`} className="rounded-full bg-[#EEF4FB] px-3 py-1 font-medium text-[#1560BD] hover:bg-[#DCE8F7]">{c.name}</Link>)}
            </div>
          </header>

          <Cover e={e} credit className="aspect-[21/9] w-full rounded-3xl" />

          {agreed.length > 0 && (
            <section className="rounded-2xl border border-[#DDE6F1] p-6">
              <h2 className="text-[18px] font-semibold tracking-[-0.015em]">{t(l, "agreed")}</h2>
              <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                {agreed.map((f, i) => <li key={i} className="flex gap-3 text-[15px] leading-relaxed"><span className="font-semibold text-[#1560BD]">{String(i + 1).padStart(2, "0")}</span><span>{f}</span></li>)}
              </ol>
            </section>
          )}

          {perspectives.length >= 2 && (
            <section className="rounded-2xl bg-[#0B3A6E] p-6 text-white">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-[18px] font-semibold">{t(l, "spectrum")}</h2><span className="text-[13px] text-slate-400">{t(l, "spectrumSub")}</span></div>
              <div className="relative mt-5">
                <div className="absolute inset-x-0 top-[9px] h-1 rounded-full bg-gradient-to-r from-emerald-400/70 via-white/25 to-rose-400/70" />
                <div className="relative grid grid-cols-3 gap-3">
                  {(["positive", "neutral", "negative"] as const).map((tone, i) => {
                    const group = perspectives.filter((p) => p.tone === tone);
                    return (
                      <div key={tone} className={`flex flex-col ${i === 0 ? "items-start" : i === 1 ? "items-center" : "items-end"}`}>
                        <span className={`h-[22px] w-[22px] rounded-full border-4 border-[#0B3A6E] ${group.length ? "bg-[#1560BD]" : "bg-slate-600"}`} />
                        <span className="mt-2 text-[12px] font-semibold text-slate-300">{t(l, tone === "negative" ? "cautious" : tone)}</span>
                        <div className={`mt-2 flex flex-wrap gap-1.5 ${i === 0 ? "justify-start" : i === 1 ? "justify-center" : "justify-end"}`}>
                          {group.map((p) => (
                            <span key={p.country} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-medium" title={countryL(p.country, l)}>
                              <Flag code={p.country} size={10} />{p.country}
                            </span>
                          ))}
                          {!group.length && <span className="text-[12px] text-slate-500">–</span>}
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
            {perspectives.length === 0 && <p className="text-slate-500">{t(l, "oneCountry")}</p>}
            <div className="grid gap-4 md:grid-cols-2">
              {perspectives.map((p) => {
                const v = perspL(p, l);
                return (
                  <article key={p.country} className="flex flex-col gap-3 rounded-2xl border border-[#DDE6F1] p-5">
                    <div className="flex items-center gap-2.5"><Flag code={p.country} size={16} /><span className="font-semibold">{countryL(p.country, l)}</span>
                      <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${TONE[p.tone]?.cls ?? ""}`}>{v.framing ?? t(l, p.tone === "negative" ? "cautious" : p.tone)}</span></div>
                    {v.headline && <div className="rounded-xl bg-[#F3F6FA] p-4"><div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{t(l, "typicalHeadline")}</div><div className="mt-1 text-[17px] font-semibold leading-snug">{v.headline}</div></div>}
                    {v.emphasis && <div><div className="text-[12px] font-semibold text-emerald-700">{t(l, "emphasises")}</div><p className="mt-1 text-[14px] leading-relaxed text-slate-700">{v.emphasis}</p></div>}
                    {v.downplayed && <div><div className="text-[12px] font-semibold text-rose-700">{t(l, "mentionsLess")}</div><p className="mt-1 text-[14px] leading-relaxed text-slate-700">{v.downplayed}</p></div>}
                    <div className="mt-auto border-t border-[#E8EEF6] pt-3 text-[12px] text-slate-500">{n(p.article_count, "article", "articles")} · {[...new Set((byCountry.get(p.country) ?? []).map((a) => a.sources.name))].join(", ")}</div>
                  </article>
                );
              })}
            </div>
          </section>

          {analysis && (
            <section className="rounded-2xl bg-[#EEF4FB] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#1560BD]">{t(l, "analysis")}</div>
              <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em]">{t(l, "whyDiffers")}</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-slate-800">{analysis}</p>
              <p className="mt-3 text-[12px] text-slate-600">{t(l, "aiNote")}</p>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-[20px] font-semibold tracking-[-0.015em]">{t(l, "sourcesH")}</h2>
            {[...byCountry].map(([c, list]) => (
              <div key={c} className="rounded-2xl border border-[#DDE6F1] p-4">
                <div className="flex items-center gap-2 text-[14px] font-semibold"><Flag code={c} size={13} />{countryL(c, l)}</div>
                <ul className="mt-2 space-y-1.5">
                  {list.map((a) => (
                    <li key={a.id} className="text-[14px] leading-snug">
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#1560BD]">{a.title}</a>
                      <span className="text-slate-500"> · {a.sources.name}{a.sources.type === "official" ? ` (${t(l, "official")})` : ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>

        <aside className="space-y-5">
          {timeline.length > 0 && (
            <section className="rounded-2xl border border-[#DDE6F1] p-5">
              <h2 className="text-[17px] font-semibold">{t(l, "timeline")}</h2>
              <ol className="mt-4">
                {timeline.map((f, i) => (
                  <li key={f.id} className="grid grid-cols-[12px_minmax(0,1fr)] gap-3">
                    <div className="flex flex-col items-center"><span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-[#1560BD]" : "bg-slate-300"}`} /><span className="w-px flex-1 bg-[#DDE6F1]" /></div>
                    <div className="pb-4"><div className="text-[12px] text-slate-500">{fmtDate(f.occurred_at)}{f.source_ids.length > 1 ? ` · ${n(f.source_ids.length, "source", "sources")}` : ""}</div><div className="text-[14px] leading-snug">{f.content.text || `${f.content.subject} ${f.content.predicate} ${f.content.object}`}</div></div>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {related.length > 0 && (
            <section className="rounded-2xl border border-[#DDE6F1] p-5">
              <h2 className="text-[17px] font-semibold">{t(l, "moreOn")} {shownCos[0].name}</h2>
              <div className="mt-2 divide-y divide-[#E8EEF6]">
                {related.map((r) => (
                  <Link key={r.id} href={`/event/${r.slug}`} className="block py-3">
                    <div className="text-[14px] font-semibold leading-snug hover:text-[#1560BD]">{title(r, l)}</div>
                    <div className="mt-1.5 flex items-center gap-2 text-[12px] text-slate-500"><Flags codes={r.countries} max={6} size={11} />{n(r.source_count, "source", "sources")}</div>
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
  return <span className={`rounded-full px-3 py-1 ${strong ? "bg-[#0B3A6E] text-white" : "bg-[#F3F6FA] text-slate-700"}`}>{children}</span>;
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
