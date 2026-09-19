import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { notFound } from "next/navigation";
import Link from "@/components/LLink";
import { langFrom, t } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import { Brand } from "@/components/Brand";
import "../globals.css";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], axes: ["opsz"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://coda.news"),
  title: { default: "coda.news · One story. Every perspective.", template: "%s · coda.news" },
  description: "The day's news, and how media in every country report it.",
  openGraph: { siteName: "coda.news", type: "website", locale: "en_AU", images: ["/og.png"] },
  twitter: { card: "summary_large_image" },
  alternates: { types: { "application/rss+xml": "https://coda.news/feed.xml" } },
  robots: { index: true, follow: true, "max-image-preview": "large" },
  appleWebApp: { capable: true, title: "coda.news", statusBarStyle: "default" },
  applicationName: "coda.news",
};
export const viewport = { themeColor: "#16181D" };

export function generateStaticParams() { return [{ lang: "en" }, { lang: "zh" }]; }


export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const raw = (await params).lang;
  if (raw !== "en" && raw !== "zh") notFound();
  const l = await langFrom(params);
  const zh = l === "zh";
  return (
    <html lang={l === "zh" ? "zh-CN" : "en"} className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* set the theme before first paint: saved choice, else the device setting */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}` }} />
      </head>
      <body className="font-sans">
        <div className="flex min-h-screen">
          <Sidebar l={l} />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar l={l} />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-[#E5E7EB] px-4 py-8 text-[13px] text-neutral-600 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                {([
                  [zh ? "coda.news" : "coda.news", [["/about", zh ? "关于我们" : "About us"], ["/about#who", zh ? "谁在运营" : "Who runs it"], ["/about#standards", zh ? "编辑原则" : "Editorial standards"], ["/about#method", zh ? "方法说明" : "How it works"], ["/brief", zh ? "每日简报" : "Daily brief"], ["/archive", zh ? "新闻归档" : "Archive"]]],
                  [zh ? "透明度" : "Transparency", [["/corrections", zh ? "核实与更正" : "Checks & corrections"], ["/about#ai", zh ? "AI 使用说明" : "Use of AI"], ["/about#contact", zh ? "联系我们" : "Contact"]]],
                  [zh ? "法律" : "Legal", [["/legal/terms", t(l, "terms")], ["/legal/privacy", t(l, "privacy")], ["/legal/cookies", t(l, "cookies")]]],
                ] as [string, [string, string][]][]).map(([h, items]) => (
                  <div key={h}>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#16181D]">{h === "coda.news" ? <Brand /> : h}</div>
                    <ul className="mt-3 space-y-2">{items.map(([href, label]) => <li key={href}>{href === "/feed.xml" ? <a href={href} className="hover:text-[#C2410C]">{label}</a> : <Link href={href} className="hover:text-[#C2410C]">{label}</Link>}</li>)}</ul>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-1 border-t border-[#E5E7EB] pt-4 text-[12px] text-neutral-500 md:flex-row md:justify-between">
                <span>© {new Date().getFullYear()} <Brand /></span>
                <a href={`mailto:${SITE.email}`} className="hover:text-neutral-800">{SITE.email}</a>
              </div>
            </footer>
          </div>
        </div>
        <Analytics />
        <InstallPrompt zh={zh} />
      </body>
    </html>
  );
}
