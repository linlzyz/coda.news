import Link from "next/link";

/** Newspaper-style section header: heavy rule, title, optional "more" link. */
export function SectionHead({ title, href, more }: { title: string; href?: string; more?: string }) {
  return (
    <div className="mb-5 flex items-baseline border-t-2 border-[#111111] pt-2.5">
      <h2 className="text-[20px] font-semibold tracking-[-0.02em]">{title}</h2>
      {href && more && <Link href={href} className="ml-auto text-[13px] text-neutral-500 hover:text-[#C2410C]">{more} →</Link>}
    </div>
  );
}
