import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header, Footer } from "@/components/Header";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://coda.news"),
  title: { default: "coda.news · One story. Every perspective.", template: "%s · coda.news" },
  description: "Technology and economy events, and how media in every country report them.",
  openGraph: { siteName: "coda.news", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="flex min-h-screen flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
