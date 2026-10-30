// Photos for issues stored in the database: files already in public/anatomy-img are served as static files first;
// anything else is fetched once from Wikimedia Commons, resized like scripts/anatomy-images.mts and cached by the CDN for a year.
import sharp from "sharp";
import { commonsUrl, photoKey } from "@/lib/anatomy";
import { photoFiles } from "@/lib/anatomy-db";

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const m = name.match(/^([0-9a-z]{1,16})-(800|1600)\.(webp|jpg)$/);
  if (!m) return new Response("Not found", { status: 404 });
  const [, key, w, fmt] = m;
  const file = (await photoFiles()).find((f) => photoKey(f) === key);
  if (!file) return new Response("Not found", { status: 404 });
  const r = await fetch(commonsUrl(file, 2000), { headers: { "user-agent": "coda.news/1.0 (info@coda.news)" }, signal: AbortSignal.timeout(20000) }).catch(() => null);
  if (!r?.ok) return new Response("Upstream error", { status: 502, headers: { "cache-control": "no-store" } });
  const img = sharp(Buffer.from(await r.arrayBuffer())).rotate().resize({ width: Number(w), withoutEnlargement: true });
  const out = fmt === "jpg"
    ? await img.flatten({ background: "#ffffff" }).jpeg({ quality: 82, mozjpeg: true }).toBuffer()
    : await img.webp({ quality: Number(w) > 900 ? 72 : 76 }).toBuffer();
  return new Response(new Uint8Array(out), { headers: {
    "content-type": fmt === "jpg" ? "image/jpeg" : "image/webp",
    "cache-control": "public, max-age=31536000, immutable",
    "cdn-cache-control": "public, max-age=31536000, immutable",
  } });
}
