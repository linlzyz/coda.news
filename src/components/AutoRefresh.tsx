"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-fetch the page quietly every few minutes so readers never need to reload. */
export function AutoRefresh({ minutes = 3 }: { minutes?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, minutes * 60_000);
    return () => clearInterval(t);
  }, [router, minutes]);
  return null;
}
