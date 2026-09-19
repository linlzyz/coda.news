import { regionName } from "@/lib/ui";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "@/components/LLink";
import { allTopics, companyDirectory, companyRedirect, companyMap, getCompany, listEvents, notable, type CompanyCard } from "@/lib/data";
import { alternates, langFrom } from "@/lib/i18n";
import { summary, timeAgoL, title } from "@/lib/loc";
import { Cover } from "@/components/Cover";
import { Flag } from "@/components/Flag";
import { NewsItem } from "@/components/NewsItem";
import { CategoryLabel } from "@/components/Pills";
import { FollowBox } from "@/components/FollowBox";
import { Avatar } from "@/components/Avatar";
import { CompanyLogo } from "@/components/companies/Logo";
import { Tabs } from "@/components/companies/Tabs";
import { sectorLabel } from "@/components/companies/sectors";
export const revalidate = 86400;
export async function generateStaticParams() { return []; }
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps<"/[lang]/company/[slug]">) {
  const p = await params;
  const c = await getCompany(p.slug);
  if (!c) return {};
  const zh = p.lang === "zh";
  const name = zh && c.name_zh ? `${c.name_zh}（${c.name}）` : c.name;
  const st = c.story;
  // search snippet: what the company is, where it came from, and that we track its news across countries
  const description = zh
    ? `${name}：${st?.tagline_zh ?? c.description_zh ?? ""}。${c.founded ? `${c.founded} 年成立，` : ""}${c.hq_zh ?? c.hq ? `总部位于${c.hq_zh ?? c.hq}。` : ""}公司简介、发展历程、关键人物，以及各国媒体的最新报道。`
    : `${c.name}: ${st?.tagline ?? c.description ?? "company profile"}.${c.founded ? ` Founded ${c.founded}` : ""}${c.hq ? `, headquartered in ${c.hq}` : ""}. History, key people and the latest news as reported in each country.`;
  // thin pages (no profile, no coverage, or not a company at all) stay reachable but out of search engines
  const [dir] = await Promise.all([companyDirectory()]);
  const me = dir.find((x) => x.id === Number(c.id));
  const thin = !me || !notable(me) || (!st && !c.about_en && me.events === 0);
  const robots = thin ? { index: false, follow: true } : undefined;
  const title = zh ? (st ? `${name}：简介、历史与最新新闻` : `${name}新闻`) : (st ? `${c.name}: profile, history and latest news` : `${c.name} news`);
  return { title, description: description.replace(/\s+/g, " ").slice(0, 300), robots, alternates: alternates(`/company/${c.slug}`, zh ? "zh" : "en"),
    openGraph: st?.cover ? { images: [st.cover.url] } : c.logo_url ? { images: [c.logo_url] } : undefined };
}

const EXCH: Record<string, string> = {
  "Australian Securities Exchange": "ASX", "Tokyo Stock Exchange": "TSE", "Hong Kong Stock Exchange": "HKEX", "Shanghai Stock Exchange": "SSE",
  "Shenzhen Stock Exchange": "SZSE", "Korea Exchange": "KRX", "London Stock Exchange": "LSE", "Frankfurt Stock Exchange": "FWB",
  "National Stock Exchange of India": "NSE", "Bombay Stock Exchange": "BSE", "Singapore Exchange": "SGX", "Taiwan Stock Exchange": "TWSE",
  "Toronto Stock Exchange": "TSX", "SIX Swiss Exchange": "SIX",
};
const ticker = (t: string | null) => { if (!t) return null; const [ex, sym] = t.split(": "); return sym ? `${EXCH[ex] ?? ex}: ${sym}` : t; };
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

