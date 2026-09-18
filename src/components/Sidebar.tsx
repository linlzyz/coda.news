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
          <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-neutral-600 hover:bg-[#F4F5F7] hover:text-[#16181D]">
            <Icon name={icon} />{t(l, key)}
          </Link>
        ))}
      </nav>
      <div className="border-t border-[#E5E7EB] pt-5">
        <Link href="/#newsletter" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-neutral-600 hover:bg-[#F4F5F7]"><Icon name="mail" />{t(l, "newsletter")}</Link>
        <Link href="/about" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-neutral-600 hover:bg-[#F4F5F7]"><Icon name="info" />{t(l, "about")}</Link>
      </div>
      <div className="mt-auto overflow-hidden rounded-2xl bg-[#1F2328] p-5">
        <div className="text-[19px] font-semibold leading-tight tracking-[-0.02em] text-white">{t(l, "promoTitle")}</div>
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-300">{t(l, "promoText")}</p>
        <Link href="/#newsletter" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#EA5514] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#D24A0F]">{t(l, "joinFree")} <Icon name="arrow" size={14} /></Link>
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
