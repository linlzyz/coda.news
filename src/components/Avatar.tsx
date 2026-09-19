"use client";
import { useState } from "react";

// round portrait; falls back to the initial if the photo will not load
export function Avatar({ src, name, size = 64 }: { src?: string; name: string; size?: number }) {
  const [bad, setBad] = useState(!src);
  const box = { width: size, height: size };
  if (bad) return <span style={box} className="flex shrink-0 items-center justify-center rounded-full bg-[#F4F5F7] text-[20px] font-semibold text-neutral-500">{name[0]}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={name} style={box} className="shrink-0 rounded-full object-cover object-top" loading="lazy" onError={() => setBad(true)} />;
}
