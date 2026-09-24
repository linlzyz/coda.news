import { notFound } from "next/navigation";
import Link from "@/components/LLink";
import { alternates, langFrom } from "@/lib/i18n";
import { companyMap, listEvents } from "@/lib/data";
import { SITE, orgLd } from "@/lib/site";
import { regionName } from "@/lib/ui";
import { Flag } from "@/components/Flag";
import { NewsItem } from "@/components/NewsItem";
import { PROFILES, getProfile, money, photoPage, photoUrl, pick, type Figure, type Photo, type Profile, type Source } from "@/lib/anatomy";
import { CapChart, Chiplet, CountUp, Deals, RevenueBars, TimelineRow, VsIntel } from "@/components/anatomy/Charts";

export const revalidate = 3600;
export function generateStaticParams() { return PROFILES.map((p) => ({ slug: p.slug })); }
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/[lang]/anatomy/[slug]">) {
  const p = await params;
  const pr = getProfile(p.slug);
  if (!pr) return {};
  const zh = p.lang === "zh";
  return {
    title: { absolute: `${pick(pr.seoTitle, zh)} | ${zh ? "Coda 剖面" : "Coda Anatomy"} · coda.news` },
    description: pick(pr.seoDesc, zh),
    keywords: pr.keywords,
    alternates: alternates(`/anatomy/${pr.slug}`, zh ? "zh" : "en"),
    openGraph: { type: "article", title: pick(pr.title, zh), description: pick(pr.dek, zh), publishedTime: pr.published, modifiedTime: pr.updated, images: [{ url: photoUrl(pr.cover.file, 1200), alt: pick(pr.cover.alt, zh) }] },
    twitter: { card: "summary_large_image", images: [photoUrl(pr.cover.file, 1200)] },
  };
}

