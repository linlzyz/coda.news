"use client";
import { useActionState, useState } from "react";
import { follow } from "./follow-action";

export function FollowBox({ name, lang, companyId, topicId }: { name: string; lang: "en" | "zh"; companyId?: number; topicId?: number }) {
  const zh = lang === "zh";
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(follow, null as null | boolean);
  if (state === true) return <p className="rounded-xl bg-[#FFF0EB] px-4 py-3 text-[13px] text-[#9A3412]">{zh ? "请查收确认邮件，点击确认后开始接收提醒。" : "Check your inbox and confirm, then alerts will start."}</p>;
  if (!open) return (
    <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#16181D] px-4 text-[13px] font-semibold text-white hover:bg-[#2B3038]">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
      {zh ? `关注${name}` : `Follow ${name}`}
    </button>
  );
  return (
    <form action={action} className="max-w-[460px] rounded-2xl border border-[#E5E7EB] bg-white p-4">
      <p className="text-[13px] text-neutral-600">{zh ? `有关于${name}的新事件时，每天早上发一封邮件给你。没有新事件就不发，随时可以取消。` : `We'll email you in the morning when there are new events about ${name}. Nothing new, no email. Unfollow any time.`}</p>
      <input type="hidden" name="lang" value={lang} />
      {companyId && <input type="hidden" name="cid" value={companyId} />}
      {topicId && <input type="hidden" name="tid" value={topicId} />}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="mt-3 flex gap-2">
        <input name="email" type="email" required placeholder={zh ? "你的邮箱" : "Your email"} aria-label="Email" className="h-10 min-w-0 flex-1 rounded-xl border border-[#E5E7EB] px-3 text-[13px] outline-none focus:ring-2 focus:ring-[#FBD5C2]" />
        <button disabled={pending} className="h-10 rounded-xl bg-[#EA5514] px-4 text-[13px] font-semibold text-white hover:bg-[#D24A0F] disabled:opacity-60">{zh ? "关注" : "Follow"}</button>
      </div>
      {state === false && <p className="mt-2 text-[12px] text-red-600">{zh ? "邮箱格式不对，或者这个邮箱关注得太多了。" : "Please check the email address."}</p>}
    </form>
  );
}
