"use client";
import { useEffect, useRef, type ImgHTMLAttributes } from "react";

// an image that, if it fails to load (e.g. the host blocks hotlinking), hides its figure's picture and shows the designed cover instead
export function SafeImg(props: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null);
  const broken = (el: HTMLImageElement | null) => el?.closest("figure")?.setAttribute("data-broken", "1");
  // it may already have failed before this page became interactive
  // (Chrome also reports complete + width 0 for lazy images it simply hasn't fetched yet, so confirm with a real load first)
  useEffect(() => {
    const el = ref.current;
    if (!el || !el.complete || el.naturalWidth > 0) return;
    const probe = new Image();
    probe.onerror = () => broken(el);
    probe.src = el.currentSrc || el.src;
  }, []);
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img ref={ref} {...props} onError={(ev) => broken(ev.currentTarget)} />;
}
