import Link from "next/link";
import { redirect } from "next/navigation";
import { subscribe } from "@/lib/data";
import { t, type Lang } from "@/lib/i18n";
import { Icon } from "./Icons";

async function join(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && (await subscribe(email, String(formData.get("lang") ?? "en")));
  redirect(`/?subscribed=${ok ? "1" : "0"}#newsletter`);
}

export function Newsletter({ status, lang }: { status?: string; lang: Lang }) {
  return (
    <section id="newsletter" className="scroll-mt-24 rounded-2xl bg-[#1F2328] p-5 text-white">
      <div className="flex items-center gap-2.5"><Icon name="mail" size={20} /><h2 className="text-[17px] font-semibold tracking-[-0.015em]">{t(lang, "nlTitle")}</h2></div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-300">{t(lang, "nlText")}</p>
      {status === "1" ? <p className="mt-4 rounded-xl bg-white/10 px-4 py-3 text-[13px] font-medium">{t(lang, "nlOk")}</p> : (
        <form action={join} className="mt-4 flex gap-2">
          <input type="hidden" name="lang" value={lang} />
          <label htmlFor="nl-email" className="sr-only">Email</label>
          <input id="nl-email" name="email" type="email" required placeholder={t(lang, "nlPlaceholder")} className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-3 text-[13px] text-white outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-[#EA5514]" />
          <button className="h-11 rounded-xl bg-[#EA5514] px-4 text-[13px] font-semibold text-white hover:bg-[#D24A0F]">{t(lang, "subscribe")}</button>
        </form>
      )}
      {status === "0" && <p className="mt-2 text-[12px] text-red-300">{t(lang, "nlErr")}</p>}
      <p className="mt-3 text-[11px] text-neutral-400">{lang === "zh" ? "订阅即表示同意" : "By subscribing you agree to our "}<Link href="/legal/privacy" className="underline">{t(lang, "privacy")}</Link>.</p>
    </section>
  );
}
