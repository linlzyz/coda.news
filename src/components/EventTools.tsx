"use client";
import { useState } from "react";

type T = Record<string, string>;
export function ShareButton({ url, title, t }: { url: string; title: string; t: T }) {
  const [done, setDone] = useState(false);
  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title, url }); return; }
      await navigator.clipboard.writeText(`${title} ${url}`); setDone(true); setTimeout(() => setDone(false), 2000);
    } catch { /* cancelled */ }
  };
  return <button type="button" onClick={share} className="min-h-9 rounded-full border border-[#E5E7EB] px-4 text-[13px] font-medium hover:border-[#16181D]">{done ? t.copied : t.share}</button>;
}

const pill = "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#E5E7EB] px-4 text-[13px] font-medium hover:border-[#16181D]";

export function ShareBar({ url, title, card, slug, t }: { url: string; title: string; card: string; slug: string; t: T }) {
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");
  const text = encodeURIComponent(title);
  const u = encodeURIComponent(url);
  const getFile = async () => {
    const r = await fetch(card);
    const b = await r.blob();
    return new File([b], `coda-${slug}.png`, { type: "image/png" });
  };
  const download = async () => {
    setBusy(true);
    try {
      const f = await getFile();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(f); a.download = f.name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } finally { setBusy(false); }
  };
  const instagram = async () => {
    setBusy(true);
    try {
      const f = await getFile();
      if (navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], title, text: `${title} ${url}` }); return; }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(f); a.download = f.name; a.click();
      setHint(t.igHint); setTimeout(() => setHint(""), 5000);
    } catch { /* cancelled */ } finally { setBusy(false); }
  };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <ShareButton url={url} title={title} t={t} />
        <a className={pill} href={`https://twitter.com/intent/tweet?text=${text}&url=${u}`} target="_blank" rel="noopener noreferrer" aria-label="X">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>X
        </a>
        <a className={pill} href={`https://www.threads.net/intent/post?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M16.5 11.5c-.3-2.6-2-3.9-4.3-3.9-2.4 0-4 1.6-4 3.4 0 1.9 1.6 3 3.6 3 3 0 4.6-2 4.6-5.2 0-4.1-2.8-6.3-6.3-6.3C5.9 2.5 3 5.6 3 12s3 9.5 7.9 9.5c3.8 0 6.8-2 6.8-5.3 0-2.9-2.6-4.4-6-4.1"/></svg>Threads
        </a>
        <button type="button" onClick={instagram} disabled={busy} className={pill}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>Instagram
        </button>
        <button type="button" onClick={download} disabled={busy} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#EA5514] px-4 text-[13px] font-semibold text-white hover:bg-[#C2410C] disabled:opacity-60">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16"/></svg>{busy ? t.making : t.image}
        </button>
      </div>
      {hint && <p className="mt-2 text-[12px] text-neutral-500">{hint}</p>}
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
