import { searchEvents } from "@/lib/data";
import { EventList } from "@/components/EventList";
import { getLang, t } from "@/lib/i18n";
export const metadata = { title: "Search" };
export default async function Page({ searchParams }: PageProps<"/search">) {
  const q = String((await searchParams).q ?? "");
  const l = await getLang();
  return (
    <div>
      <form action="/search" className="mx-auto max-w-[900px] px-4 pt-8 sm:px-6">
        <label htmlFor="sq" className="sr-only">Search</label>
        <input id="sq" name="q" defaultValue={q} autoFocus placeholder={t(l, "search")} className="h-12 w-full border-b-2 border-[#16181D] px-1 text-[15px] outline-none focus:ring-2 focus:ring-[#FBD5C2]" />
      </form>
      <EventList title={q ? `${t(l, "resultsFor")} “${q}”` : t(l, "searchH")} events={q ? await searchEvents(q) : []} />
    </div>
  );
}
