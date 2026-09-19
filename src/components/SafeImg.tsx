"use client";
import { useEffect, useRef, type ImgHTMLAttributes } from "react";

// an image that, if it fails to load (e.g. the host blocks hotlinking), hides its figure's picture and shows the designed cover instead
export function SafeImg(props: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null);
  const broken = (el: HTMLImageElement | null) => el?.closest("figure")?.setAttribute("data-broken", "1");
  // it may already have failed before this page became interactive
  useEffect(() => { const el = ref.current; if (el && el.complete && el.naturalWidth === 0) broken(el); }, []);
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img ref={ref} {...props} onError={(ev) => broken(ev.currentTarget)} />;
}
