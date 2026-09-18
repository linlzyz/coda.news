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
