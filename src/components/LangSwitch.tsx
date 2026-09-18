"use client";
import { usePathname, useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

function saveLang(l: string) {
  document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
}

export function LangSwitch({ lang }: { lang: "en" | "zh" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [shown, setShown] = useOptimistic(lang);
  const set = (l: "en" | "zh") => start(() => {
    setShown(l); saveLang(l);
    const base = pathname === "/zh" ? "/" : pathname.startsWith("/zh/") ? pathname.slice(3) : pathname;
    router.push((l === "zh" ? (base === "/" ? "/zh" : `/zh${base}`) : base) + window.location.search);
  });
  return (
    <div className={`flex h-10 items-center rounded-xl border border-[#E5E7EB] p-1 text-[13px] font-medium transition-opacity ${pending ? "opacity-60" : ""}`} role="group" aria-label="Language">
      {([["en", "EN"], ["zh", "中文"]] as const).map(([l, label]) => (
        <button key={l} type="button" onClick={() => set(l)} aria-pressed={shown === l}
          className={`h-8 rounded-lg px-2.5 ${shown === l ? "bg-[#1F2328] text-white" : "text-neutral-600 hover:text-[#16181D]"}`}>{label}</button>
      ))}
    </div>
  );
}
