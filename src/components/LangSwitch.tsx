"use client";
import { useRouter } from "next/navigation";

function saveLang(l: string) {
  document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
}

export function LangSwitch({ lang }: { lang: "en" | "zh" }) {
  const router = useRouter();
  const set = (l: string) => { saveLang(l); router.refresh(); };
  return (
    <div className="flex h-10 items-center rounded-xl border border-[#E5E7EB] p-1 text-[13px] font-medium" role="group" aria-label="Language">
      {([["en", "EN"], ["zh", "中文"]] as const).map(([l, label]) => (
        <button key={l} type="button" onClick={() => set(l)} aria-pressed={lang === l}
          className={`h-8 rounded-lg px-2.5 ${lang === l ? "bg-[#1F2328] text-white" : "text-neutral-600 hover:text-[#16181D]"}`}>{label}</button>
      ))}
    </div>
  );
}
