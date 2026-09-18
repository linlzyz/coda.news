"use client";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

function saveLang(l: string) {
  document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
}

export function LangSwitch({ lang }: { lang: "en" | "zh" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [shown, setShown] = useOptimistic(lang);
  const set = (l: "en" | "zh") => start(() => { setShown(l); saveLang(l); router.refresh(); });
  return (
    <div className={`flex h-10 items-center gap-1 text-[13px] font-medium transition-opacity ${pending ? "opacity-60" : ""}`} role="group" aria-label="Language">
      {([["en", "EN"], ["zh", "中文"]] as const).map(([l, label]) => (
        <button key={l} type="button" onClick={() => set(l)} aria-pressed={shown === l}
          className={`h-8 px-1.5 ${shown === l ? "text-[#16181D] underline decoration-[#EA5514] decoration-2 underline-offset-4" : "text-neutral-500 hover:text-[#16181D]"}`}>{label}</button>
      ))}
    </div>
  );
}
