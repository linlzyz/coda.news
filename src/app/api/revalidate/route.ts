// Called by the news pipeline when stories change: refreshes just those pages instead of rebuilding everything on a timer.
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) return new Response("forbidden", { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { events?: string[]; home?: boolean };
  const slugs = (body.events ?? []).filter((s) => /^[a-z0-9-]{1,200}$/.test(s)).slice(0, 100);
  if (slugs.length) revalidateTag("ev", "max");
  for (const s of slugs) for (const l of ["en", "zh"]) revalidatePath(`/${l}/event/${s}`);
  if (body.home) { revalidateTag("list", "max"); for (const l of ["en", "zh"]) revalidatePath(`/${l}`); }
  return Response.json({ ok: true, events: slugs.length, home: !!body.home });
}
