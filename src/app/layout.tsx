import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { Masthead } from "@/components/Masthead";
import { getLang, t } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], axes: ["opsz"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://coda.news"),
  title: { default: "coda.news · One story. Every perspective.", template: "%s · coda.news" },
  description: "Technology and economy events, and how media in every country report them.",
  openGraph: { siteName: "coda.news", type: "website" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const l = await getLang();
  return (
    <html lang={l === "zh" ? "zh-CN" : "en"} className={`${inter.variable} antialiased`}>
      <body className="font-sans">
        <Masthead />
        <main>{children}</main>
        <footer className="mt-16 border-t-2 border-[#111111]">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-4 py-8 text-[13px] text-neutral-500 sm:flex-row sm:items-center sm:px-6">
            <img src="/logo.svg" alt="coda.news" className="h-auto w-[110px]" />
            <span className="sm:ml-4">© {new Date().getFullYear()} coda.news</span>
            <span className="flex flex-wrap gap-5 sm:ml-auto">
              <Link href="/about" className="hover:text-[#111111]">{t(l, "about")}</Link>
              <Link href="/legal/terms" className="hover:text-[#111111]">{t(l, "terms")}</Link>
              <Link href="/legal/privacy" className="hover:text-[#111111]">{t(l, "privacy")}</Link>
              <Link href="/legal/cookies" className="hover:text-[#111111]">{t(l, "cookies")}</Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
