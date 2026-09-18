// Language routing: /zh/... serves the Chinese version of every page (crawlable, own URLs).
// Readers who chose Chinese (cookie) are sent to the /zh/ URL of whatever they open.
import { NextResponse, type NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isZh = pathname === "/zh" || pathname.startsWith("/zh/");
  const headers = new Headers(req.headers);
  if (isZh) {
    headers.set("x-lang", "zh");
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.rewrite(url, { request: { headers } });
  }
  if (req.cookies.get("lang")?.value === "zh" && req.method === "GET") {
    return NextResponse.redirect(new URL(`/zh${pathname === "/" ? "" : pathname}${search}`, req.url), 307);
  }
  headers.set("x-lang", "en");
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next|api|legal|unsubscribe|.*\\..*).*)"],
};
