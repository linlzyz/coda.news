import { allSources } from "@/lib/data";
import { alternates, COUNTRY_ZH, langFrom } from "@/lib/i18n";
import { COUNTRY } from "@/lib/ui";
import { Flag } from "@/components/Flag";
import Link from "@/components/LLink";
export const revalidate = 3600;

const LANG: Record<string, [string, string]> = {
  en: ["English", "英语"], zh: ["Chinese", "中文"], ja: ["Japanese", "日语"], ko: ["Korean", "韩语"], de: ["German", "德语"],
  fr: ["French", "法语"], es: ["Spanish", "西班牙语"], it: ["Italian", "意大利语"],
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  return { title: l === "zh" ? "新闻来源" : "Our sources", description: l === "zh" ? "coda.news 使用的全部新闻来源，按国家列出。" : "Every news source coda.news reads, listed by country.", alternates: alternates("/sources", l) };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  const zh = l === "zh";
  const sources = await allSources();
  const byCountry = new Map<string, typeof sources>();
  for (const s of sources) byCountry.set(s.country, [...(byCountry.get(s.country) ?? []), s]);
  const name = (c: string) => (zh ? COUNTRY_ZH[c] : COUNTRY[c]) ?? c;
  const countries = [...byCountry.keys()].sort((a, b) => (byCountry.get(b)!.length - byCountry.get(a)!.length) || name(a).localeCompare(name(b)));
  const langs = new Set(sources.map((s) => s.language));
  return (
    <div className="mx-auto max-w-[960px] px-4 py-12 sm:px-6">
      <h1 className="text-[40px] font-semibold tracking-[-0.03em]">{zh ? "新闻来源" : "Our sources"}</h1>
      <p className="mt-3 max-w-[680px] text-[16px] leading-relaxed text-neutral-600">
        {zh
          ? `coda.news 目前读取 ${countries.length} 个国家和地区、${langs.size} 种语言的 ${sources.length} 个公开新闻源。每个国家的视角只来自该国自己的媒体。我们只做摘要并链接原文，不转载文章，也不绕过付费墙。`
          : `coda.news currently reads ${sources.length} public news feeds from ${countries.length} countries and regions in ${langs.size} languages. Each country's perspective comes only from that country's own media. We summarise and link to the originals; we never republish articles or bypass paywalls.`}
        {" "}<Link href="/about#sources" className="text-[#C2410C] underline underline-offset-2">{zh ? "了解方法" : "How we use them"}</Link>
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {countries.map((c) => (
          <section key={c} className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold"><Flag code={c} size={18} />{name(c)}<span className="ml-auto text-[12px] font-normal text-neutral-500">{byCountry.get(c)!.length}</span></h2>
            <ul className="mt-3 space-y-1.5 text-[14px]">
              {byCountry.get(c)!.map((s) => (
                <li key={s.name} className="flex items-center gap-2">
                  {s.homepage ? <a href={s.homepage} target="_blank" rel="noopener noreferrer" className="hover:text-[#C2410C] hover:underline">{s.name}</a> : s.name}
                  {s.type === "official" && <span className="rounded-full bg-[#FFF0EB] px-2 py-0.5 text-[11px] font-medium text-[#C2410C]">{zh ? "官方" : "Official"}</span>}
                  <span className="ml-auto text-[12px] text-neutral-400">{(LANG[s.language] ?? [s.language, s.language])[zh ? 1 : 0]}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
