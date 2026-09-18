import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import Link from "@/components/LLink";
import { getLang, t } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], axes: ["opsz"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://coda.news"),
  title: { default: "coda.news · One story. Every perspective.", template: "%s · coda.news" },
  description: "Technology and economy events, and how media in every country report them.",
  openGraph: { siteName: "coda.news", type: "website", locale: "en_AU", images: ["/og.png"] },
  twitter: { card: "summary_large_image" },
  alternates: { types: { "application/rss+xml": "https://coda.news/feed.xml" } },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const l = await getLang();
  return (
    <html lang={l === "zh" ? "zh-CN" : "en"} className={`${inter.variable} antialiased`}>
      <body className="font-sans">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <main className="flex-1">{children}</main>
            <footer className="flex flex-col gap-2 border-t border-[#E5E7EB] px-4 py-6 text-[12px] text-neutral-500 sm:px-6 md:flex-row lg:px-8">
              <span>© {new Date().getFullYear()} coda.news</span>
              <span className="flex shrink-0 gap-4 md:ml-auto">
                <Link href="/legal/terms" className="hover:text-neutral-800">{t(l, "terms")}</Link>
                <Link href="/legal/privacy" className="hover:text-neutral-800">{t(l, "privacy")}</Link>
                <Link href="/legal/cookies" className="hover:text-neutral-800">{t(l, "cookies")}</Link>
              </span>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
