import type { EventRow } from "@/lib/data";
import { Icon } from "./Icons";

const TOPIC_ICON: Record<number, string> = {};
const PALETTE = [["#F4F5F7", "#1F2328"], ["#FFF1EA", "#C2410C"], ["#EEF0F3", "#4B5563"], ["#F6F1EC", "#9A3412"]];

/** Image if a legal one exists, otherwise a designed cover in the topic's colour. Never a broken image. */
export function Cover({ e, className = "", credit = false, iconName, priority = false }: { e: EventRow; className?: string; credit?: boolean; iconName?: string; priority?: boolean }) {
  if (e.image_url) {
    return (
      <figure className={`relative overflow-hidden bg-[#F4F5F7] ${className}`}>
        {e.image_focus === "top" ? (
          // portraits: show the whole photo over a blurred copy of itself, so a vertical picture is never cut in half
          <>
            <img src={e.image_url} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl" loading={priority ? "eager" : "lazy"} decoding="async" />
            <img src={e.image_url} alt={e.title} title={e.image_credit ? `Photo: ${e.image_credit}` : undefined} className="relative h-full w-full object-contain" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" />
          </>
        ) : (
          <img src={e.image_url} alt={e.title} title={e.image_credit ? `Photo: ${e.image_credit}` : undefined} className="h-full w-full object-cover" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" />
        )}
        {credit && e.image_credit && (
          <figcaption className="absolute bottom-2 right-2 rounded-md bg-black/45 px-2 py-0.5 text-[10px] text-white/90">
            {e.image_link ? <a href={e.image_link} target="_blank" rel="noopener noreferrer">Photo: {e.image_credit}</a> : <>Photo: {e.image_credit}</>}
          </figcaption>
        )}
      </figure>
    );
  }
  const [bg, fg] = PALETTE[e.id % PALETTE.length];
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`} style={{ background: bg, color: fg }}>
      <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: `radial-gradient(${fg} 1px, transparent 1px)`, backgroundSize: "14px 14px" }} />
      <Icon name={iconName ?? TOPIC_ICON[e.topic_ids[0]] ?? (e.category === "economy" ? "economy" : "technology")} size={40} className="relative" />
    </div>
  );
}
