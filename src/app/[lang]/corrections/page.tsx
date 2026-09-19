import { correctionStats, listCorrections } from "@/lib/data";
import { alternates, langFrom } from "@/lib/i18n";
import Link from "@/components/LLink";
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  return { title: l === "zh" ? "核实与更正" : "Checks and corrections", description: l === "zh" ? "coda.news 公开记录每一次核实和更正。" : "A public log of every check and correction on coda.news.", alternates: alternates("/corrections", l) };
}

const KIND: Record<string, [string, string]> = {
  removed_articles: ["Wrong articles removed", "移除错误归并的文章"], removed_facts: ["Wrong facts removed", "移除错误的事实"],
  merged: ["Duplicate merged", "合并重复页面"], verified: ["Checked, no change needed", "已核实，无需更正"], reader_report: ["Reader report", "读者报告"], editorial: ["Editorial correction", "编辑更正"],
};

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params); const zh = l === "zh";
  const [list, stats] = await Promise.all([listCorrections(150), correctionStats()]);
  const fmt = (d: string) => new Date(d).toLocaleString(zh ? "zh-CN" : "en-AU", { timeZone: "Australia/Melbourne", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="mx-auto max-w-[860px] px-4 py-12 sm:px-6">
      <h1 className="text-[40px] font-semibold tracking-[-0.03em]">{zh ? "核实与更正" : "Checks and corrections"}</h1>
      <p className="mt-3 max-w-[680px] text-[16px] leading-relaxed text-neutral-600">
        {zh ? "多国报道的事件会被反复复查：报道是否真的在讲同一件事、事实是否属于这个事件。查过没问题的记为“已核实”，发现问题的会修正并公开说明，修正后的页面会根据正确的事实重新生成。"
            : "Stories covered in several countries are re-checked again and again: do the reports really cover the same event, do the facts belong to it. Clean checks are logged as verified; problems are fixed and explained here, and the page is regenerated from the corrected facts."}
        {" "}<Link href="/about#corrections" className="text-[#C2410C] underline underline-offset-2">{zh ? "更正政策" : "Corrections policy"}</Link>
      </p>
      <div className="mt-6 grid max-w-[520px] grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#ECFDF5] p-4"><div className="text-[28px] font-semibold text-[#0F766E]">{stats.verified}</div><div className="text-[13px] text-neutral-600">{zh ? "过去 7 天核实无误" : "checked, no change (7 days)"}</div></div>
        <div className="rounded-2xl bg-[#FFF0EB] p-4"><div className="text-[28px] font-semibold text-[#C2410C]">{stats.corrected}</div><div className="text-[13px] text-neutral-600">{zh ? "过去 7 天公开更正" : "corrections (7 days)"}</div></div>
      </div>
      <ol className="mt-8 divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
        {list.length === 0 && <li className="py-8 text-neutral-500">{zh ? "暂无更正。" : "No corrections yet."}</li>}
        {list.map((c) => (
          <li key={c.id} className="py-4">
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <span className={`rounded-full px-2.5 py-0.5 font-semibold ${c.kind === "verified" ? "bg-[#ECFDF5] text-[#0F766E]" : "bg-[#FFF0EB] text-[#C2410C]"}`}>{(KIND[c.kind] ?? [c.kind, c.kind])[zh ? 1 : 0]}</span>
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
