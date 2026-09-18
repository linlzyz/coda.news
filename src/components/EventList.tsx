import type { EventRow } from "@/lib/data";
import { EventCard } from "./EventCard";

export function EventList({ title, intro, events }: { title: string; intro?: string; events: EventRow[] }) {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-[-0.02em]">{title}</h1>
      {intro && <p className="mt-3 text-lg text-slate-600">{intro}</p>}
      <div className="mt-6">{events.length ? events.map((e) => <EventCard key={e.id} e={e} />) : <p className="py-10 text-slate-500">No events yet.</p>}</div>
    </div>
  );
}
