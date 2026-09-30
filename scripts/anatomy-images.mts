// Copies every Wikimedia Commons photo used by Coda Anatomy into public/anatomy-img as WebP (800 and 1600 wide).
// Run after adding a profile or a photo: npx tsx scripts/anatomy-images.mts   (existing files are skipped)
import fs from "node:fs";
import sharp from "sharp";
import { DRAFTS, PROFILES, PHOTO_WIDTHS, commonsUrl, photoUrl } from "../src/lib/anatomy";

const files = new Set<string>();
for (const p of [...PROFILES, ...DRAFTS]) { if (!p.cover.own) files.add(p.cover.file); for (const s of p.sections) if (s.photo && !s.photo.own) files.add(s.photo.file); }
fs.mkdirSync("public/anatomy-img", { recursive: true });
for (const f of files) {
  const outs = PHOTO_WIDTHS.map((w) => ({ w, path: `public${photoUrl(f, w)}` }));
  // plus one JPEG for the Instagram slides: Satori (next/og) cannot draw WebP
  const jpg = `public${photoUrl(f, 1600).replace(/\.webp$/, ".jpg")}`;
  if (outs.every((o) => fs.existsSync(o.path)) && fs.existsSync(jpg)) continue;
  const r = await fetch(commonsUrl(f, 2000), { headers: { "user-agent": "coda.news/1.0 (info@coda.news)" } });
  if (!r.ok) { console.error("failed", r.status, f); process.exitCode = 1; continue; }
  const buf = Buffer.from(await r.arrayBuffer());
  for (const o of outs) await sharp(buf).rotate().resize({ width: o.w, withoutEnlargement: true }).webp({ quality: o.w > 900 ? 72 : 76 }).toFile(o.path);
  await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 82, mozjpeg: true }).toFile(jpg);
  console.log("ok", f, [...outs.map((o) => o.path), jpg].map((x) => `${x} ${Math.round(fs.statSync(x).size / 1024)}KB`).join(" "));
}
