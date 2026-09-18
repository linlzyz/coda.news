import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { companiesByIds, getArticles, getEvent, getFacts, getLatestSummary, getPerspectives, listEvents } from "@/lib/data";
import { countryName, fmtDate, timeAgo, TONE } from "@/lib/ui";
import { Flag } from "@/components/Flag";
import { CategoryLabel, StatusPill } from "@/components/Pills";
import { EventMini } from "@/components/EventCard";
import { AutoRefresh } from "@/components/AutoRefresh";

export const revalidate = 60;
export async function generateStaticParams() { return []; }

export async function generateMetadata({ params }: PageProps<"/event/[slug]">): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  if (!e) return {};
  return { title: e.title, description: e.summary ?? undefined, openGraph: { title: e.title, description: e.summary ?? undefined, type: "article" } };
}

export default async function EventPage({ params }: PageProps<"/event/[slug]">) {
  const e = await getEvent((await params).slug);
  if (!e || !e.summary) notFound();
  const [perspMap, latest, facts, articles, companies] = await Promise.all([
    getPerspectives([e.id]), getLatestSummary(e.id), getFacts(e.id), getArticles(e.id), companiesByIds(e.company_ids),
  ]);
  const perspectives = perspMap.get(e.id) ?? [];
  const related = companies[0] ? (await listEvents({ companyId: companies[0].id, limit: 6 })).filter((r) => r.id !== e.id).slice(0, 4) : [];
  const byCountry = new Map<string, typeof articles>();
  for (const a of articles) byCountry.set(a.sources.country, [...(byCountry.get(a.sources.country) ?? []), a]);
  const languages = new Set(articles.map((a) => a.sources.country)).size;

  const jsonLd = {
    "@context": "https://schema.org", "@type": "NewsArticle", headline: e.title, description: e.summary,
    datePublished: e.started_at, dateModified: e.last_article_at, publisher: { "@type": "Organization", name: "coda.news" },
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <AutoRefresh />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 text-sm text-slate-500"><Link href="/" className="hover:text-[#0A1A33]">Home</Link> <span className="mx-1.5">/</span> <Link href={`/${e.category}`} className="capitalize hover:text-[#0A1A33]">{e.category}</Link></nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-8">
          {/* Header */}
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs"><CategoryLabel category={e.category} /><StatusPill status={e.status} /><span className="text-slate-500">Updated {timeAgo(e.last_article_at)} · since {fmtDate(e.started_at)}</span></div>
            <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[44px]">{e.title}</h1>
            <p className="max-w-3xl text-lg leading-relaxed text-slate-600">{e.summary}</p>
            <div className="flex flex-wrap gap-2 text-[13px]">
              <Chip>{plural(e.source_count, "source")}</Chip><Chip>{plural(e.countries.length, "country", "countries")}</Chip><Chip>{plural(e.article_count, "article")}</Chip>
              <Chip>Confidence {e.confidence}</Chip>{e.has_official && <Chip strong>Official source</Chip>}
              {companies.map((c) => <Link key={c.id} href={`/company/${c.slug}`} className="rounded-full bg-[#EAF1FE] px-3 py-1 font-medium text-[#1D4ED8] hover:bg-[#D7E4FD]">{c.name}</Link>)}
            </div>
          </header>

          {e.image_url && <img src={e.image_url} alt="" className="max-h-[360px] w-full rounded-2xl object-cover" />}

          {/* Agreed facts */}
          {latest?.agreed && latest.agreed.length > 0 && (
            <section className="rounded-2xl border border-[#D6E2F5] p-6">
              <h2 className="text-lg font-semibold">What everyone agrees on</h2>
              <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                {latest.agreed.map((f, i) => <li key={i} className="flex gap-3 text-[15px] leading-relaxed"><span className="font-semibold text-slate-400">{String(i + 1).padStart(2, "0")}</span><span>{f}</span></li>)}
              </ol>
            </section>
          )}

          {/* Framing spectrum */}
          {perspectives.length >= 2 && (
            <section className="rounded-2xl bg-[#EEF4FF] p-6 text-[#0A1A33] ring-1 ring-[#D6E2F5]">
              <div className="flex items-baseline gap-3"><h2 className="text-lg font-semibold">The framing spectrum</h2><span className="text-sm text-slate-500">Tone of each country&apos;s coverage</span></div>
              <div className="relative mt-6 h-20">
                <div className="absolute inset-x-0 top-[34px] h-1 rounded bg-[#C7D7F4]" />
                {perspectives.map((p, i) => {
                  const x = (TONE[p.tone]?.x ?? 50) + ((i % 3) - 1) * 5;
                  return (
                    <div key={p.country} className="absolute flex -translate-x-1/2 flex-col items-center gap-1.5" style={{ left: `${x}%`, top: i % 2 ? 40 : 0 }}>
                      {i % 2 ? <><span className="h-3.5 w-3.5 rounded-full border-2 border-white bg-[#1D4ED8]" /><span className="text-xs font-semibold">{p.country}</span></>
                             : <><span className="text-xs font-semibold">{p.country}</span><span className="h-3.5 w-3.5 rounded-full border-2 border-white bg-[#1D4ED8]" /></>}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-500"><span>← Positive</span><span>Neutral</span><span>Cautious →</span></div>
            </section>
          )}

          {/* Perspectives */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-[-0.01em]">How each country tells it</h2>
            {perspectives.length === 0 && <p className="text-slate-500">So far one country has covered this event. Perspectives appear when media in a second country report it.</p>}
            <div className="grid gap-4 md:grid-cols-2">
              {perspectives.map((p) => (
                <article key={p.country} className="flex flex-col gap-3 rounded-2xl border border-[#D6E2F5] p-5">
                  <div className="flex items-center gap-2.5"><Flag code={p.country} size={16} /><span className="font-semibold">{countryName(p.country)}</span>
                    <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[p.tone]?.cls ?? ""}`}>{p.framing ?? TONE[p.tone]?.label}</span></div>
                  {p.headline && <div className="rounded-xl bg-slate-50 p-4"><div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Typical headline, translated</div><div className="mt-1 text-[17px] font-semibold leading-snug">{p.headline}</div></div>}
                  {p.emphasis && <div><div className="text-xs font-semibold text-emerald-700">Emphasises</div><p className="mt-1 text-sm leading-relaxed text-slate-700">{p.emphasis}</p></div>}
                  {p.downplayed && <div><div className="text-xs font-semibold text-rose-700">Mentions less</div><p className="mt-1 text-sm leading-relaxed text-slate-700">{p.downplayed}</p></div>}
                  <div className="mt-auto border-t border-[#D6E2F5] pt-3 text-xs text-slate-500">{p.article_count} {p.article_count === 1 ? "article" : "articles"} · {(byCountry.get(p.country) ?? []).map((a) => a.sources.name).filter((v, i, s) => s.indexOf(v) === i).join(", ")}</div>
                </article>
              ))}
            </div>
          </section>

          {latest?.analysis && (
            <section className="rounded-2xl bg-[#EAF1FE] p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#1D4ED8]">Coda analysis</div>
              <h2 className="mt-2 text-2xl font-semibold">Why the coverage differs</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-slate-800">{latest.analysis}</p>
              <p className="mt-3 text-xs text-slate-600">AI-generated from the sources below. Always check the originals.</p>
            </section>
          )}

          {/* Sources */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Sources</h2>
            {[...byCountry].map(([c, list]) => (
              <div key={c} className="rounded-2xl border border-[#D6E2F5] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><Flag code={c} size={13} />{countryName(c)}</div>
                <ul className="mt-2 space-y-1.5">
                  {list.map((a) => (
                    <li key={a.id} className="text-sm leading-snug">
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-[#0A1A33] hover:text-[#EA5514]">{a.title}</a>
                      <span className="text-slate-500"> · {a.sources.name}{a.sources.type === "official" ? " (official)" : ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-xs text-slate-500">{plural(articles.length, "article")} from {plural(languages, "country", "countries")}. Links open the original publisher.</p>
          </section>
        </div>

        <aside className="space-y-6">
          {facts.length > 0 && (
            <section className="rounded-2xl border border-[#D6E2F5] p-5">
              <h2 className="text-base font-semibold">Timeline</h2>
              <ol className="mt-4">
                {facts.slice(0, 12).map((f, i) => (
                  <li key={f.id} className="grid grid-cols-[12px_minmax(0,1fr)] gap-3">
                    <div className="flex flex-col items-center"><span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-[#EA5514]" : "bg-slate-300"}`} /><span className="w-px flex-1 bg-[#D6E2F5]" /></div>
                    <div className="pb-4"><div className="text-xs text-slate-500">{fmtDate(f.occurred_at)}{f.source_ids.length > 1 ? ` · ${f.source_ids.length} sources` : ""}</div><div className="text-sm leading-snug">{f.content.text || `${f.content.subject} ${f.content.predicate} ${f.content.object}`}</div></div>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {related.length > 0 && (
            <section className="rounded-2xl border border-[#D6E2F5] p-5">
              <h2 className="text-base font-semibold">More on {companies[0].name}</h2>
              <div className="-mx-3 mt-2">{related.map((r) => <EventMini key={r.id} e={r} />)}</div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function Chip({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return <span className={`rounded-full px-3 py-1 ${strong ? "bg-[#0A1A33] text-white" : "bg-slate-100 text-slate-700"}`}>{children}</span>;
}

const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;
