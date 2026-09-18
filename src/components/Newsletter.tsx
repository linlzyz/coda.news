"use client";
import { useActionState } from "react";
import Link from "./LLink";
import { Icon } from "./Icons";
import { join } from "./newsletter-action";

type T = Record<"nlTitle" | "nlText" | "nlOk" | "nlPlaceholder" | "subscribe" | "nlErr" | "privacy", string>;
export function Newsletter({ lang, t }: { lang: "en" | "zh"; t: T }) {
  const [state, action, pending] = useActionState(join, null as null | boolean);
  return (
    <section id="newsletter" className="scroll-mt-24 rounded-2xl bg-[#1F2328] p-5 text-white">
      <div className="flex items-center gap-2.5"><Icon name="mail" size={20} /><h2 className="text-[17px] font-semibold tracking-[-0.015em]">{t.nlTitle}</h2></div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-300">{t.nlText}</p>
      {state === true ? <p className="mt-4 rounded-xl bg-white/10 px-4 py-3 text-[13px] font-medium">{t.nlOk}</p> : (
        <form action={action} className="mt-4 flex gap-2">
          <input type="hidden" name="lang" value={lang} />
          <label htmlFor="nl-email" className="sr-only">Email</label>
          <input id="nl-email" name="email" type="email" required placeholder={t.nlPlaceholder} className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-3 text-[13px] text-white outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-[#EA5514]" />
          <button disabled={pending} className="h-11 rounded-xl bg-[#EA5514] px-4 text-[13px] font-semibold text-white hover:bg-[#D24A0F] disabled:opacity-60">{t.subscribe}</button>
        </form>
      )}
      {state === false && <p className="mt-2 text-[12px] text-red-300">{t.nlErr}</p>}
      <p className="mt-3 text-[11px] text-neutral-400">{lang === "zh" ? "订阅即表示同意" : "By subscribing you agree to our "}<Link href="/legal/privacy" className="underline">{t.privacy}</Link>.</p>
    </section>
  );
}
