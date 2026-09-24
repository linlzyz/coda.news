// Home row "New launches / 新品速览": swipeable cards of products unveiled in the last three days.
// Key numbers (power, range, price, screen, storage...) are picked out of our own summary and key points; nothing is invented.
import Link from "@/components/LLink";
import type { EventRow } from "@/lib/data";
import { t, type Lang } from "@/lib/i18n";
import { summary, title } from "@/lib/loc";
import { Cover } from "./Cover";
import { CategoryLabel } from "./Pills";
import { HeroCarousel } from "./HeroCarousel";

const oneSource = (e: EventRow) => e.source_count < 2 && !!e.lead_url && !!e.lead_source;
const SPEC = /(?:(?:US)?\$|€|£|¥|A\$)\s?\d[\d,.]*\s?(?:万|million|m|k)?|\d[\d,.]*\s?(?:万元|万美元|美元|欧元|英镑|元|日元)|\d[\d,.]*\s?(?:马力|hp|HP|horsepower|PS|kW|kWh|公里|km|miles|英里|mph|英寸|inch(?:es)?|GB|TB|mAh|W\b|Hz|MP|万像素|秒)/g;
function specs(e: EventRow, zh: boolean) {
  const text = [summary(e, zh ? "zh" : "en") ?? "", ...((zh ? e.points?.zh : e.points?.en) ?? [])].join(" ");
  const out: string[] = [];
  for (const m of text.matchAll(SPEC)) { const v = m[0].trim().replace(/\s+/g, " "); if (!out.some((x) => x.replace(/\D/g, "") === v.replace(/\D/g, ""))) out.push(v); if (out.length === 3) break; }
  return out;
}
const firstSentence = (s: string, zh: boolean) => (s.match(zh ? /^.+?[。！？]/ : /^.+?[.!?](?=\s|$)/)?.[0] ?? s);

export function NewProducts({ events, lang }: { events: EventRow[]; lang: Lang }) {
  if (events.length < 3) return null;   // a row of one or two cards looks broken; they stay in Picks and Latest
  const zh = lang === "zh";
  return (
    <section>
      <div className="flex items-baseline gap-3 border-b border-[#E5E7EB] py-3">
        <h2 className="text-[22px] font-semibold tracking-[-0.02em]">{t(lang, "newProducts")}</h2>
        <span className="hidden text-[13px] text-neutral-500 sm:inline">{t(lang, "newProductsSub")}</span>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 pt-4 [scrollbar-width:thin] sm:mx-0 sm:px-0">
        {events.map((e) => {
          const sp = specs(e, zh);
          const inner = (
            <>
              <Cover e={e} className="aspect-[4/3] w-full rounded-xl" />
              <div className="mt-3 flex items-center gap-2 text-[11px]"><CategoryLabel category={e.category} lang={lang} />
                <span className="text-neutral-500">{e.countries.length > 1 ? (zh ? `${e.countries.length} 国报道` : `${e.countries.length} countries`) : e.lead_source}</span></div>
              <h3 className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-[#16181D] group-hover:text-[#C2410C]">{title(e, lang)}</h3>
              <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-neutral-600">{firstSentence(summary(e, lang) ?? "", zh)}</p>
              {sp.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{sp.map((x) => <span key={x} className="rounded-md bg-[#F4F5F7] px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-[#16181D]">{x}</span>)}</div>}
            </>
          );
          const cls = "group block w-[250px] shrink-0 snap-start sm:w-[270px]";
          return oneSource(e)
            ? <a key={e.id} href={e.lead_url!} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
            : <Link key={e.id} href={`/event/${e.slug}`} className={cls}>{inner}</Link>;
        })}
      </div>
    </section>
  );
}

/** Sidebar version under Top topics: one product at a time, turning by itself (HeroCarousel: swipe, dots, pauses on hover, still with reduce-motion). */
export function NewProductsBox({ events, lang }: { events: EventRow[]; lang: Lang }) {
  if (!events.length) return null;
  const zh = lang === "zh";
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 min-w-0 overflow-hidden">
      <div className="flex items-baseline"><h2 className="text-[17px] font-semibold tracking-[-0.015em]">{t(lang, "newProducts")}</h2>
        <span className="ml-auto text-[12px] text-neutral-500">{zh ? "最近三天" : "Last 3 days"}</span></div>
      <div className="mt-4">
        <HeroCarousel label={t(lang, "newProducts")} every={5000}>
          {events.map((e) => {
            const sp = specs(e, zh);
            const inner = (
              <>
                <Cover e={e} className="aspect-[4/3] w-full rounded-xl" />
                <div className="mt-3 flex items-center gap-2 text-[11px]"><CategoryLabel category={e.category} lang={lang} />
                  <span className="text-neutral-500">{e.countries.length > 1 ? (zh ? `${e.countries.length} 国报道` : `${e.countries.length} countries`) : e.lead_source}</span></div>
                <h3 className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-[#16181D] group-hover:text-[#C2410C]">{title(e, lang)}</h3>
                <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-neutral-600">{firstSentence(summary(e, lang) ?? "", zh)}</p>
                {sp.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{sp.map((x) => <span key={x} className="rounded-md bg-[#F4F5F7] px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-[#16181D]">{x}</span>)}</div>}
              </>
            );
            return oneSource(e)
              ? <a key={e.id} href={e.lead_url!} target="_blank" rel="noopener noreferrer" className="group block">{inner}</a>
              : <Link key={e.id} href={`/event/${e.slug}`} className="group block">{inner}</Link>;
          })}
        </HeroCarousel>
      </div>
    </section>
  );
}
