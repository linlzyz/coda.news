import Link from "@/components/LLink";
import { t, type Lang } from "@/lib/i18n";
import { Icon } from "./Icons";
import { TodayBadge } from "./TodayBadge";

export function Sidebar({ l }: { l: Lang }) {
  const NAV = [["home", "/", "home"], ["economy", "/economy", "economy"], ["technology", "/technology", "technology"], ["sport", "/sport", "sport"], ["entertainment", "/entertainment", "entertainment"], ["fashion", "/fashion", "fashion"], ["travel", "/travel", "travel"], ["automotive", "/automotive", "automotive"], ["gaming", "/gaming", "gaming"], ["australia", "/australia", "australia"], ["china", "/china", "china"], ["companies", "/companies", "companies"], ["topics", "/topics", "topics"]] as const;
  return (
    <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-[#E5E7EB] bg-white px-4 py-6 lg:flex">
      <Link href="/" className="px-3" aria-label="coda.news home">
        <img src="/logo.svg" alt="coda.news" className="h-auto w-[164px]" />
        <span className="mt-2 block text-[12px] leading-snug text-neutral-500">{t(l, "tagline")}</span>
      </Link>
      <nav className="flex flex-col gap-0.5">
        {NAV.map(([key, href, icon]) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium text-neutral-600 hover:bg-[#F4F5F7] hover:text-[#16181D]">
            <Icon name={icon} />{t(l, key)}
          </Link>
        ))}
      </nav>
      <div className="border-t border-[#E5E7EB] pt-3">
        <Link href="/brief" className="flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium text-neutral-600 hover:bg-[#F4F5F7]"><Icon name="mail" />{t(l, "briefNav")}<TodayBadge zh={l === "zh"} /></Link>
        <Link href="/about" className="flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium text-neutral-600 hover:bg-[#F4F5F7]"><Icon name="info" />{t(l, "about")}</Link>
      </div>
      <div className="mt-auto shrink-0 overflow-hidden rounded-2xl bg-[#1F2328] p-4">
        <div className="text-[16px] font-semibold leading-snug tracking-[-0.015em] text-white">{t(l, "promoTitle")}</div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-300 [@media(max-height:820px)]:hidden">{t(l, "promoText")}</p>
        <Link href="/#newsletter" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#EA5514] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#D24A0F]">{t(l, "joinFree")} <Icon name="arrow" size={14} /></Link>
      </div>
    </aside>
  );
}
