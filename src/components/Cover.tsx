import type { EventRow } from "@/lib/data";
import { Icon } from "./Icons";

const TOPIC_ICON: Record<number, string> = {};
const PALETTE = [["#F2F1EF", "#8A8580"], ["#F2F1EF", "#8A8580"]];

/** Image if a legal one exists, otherwise a designed cover in the topic's colour. Never a broken image. */
export function Cover({ e, className = "", credit = false, iconName }: { e: EventRow; className?: string; credit?: boolean; iconName?: string }) {
  if (e.image_url) {
    return (
      <figure className={`relative overflow-hidden bg-[#F4F5F7] ${className}`}>
        <img src={e.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        {credit && e.image_credit && (
          <figcaption className="absolute bottom-0 right-0 bg-black/50 px-2 py-0.5 text-[10px] text-white/90">
            {e.image_link ? <a href={e.image_link} target="_blank" rel="noopener noreferrer">Photo: {e.image_credit}</a> : <>Photo: {e.image_credit}</>}
          </figcaption>
        )}
      </figure>
    );
  }
  const [bg, fg] = PALETTE[e.id % PALETTE.length];
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`} style={{ background: bg, color: fg }}>
            <Icon name={iconName ?? TOPIC_ICON[e.topic_ids[0]] ?? (e.category === "economy" ? "economy" : "technology")} size={40} className="relative" />
    </div>
  );
}
