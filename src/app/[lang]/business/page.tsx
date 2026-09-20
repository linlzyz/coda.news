import Link from "@/components/LLink";
import { getCompany, getPerspectives, listEvents } from "@/lib/data";
import { alternates, langFrom } from "@/lib/i18n";
import { countryL, persp as perspL, title } from "@/lib/loc";
import { Flag } from "@/components/Flag";
import { SITE } from "@/lib/site";
export const revalidate = 21600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  return { title: l === "zh" ? "商务合作：品牌媒体报道监测" : "For business: media coverage monitoring", alternates: alternates("/business", l),
    description: l === "zh" ? "每周一份报告：各国媒体怎么报道你的品牌、竞争对手和行业。" : "A weekly report on how outlets in each country cover your brand, your competitors and your industry." };
}

// For companies, PR teams and researchers: what the monitoring report is, a live sample built from real data, and how to start a pilot.
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params); const zh = l === "zh";
  const SAMPLE = "apple";
  const co = await getCompany(SAMPLE);
  const events = co ? (await listEvents({ companyId: co.id, limit: 40, sinceHours: 24 * 7 })) : [];
  const persp = await getPerspectives(events.map((e) => e.id));
  const countries = new Map<string, number>();
  for (const e of events) for (const c of e.countries) countries.set(c, (countries.get(c) ?? 0) + 1);
  const topC = [...countries].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const multi = events.filter((e) => (persp.get(e.id)?.length ?? 0) >= 2).sort((a, b) => (persp.get(b.id)?.length ?? 0) - (persp.get(a.id)?.length ?? 0)).slice(0, 3);
  const tones = { positive: 0, neutral: 0, negative: 0 } as Record<string, number>;
  for (const ps of persp.values()) for (const p of ps) tones[p.tone] = (tones[p.tone] ?? 0) + 1;
  const tTotal = Object.values(tones).reduce((a, b) => a + b, 0) || 1;
  const mail = `mailto:${SITE.email}?subject=${encodeURIComponent(zh ? "coda.news 报道监测试点" : "coda.news monitoring pilot")}`;

  const T = zh ? {
    kicker: "商务合作", h1: "各国媒体怎么报道你的品牌？",
    lede: "每周一份报告：你的品牌、你的竞争对手、你所在的行业，在 17 个国家和地区的媒体里被怎么报道，哪些内容各国都一样，哪些地方侧重不同。",
    who: "适合谁", whoList: ["品牌方和市场团队", "公关和传播公司", "研究机构和咨询公司", "关注特定公司或行业的投资者"],
    what: "每周报告包含", whatList: ["本周所有提到你品牌的报道，按事件归并，附原文链接", "哪些国家在报道、报道量的变化", "各国报道的整体语气（支持、描述、审慎）", "共同事实与各国侧重，一目了然", "竞争对手和行业的同期对比", "需要留意的新话题或负面苗头"],
    sample: "样品：真实数据", sampleSub: `${co?.name ?? "Apple"} · 过去 7 天 · 每天自动更新`,
    stories: "相关报道事件", cs: "覆盖国家", tone: "各国报道语气", byCountry: "按国家的报道量", compared: "多国报道的事件",
    toneL: { positive: "支持性", neutral: "描述性", negative: "审慎性" },
    principle: "独立性原则", principleText: "报告服务和网站新闻完全分开。客户付费购买的是报告，不会影响 coda.news 网站上报道什么、怎么呈现：没有付费置顶，没有软文，没有付费下架。我们只描述各国媒体怎么报道，不评判，也不替任何一方发声。",
    pilot: "试点合作", pilotText: "目前开放少量试点名额：免费试用 4 周，每周一份报告，之后再决定是否继续。", cta: "申请试点", note: `或发邮件到 ${SITE.email}，写上你的品牌和想关注的竞争对手。`,
    how: "报告基于公开新闻源，由 AI 归并和摘要，并经过抽检核对。所有内容附原文链接，便于核实。",
  } : {
    kicker: "For business", h1: "How do outlets in each country cover your brand?",
    lede: "A weekly report on how media in 17 countries and regions cover your brand, your competitors and your industry: what every report shares, and where the coverage puts the weight differently.",
    who: "Who it is for", whoList: ["Brands and marketing teams", "PR and communications agencies", "Researchers and consultancies", "Investors following a company or sector"],
    what: "Each weekly report includes", whatList: ["Every report that mentions your brand this week, grouped by event, with links to the originals", "Which countries are covering you, and how the volume changes", "The overall tone of each country's coverage (supportive, descriptive, cautious)", "What all reports share, and where the coverage differs", "The same view for your competitors and your industry", "New topics or early warning signs worth a look"],
    sample: "Sample: live data", sampleSub: `${co?.name ?? "Apple"} · last 7 days · updated daily`,
    stories: "Events covered", cs: "Countries", tone: "Tone of coverage", byCountry: "Coverage by country", compared: "Events covered in several countries",
    toneL: { positive: "Supportive", neutral: "Descriptive", negative: "Cautious" },
    principle: "Independence", principleText: "The report service is kept apart from the news on coda.news. Clients pay for the report; nobody can pay to change what the site covers or how: no paid placement, no sponsored stories, no paid removal. We describe how outlets in each country report a story. We do not judge it or speak for anyone.",
    pilot: "Pilot", pilotText: "A few pilot places are open: four weeks free, one report a week, then decide whether to continue.", cta: "Apply for a pilot", note: `Or email ${SITE.email} with your brand and the competitors you want to follow.`,
    how: "Reports are built from public news sources, grouped and summarised by AI and checked by sampling. Every item links to the original so it can be verified.",
  };
  const toneColor: Record<string, string> = { positive: "#047857", neutral: "#6B7280", negative: "#BE123C" };

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-12 sm:px-6">
      <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#C2410C]">{T.kicker}</div>
      <h1 className="mt-3 max-w-[720px] text-[36px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#16181D] sm:text-[48px]">{T.h1}</h1>
      <p className="mt-4 max-w-[680px] text-[17px] leading-relaxed text-neutral-600">{T.lede}</p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <a href={mail} className="inline-flex items-center gap-2 rounded-xl bg-[#EA5514] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#D24A0F]">{T.cta} →</a>
        <span className="text-[13px] text-neutral-500">{T.pilotText}</span>
      </div>

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        <section><h2 className="text-[20px] font-semibold tracking-[-0.02em]">{T.who}</h2>
          <ul className="mt-4 space-y-2.5 text-[15px] text-neutral-700">{T.whoList.map((x) => <li key={x} className="flex gap-3"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#EA5514]" />{x}</li>)}</ul></section>
        <section><h2 className="text-[20px] font-semibold tracking-[-0.02em]">{T.what}</h2>
          <ul className="mt-4 space-y-2.5 text-[15px] text-neutral-700">{T.whatList.map((x) => <li key={x} className="flex gap-3"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#EA5514]" />{x}</li>)}</ul></section>
      </div>

      {/* live sample: the same numbers a client report is built from */}
      <section className="mt-14 rounded-3xl border border-[#E5E7EB] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em]">{T.sample}</h2>
          <span className="text-[13px] text-neutral-500">{T.sampleSub}</span>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div><div className="text-[32px] font-semibold tabular-nums tracking-[-0.03em]">{events.length}</div><div className="text-[13px] text-neutral-500">{T.stories}</div></div>
          <div><div className="text-[32px] font-semibold tabular-nums tracking-[-0.03em]">{countries.size}</div><div className="text-[13px] text-neutral-500">{T.cs}</div></div>
          <div className="col-span-2">
            <div className="text-[13px] text-neutral-500">{T.tone}</div>
            <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-[#F4F5F7]">{(["positive", "neutral", "negative"] as const).map((k) => <div key={k} style={{ width: `${(tones[k] / tTotal) * 100}%`, background: toneColor[k] }} />)}</div>
            <div className="mt-2 flex gap-4 text-[12px] text-neutral-600">{(["positive", "neutral", "negative"] as const).map((k) => <span key={k} className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: toneColor[k] }} />{T.toneL[k]} {Math.round((tones[k] / tTotal) * 100)}%</span>)}</div>
          </div>
        </div>
        {topC.length > 0 && (
          <div className="mt-8">
            <div className="text-[13px] font-semibold text-[#16181D]">{T.byCountry}</div>
            <div className="mt-3 space-y-2">{topC.map(([c, n]) => (
              <div key={c} className="grid grid-cols-[140px_minmax(0,1fr)_32px] items-center gap-3 text-[13px]">
                <span className="flex items-center gap-2 truncate"><Flag code={c} size={11} />{countryL(c, l)}</span>
                <div className="h-2 rounded-full bg-[#F4F5F7]"><div className="h-2 rounded-full bg-[#EA5514]" style={{ width: `${(n / topC[0][1]) * 100}%` }} /></div>
                <span className="text-right tabular-nums text-neutral-500">{n}</span>
              </div>))}</div>
          </div>
        )}
        {multi.length > 0 && (
          <div className="mt-8">
            <div className="text-[13px] font-semibold text-[#16181D]">{T.compared}</div>
            <div className="mt-3 divide-y divide-[#E5E7EB]">{multi.map((e) => (
              <div key={e.id} className="py-3">
                <Link href={`/event/${e.slug}`} className="text-[15px] font-medium hover:text-[#C2410C]">{title(e, l)}</Link>
                <div className="mt-2 flex flex-wrap gap-2">{(persp.get(e.id) ?? []).slice(0, 4).map((p) => (
                  <span key={p.country} className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F5F7] px-2.5 py-1 text-[12px] text-neutral-700"><Flag code={p.country} size={10} />{perspL(p, l).framing}</span>))}</div>
              </div>))}</div>
          </div>
        )}
        <p className="mt-6 text-[12px] text-neutral-500">{T.how}</p>
      </section>

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        <section><h2 className="text-[20px] font-semibold tracking-[-0.02em]">{T.principle}</h2><p className="mt-3 text-[15px] leading-relaxed text-neutral-700">{T.principleText}</p></section>
        <section className="rounded-2xl bg-[#FFF6F0] p-6"><h2 className="text-[20px] font-semibold tracking-[-0.02em]">{T.pilot}</h2><p className="mt-3 text-[15px] leading-relaxed text-neutral-700">{T.pilotText}</p>
          <a href={mail} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#EA5514] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#D24A0F]">{T.cta} →</a>
          <p className="mt-3 text-[13px] text-neutral-500">{T.note}</p></section>
      </div>
    </div>
  );
}
