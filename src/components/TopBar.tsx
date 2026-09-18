import Link from "@/components/LLink";
import { t, type Lang } from "@/lib/i18n";
import { Icon } from "./Icons";
import { LangSwitch } from "./LangSwitch";
import { SearchBox } from "./SearchBox";

export function TopBar({ l }: { l: Lang }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#E5E7EB] bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="lg:hidden" aria-label="coda.news home"><img src="/logo.svg" alt="coda.news" className="h-auto w-[112px]" /></Link>
        <SearchBox lang={l} placeholder={t(l, "search")} />
        <div className="ml-auto flex items-center gap-2">
          <Link href="/search" className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-600 sm:hidden" aria-label="Search"><Icon name="search" /></Link>
          <LangSwitch lang={l} />
          <Link href="/#newsletter" className="hidden rounded-xl bg-[#1F2328] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#2B3038] sm:inline-block">{t(l, "dailyBrief")}</Link>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden">
        {([["home", "/"], ["economy", "/economy"], ["technology", "/technology"], ["sport", "/sport"], ["entertainment", "/entertainment"], ["fashion", "/fashion"], ["travel", "/travel"], ["automotive", "/automotive"], ["gaming", "/gaming"], ["australia", "/australia"], ["china", "/china"], ["companies", "/companies"], ["topics", "/topics"]] as const).map(([k, h]) => (
          <Link key={h} href={h} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium text-neutral-600">{t(l, k)}</Link>
        ))}
      </nav>
    </header>
  );
}
