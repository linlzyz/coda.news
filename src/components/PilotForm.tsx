"use client";
import { useActionState } from "react";
import { applyPilot } from "./pilot-action";

/** Pilot sign-up on /business: stored in our database, emailed to business@ and confirmed to the applicant. */
export function PilotForm({ zh }: { zh: boolean }) {
  const [state, action, pending] = useActionState(applyPilot, null);
  const T = zh
    ? { name: "姓名", company: "公司 / 品牌 *", email: "工作邮箱 *", brands: "想关注的竞争对手或行业（可选）", note: "还有什么想告诉我们（可选）", send: "申请试点", sending: "提交中…",
        ok: "收到了。我们会在两个工作日内发邮件给你，确认试点安排。确认邮件已发到你的邮箱。", bad: "请填写公司和有效的邮箱。" }
    : { name: "Your name", company: "Company / brand *", email: "Work email *", brands: "Competitors or industry to follow (optional)", note: "Anything else (optional)", send: "Apply for a pilot", sending: "Sending…",
        ok: "Thank you. We will email you within two working days to set up your pilot. A confirmation is on its way to your inbox.", bad: "Please add your company and a valid email." };
  if (state === "ok") return <p className="rounded-xl bg-white p-4 text-[15px] leading-relaxed text-[#16181D]">{T.ok}</p>;
  const f = "w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-[#EA5514]";
  return (
    <form action={action} className="mt-4 grid gap-3">
      <input type="hidden" name="lang" value={zh ? "zh" : "en"} />
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-3 sm:grid-cols-2">
        <input id="pilot-name" name="name" placeholder={T.name} className={f} autoComplete="name" />
        <input id="pilot-company" name="company" placeholder={T.company} required className={f} autoComplete="organization" />
      </div>
      <input id="pilot-email" name="email" type="email" placeholder={T.email} required className={f} autoComplete="email" />
      <input id="pilot-brands" name="brands" placeholder={T.brands} className={f} />
      <textarea id="pilot-note" name="note" placeholder={T.note} rows={3} className={f} />
      {state === "bad" && <p className="text-[13px] text-[#BE123C]">{T.bad}</p>}
      <button disabled={pending} className="justify-self-start rounded-xl bg-[#EA5514] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#D24A0F] disabled:opacity-60">{pending ? T.sending : T.send} →</button>
    </form>
  );
}
