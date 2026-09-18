import { listCorrections } from "@/lib/data";
import { alternates, langFrom } from "@/lib/i18n";
import Link from "@/components/LLink";
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  return { title: l === "zh" ? "更正记录" : "Corrections", description: l === "zh" ? "coda.news 所有公开更正的记录。" : "A public log of every correction made on coda.news.", alternates: alternates("/corrections", l) };
}

const KIND: Record<string, [string, string]> = {
  removed_articles: ["Wrong articles removed", "移除错误归并的文章"], removed_facts: ["Wrong facts removed", "移除错误的事实"],
  merged: ["Duplicate merged", "合并重复页面"], reader_report: ["Reader report", "读者报告"], editorial: ["Editorial correction", "编辑更正"],
};

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params); const zh = l === "zh";
  const list = await listCorrections(150);
  const fmt = (d: string) => new Date(d).toLocaleString(zh ? "zh-CN" : "en-AU", { timeZone: "Australia/Melbourne", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="mx-auto max-w-[860px] px-4 py-12 sm:px-6">
      <h1 className="text-[40px] font-semibold tracking-[-0.03em]">{zh ? "更正记录" : "Corrections"}</h1>
      <p className="mt-3 max-w-[680px] text-[16px] leading-relaxed text-neutral-600">
        {zh ? "我们公开记录每一次更正：自动复查发现的错误归并、重复页面的合并，以及根据读者报告做的修改。修正后的事件会根据正确的事实重新生成。"
            : "Every correction is logged here in public: wrong articles caught by our automatic re-checks, duplicate pages merged, and changes made after reader reports. Corrected events are regenerated from the corrected facts."}
        {" "}<Link href="/about#corrections" className="text-[#C2410C] underline underline-offset-2">{zh ? "更正政策" : "Corrections policy"}</Link>
      </p>
      <ol className="mt-8 divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
        {list.length === 0 && <li className="py-8 text-neutral-500">{zh ? "暂无更正。" : "No corrections yet."}</li>}
        {list.map((c) => (
          <li key={c.id} className="py-4">
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <span className="rounded-full bg-[#FFF0EB] px-2.5 py-0.5 font-semibold text-[#C2410C]">{(KIND[c.kind] ?? [c.kind, c.kind])[zh ? 1 : 0]}</span>
              <time className="text-neutral-500" dateTime={c.created_at}>{fmt(c.created_at)}</time>
            </div>
            {c.event_slug ? <Link href={`/event/${c.event_slug}`} className="mt-1.5 block text-[16px] font-semibold leading-snug hover:text-[#C2410C]">{c.event_title}</Link> : <div className="mt-1.5 text-[16px] font-semibold">{c.event_title}</div>}
            <p className="mt-1 text-[14px] leading-relaxed text-neutral-600">{zh ? c.detail_zh ?? c.detail_en : c.detail_en}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
