import Link from "next/link";

const NAV = [["Home", "/"], ["Technology", "/technology"], ["Economy", "/economy"]];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-[#D6E2F5] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-8 px-4 sm:px-6">
        <Link href="/" aria-label="coda.news home"><img src="/logo.svg" alt="coda.news" className="h-6 w-auto" /></Link>
        <nav className="hidden gap-1 sm:flex">
          {NAV.map(([label, href]) => <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-[#0A1A33]">{label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="hidden text-slate-500 md:inline">One story. Every perspective.</span>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 sm:hidden">
        {NAV.map(([label, href]) => <Link key={href} href={href} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600">{label}</Link>)}
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[#D6E2F5]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
        <span>© {new Date().getFullYear()} coda.news</span>
        <span className="sm:ml-auto">Summaries are AI-generated from linked sources. We summarise and link; we never republish articles.</span>
      </div>
    </footer>
  );
}
