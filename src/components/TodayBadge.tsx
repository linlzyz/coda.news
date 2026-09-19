"use client";
import { useEffect, useState } from "react";

// today's date in Melbourne, rendered on the client so cached pages never show a stale day
export function TodayBadge({ zh }: { zh: boolean }) {
  const [d, setD] = useState<string | null>(null);
  useEffect(() => {
    const now = new Date();
    const [m, day] = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" }).split("-").slice(1).map(Number);
    setD(zh ? `${m}月${day}日` : `${day} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1]}`);
  }, [zh]);
  if (!d) return null;
  return <span className="ml-auto rounded-full bg-[#FDEEE6] px-2 py-0.5 text-[11px] font-semibold text-[#C2410C]">{d}</span>;
}
