import { redirect } from "next/navigation";
import { followToken } from "@/lib/data";
import { langFrom } from "@/lib/i18n";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

// The email link opens this page; the action runs only when the reader presses the button (mail scanners can't trigger it).
export default async function Page({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ t?: string; a?: string; done?: string }> }) {
  const l = await langFrom(params); const zh = l === "zh";
  const { t = "", a = "confirm", done } = await searchParams;
  const act = a === "stop" ? "stop" : "confirm";
  async function run() {
    "use server";
    const ok = await followToken(t, act);
    redirect(`${zh ? "/zh" : ""}/follow?a=${act}&done=${ok ? 1 : 0}`);
  }
  const msg = done === "1" ? (act === "confirm" ? (zh ? "已确认。有新事件时我们会发邮件给你。" : "Confirmed. We'll email you when there's something new.") : (zh ? "已取消关注。" : "You've unfollowed."))
    : done === "0" ? (zh ? "链接无效或已过期。" : "This link is invalid or has expired.") : null;
  return (
    <div className="mx-auto max-w-[560px] px-4 py-16 text-center sm:px-6">
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">{act === "confirm" ? (zh ? "确认关注" : "Confirm follow") : (zh ? "取消关注" : "Unfollow")}</h1>
      {msg ? <p className="mt-4 text-[15px] text-neutral-600">{msg}</p> : (
        <form action={run} className="mt-6">
          <button className="h-11 rounded-xl bg-[#EA5514] px-6 text-[14px] font-semibold text-white hover:bg-[#D24A0F]">{act === "confirm" ? (zh ? "确认关注" : "Confirm") : (zh ? "取消关注" : "Unfollow")}</button>
        </form>
      )}
    </div>
  );
}
