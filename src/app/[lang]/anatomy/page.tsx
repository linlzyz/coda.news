import Link from "@/components/LLink";
import { alternates, langFrom } from "@/lib/i18n";
import { PROFILES, pick } from "@/lib/anatomy";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  return {
    title: l === "zh" ? "Coda 剖面" : "Coda Anatomy",
    description: l === "zh" ? "切开一家公司、一个行业或一次转折：决定、数字、利益关系，以及各国怎么讲。" : "Cutting open one company, industry or turning point: the decisions, the numbers, and how each country tells it.",
    alternates: alternates("/anatomy", l),
  };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const zh = (await langFrom(params)) === "zh";
  return (
    <div className="mx-auto max-w-[760px] px-4 py-12 sm:px-6">
      <h1 className="text-[40px] font-semibold tracking-[-0.03em]">{zh ? "Coda 剖面" : "Coda Anatomy"}</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-neutral-700">
        {zh ? "切开一家公司、一个行业或一次转折，看清其中的决定、数字、利益关系，以及不同国家的讲法。每个数字都附来源。" : "We cut open one company, industry or turning point to show the decisions, the numbers, the interests involved and how different countries tell the story. Every number links to its source."}
      </p>
      <ul className="mt-8 divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
        {PROFILES.map((p) => (
          <li key={p.slug}>
            <Link href={`/anatomy/${p.slug}`} className="group block py-5">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#C2410C]">{String(p.no).padStart(2, "0")}</span>
              <span className="mt-1 block text-[24px] font-semibold tracking-[-0.02em] text-[#16181D] group-hover:text-[#C2410C]">{pick(p.title, zh)}</span>
              <span className="mt-1 block text-[15px] text-neutral-600">{pick(p.dek, zh)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
