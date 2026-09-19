"use client";
import { useEffect, useState } from "react";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const KEY = "coda-install";

/** Phones only: a small bottom card inviting readers to put coda.news on their home screen.
 *  Android/Chrome gets a real "Add" button; iPhone gets the two taps Safari needs. Shown from the second visit,
 *  never in the installed app, and a dismissal is remembered for 30 days. */
export function InstallPrompt({ zh }: { zh: boolean }) {
  const [mode, setMode] = useState<"android" | "ios" | null>(null);
  const [evt, setEvt] = useState<BIP | null>(null);

  useEffect(() => {
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    // ?install=1 shows it straight away (for checking on a phone)
    const force = new URLSearchParams(location.search).has("install");
    if (standalone || (!force && window.innerWidth > 820)) return;
    let st: { visits?: number; until?: number } = {};
    try { st = JSON.parse(localStorage.getItem(KEY) ?? "{}"); st.visits = (st.visits ?? 0) + 1; localStorage.setItem(KEY, JSON.stringify(st)); } catch { return; }
    if (!force && ((st.visits ?? 0) < 2 || (st.until ?? 0) > Date.now())) return;
    const wait = force ? 800 : 15000;
    const ua = navigator.userAgent;
    const iosSafari = /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Instagram|FBAN|FBAV|Line|MicroMessenger/.test(ua);
    const onBip = (e: Event) => { e.preventDefault(); setEvt(e as BIP); setTimeout(() => setMode("android"), wait); };
    window.addEventListener("beforeinstallprompt", onBip);
    const t = iosSafari || (force && !/Android/.test(ua)) ? setTimeout(() => setMode("ios"), wait) : undefined;
    return () => { window.removeEventListener("beforeinstallprompt", onBip); if (t) clearTimeout(t); };
  }, []);

  const close = () => {
    setMode(null);
    try { const st = JSON.parse(localStorage.getItem(KEY) ?? "{}"); st.until = Date.now() + 30 * 86400_000; localStorage.setItem(KEY, JSON.stringify(st)); } catch {}
  };
  if (!mode) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 rounded-2xl bg-[#1F2328] p-4 text-white shadow-2xl" role="dialog" aria-label={zh ? "添加到主屏幕" : "Add to home screen"}>
      <div className="flex items-start gap-3">
        <img src="/icons/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">{zh ? "把 coda.news 放到主屏幕" : "Put coda.news on your home screen"}</p>
          {mode === "ios" ? (
            <p className="mt-1 text-[13px] leading-relaxed text-neutral-300">
              {zh ? <>点下方 Safari 的分享按钮 <ShareIcon />，再选“添加到主屏幕”。</> : <>Tap Safari&apos;s Share button <ShareIcon />, then “Add to Home Screen”.</>}
            </p>
          ) : (
            <p className="mt-1 text-[13px] leading-relaxed text-neutral-300">{zh ? "像 App 一样一点就开，每天的新闻不用再找。" : "Open it in one tap, like an app."}</p>
          )}
        </div>
        <button type="button" onClick={close} aria-label={zh ? "关闭" : "Close"} className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-white">✕</button>
      </div>
      {mode === "android" && evt && (
        <button type="button" onClick={async () => { await evt.prompt(); await evt.userChoice.catch(() => null); close(); }}
          className="mt-3 w-full rounded-xl bg-[#EA5514] py-2.5 text-[14px] font-semibold text-white hover:bg-[#D24A0F]">{zh ? "添加到主屏幕" : "Add to home screen"}</button>
      )}
    </div>
  );
}

function ShareIcon() {
  return <svg className="mx-0.5 inline-block align-[-3px]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>;
}
