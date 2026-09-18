import { getPerspectives, listEvents } from "@/lib/data";
import { langFrom } from "@/lib/i18n";
import { CopyText } from "@/components/CopyText";
export const revalidate = 600;
export const metadata = { title: "Social posts", robots: { index: false, follow: false } };

// Internal page: today's best stories as ready-to-post 4:5 carousels (cover + country comparison) with captions.
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params); const zh = l === "zh"; const p = zh ? "/zh" : "";
  const events = (await listEvents({ limit: 60 })).filter((e) => Date.now() - Date.parse(e.last_article_at) < 36 * 3600_000);
  const persp = await getPerspectives(events.map((e) => e.id));
  const picks = events.filter((e) => (persp.get(e.id)?.length ?? 0) >= 3).slice(0, 6);
  const tag = (c: string) => zh ? ({ technology: "#科技", economy: "#经济", sport: "#体育", entertainment: "#娱乐", fashion: "#时尚" } as Record<string, string>)[c] ?? "" : `#${c}`;
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <h1 className="text-[32px] font-semibold tracking-[-0.02em]">{zh ? "社交媒体素材" : "Social posts"}</h1>
      <p className="mt-2 text-[14px] text-neutral-600">{zh ? "过去 36 小时里至少 3 个国家报道的事件。每条两张 4:5 图（封面 + 各国对比），附文案。" : "Stories from the last 36 hours covered by at least 3 countries. Two 4:5 slides each (cover + country comparison), with a caption."}</p>
      <div className="mt-8 space-y-10">
        {picks.map((e) => {
          const title = (zh && e.title_zh) || e.title;
          const cs = (persp.get(e.id) ?? []).length;
          const url = `https://coda.news${p}/event/${e.slug}`;
          const caption = zh
            ? `${title}\n\n${cs} 个国家的媒体怎么报道这件事？各国侧重点不一样。\n\n完整对比：${url}\n\n${tag(e.category)} #国际新闻 #codanews`
            : `${title}\n\nHow media in ${cs} countries reported it, side by side.\n\nFull comparison: ${url}\n\n${tag(e.category)} #news #worldnews #codanews`;
          return (
            <section key={e.id} className="grid gap-4 border-t border-[#E5E7EB] pt-6 md:grid-cols-[1fr_1fr_1.1fr]">
              {[1, 2].map((s) => (
                <a key={s} href={`${p}/event/${e.slug}/social?s=${s}`} download={`coda.news-${e.slug}${zh ? "-zh" : ""}-${s}.png`} className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${p}/event/${e.slug}/social?s=${s}`} alt="" loading="lazy" className="aspect-[4/5] w-full rounded-xl border border-[#E5E7EB] object-cover" />
                  <span className="mt-1 block text-center text-[12px] text-neutral-500">{zh ? `下载第 ${s} 张` : `Download slide ${s}`}</span>
                </a>
              ))}
              <div>
                <h2 className="text-[16px] font-semibold leading-snug">{title}</h2>
                <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-[#F4F5F7] p-3 font-sans text-[13px] leading-relaxed text-neutral-700">{caption}</pre>
                <CopyText text={caption} label={zh ? "复制文案" : "Copy caption"} done={zh ? "已复制" : "Copied"} />
              </div>
            </section>
          );
        })}
        {picks.length === 0 && <p className="text-neutral-500">{zh ? "暂时没有合适的事件。" : "Nothing suitable right now."}</p>}
      </div>
    </div>
  );
}
