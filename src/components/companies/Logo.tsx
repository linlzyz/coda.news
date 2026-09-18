/** Company logo from Wikimedia Commons, or a monogram tile when there is none. */
export function CompanyLogo({ name, url, size = 72, className = "" }: { name: string; url: string | null; size?: number; className?: string }) {
  const initials = name.replace(/[^\p{L}\p{N} ]/gu, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  return (
    <div className={`flex items-center justify-center overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white ${className}`} style={{ width: size, height: size }}>
      {url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={url} alt={`${name} logo`} loading="lazy" className="max-h-[62%] max-w-[72%] object-contain" />
        : <span className="font-semibold tracking-[-0.02em] text-[#16181D]" style={{ fontSize: size * 0.32 }}>{initials}</span>}
    </div>
  );
}
