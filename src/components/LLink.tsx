"use client";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

/** Internal link that stays in the reader's language: on /zh pages, "/event/x" becomes "/zh/event/x". */
export default function LLink({ href, ...rest }: ComponentProps<typeof NextLink>) {
  const path = usePathname() ?? "/";
  const zh = path === "/zh" || path.startsWith("/zh/");
  let h = href;
  if (zh && typeof href === "string" && href.startsWith("/") && !href.startsWith("/zh") && !href.startsWith("/legal") && !href.startsWith("/unsubscribe")) {
    h = href === "/" ? "/zh" : href.startsWith("/#") ? `/zh${href.slice(1)}` : href.startsWith("/?") ? `/zh${href.slice(1)}` : `/zh${href}`;
  }
  return <NextLink href={h} {...rest} />;
}
