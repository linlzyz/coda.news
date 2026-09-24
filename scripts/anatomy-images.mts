// Copies every Wikimedia Commons photo used by Coda Anatomy into public/anatomy-img as WebP (800 and 1600 wide).
// Run after adding a profile or a photo: npx tsx scripts/anatomy-images.mts   (existing files are skipped)
import fs from "node:fs";
import sharp from "sharp";
import { PROFILES, PHOTO_WIDTHS, commonsUrl, photoUrl } from "../src/lib/anatomy";

const files = new Set<string>();
for (const p of PROFILES) { files.add(p.cover.file); for (const s of p.sections) if (s.photo) files.add(s.photo.file); }
fs.mkdirSync("public/anatomy-img", { recursive: true });
for (const f of files) {
  const outs = PHOTO_WIDTHS.map((w) => ({ w, path: `public${photoUrl(f, w)}` }));
  if (outs.every((o) => fs.existsSync(o.path))) continue;
  const r = await fetch(commonsUrl(f, 2000), { headers: { "user-agent": "coda.news/1.0 (info@coda.news)" } });
  if (!r.ok) { console.error("failed", r.status, f); process.exitCode = 1; continue; }
  const buf = Buffer.from(await r.arrayBuffer());
  for (const o of outs) await sharp(buf).rotate().resize({ width: o.w, withoutEnlargement: true }).webp({ quality: o.w > 900 ? 72 : 76 }).toFile(o.path);
  console.log("ok", f, outs.map((o) => `${o.path} ${Math.round(fs.statSync(o.path).size / 1024)}KB`).join(" "));
}
