"use client";
// Vercel Web Analytics, minus the owner's own devices: open coda.news/?notrack=1 once on a device to stop counting it
// (?notrack=0 turns counting back on).
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

function beforeSend(e: BeforeSendEvent) {
  try {
    const q = new URLSearchParams(window.location.search).get("notrack");
    if (q === "1") localStorage.setItem("coda_notrack", "1");
    if (q === "0") localStorage.removeItem("coda_notrack");
    if (localStorage.getItem("coda_notrack")) return null;
  } catch { /* storage blocked: count as normal */ }
  return e;
}

export function SiteAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
