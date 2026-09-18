import Link from "next/link";
import { getLang, t } from "@/lib/i18n";
import { Icon } from "./Icons";

export async function Sidebar() {
  const l = await getLang();
  const NAV = [["home", "/", "home"], ["economy", "/economy", "economy"], ["technology", "/technology", "technology"], ["companies", "/companies", "companies"], ["topics", "/topics", "topics"]] as const;
  return (
    <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col gap-7 overflow-y-auto border-r border-[#E5E7EB] bg-white px-4 py-6 lg:flex">
      <Link href="/" className="px-3" aria-label="coda.news home">
        <img src="/logo.svg" alt="coda.news" className="h-auto w-[164px]" />
        <span className="mt-2 block text-[12px] leading-snug text-neutral-500">{t(l, "tagline")}</span>
      </Link>
      <nav className="flex flex-col gap-0.5">
        {NAV.map(([key, href, icon]) => (
          <Link key={href} href={href} className="flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-[14px] font-medium text-neutral-700 hover:border-[#EA5514] hover:text-[#16181D]">
            <Icon name={icon} />{t(l, key)}
          </Link>
        ))}
      </nav>
      <div className="border-t border-[#E5E7EB] pt-5">
        <Link href="/#newsletter" className="flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-[14px] font-medium text-neutral-700 hover:border-[#EA5514]"><Icon name="mail" />{t(l, "newsletter")}</Link>
        <Link href="/about" className="flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-[14px] font-medium text-neutral-700 hover:border-[#EA5514]"><Icon name="info" />{t(l, "about")}</Link>
      </div>
      <div className="mt-auto border-t-2 border-[#16181D] pt-3">
        <div className="text-[15px] font-semibold leading-snug">{t(l, "promoTitle")}</div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-500">{t(l, "promoText")}</p>
        <Link href="/#newsletter" className="mt-2 inline-block text-[13px] font-semibold text-[#C2410C] hover:underline">{t(l, "joinFree")} →</Link>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 text-[11px] text-neutral-400">
        <Link href="/legal/terms" className="hover:text-neutral-700">{t(l, "terms")}</Link>
        <Link href="/legal/privacy" className="hover:text-neutral-700">{t(l, "privacy")}</Link>
        <Link href="/legal/cookies" className="hover:text-neutral-700">{t(l, "cookies")}</Link>
        <span className="w-full">© {new Date().getFullYear()} coda.news</span>
      </div>
    </aside>
  );
}
