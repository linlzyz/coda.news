"use client";
import { useEffect, useRef, useState } from "react";
import { ICON } from "@/lib/share-icons";

type T = Record<string, string>;
type Net = { k: string; label: string; href?: (u: string, t: string) => string; color: string };
const NETS: Net[] = [
  { k: "x", label: "X", color: "#000000", href: (u, t) => `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
  { k: "whatsapp", label: "WhatsApp", color: "#25D366", href: (u, t) => `https://wa.me/?text=${t}%20${u}` },
  { k: "instagram", label: "Instagram", color: "#E4405F" },
  { k: "threads", label: "Threads", color: "#000000", href: (u, t) => `https://www.threads.net/intent/post?text=${t}%20${u}` },
  { k: "facebook", label: "Facebook", color: "#0866FF", href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  { k: "linkedin", label: "LinkedIn", color: "#0A66C2", href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
  { k: "telegram", label: "Telegram", color: "#26A5E4", href: (u, t) => `https://t.me/share/url?url=${u}&text=${t}` },
  { k: "reddit", label: "Reddit", color: "#FF4500", href: (u, t) => `https://www.reddit.com/submit?url=${u}&title=${t}` },
  { k: "wechat", label: "WeChat", color: "#07C160" },
  { k: "weibo", label: "Weibo", color: "#E6162D", href: (u, t) => `https://service.weibo.com/share/share.php?url=${u}&title=${t}` },
  { k: "line", label: "LINE", color: "#00C300", href: (u) => `https://social-plugins.line.me/lineit/share?url=${u}` },
  { k: "email", label: "Email", color: "#16181D", href: (u, t) => `mailto:?subject=${t}&body=${t}%0A%0A${u}` },
];
const ZH_FIRST = ["wechat", "weibo"];

function Glyph({ k }: { k: string }) {
  if (k === "email") return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={ICON[k]} /></svg>;
}

export function ShareBar({ url, title, card, slug, zh, t }: { url: string; title: string; card: string; slug: string; zh: boolean; t: T }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [qr, setQr] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const nets = zh ? [...NETS.filter((n) => ZH_FIRST.includes(n.k)), ...NETS.filter((n) => !ZH_FIRST.includes(n.k))] : NETS;

  useEffect(() => {
    if (!open) return;
    if (!qr) import("qrcode").then((Q) => Q.toDataURL(url, { margin: 1, width: 360, color: { dark: "#16181D", light: "#ffffff" } })).then(setQr).catch(() => {});
    const off = (ev: MouseEvent) => { if (box.current && !box.current.contains(ev.target as Node)) setOpen(false); };
    const esc = (ev: KeyboardEvent) => { if (ev.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", off); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", off); document.removeEventListener("keydown", esc); };
  }, [open, qr, url]);

  const flash = (m: string) => { setNote(m); setTimeout(() => setNote(""), 4000); };
  const copy = async (m = t.copied) => { try { await navigator.clipboard.writeText(url); flash(m); } catch { /* blocked */ } };
  const getFile = async () => {
    const b = await (await fetch(card)).blob();
    return new File([b], `coda-${slug}.png`, { type: "image/png" });
  };
  const save = (f: File) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(f); a.download = f.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  const image = async (viaShare: boolean) => {
    setBusy(true);
    try {
      const f = await getFile();
      if (viaShare && navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], title, text: `${title} ${url}` }); return; }
      save(f);
      if (viaShare) flash(t.igHint);
    } catch { /* cancelled */ } finally { setBusy(false); }
  };
  const native = async () => { try { await navigator.share({ title, url }); } catch { /* cancelled */ } };
  const u = encodeURIComponent(url), tt = encodeURIComponent(title);

  return (
    <div ref={box} className="relative">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#E5E7EB] px-4 text-[13px] font-medium hover:border-[#16181D]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" /></svg>{t.share}
        </button>
        <button type="button" onClick={() => image(false)} disabled={busy} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#EA5514] px-4 text-[13px] font-semibold text-white hover:bg-[#C2410C] disabled:opacity-60">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>{busy ? t.making : t.image}
        </button>
      </div>
      {note && !open && <p className="mt-2 text-[12px] text-neutral-500">{note}</p>}
      {open && (
        <div className="absolute left-0 z-30 mt-2 w-[min(92vw,380px)] rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,.12)]">
          <div className="grid grid-cols-4 gap-x-2 gap-y-3">
            {nets.map((n) => {
              const inner = (<><span className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: n.color }}><Glyph k={n.k} /></span><span className="text-[11px] text-neutral-600">{n.k === "wechat" && zh ? "微信" : n.k === "weibo" && zh ? "微博" : n.k === "email" ? t.email : n.label}</span></>);
              const cls = "flex flex-col items-center gap-1.5 rounded-xl py-1 hover:bg-neutral-50";
              if (n.k === "instagram") return <button key={n.k} type="button" className={cls} onClick={() => image(true)}>{inner}</button>;
              if (n.k === "wechat") return <button key={n.k} type="button" className={cls} onClick={() => copy(t.wxHint)}>{inner}</button>;
              return <a key={n.k} className={cls} href={n.href!(u, tt)} target={n.k === "email" ? undefined : "_blank"} rel="noopener noreferrer">{inner}</a>;
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#E5E7EB] p-1.5 pl-3">
            <span className="min-w-0 flex-1 truncate text-[12px] text-neutral-500">{url.replace("https://", "")}</span>
            <button type="button" onClick={() => copy()} className="h-8 shrink-0 rounded-lg bg-[#16181D] px-3 text-[12px] font-semibold text-white">{t.copy}</button>
          </div>
          <div className="mt-4 flex items-center gap-4 border-t border-[#E5E7EB] pt-4">
            {qr ? <img src={qr} alt="QR" width={96} height={96} className="h-24 w-24 rounded-lg border border-[#E5E7EB]" /> : <div className="h-24 w-24 rounded-lg bg-neutral-100" />}
            <div className="text-[12px] leading-relaxed text-neutral-600">
              <p className="font-semibold text-[#16181D]">{t.qr}</p>
              <p>{t.qrHint}</p>
              {qr && <a href={qr} download={`coda-${slug}-qr.png`} className="mt-1 inline-block text-[#C2410C] underline underline-offset-2">{t.qrSave}</a>}
            </div>
          </div>
          {typeof navigator !== "undefined" && "share" in navigator && <button type="button" onClick={native} className="mt-3 w-full rounded-xl border border-[#E5E7EB] py-2 text-[12px] font-medium hover:border-[#16181D]">{t.more}</button>}
          {note && <p className="mt-2 text-[12px] text-[#C2410C]">{note}</p>}
        </div>
      )}
    </div>
  );
}

export function ReportError({ action, t }: { action: (fd: FormData) => Promise<void>; t: T }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  if (sent) return <p className="text-[13px] text-green-700">{t.rThanks}</p>;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="text-[13px] text-neutral-500 underline underline-offset-4 hover:text-[#C2410C]">{t.report}</button>;
  return (
    <form action={async (fd) => { await action(fd); setSent(true); }} className="space-y-3 rounded-2xl border border-[#E5E7EB] p-4">
      <fieldset>
        <legend className="text-[13px] font-semibold">{t.reportKind}</legend>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {[["merge", t.rMerge], ["translation", t.rTrans], ["country", t.rCountry], ["ai", t.rAi], ["other", t.rOther]].map(([v, label], i) => (
            <label key={v} className="flex items-center gap-2 text-[13px]"><input type="radio" name="kind" value={v} defaultChecked={i === 0} />{label}</label>
          ))}
        </div>
      </fieldset>
      <label className="block text-[13px]">{t.rNote}
        <textarea name="note" maxLength={1500} rows={3} className="mt-1 w-full rounded-xl border border-[#E5E7EB] p-2 text-[13px] outline-none focus:ring-2 focus:ring-[#FBD5C2]" />
      </label>
      <button className="h-10 rounded-xl bg-[#16181D] px-4 text-[13px] font-semibold text-white">{t.rSend}</button>
    </form>
  );
}
