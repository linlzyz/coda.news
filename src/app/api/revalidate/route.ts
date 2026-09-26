// Called by the news pipeline when stories change: refreshes just those pages instead of rebuilding everything on a timer.
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });

export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) return new Response("forbidden", { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { events?: string[]; home?: boolean; sections?: boolean };
  const slugs = (body.events ?? []).filter((s) => /^[a-z0-9-]{1,200}$/.test(s)).slice(0, 100);
  if (slugs.length) {
    // refresh only the changed stories' cached data (by slug and by id), not every story on the site
    const { data } = await supabase.from("events").select("id,slug").in("slug", slugs);
    for (const s of slugs) revalidateTag(`evs-${s}`, "max");
    for (const r of data ?? []) revalidateTag(`ev-${r.id}`, "max");
  }
  for (const s of slugs) for (const l of ["en", "zh"]) revalidatePath(`/${l}/event/${s}`);
  if (body.sections) {
    revalidateTag("list", "max");
    for (const l of ["en", "zh"]) for (const p of ["", "/economy", "/technology", "/sport", "/entertainment", "/fashion", "/travel", "/automotive", "/gaming", "/australia", "/china"]) revalidatePath(`/${l}${p}`);
  }
  if (body.home) { revalidateTag("list", "max"); for (const l of ["en", "zh"]) revalidatePath(`/${l}`); }
  return Response.json({ ok: true, events: slugs.length, home: !!body.home, sections: !!body.sections });
}
