import type { EventRow } from "@/lib/data";
import { Icon } from "./Icons";

const TOPIC_ICON: Record<number, string> = {};
const PALETTE = [["#EEF4FB", "#0B3A6E"], ["#E6EDF6", "#1560BD"], ["#F3F6FA", "#3A5A80"], ["#EAF2F8", "#1D5D8C"]];

/** Image if a legal one exists, otherwise a designed cover in the topic's colour. Never a broken image. */
export function Cover({ e, className = "", credit = false, iconName }: { e: EventRow; className?: string; credit?: boolean; iconName?: string }) {
  if (e.image_url) {
    return (
      <figure className={`relative overflow-hidden bg-[#F3F6FA] ${className}`}>
        <img src={e.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
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
