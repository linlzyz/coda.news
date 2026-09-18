// Language routing. Pages live under app/[lang]: /zh/... is Chinese, every other path is served from /en/... internally.
// Readers who chose Chinese (cookie) are sent to the /zh/ URL. /en/... is never a public URL.
import { NextResponse, type NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/zh" || pathname.startsWith("/zh/")) return NextResponse.next();
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return NextResponse.redirect(new URL(`${pathname.slice(3) || "/"}${search}`, req.url), 308);
  }
  if (req.method === "GET" && req.cookies.get("lang")?.value === "zh" && !req.headers.get("next-router-prefetch")) {
    return NextResponse.redirect(new URL(`/zh${pathname === "/" ? "" : pathname}${search}`, req.url), 307);
  }
  const url = req.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
