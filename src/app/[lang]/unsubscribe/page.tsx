import Link from "@/components/LLink";
import { unsubscribe } from "@/lib/data";
import { langFrom } from "@/lib/i18n";

export const metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function Page({ params, searchParams }: PageProps<"/[lang]/unsubscribe">) {
  const token = String((await searchParams).t ?? "");
  const [ok, l] = await Promise.all([unsubscribe(token), langFrom(params)]);
  const zh = l === "zh";
  return (
    <div className="mx-auto max-w-[560px] px-4 py-20 text-center sm:px-6">
      <h1 className="text-[30px] font-semibold tracking-[-0.02em]">{ok ? (zh ? "已退订" : "You're unsubscribed") : (zh ? "链接已失效" : "This link is no longer valid")}</h1>
      <p className="mt-3 text-neutral-600">{ok ? (zh ? "你不会再收到 coda.news 每日简报。随时欢迎回来。" : "You won't receive the coda.news Daily Brief any more. You're welcome back any time.") : (zh ? "你可能已经退订过了。" : "You may already be unsubscribed.")}</p>
      <Link href="/" className="mt-6 inline-block font-semibold text-[#C2410C] hover:underline">coda.news →</Link>
    </div>
  );
}
