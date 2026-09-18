"use client";
import { useState } from "react";
export function CopyText({ text, label, done }: { text: string; label: string; done: string }) {
  const [ok, setOk] = useState(false);
  return <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); } catch {} }}
    className="mt-2 h-9 rounded-full border border-[#E5E7EB] px-4 text-[13px] font-medium hover:border-[#16181D]">{ok ? done : label}</button>;
}
