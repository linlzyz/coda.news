"use client";
// 简/繁 switch for /zh pages (Lyn, 30 Oct 2026). The conversion runs in the reader's browser with OpenCC
// (Simplified → Traditional with Taiwan-style phrases), so it adds no pages, no AI calls and no Vercel cost.
// The dictionary (opencc-js/cn2t) loads only when someone switches it on.
import { useEffect, useRef, useState } from "react";

const KEY = "hant";
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "CODE", "PRE", "NOSCRIPT"]);
const get = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };
const put = (on: boolean) => { try { if (on) localStorage.setItem(KEY, "1"); else localStorage.removeItem(KEY); } catch { /* private mode */ } };

export function HantToggle() {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const obs = useRef<MutationObserver | null>(null);

  async function enable() {
    setBusy(true);
    const OpenCC = await import("opencc-js/cn2t");
    const conv = OpenCC.Converter({ from: "cn", to: "twp" });
    const fix = (n: Node) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const p = n.parentElement;
        if (!p || SKIP.has(p.tagName) || p.closest("[data-no-hant]")) return;
        const v = n.nodeValue ?? "";
        if (/[一-鿿]/.test(v)) { const t = conv(v); if (t !== v) n.nodeValue = t; }
      } else if (n.nodeType === Node.ELEMENT_NODE && !SKIP.has((n as Element).tagName)) {
        const el = n as HTMLElement;
        for (const a of ["placeholder", "aria-label", "title", "alt"]) { const v = el.getAttribute(a); if (v && /[一-鿿]/.test(v)) el.setAttribute(a, conv(v)); }
        n.childNodes.forEach(fix);
      }
    };
    fix(document.body);
    document.title = conv(document.title);
    document.documentElement.lang = "zh-Hant";
    obs.current?.disconnect();
    obs.current = new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === "characterData") fix(m.target);
        else m.addedNodes.forEach(fix);
      }
      const t = conv(document.title); if (t !== document.title) document.title = t;
    });
    obs.current.observe(document.body, { subtree: true, childList: true, characterData: true });
    setOn(true); setBusy(false);
  }

  useEffect(() => { if (get()) enable(); return () => obs.current?.disconnect(); }, []);

  const click = () => {
    if (busy) return;
    if (on) { put(false); window.location.reload(); }
    else { put(true); enable(); }
  };
  return (
    <button type="button" onClick={click} aria-pressed={on} data-no-hant title={on ? "切换为简体" : "切換為繁體"} aria-label={on ? "切换为简体" : "切換為繁體"}
      className={`flex h-10 min-w-10 items-center justify-center rounded-xl border border-[#E5E7EB] px-2.5 text-[13px] font-medium transition-opacity ${busy ? "opacity-60" : ""} ${on ? "bg-[#1F2328] text-white" : "text-neutral-600 hover:text-[#16181D]"}`}>
      {on ? "简" : "繁"}
    </button>
  );
}
