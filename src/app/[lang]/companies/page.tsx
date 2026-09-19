import { regionName } from "@/lib/ui";
import Link from "@/components/LLink";
import { companyDirectory, notable, type CompanyCard } from "@/lib/data";
import { alternates, langFrom } from "@/lib/i18n";
import { Flag } from "@/components/Flag";
import { SearchBox } from "@/components/SearchBox";
import { CompanyLogo } from "@/components/companies/Logo";
import { Directory } from "@/components/companies/Directory";
import { SECTORS, SectorIcon, sectorLabel } from "@/components/companies/sectors";
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  return { title: l === "zh" ? "公司" : "Companies", description: l === "zh" ? "新闻里的公司：按行业和国家浏览，看各国媒体怎么报道它们。" : "The companies in the news, by industry and country, and how media in each country report on them.", alternates: alternates("/companies", l) };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params); const zh = l === "zh";
  const all = (await companyDirectory()).filter(notable);
  const cname = (c: string) => regionName(c, zh);
  const nameOf = (c: CompanyCard) => (zh && c.name_zh) || c.name;
  const week = Date.now() - 7 * 86400_000;
  const trending = [...all].filter((c) => c.last_at && Date.parse(c.last_at) > week && c.logo_url).sort((a, b) => b.events - a.events).slice(0, 10);
  const bySector = new Map<string, number>(); for (const c of all) bySector.set(c.sector ?? "other", (bySector.get(c.sector ?? "other") ?? 0) + 1);
  const sectors = SECTORS.filter((s) => bySector.get(s));
  const countries = [...new Set(all.map((c) => c.country).filter(Boolean) as string[])].map((c) => [c, cname(c)] as [string, string]).sort((a, b) => a[1].localeCompare(b[1], zh ? "zh-CN" : "en"));
  const popular = [...all].sort((a, b) => b.events - a.events).slice(0, 7);

  const card = (c: CompanyCard) => (
    <Link href={`/company/${c.slug}`} className="flex h-full items-center gap-3.5 rounded-2xl border border-[#E5E7EB] bg-white p-3.5 transition hover:border-[#F0A57F] hover:shadow-[0_4px_16px_rgba(0,0,0,.05)]">
      <CompanyLogo name={c.name} url={c.logo_url} size={56} className="shrink-0 rounded-xl" />
      <div className="min-w-0">
        <div className="truncate text-[15px] font-semibold text-[#16181D]">{nameOf(c)}</div>
        <div className="mt-0.5 truncate text-[12px] text-neutral-500">{sectorLabel(c.sector, zh)}</div>
        <div className="mt-1 flex items-center gap-1.5 text-[12px] text-neutral-500">
          {c.country && <><Flag code={c.country} size={10} /><span className="truncate">{cname(c.country)}</span><span>·</span></>}
          <span className="whitespace-nowrap">{c.events > 0 ? (zh ? `${c.events} 条新闻` : `${c.events} ${c.events === 1 ? "story" : "stories"}`) : (zh ? "暂无报道" : "No coverage yet")}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid items-end gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{zh ? "新闻里的公司" : "The companies in the news"}</div>
          <h1 className="mt-3 text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[52px]">{zh ? "每一家公司，" : "Every company,"}<br />{zh ? "全世界怎么看。" : "every perspective."}</h1>
          <p className="mt-4 max-w-[560px] text-[16px] leading-relaxed text-neutral-600">{zh ? "它们是谁、来自哪里，以及各国媒体最近怎么报道它们。" : "Who they are, where they come from, and how media in each country have been reporting on them."}</p>
        </div>
        <div>
          <SearchBox lang={l} variant="hero" placeholder={zh ? "搜索公司、话题或新闻…" : "Search companies, topics or news…"} />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-neutral-500">
            <span>{zh ? "热门：" : "Popular:"}</span>
            {popular.map((c) => <Link key={c.id} href={`/company/${c.slug}`} className="rounded-full bg-[#F4F5F7] px-3 py-1 font-medium text-neutral-700 hover:bg-[#ECEEF1]">{nameOf(c)}</Link>)}
          </div>
        </div>
      </section>

      <Directory
          sectorCards={sectors.map((s) => ({ k: s, node: (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white px-3 py-4 text-center hover:border-[#F0A57F]">
              <span className="flex justify-center text-[#16181D]"><SectorIcon s={s} /></span>
              <div className="mt-2 text-[13px] font-semibold text-[#16181D]">{sectorLabel(s, zh)}</div>
              <div className="text-[12px] text-neutral-500">{zh ? `${bySector.get(s)} 家` : `${bySector.get(s)} companies`}</div>
            </div>) }))}
          middle={<>
      {trending.length > 0 && (
            <section className="mt-12">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em]">{zh ? "本周热门" : "In the news this week"}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {trending.map((c) => (
                  <Link key={c.id} href={`/company/${c.slug}`} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 hover:border-[#F0A57F]">
                    <div className="flex h-[88px] items-center justify-center"><CompanyLogo name={c.name} url={c.logo_url} size={88} className="border-0" /></div>
                    <div className="mt-3 truncate text-[14px] font-semibold">{nameOf(c)}</div>
                    <div className="truncate text-[12px] text-neutral-500">{sectorLabel(c.sector, zh)}</div>
                    <div className="truncate text-[12px] text-neutral-500">{c.country ? cname(c.country) : ""}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
    
              </>}
          items={all.map((c) => ({ id: c.id, name: nameOf(c), sector: c.sector ?? "other", country: c.country, events: c.events, last: c.last_at ? Date.parse(c.last_at) : 0, node: card(c), indices: c.indices ?? [] }))}
          sectors={sectors.map((s) => [s, sectorLabel(s, zh)])}
          countries={countries.map(([c, label]) => [c, label, <Flag key={c} code={c} size={12} />])}
          t={{ heading: zh ? "全部公司" : "All companies", all: zh ? "全部" : "All", search: zh ? "按名称筛选" : "Filter by name", recent: zh ? "最近活跃" : "Most recent", az: "A-Z", allCountries: zh ? "所有国家和地区" : "All countries & regions",
               none: zh ? "没有符合条件的公司。" : "No companies match.", more: zh ? "加载更多" : "Load more", count: zh ? "{n} 家" : "{n} companies" }} />
    </div>
  );
}
