import type { EventRow } from "@/lib/data";
import { Icon } from "./Icons";

/** Image if a legal one exists, otherwise a quiet designed cover. Never a broken image. */
export function Cover({ e, className = "", credit = false, iconName }: { e: EventRow; className?: string; credit?: boolean; iconName?: string }) {
  if (e.image_url) {
    return (
      <figure className={`relative overflow-hidden bg-[#F5F5F4] ${className}`}>
        <img src={e.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        {credit && e.image_credit && (
          <figcaption className="absolute bottom-0 right-0 bg-black/50 px-2 py-0.5 text-[10px] text-white/90">
            {e.image_link ? <a href={e.image_link} target="_blank" rel="noopener noreferrer">Photo: {e.image_credit}</a> : <>Photo: {e.image_credit}</>}
          </figcaption>
        )}
      </figure>
    );
  }
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-[#F2F1EF] text-[#8A8580] ${className}`}>
      <Icon name={iconName ?? (e.category === "economy" ? "economy" : "technology")} size={36} />
    </div>
  );
}
