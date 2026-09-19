"use client";
import { useCallback, useEffect, useState } from "react";

// The site owner's control room: take a story down, pin it to Picks, reject its picture, redo its Chinese, move it to another section.
const API = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin`;
const CATS: [string, string][] = [["technology", "科技"], ["economy", "经济"], ["sport", "体育"], ["entertainment", "娱乐"], ["fashion", "时尚"], ["travel", "旅行"], ["automotive", "汽车"], ["gaming", "游戏"]];
const FILTERS: [string, string][] = [["flagged", "待确认"], ["auto", "系统自动处理的"], ["recent", "最新"], ["pinned", "已置顶"], ["noimage", "多来源但没图"], ["hidden", "已下架"]];
type Row = { id: string; review_note: string | null; slug: string; title: string; title_zh: string | null; summary_zh: string | null; category: string; image_url: string | null; image_source: string | null;
  source_count: number; countries: string[]; hidden: boolean; pinned_at: string | null; last_article_at: string; lead_url: string | null; lead_source: string | null };

export function AdminPanel() {
  const [key, setKey] = useState("");
  const [ok, setOk] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("flagged");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const call = useCallback(async (body: Record<string, unknown>, k = key) => {
    const r = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: k, ...body }) });
    if (r.status === 403) { setOk(false); try { localStorage.removeItem("coda-admin"); } catch {} throw new Error("密码不对"); }
    return r.json();
  }, [key]);
  const load = useCallback(async (k = key) => {
    const j = await call({ action: "list", filter, q }, k); setRows(j.rows ?? []); setOk(true);
  }, [call, filter, q, key]);

  useEffect(() => { try { const k = localStorage.getItem("coda-admin"); if (k) { setKey(k); load(k).catch(() => {}); } } catch {} }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ok) load().catch(() => {}); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (id: string, action: string, value?: string, note?: string) => {
    setBusy(id + action);
    try { await call({ action, id, value }); setMsg(note ?? "已完成"); await load(); } catch (e) { setMsg((e as Error).message); }
    setBusy(null); setTimeout(() => setMsg(""), 2500);
  };

  if (!ok) return (
    <div className="mx-auto max-w-[420px] px-4 py-20">
      <h1 className="text-[28px] font-semibold">管理后台</h1>
      <form className="mt-6 flex gap-2" onSubmit={async (e) => { e.preventDefault(); try { await load(key); localStorage.setItem("coda-admin", key); } catch (err) { setMsg((err as Error).message); } }}>
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="管理密码" className="h-11 flex-1 rounded-xl border border-[#E5E7EB] bg-white px-3 text-[15px]" />
        <button className="h-11 rounded-xl bg-[#EA5514] px-5 font-semibold text-white">进入</button>
      </form>
      {msg && <p className="mt-3 text-[14px] text-red-600">{msg}</p>}
    </div>
  );

  const btn = "rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1 text-[12px] font-medium text-neutral-700 hover:border-[#16181D] disabled:opacity-40";
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[28px] font-semibold">管理后台</h1>
        <button className="ml-auto text-[13px] text-neutral-500 underline" onClick={() => { localStorage.removeItem("coda-admin"); setOk(false); setKey(""); }}>退出</button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {FILTERS.map(([k, label]) => <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium ${filter === k ? "bg-[#16181D] text-white" : "border border-[#E5E7EB] bg-white text-neutral-700"}`}>{label}</button>)}
        <form className="ml-auto flex gap-2" onSubmit={(e) => { e.preventDefault(); load().catch(() => {}); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜标题" className="h-9 w-[200px] rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px]" />
          <button className={btn}>搜索</button>
        </form>
      </div>
      {msg && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#16181D] px-4 py-2 text-[14px] text-white">{msg}</div>}
      <ul className="mt-6 divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
        {rows.map((r) => (
          <li key={r.id} className={`grid gap-4 py-4 sm:grid-cols-[120px_minmax(0,1fr)] ${r.hidden ? "opacity-50" : ""}`}>
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#F4F5F7]">{r.image_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={r.image_url} alt="" className={`h-full w-full ${r.image_source === "logo" ? "bg-white object-contain p-3" : "object-cover"}`} loading="lazy" /> : <div className="flex h-full items-center justify-center text-[12px] text-neutral-400">无图</div>}</div>
            <div className="min-w-0">
              <a href={`/zh/event/${r.slug}`} target="_blank" rel="noopener noreferrer" className="text-[16px] font-semibold leading-snug hover:text-[#C2410C]">{r.title_zh ?? r.title}</a>
              {r.pinned_at && <span className="ml-2 rounded-full bg-[#FFF0EB] px-2 py-0.5 text-[11px] font-semibold text-[#C2410C]">置顶中</span>}
              {r.review_note && <p className={`mt-1 text-[13px] font-medium ${r.review_note.startsWith("待确认") ? "text-amber-700" : "text-[#0F766E]"}`}>{r.review_note}</p>}
              <p className="mt-1 line-clamp-2 text-[13px] text-neutral-600">{r.summary_zh}</p>
              <p className="mt-1 text-[12px] text-neutral-400">{r.source_count} 个来源 · {r.countries.join(" ")} · {new Date(r.last_article_at).toLocaleString("zh-CN", { timeZone: "Australia/Melbourne" })}{r.image_source ? ` · 图：${r.image_source}` : ""}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {r.review_note?.startsWith("待确认") && !r.hidden && <button className={`${btn} border-green-200 text-green-700`} disabled={!!busy} onClick={() => act(r.id, "ok", undefined, "已确认")}>没问题</button>}
                {r.hidden
                  ? <button className={btn} disabled={!!busy} onClick={() => act(r.id, "unhide", undefined, "已恢复")}>恢复上线</button>
                  : <button className={`${btn} border-red-200 text-red-700`} disabled={!!busy} onClick={() => act(r.id, "hide", undefined, "已下架")}>下架</button>}
                {!r.hidden && (r.pinned_at
                  ? <button className={btn} disabled={!!busy} onClick={() => act(r.id, "unpin", undefined, "已取消置顶")}>取消置顶</button>
                  : <button className={btn} disabled={!!busy} onClick={() => act(r.id, "pin", undefined, "已置顶到精选")}>置顶精选</button>)}
                {r.image_url && <button className={btn} disabled={!!busy} onClick={() => act(r.id, "noimage", undefined, "这张图不会再用，正在重新找")}>图不对</button>}
                <button className={btn} disabled={!!busy} onClick={() => act(r.id, "retranslate", undefined, "中文会在几分钟内重写")}>重写中文</button>
                <select className="h-[28px] rounded-lg border border-[#E5E7EB] bg-white px-2 text-[12px]" value={r.category} disabled={!!busy} onChange={(e) => act(r.id, "category", e.target.value, "已改分类")}>
                  {CATS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                </select>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {!rows.length && <p className="py-10 text-center text-neutral-500">{filter === "flagged" ? "没有需要你确认的，系统都处理好了。" : "没有内容"}</p>}
    </div>
  );
}
