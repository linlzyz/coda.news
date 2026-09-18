import Link from "next/link";
import { redirect } from "next/navigation";
import { subscribe } from "@/lib/data";
import { t, type Lang } from "@/lib/i18n";

async function join(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && (await subscribe(email));
  redirect(`/?subscribed=${ok ? "1" : "0"}#newsletter`);
}

export function Newsletter({ status, lang }: { status?: string; lang: Lang }) {
  return (
    <section id="newsletter" className="scroll-mt-24">
      <div className="border-t-2 border-[#111111] pt-2.5"><h2 className="text-[20px] font-semibold tracking-[-0.02em]">{t(lang, "nlTitle")}</h2></div>
      <p className="mt-3 text-[14px] leading-relaxed text-neutral-600">{t(lang, "nlText")}</p>
      {status === "1" ? <p className="mt-4 text-[14px] font-medium text-green-700">{t(lang, "nlOk")}</p> : (
        <form action={join} className="mt-4 flex border border-[#111111]">
          <label htmlFor="nl-email" className="sr-only">Email</label>
          <input id="nl-email" name="email" type="email" required placeholder={t(lang, "nlPlaceholder")} className="h-11 min-w-0 flex-1 bg-white px-3 text-[14px] outline-none" />
          <button className="h-11 bg-[#111111] px-5 text-[13px] font-semibold text-white hover:bg-[#C2410C]">{t(lang, "subscribe")}</button>
        </form>
      )}
      {status === "0" && <p className="mt-2 text-[12px] text-red-700">{t(lang, "nlErr")}</p>}
      <p className="mt-2 text-[11px] text-neutral-400">{lang === "zh" ? "订阅即表示同意" : "By subscribing you agree to our "}<Link href="/legal/privacy" className="underline">{t(lang, "privacy")}</Link>.</p>
    </section>
  );
}
