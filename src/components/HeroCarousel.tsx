"use client";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";

/** Up to five headline stories, one at a time: swipe or use the dots; turns every 8 s unless the reader is on it. */
export function HeroCarousel({ children, label, every = 8000 }: { children: ReactNode; label: string; every?: number }) {
  const slides = Children.toArray(children);
  const box = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const go = (k: number) => { const el = box.current; if (!el) return; el.scrollTo({ left: el.clientWidth * k, behavior: "smooth" }); };
  useEffect(() => {
    const el = box.current; if (!el) return;
    const on = () => setI(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (hold || slides.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => go((i + 1) % slides.length), every);
    return () => clearTimeout(id);
  }, [i, hold, slides.length, every]);
  if (slides.length < 2) return <>{slides}</>;
  return (
    <div onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onTouchStart={() => setHold(true)} onFocus={() => setHold(true)} aria-roledescription="carousel" aria-label={label}>
      <div ref={box} className="flex snap-x snap-mandatory overflow-x-auto rounded-3xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slides.map((s, k) => <div key={k} className="flex w-full shrink-0 snap-start [&>*]:w-full" aria-hidden={k !== i}>{s}</div>)}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        {slides.map((_, k) => (
          <button key={k} type="button" aria-label={`${k + 1} / ${slides.length}`} onClick={() => go(k)}
            className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-[#EA5514]" : "w-1.5 bg-neutral-300 hover:bg-neutral-400"}`} />
        ))}
      </div>
    </div>
  );
}
