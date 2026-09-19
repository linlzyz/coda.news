// Language routing. Pages live under app/[lang]: /zh/... is Chinese, every other path is served from /en/... internally.
// Readers who chose Chinese (cookie) are sent to the /zh/ URL. /en/... is never a public URL.
import { NextResponse, type NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/zh" || pathname.startsWith("/zh/")) return NextResponse.next();
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return NextResponse.redirect(new URL(`${pathname.slice(3) || "/"}${search}`, req.url), 308);
  }
  const chosen = req.cookies.get("lang")?.value;
  // first visit with no choice made yet: a browser whose first language is Chinese gets the Chinese site.
  // Once the reader picks a language (the EN/中文 switch sets the cookie) that choice always wins. Search bots send no Chinese, so they see English.
  const firstLang = (req.headers.get("accept-language") ?? "").split(",")[0].trim().toLowerCase();
  const wantsZh = chosen === "zh" || (!chosen && firstLang.startsWith("zh"));
  if (req.method === "GET" && wantsZh && !req.headers.get("next-router-prefetch")) {
    const res = NextResponse.redirect(new URL(`/zh${pathname === "/" ? "" : pathname}${search}`, req.url), 307);
    if (!chosen) res.cookies.set("lang", "zh", { path: "/", maxAge: 31536000, sameSite: "lax" });
    return res;
  }
  const url = req.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