const SOCIAL: [keyof Social, string, (h: string) => string, string][] = [
  ["instagram", "Instagram", (h) => `https://www.instagram.com/${h}/`, "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17.5 6.5h.01"],
  ["x_handle", "X", (h) => `https://x.com/${h}`, "M4 4l16 16M20 4 4 20"],
  ["facebook", "Facebook", (h) => `https://www.facebook.com/${h}`, "M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H7v3h2v9h3v-9h2.5l.5-3h-3V7a1 1 0 0 1 1-1h2z"],
  ["youtube", "YouTube", (h) => `https://www.youtube.com/channel/${h}`, "M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM10 9l5 3-5 3z"],
  ["linkedin", "LinkedIn", (h) => `https://www.linkedin.com/company/${h}`, "M4 9h3v11H4zM5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM10 9h3v1.5c.6-1 1.8-1.8 3.5-1.8 2.5 0 3.5 1.6 3.5 4.3v7h-3v-6.2c0-1.5-.5-2.3-1.7-2.3-1.3 0-2.3.9-2.3 2.5v6h-3z"],
];
type Social = { instagram: string | null; x_handle: string | null; facebook: string | null; youtube: string | null; linkedin: string | null };

export default async function Page({ params }: PageProps<"/[lang]/company/[slug]">) {
  const p = await params;
  const c = await getCompany(p.slug);
  if (!c) { const to = await companyRedirect(p.slug); if (to) permanentRedirect(`${p.lang === "zh" ? "/zh" : ""}/company/${to}`); notFound(); }
  const l = await langFrom(params); const zh = l === "zh";
  const [events, dir, topics] = await Promise.all([listEvents({ companyId: c.id, order: "recent", limit: 60 }), companyDirectory(), allTopics()]);
  const companies = await companyMap(events);
  const tm = new Map(topics.map((x) => [x.id, x]));
  const cname = (x: string) => regionName(x, zh);

  const name = zh && c.name_zh ? c.name_zh : c.name;
  const desc = (zh ? c.description_zh : c.description) ?? null;
  const about = zh ? c.about_zh : c.about_en;
  const wiki = zh ? c.wikipedia_zh ?? c.wikipedia_en : c.wikipedia_en;
  const industry = zh ? c.industry_zh ?? c.industry : c.industry && c.industry[0].toUpperCase() + c.industry.slice(1);
  const countries = new Set(events.flatMap((e) => e.countries));

  // similar: same sector, same country first, then most covered
  const similar = !c.sector || c.sector === "other" ? [] : dir.filter((x) => x.id !== c.id && x.sector === c.sector && notable(x))
    .sort((a, b) => Number(b.country === c.country) - Number(a.country === c.country) || b.events - a.events).slice(0, 8);
  const simName = (x: CompanyCard) => (zh && x.name_zh) || x.name;

  // ownership: link the parent if we have it, and list what this company owns (brands whose parent is this company)
  const low = (x?: string | null) => (x ?? "").toLowerCase().replace(/\b(se|sa|inc|group|holding|holdings)\b|[^a-z0-9]/g, "");
  const parentCo = c.parent ? dir.find((x) => x.id !== c.id && low(x.name) === low(c.parent)) : undefined;
  const owned = dir.filter((x) => x.id !== c.id && x.parent && low(x.parent) === low(c.name) && x.kind !== "org");
  const rows: [string, React.ReactNode][] = ([
    [zh ? "国家/地区" : "Country/region", c.country ? <span className="inline-flex items-center gap-2"><Flag code={c.country} size={12} />{cname(c.country)}</span> : null],
    [zh ? "成立" : "Founded", c.founded ? String(c.founded) : null],
    [zh ? "总部" : "Headquarters", zh ? c.hq_zh ?? c.hq : c.hq],
    [zh ? "创始人" : "Founders", zh ? c.founders_zh ?? c.founders : c.founders],
    [zh ? "首席执行官" : "CEO", zh ? c.ceo_zh ?? c.ceo : c.ceo],
    [zh ? "母公司" : "Parent company", parentCo ? <Link href={`/company/${parentCo.slug}`} className="text-[#C2410C] hover:underline">{(zh && parentCo.name_zh) || parentCo.name}</Link> : zh ? c.parent_zh ?? c.parent : c.parent],
    [zh ? "旗下品牌/公司" : "Owns", owned.length ? <span className="flex flex-wrap gap-x-2 gap-y-1">{owned.slice(0, 12).map((x) => <Link key={x.id} href={`/company/${x.slug}`} className="text-[#C2410C] hover:underline">{(zh && x.name_zh) || x.name}</Link>)}</span> : null],
    [zh ? "指数" : "Index", c.indices?.length ? [["SP500", "S&P 500"], ["SP100", "S&P 100"], ["NDX100", "Nasdaq-100"]].filter(([k]) => c.indices!.includes(k)).map(([, v]) => v).join(" · ") : null],
    [zh ? "上市" : "Listed", ticker(c.ticker)],
    [zh ? "官网" : "Website", c.website ? <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-[#C2410C] hover:underline">{host(c.website)} ↗</a> : null],
  ] as [string, React.ReactNode][]).filter(([, v]) => v);
  const socials = SOCIAL.filter(([k]) => (c as unknown as Social)[k]);

  const ld = { "@context": "https://schema.org", "@type": "Organization", name: c.name, ...(c.name_zh ? { alternateName: c.name_zh } : {}),
    ...(c.website ? { url: c.website } : {}), ...(c.logo_url ? { logo: c.logo_url } : {}), ...(c.description ? { description: c.description } : {}),
    ...(c.founded ? { foundingDate: String(c.founded) } : {}),
    ...(c.founders ? { founder: c.founders.split(/,\s*/).map((n) => ({ "@type": "Person", name: n })) } : {}),
    ...(c.hq ? { location: { "@type": "Place", name: c.hq } } : {}),
    ...(c.ticker ? { tickerSymbol: c.ticker } : {}),
    ...(parentCo ? { parentOrganization: { "@type": "Organization", name: parentCo.name, url: `https://coda.news/company/${parentCo.slug}` } } : c.parent ? { parentOrganization: { "@type": "Organization", name: c.parent } } : {}),
    ...(owned.length ? { subOrganization: owned.slice(0, 20).map((x) => ({ "@type": "Organization", name: x.name, url: `https://coda.news/company/${x.slug}` })) } : {}),
    sameAs: [c.wikipedia_en, c.wikipedia_zh, c.wikidata_id && `https://www.wikidata.org/wiki/${c.wikidata_id}`, ...socials.map(([k, , u]) => u((c as unknown as Social)[k]!))].filter(Boolean) };

  const newsList = (n: number) => events.slice(0, n).map((e) => (
    <Link key={e.id} href={`/event/${e.slug}`} className="group grid grid-cols-[112px_minmax(0,1fr)] gap-3">
      <Cover e={e} className="aspect-[4/3] w-full rounded-xl" />
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[11px]"><CategoryLabel category={e.category} lang={l} /><span className="text-neutral-500">{timeAgoL(e.last_article_at, l)}</span></div>
        <div className="mt-1 line-clamp-2 text-[14px] font-semibold leading-snug group-hover:text-[#C2410C]">{title(e, l)}</div>
        {summary(e, l) && <p className="mt-0.5 line-clamp-2 text-[12px] text-neutral-500">{summary(e, l)}</p>}
      </div>
    </Link>
  ));
  const simRow = (x: CompanyCard) => (
    <Link key={x.id} href={`/company/${x.slug}`} className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-2.5 hover:border-[#F0A57F]">
      <CompanyLogo name={x.name} url={x.logo_url} size={44} className="shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-semibold">{simName(x)}</div><div className="truncate text-[12px] text-neutral-500">{x.country ? cname(x.country) : sectorLabel(x.sector, zh)}</div></div>
      <span className="text-neutral-400">›</span>
    </Link>
  );

  const overview = (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1.2fr_0.9fr]">
      <section>
        <h2 className="text-[18px] font-semibold">{zh ? "简介" : "About"}</h2>
        {about ? <p className="mt-3 text-[14px] leading-relaxed text-neutral-700">{about}</p> : <p className="mt-3 text-[14px] text-neutral-500">{zh ? "暂无简介。" : "No profile yet."}</p>}
        {about && wiki && <a href={wiki} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[12px] text-neutral-500 underline underline-offset-2 hover:text-[#C2410C]">{zh ? "来源：维基百科（CC BY-SA）" : "Source: Wikipedia (CC BY-SA)"}</a>}
        {c.slogan && <blockquote className="mt-5 rounded-2xl bg-[#F4F5F7] px-6 py-7 font-serif text-[18px] italic leading-snug text-neutral-700">“{c.slogan}”</blockquote>}
        <div className="mt-5 rounded-2xl border border-[#E5E7EB] p-4 text-[13px] text-neutral-600">
          <div className="font-semibold text-[#16181D]">{zh ? "coda.news 报道" : "On coda.news"}</div>
          <div className="mt-1">{zh ? `${events.length} 个事件，${countries.size} 个国家的媒体报道过` : `${events.length} ${events.length === 1 ? "event" : "events"}, reported by media in ${countries.size} ${countries.size === 1 ? "country" : "countries"}`}</div>
        </div>
      </section>
      <section>
        <div className="flex items-baseline justify-between"><h2 className="text-[18px] font-semibold">{zh ? "最新新闻" : "Latest news"}</h2></div>
        <div className="mt-3 space-y-4">{events.length ? newsList(4) : <p className="text-[14px] text-neutral-500">{zh ? "暂无报道。" : "No coverage yet."}</p>}</div>
      </section>
      <section>
        <h2 className="text-[18px] font-semibold">{zh ? "相似公司" : "Similar companies"}</h2>
        <div className="mt-3 space-y-2">{similar.length ? similar.slice(0, 4).map(simRow) : <p className="text-[14px] text-neutral-500">{zh ? "暂无。" : "None yet."}</p>}</div>
      </section>
    </div>
  );

  // companies with a written profile get the long-form page: who they are, where they came from, the moments that shaped them, and our coverage
  const st = c.story;
  if (st) {
    const glance = (
      <dl className="divide-y divide-[#F0F1F3] text-[14px]">
        {rows.map(([k, v]) => <div key={k} className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 py-2.5"><dt className="text-neutral-500">{k}</dt><dd className="font-medium text-[#16181D]">{v}</dd></div>)}
        {st.products && st.products.length > 0 && <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 py-2.5"><dt className="text-neutral-500">{zh ? "代表产品" : "Known for"}</dt><dd className="font-medium text-[#16181D]">{st.products.join(zh ? "、" : ", ")}</dd></div>}
        {socials.length > 0 && (
          <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 py-2.5"><dt className="text-neutral-500">{zh ? "社交媒体" : "Social"}</dt>
            <dd className="flex gap-3">{socials.map(([k, label, url, d]) => (
              <a key={k} href={url((c as unknown as Social)[k]!)} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="text-[#16181D] hover:text-[#C2410C]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
              </a>))}</dd></div>
        )}
      </dl>
    );
    const credits = [st.cover?.credit, ...(st.people ?? []).map((x) => x.photo && x.credit ? `${x.name}: ${x.credit}` : null)].filter(Boolean) as string[];
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <nav className="text-[13px] text-neutral-500"><Link href="/" className="hover:text-[#16181D]">{zh ? "首页" : "Home"}</Link> › <Link href="/companies" className="hover:text-[#16181D]">{zh ? "公司" : "Companies"}</Link> › <span className="text-[#16181D]">{name}</span></nav>

        {/* hero */}
        <section className="mt-5 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div>
            <div className="flex items-center gap-4">
              <CompanyLogo name={c.name} url={c.logo_url} size={64} className="shrink-0 rounded-xl" priority />
              <div className="min-w-0">
                <h1 className="text-[40px] font-semibold leading-none tracking-[-0.035em] sm:text-[56px]">{name}</h1>
                {zh && c.name_zh && c.name_zh !== c.name && <div className="mt-1 text-[15px] text-neutral-500">{c.name}</div>}
              </div>
            </div>
            <p className="mt-4 text-[20px] leading-snug text-[#16181D]">{zh ? st.tagline_zh : st.tagline}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[13px]">
              {c.founded && <span className="rounded-full bg-[#F4F5F7] px-3 py-1.5 font-medium text-neutral-700">{zh ? `${c.founded} 年成立` : `Founded ${c.founded}`}</span>}
              {(zh ? c.hq_zh ?? c.hq : c.hq) && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F5F7] px-3 py-1.5 font-medium text-neutral-700">{c.country && <Flag code={c.country} size={10} />}{zh ? c.hq_zh ?? c.hq : c.hq}</span>}
              <span className="rounded-full bg-[#F4F5F7] px-3 py-1.5 font-medium text-neutral-700">{sectorLabel(c.sector, zh)}</span>
            </div>
            <div className="mt-6 flex flex-wrap items-start gap-3">
              {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#16181D] px-5 text-[14px] font-semibold text-white hover:bg-[#2B3038]">{zh ? "访问官网" : "Visit website"} ↗</a>}
              <FollowBox name={name} lang={l} companyId={c.id} variant="outline" short />
            </div>
          </div>
          {st.cover ? (
            <figure className="relative overflow-hidden rounded-3xl">
              <img src={st.cover.url} alt={name} className="aspect-[16/10] w-full object-cover" fetchPriority="high" />
              <figcaption className="absolute bottom-2 right-2 rounded-md bg-black/45 px-2 py-0.5 text-[10px] text-white/90"><a href={st.cover.link} target="_blank" rel="noopener noreferrer">Photo: {st.cover.credit}</a></figcaption>
            </figure>
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center rounded-3xl bg-[#FFFFFF] p-12 ring-1 ring-[#E5E7EB]"><CompanyLogo name={c.name} url={c.logo_url} size={200} /></div>
          )}
        </section>

        {/* origin + at a glance */}
        <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="rounded-2xl bg-[#F4F5F7] p-6 sm:p-8">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em]">{zh ? "起源" : "The origin"}</h2>
            {(zh ? st.origin_zh : st.origin).map((para, i) => <p key={i} className="mt-4 text-[15px] leading-relaxed text-neutral-700">{para}</p>)}
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-8">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em]">{zh ? "一览" : "At a glance"}</h2>
            <div className="mt-3">{glance}</div>
          </div>
        </section>

        {/* turning points */}
        <section className="mt-12">
          <h2 className="text-[24px] font-semibold tracking-[-0.02em]">{zh ? "关键时刻" : "Turning points"}</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {st.turning.map((tp) => (
              <li key={tp.year + tp.text} className="relative border-t-2 border-[#E5E7EB] pt-5">
                <span className="absolute -top-[7px] left-0 h-3 w-3 rounded-full bg-[#EA5514]" aria-hidden />
                <div className="text-[22px] font-semibold tracking-[-0.02em]">{tp.year}</div>
                <p className="mt-1.5 text-[14px] leading-snug text-neutral-600">{(zh ? tp.text_zh : tp.text).replace(/^\d{4}\s*年[，,]?\s*/, "")}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* people */}
        {st.people && st.people.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em]">{zh ? "关键人物" : "Key people"}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {st.people.map((x) => (
                <div key={x.name} className="flex items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4">
                  <Avatar src={x.photo} name={x.name} />
                  <div className="min-w-0"><div className="truncate text-[15px] font-semibold">{x.name}</div><div className="text-[13px] text-neutral-500">{zh ? x.role_zh : x.role}</div></div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* our coverage */}
        <section className="mt-12">
          <div className="flex items-baseline justify-between border-b border-[#E5E7EB] pb-3">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em]">{zh ? "coda.news 报道" : "On coda.news"}</h2>
            <span className="text-[13px] text-neutral-500">{zh ? `${events.length} 个事件 · ${countries.size} 个国家的媒体` : `${events.length} events · media in ${countries.size} countries`}</span>
          </div>
          {events.length ? events.slice(0, 12).map((e) => <NewsItem key={e.id} e={e} companies={companies} topics={tm} lang={l} />) : <p className="py-6 text-neutral-500">{zh ? "暂无报道。" : "No coverage yet."}</p>}
        </section>

        {similar.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em]">{zh ? "相似公司" : "Similar companies"}</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{similar.map(simRow)}</div>
          </section>
        )}

        <footer className="mt-12 border-t border-[#E5E7EB] pt-4 text-[12px] leading-relaxed text-neutral-500">
          {zh ? "资料来源：" : "Sources: "}{wiki && <a href={wiki} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#C2410C]">{zh ? "维基百科（CC BY-SA，由 coda.news 改写）" : "Wikipedia (CC BY-SA, rewritten by coda.news)"}</a>}
          {c.wikidata_id && <> · <a href={`https://www.wikidata.org/wiki/${c.wikidata_id}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#C2410C]">Wikidata</a></>}
          {credits.length > 0 && <div className="mt-1">{zh ? "图片：" : "Photos: "}{credits.join(" · ")}</div>}
        </footer>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav className="text-[13px] text-neutral-500"><Link href="/" className="hover:text-[#16181D]">{zh ? "首页" : "Home"}</Link> › <Link href="/companies" className="hover:text-[#16181D]">{zh ? "公司" : "Companies"}</Link> › <span className="text-[#16181D]">{name}</span></nav>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-6 sm:flex-row">
          <CompanyLogo name={c.name} url={c.logo_url} size={160} className="shrink-0" priority />
          <div className="min-w-0">
            <h1 className="text-[36px] font-semibold leading-tight tracking-[-0.03em]">{name}</h1>
            {zh && c.name_zh && c.name_zh !== c.name && <div className="text-[16px] text-neutral-500">{c.name}</div>}
            {desc && <p className="mt-1 text-[16px] text-neutral-600">{desc[0].toUpperCase() + desc.slice(1)}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#F4F5F7] px-3 py-1 text-[12px] font-medium text-neutral-700">{sectorLabel(c.sector, zh)}</span>
              {industry && !industry.toLowerCase().includes(sectorLabel(c.sector, zh).toLowerCase()) && !sectorLabel(c.sector, zh).toLowerCase().includes(industry.toLowerCase()) && <span className="rounded-full bg-[#F4F5F7] px-3 py-1 text-[12px] font-medium text-neutral-700">{industry}</span>}
            </div>
            <div className="mt-5 flex flex-wrap items-start gap-3">
              {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#16181D] px-5 text-[14px] font-semibold text-white hover:bg-[#2B3038]">{zh ? "访问官网" : "Visit website"} ↗</a>}
              <FollowBox name={name} lang={l} companyId={c.id} variant="outline" short />
            </div>
          </div>
        </div>
        {(rows.length > 0 || socials.length > 0) && (
          <aside className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <dl className="divide-y divide-[#F0F1F3] text-[14px]">
              {rows.map(([k, v]) => <div key={k} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-2.5"><dt className="text-neutral-500">{k}</dt><dd className="font-medium text-[#16181D]">{v}</dd></div>)}
              {socials.length > 0 && (
                <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-2.5"><dt className="text-neutral-500">{zh ? "社交媒体" : "Social media"}</dt>
                  <dd className="flex gap-3">{socials.map(([k, label, url, d]) => (
                    <a key={k} href={url((c as unknown as Social)[k]!)} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="text-[#16181D] hover:text-[#C2410C]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
                    </a>))}</dd></div>
              )}
            </dl>
            {c.wikidata_id && <p className="mt-3 text-[11px] text-neutral-400">{zh ? "资料来自 Wikidata（CC0），仅供参考。" : "Facts from Wikidata (CC0), for reference only."}</p>}
          </aside>
        )}
      </div>

      <div className="mt-10">
        <Tabs tabs={[
          { k: "overview", label: zh ? "概览" : "Overview", node: overview },
          { k: "news", label: zh ? `新闻（${events.length}）` : `News (${events.length})`, node: events.length ? <div>{events.map((e) => <NewsItem key={e.id} e={e} companies={companies} topics={tm} lang={l} />)}</div> : <p className="text-neutral-500">{zh ? "暂无报道。" : "No coverage yet."}</p> },
          { k: "similar", label: zh ? "相似公司" : "Similar companies", node: <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{similar.map(simRow)}</div> },
        ]} />
      </div>
    </div>
  );
}
