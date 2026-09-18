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
    <span className={`inline-flex items-center gap-1 ${pending ? "opacity-60" : ""}`} role="group" aria-label="Language">
      {([["en", "EN"], ["zh", "中文"]] as const).map(([l, label], i) => (
        <span key={l} className="inline-flex items-center gap-1">
          {i > 0 && <span className="text-neutral-300">/</span>}
          <button type="button" onClick={() => set(l)} aria-pressed={shown === l}
            className={`min-h-8 px-1 ${shown === l ? "font-semibold text-[#111111] underline decoration-[#EA5514] decoration-2 underline-offset-4" : "text-neutral-500 hover:text-[#111111]"}`}>{label}</button>
        </span>
      ))}
    </span>
  );
}