/** Text with [[n]] source markers → superscript links to the source list. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[\[\d+\]\])/);
  return <>{parts.map((s, i) => {
    const m = s.match(/^\[\[(\d+)\]\]$/);
    return m ? <sup key={i} className="ml-[1px]"><a href={`#src-${m[1]}`} className="ana-cite">{m[1]}</a></sup> : <span key={i}>{s}</span>;
  })}</>;
}
const Cites = ({ ns }: { ns: number[] }) => <>{ns.map((n) => <sup key={n} className="ml-[1px]"><a href={`#src-${n}`} className="ana-cite">{n}</a></sup>)}</>;

function Credit({ p, zh, light }: { p: Photo; zh: boolean; light?: boolean }) {
  return <a href={photoPage(p.file)} target="_blank" rel="noopener noreferrer" className={`hover:underline ${light ? "text-white/60" : "text-neutral-400"}`}>{zh ? "照片：" : "Photo: "}{p.credit} / Wikimedia Commons ({p.license})</a>;
}

function PhotoFig({ p, zh }: { p: Photo; zh: boolean }) {
  const contain = p.fit === "contain";
  return (
    <figure className="my-6">
      <div className={`overflow-hidden rounded-2xl ${contain ? "bg-[#F4F5F7] p-4 sm:p-6" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl(p.file, 1400)} alt={pick(p.alt, zh)} loading="lazy" decoding="async"
          className={contain ? "mx-auto block max-h-[320px] w-auto max-w-full object-contain" : "block aspect-[16/9] w-full object-cover"} />
      </div>
      <figcaption className="mt-2 text-[12.5px] leading-relaxed text-neutral-500">{pick(p.caption, zh)} <Credit p={p} zh={zh} /></figcaption>
    </figure>
  );
}

function FigureFor({ f, pr, zh }: { f: Figure; pr: Profile; zh: boolean }) {
  switch (f) {
    case "cap": return <CapChart pts={pr.cap} zh={zh} marks={[
      { x: 2014.77, label: zh ? "2014.10 苏姿丰出任 CEO" : "Oct 2014: Lisa Su becomes CEO" },
      { x: 2017.17, label: zh ? "2017.3 首批 Zen 芯片上市" : "Mar 2017: first Zen chips" },
      { x: 2019.5, label: zh ? "2019 Zen 2 小芯片，台积电生产" : "2019: Zen 2 chiplets, made by TSMC" },
      { x: 2022.12, label: zh ? "2022.2 完成收购 Xilinx" : "Feb 2022: Xilinx deal closes" },
      { x: 2023.93, label: zh ? "2023.12 发布 MI300X" : "Dec 2023: MI300X launched" },
      { x: 2025.76, label: zh ? "2025.10 OpenAI 6 吉瓦协议" : "Oct 2025: OpenAI 6 GW deal" },
      { x: 2026.72, label: zh ? "2026.9.21 市值破 1 万亿美元" : "21 Sep 2026: $1 trillion" },
    ]} />;
    case "chiplet": return <Chiplet zh={zh} />;
    case "revenue": return <RevenueBars rows={pr.revenue} zh={zh} />;
    case "vsintel": return <VsIntel amd={pr.cap} intel={pr.intel} zh={zh} />;
    case "deals": return <Deals deals={pr.deals} zh={zh} />;
    case "timeline": return (
      <ol className="mt-5">
        {pr.timeline.map((t, i) => <TimelineRow key={i} date={pick(t.date, zh)} last={i === pr.timeline.length - 1}>{pick(t.text, zh)}<Cites ns={t.src} /></TimelineRow>)}
      </ol>
    );
    case "countries": return (
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {pr.countries.map((c) => (
          <div key={c.code} className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
            <div className="flex items-center gap-2">
              <Flag code={c.code} size={14} />
              <span className="text-[14px] font-semibold text-[#16181D]">{regionName(c.code, zh)}</span>
              <span className="ml-auto text-[12px] text-neutral-500">{zh ? `${c.count} 篇` : `${c.count} ${c.count === 1 ? "article" : "articles"}`}</span>
            </div>
            {c.count === 1 && <span className="mt-2 inline-block rounded-full bg-[#F4F5F7] px-2 py-0.5 text-[11px] text-neutral-600">{zh ? "报道有限" : "Limited coverage"}</span>}
            <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-700">{pick(c.focus, zh)}</p>
            <ul className="mt-3 space-y-1.5 border-t border-[#F0F1F3] pt-3">
              {c.headlines.map((h) => (
                <li key={h.url} className="text-[12.5px] leading-snug">
                  <a href={h.url} target="_blank" rel="noopener noreferrer" className="text-neutral-800 hover:text-[#C2410C]">{h.t} <span aria-hidden>↗</span></a>
                  <span className="block text-[11.5px] text-neutral-500">{h.outlet}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11.5px] text-neutral-500">{zh ? "来源：" : "Outlets: "}{c.outlets}</p>
          </div>
        ))}
      </div>
    );
  }
}

export default async function Page({ params }: PageProps<"/[lang]/anatomy/[slug]">) {
  const p = await params;
  const pr = getProfile(p.slug);
  if (!pr) notFound();
  const l = await langFrom(params);
  const zh = l === "zh";
  // only stories that are actually about the company, not ones that merely mention it
  const events = (await listEvents({ companyId: pr.companyId, order: "recent", limit: 40 }).catch(() => []))
    .filter((e) => /\bAMD\b|Advanced Micro Devices|超威/i.test(`${e.title} ${(e as { title_zh?: string | null }).title_zh ?? ""}`)).slice(0, 6);
  const companies = await companyMap(events).catch(() => undefined);
  const used = new Set<number>();
  const collect = (s: string) => { for (const m of s.matchAll(/\[\[(\d+)\]\]/g)) used.add(Number(m[1])); };
  pr.lede.forEach((x) => collect(pick(x, zh)));
  pr.sections.forEach((s) => s.paras.forEach((x) => collect(pick(x, zh))));
  pr.timeline.forEach((t) => t.src.forEach((n) => used.add(n)));
  pr.stats.forEach((t) => t.src.forEach((n) => used.add(n)));
  const sources: Source[] = pr.sources.filter((s) => used.has(s.n) || [7, 8, 9, 13, 17].includes(s.n));
  const url = `${SITE.url}${zh ? "/zh" : ""}/anatomy/${pr.slug}`;
  const ld = {
    "@context": "https://schema.org", "@type": "Article", headline: pick(pr.seoTitle, zh), alternativeHeadline: pick(pr.title, zh),
    datePublished: pr.published, dateModified: pr.updated, inLanguage: zh ? "zh-CN" : "en", mainEntityOfPage: url, isAccessibleForFree: true,
    about: { "@type": "Corporation", name: "AMD", legalName: "Advanced Micro Devices, Inc." },
    author: { "@type": "Organization", name: SITE.name, url: SITE.url }, publisher: orgLd,
    isPartOf: { "@type": "CreativeWorkSeries", name: zh ? "Coda 剖面" : "Coda Anatomy", url: `${SITE.url}${zh ? "/zh" : ""}/anatomy` },
    citation: sources.map((s) => s.url),
  };
  const date = new Date(pr.updated).toLocaleDateString(zh ? "zh-CN" : "en-AU", { day: "numeric", month: "long", year: "numeric" });
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ ...ld, image: photoUrl(pr.cover.file, 1600), keywords: pr.keywords.join(", "), description: pick(pr.seoDesc, zh) }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "coda.news", item: `${SITE.url}${zh ? "/zh" : ""}` },
        { "@type": "ListItem", position: 2, name: zh ? "Coda 剖面" : "Coda Anatomy", item: `${SITE.url}${zh ? "/zh" : ""}/anatomy` },
        { "@type": "ListItem", position: 3, name: pick(pr.title, zh), item: url },
      ] }) }} />
      <header className="relative isolate overflow-hidden bg-[#08090B] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl(pr.cover.file, 2000)} alt={pick(pr.cover.alt, zh)} fetchPriority="high"
          className="ana-hero-img absolute inset-y-0 right-0 -z-10 h-full w-full object-cover opacity-80 sm:w-[78%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#08090B] via-[#08090B]/80 to-transparent" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#08090B] via-transparent to-transparent" />
        <div className="mx-auto flex min-h-[460px] max-w-[1080px] flex-col justify-end px-4 pb-10 pt-24 sm:min-h-[560px] sm:px-8 sm:pb-14">
          <Link href="/anatomy" className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#FF8A50]">
            {zh ? `Coda 剖面 ${String(pr.no).padStart(2, "0")}` : `Coda Anatomy ${String(pr.no).padStart(2, "0")}`}
          </Link>
          <h1 className="mt-3 max-w-[720px] text-[36px] font-semibold leading-[1.05] tracking-[-0.035em] text-white [word-break:keep-all] sm:text-[72px] sm:leading-[1.02]">{pick(pr.title, zh)}</h1>
          <p className="mt-4 max-w-[600px] text-[18px] leading-snug text-white/80 sm:text-[21px]">{pick(pr.dek, zh)}</p>
          <p className="mt-5 text-[12.5px] text-white/60">{date} · {zh ? "AI 辅助整理，人工核对" : "AI-assisted, checked by an editor"}</p>
          <p className="mt-6 max-w-[560px] text-[11.5px] leading-snug text-white/50">{pick(pr.cover.caption, zh)} <Credit p={pr.cover} zh={zh} light /></p>
        </div>
      </header>
      <div className="mx-auto max-w-[760px] px-4 pb-14 sm:px-6">

      <div className="-mt-6 relative grid gap-3 sm:grid-cols-3">
        {pr.stats.map((s, i) => (
          <div key={i} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_24px_-12px_rgba(0,0,0,.25)]">
            <div className="text-[12px] font-medium text-neutral-600">{pick(s.label, zh)}<Cites ns={s.src} /></div>
            <div className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.03em] text-[#16181D]"><CountUp from={s.from} to={s.to} unit={s.unit} zh={zh} /></div>
            <div className="mt-2 text-[12px] text-neutral-500">
              {s.unit === "bn" ? `${pick(s.fromLabel, zh)} ${money(s.from, zh)} → ${pick(s.toLabel, zh)}` : pick(s.toLabel, zh)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-4 text-[17px] leading-[1.7] text-neutral-800">
        {pr.lede.map((x, i) => <p key={i}><Rich text={pick(x, zh)} /></p>)}
      </div>

      {pr.sections.map((s) => (
        <section key={s.id} id={s.id} className="mt-12 scroll-mt-24">
          <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-[#16181D]">{pick(s.h, zh)}</h2>
          {s.photo && <PhotoFig p={s.photo} zh={zh} />}
          <div className="mt-3 space-y-4 text-[16.5px] leading-[1.7] text-neutral-800">
            {s.paras.map((x, i) => <p key={i}><Rich text={pick(x, zh)} /></p>)}
          </div>
          {s.figure && <FigureFor f={s.figure} pr={pr} zh={zh} />}
        </section>
      ))}

      <section className="mt-14 border-t border-[#E5E7EB] pt-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#16181D]">{zh ? "AMD 最新动态" : "Latest on AMD"}</h2>
          <Link href={`/company/${pr.companySlug}`} className="shrink-0 text-[13px] font-medium text-[#C2410C] hover:underline">{zh ? "公司页 →" : "Company page →"}</Link>
        </div>
        <p className="mt-1 text-[13px] text-neutral-500">{zh ? "这一段自动更新，来自 coda.news 追踪的各国报道。" : "This part updates by itself from the coverage coda.news tracks."}</p>
        <div className="mt-3">{events.length ? events.map((e) => <NewsItem key={e.id} e={e} companies={companies} lang={l} />) : <p className="py-4 text-neutral-500">{zh ? "暂无报道。" : "No coverage yet."}</p>}</div>
      </section>

      <section className="mt-12 border-t border-[#E5E7EB] pt-6">
        <h2 className="text-[16px] font-semibold text-[#16181D]">{zh ? "来源" : "Sources"}</h2>
        <ol className="mt-3 space-y-1.5 text-[13px] text-neutral-600">
          {sources.map((s) => (
            <li key={s.n} id={`src-${s.n}`} className="scroll-mt-24">
              <span className="mr-1.5 tabular-nums text-neutral-400">{s.n}.</span>{s.name}: <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-neutral-300 underline-offset-2 hover:text-[#C2410C]">{s.title}</a>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-[12.5px] leading-relaxed text-neutral-500">
          {zh
            ? "写法：本文由 AI 根据上列来源整理，编辑逐条核对。市值为年末数据，可能与其他数据商略有出入。本文不构成投资建议。发现错误请写信到 "
            : "Method: drafted with AI from the sources above and checked line by line by an editor. Market values are year-end figures and may differ slightly between data providers. This is not investment advice. Found a mistake? Email "}
          <a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a>{zh ? "。" : "."}
        </p>
      </section>
      </div>
    </article>
  );
}
