import Link from "next/link";
import { getLang, t } from "@/lib/i18n";
import { Icon } from "./Icons";
import { LangSwitch } from "./LangSwitch";

export async function Masthead() {
  const l = await getLang();
  const date = new Date().toLocaleDateString(l === "zh" ? "zh-CN" : "en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Australia/Melbourne" });
  const NAV = [["home", "/"], ["economy", "/economy"], ["technology", "/technology"], ["companies", "/companies"], ["topics", "/topics"], ["about", "/about"]] as const;
  return (
    <header className="bg-white">
      <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4 py-2.5 text-[12px] text-neutral-500 sm:px-6">
        <span className="hidden sm:inline">{date}</span>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/search" className="inline-flex items-center gap-1.5 hover:text-[#111111]"><Icon name="search" size={15} />{t(l, "searchH")}</Link>
          <LangSwitch lang={l} />
          <Link href="/#newsletter" className="font-semibold text-[#111111] hover:text-[#C2410C]">{t(l, "subscribe")}</Link>
        </div>
      </div>
      <div className="mx-auto max-w-[1240px] px-4 pb-5 pt-2 text-center sm:px-6">
        <Link href="/" aria-label="coda.news home" className="inline-block"><img src="/logo.svg" alt="coda.news" className="mx-auto h-auto w-[210px] sm:w-[260px]" /></Link>
        <p className="mt-2 text-[13px] text-neutral-500">{t(l, "tagline")}</p>
      </div>
      <nav className="border-y border-[#E6E6E6]">
        <div className="mx-auto flex max-w-[1240px] justify-start gap-1 overflow-x-auto px-4 sm:justify-center sm:px-6">
          {NAV.map(([k, h]) => <Link key={h} href={h} className="whitespace-nowrap px-3 py-3 text-[14px] font-medium text-neutral-700 hover:text-[#C2410C]">{t(l, k)}</Link>)}
        </div>
      </nav>
    </header>
  );
}
