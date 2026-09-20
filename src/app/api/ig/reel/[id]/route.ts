// Instagram Reel for one planned post: the post's three slides as a 9:16 MP4 (soft crossfades, silent audio track).
// Instagram fetches this URL itself; the CDN keeps the result, so it renders once.
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import { igSlide } from "@/lib/data";

export const runtime = "nodejs";
export const maxDuration = 120;
const run = promisify(execFile);
const HOLD = [4.5, 4.5, 5], FADE = 0.5;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id.replace(/\.mp4$/, ""));
  const p = id ? await igSlide(id) : null;
  if (!p?.slug || p.format !== "reel" || !ffmpegPath) return new Response("Not found", { status: 404 });
  const origin = new URL(req.url).origin;
  const dir = await mkdtemp(path.join(tmpdir(), "reel-"));
  try {
    const files = await Promise.all([1, 2, 3].map(async (s) => {
      const r = await fetch(`${origin}/event/${p.slug}/social?s=${s}&fmt=jpg`);
      if (!r.ok) throw new Error(`slide ${s}: ${r.status}`);
      const f = path.join(dir, `s${s}.jpg`);
      await writeFile(f, Buffer.from(await r.arrayBuffer()));
      return f;
    }));
    const total = HOLD.reduce((a, b) => a + b, 0) - FADE * (HOLD.length - 1);
    // each 4:5 slide sits on warm paper in a 9:16 frame; crossfade between them
    const prep = HOLD.map((_, i) => `[${i}:v]scale=1080:1350,pad=1080:1920:0:285:color=0xF4F3F0,setsar=1,fps=30,format=yuv420p[v${i}]`);
    const fades = `[v0][v1]xfade=transition=fade:duration=${FADE}:offset=${HOLD[0] - FADE}[x1];[x1][v2]xfade=transition=fade:duration=${FADE}:offset=${HOLD[0] + HOLD[1] - 2 * FADE}[out]`;
    const out = path.join(dir, "reel.mp4");
    await run(ffmpegPath, [
      "-hide_banner", "-loglevel", "error",
      ...files.flatMap((f, i) => ["-loop", "1", "-t", String(HOLD[i]), "-i", f]),
      "-f", "lavfi", "-t", String(total), "-i", "anullsrc=r=48000:cl=stereo",
      "-filter_complex", [...prep, fades].join(";"),
      "-map", "[out]", "-map", "3:a",
      "-c:v", "libx264", "-preset", "veryfast", "-tune", "stillimage", "-crf", "24", "-pix_fmt", "yuv420p", "-r", "30",
      "-c:a", "aac", "-b:a", "64k", "-shortest", "-movflags", "+faststart", out,
    ], { timeout: 100_000 });
    const mp4 = await readFile(out);
    return new Response(new Uint8Array(mp4), { headers: { "content-type": "video/mp4", "content-length": String(mp4.length), "cache-control": "public, max-age=0, s-maxage=604800" } });
  } catch (e) {
    return new Response(`Render failed: ${(e as Error).message.slice(0, 200)}`, { status: 500, headers: { "cache-control": "no-store" } });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
