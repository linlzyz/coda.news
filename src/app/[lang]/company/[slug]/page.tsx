import { notFound } from "next/navigation";
import { getCompany, listEvents } from "@/lib/data";
import { EventList } from "@/components/EventList";
import { alternates, langFrom } from "@/lib/i18n";
export const revalidate = 300;
export async function generateStaticParams() { return []; }
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps<"/[lang]/company/[slug]">) {
  const p = await params;
  const c = await getCompany(p.slug);
  if (!c) return {};
  const zh = p.lang === "zh";
  const name = zh && c.name_zh ? `${c.name_zh}（${c.name}）` : c.name;
  const description = zh
    ? `${name}最新新闻，以及各国媒体如何报道。${c.description_zh ?? ""}`
    : `Latest ${c.name} news and how media in different countries report it.${c.description ? ` ${c.name}: ${c.description}.` : ""}`;
  return { title: zh ? `${name}新闻` : `${c.name} news`, description, alternates: alternates(`/company/${c.slug}`, p.lang === "zh" ? "zh" : "en") };
}

const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

export default async function Page({ params }: PageProps<"/[lang]/company/[slug]">) {
  const p = await params;
  const c = await getCompany(p.slug);
  if (!c) notFound();
  const l = await langFrom(params);
  const zh = l === "zh";
  const events = await listEvents({ companyId: c.id, order: "recent", limit: 60 });
  const countries = new Set(events.flatMap((e) => e.countries));
  const sources = events.reduce((n, e) => n + e.source_count, 0);

  const desc = zh ? c.description_zh : c.description;
  const about = zh ? c.about_zh ?? null : c.about_en;
  const wiki = zh ? c.wikipedia_zh ?? c.wikipedia_en : c.wikipedia_en;
  const facts: [string, string][] = ([
    [zh ? "成立" : "Founded", c.founded ? String(c.founded) : null],
    [zh ? "总部" : "Headquarters", zh ? c.hq_zh ?? c.hq : c.hq],
    [zh ? "行业" : "Industry", zh ? c.industry_zh ?? c.industry : c.industry && c.industry[0].toUpperCase() + c.industry.slice(1)],
    [zh ? "上市" : "Listed", c.ticker],
  ] as [string, string | null][]).filter((f): f is [string, string] => !!f[1]);
  const links: [string, string][] = ([
    [zh ? "官网" : "Official website", c.website],
    ["Wikipedia", wiki],
    ["Wikidata", c.wikidata_id ? `https://www.wikidata.org/wiki/${c.wikidata_id}` : null],
  ] as [string, string | null][]).filter((x): x is [string, string] => !!x[1]);

  const ld = {
    "@context": "https://schema.org", "@type": "Organization", name: c.name, ...(c.name_zh ? { alternateName: c.name_zh } : {}),
    ...(c.website ? { url: c.website } : {}), ...(c.description ? { description: c.description } : {}), ...(c.founded ? { foundingDate: String(c.founded) } : {}),
    sameAs: [c.wikipedia_en, c.wikipedia_zh, c.wikidata_id && `https://www.wikidata.org/wiki/${c.wikidata_id}`].filter(Boolean),
  };

  const header = (
    <header>
      {c.wikidata_id && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-[36px] font-semibold tracking-[-0.03em]">{zh && c.name_zh ? c.name_zh : c.name}</h1>
        {zh && c.name_zh && c.name_zh !== c.name && <span className="text-[18px] text-neutral-500">{c.name}</span>}
      </div>
      {desc && <p className="mt-1 text-[16px] text-neutral-600">{desc[0].toUpperCase() + desc.slice(1)}</p>}

      {(facts.length > 0 || links.length > 0 || events.length > 0) && (
        <div className="mt-5 rounded-2xl border border-[#E5E7EB] bg-white p-5">
          {about && (
            <p className="text-[14px] leading-relaxed text-neutral-700">{about}
              {wiki && <> <a href={wiki} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-[12px] text-neutral-500 underline underline-offset-2 hover:text-[#C2410C]">{zh ? "来源：维基百科（CC BY-SA）" : "Source: Wikipedia (CC BY-SA)"}</a></>}
            </p>
          )}
          <dl className={`grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-4 ${about ? "mt-4 border-t border-[#E5E7EB] pt-4" : ""}`}>
            {facts.map(([k, v]) => (
              <div key={k}><dt className="text-neutral-500">{k}</dt><dd className="mt-0.5 font-medium text-[#16181D]">{v}</dd></div>
            ))}
            <div><dt className="text-neutral-500">{zh ? "coda.news 报道" : "On coda.news"}</dt>
              <dd className="mt-0.5 font-medium text-[#16181D]">{zh ? `${events.length} 个事件 · ${countries.size} 个国家 · ${sources} 个来源` : `${events.length} events · ${countries.size} countries · ${sources} sources`}</dd></div>
          </dl>
          {links.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-[#E5E7EB] pt-4">
              {links.map(([k, href]) => (
                <a key={k} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#E5E7EB] px-3.5 text-[12px] font-medium hover:border-[#16181D]">
                  {k}{k === (zh ? "官网" : "Official website") && <span className="text-neutral-500">{host(href)}</span>}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><path d="M7 17 17 7M8 7h9v9" /></svg>
                </a>
              ))}
            </div>
          )}
          {c.wikidata_id && <p className="mt-3 text-[11px] text-neutral-400">{zh ? "公司资料来自 Wikidata（CC0），仅供参考。" : "Company facts from Wikidata (CC0), for reference only."}</p>}
        </div>
      )}
      <h2 className="mt-8 text-[20px] font-semibold tracking-[-0.02em]">{zh ? "相关事件" : "Events"}</h2>
    </header>
  );
  return <EventList lang={l} title={c.name} header={header} events={events} />;
}
