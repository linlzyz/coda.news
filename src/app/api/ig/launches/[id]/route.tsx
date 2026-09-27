// Sunday Instagram roundup "New launches this week" (1080×1350; ?s=story is 9:16). The picks and their short copy are
// written by the Instagram job and stored on the post (ig_posts.copy.items), so the slides never change after posting.
//   ?s=0 cover (numbered list)   ?s=1..6 one launch per slide   ?s=story   &fmt=jpg for Instagram
import { ImageResponse } from "next/og";
import { igSlide } from "@/lib/data";
import { LOGO_DATA_URI, LOGO_WHITE_DATA_URI } from "@/lib/logo-data";
import { brandParts, gfont } from "@/lib/og-font";

export const revalidate = 86400;
const W = 1080, H = 1350, SH = 1920, ORANGE = "#EA5514", INK = "#16181D", PAPER = "#F4F3F0";
const SEC: Record<string, [string, string]> = { technology: ["TECH", "#1D5FD1"], automotive: ["AUTO", "#B42318"], gaming: ["GAMES", "#7A2E9E"], fashion: ["STYLE", "#16181D"] };
type Item = { slug: string; cat: string; name: string; brand: string; line: string; countries: string[]; sources: number; img?: string | null; credit?: string | null };
const B = ({ text }: { text: string }) => <>{brandParts(text).map((p, i) => <span key={i} style={p.dot ? { color: ORANGE } : {}}>{p.t}</span>)}</>;

async function dataUri(url: string) {
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; coda.news/1.0)" }, signal: AbortSignal.timeout(12000) }).catch(() => null);
  if (!r?.ok) return null;
  const type = r.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) return null;
  const sharp = (await import("sharp")).default;
  const buf = await sharp(Buffer.from(await r.arrayBuffer())).resize(1080, 1080, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer().catch(() => null);
  return buf ? `data:image/jpeg;base64,${buf.toString("base64")}` : null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = new URL(req.url);
  const s = u.searchParams.get("s") ?? "0";
  const post = await igSlide(Number((await params).id));
  const copy = post?.copy as unknown as { week?: string; items?: Item[] } | null;
  const items = copy?.items ?? [];
  if (post?.kind !== "launches" || !items.length) return new Response("Not found", { status: 404 });
  const week = copy?.week ?? "";
  // pictures: the cover shows them all as a grid, each launch slide its own
  const want = s === "0" ? items.map((x) => x.img) : [items[Number(s) - 1]?.img];
  const pics = await Promise.all(want.map((u) => (u ? dataUri(u) : Promise.resolve(null))));
  const k = Number(s);
  const it = s !== "story" && k >= 1 ? items[k - 1] : undefined;
  if (s !== "0" && s !== "story" && !it) return new Response("Not found", { status: 404 });

  const text = ["NEW LAUNCHES THIS WEEK", "This week's launches", "Swipe →", "Reported in countries sources Photo:", "More on coda.news: link in bio", "New post: this week's launches", week, "0123456789/·", "coda.news",
    ...Object.values(SEC).map((v) => v[0]), ...items.flatMap((x) => [x.name, x.brand, x.line, x.credit ?? ""])].join("");
  const [r4, b7, k9] = await Promise.all([gfont("Inter", 400, text), gfont("Inter", 700, text), gfont("Inter", 900, text)]);
  const fonts = [{ name: "Sans", data: r4, weight: 400 as const }, { name: "Sans", data: b7, weight: 700 as const }, { name: "Sans", data: k9, weight: 900 as const }];
  const flags = (cs: string[]) => cs.slice(0, 5).map((c) => <img key={c} src={`https://flagcdn.com/48x36/${c.toLowerCase()}.png`} width={40} height={30} style={{ marginRight: 10, borderRadius: 3 }} alt="" />);
  const nameSize = (n: string) => (n.length > 36 ? 68 : n.length > 24 ? 84 : 100);

  const tiles = items.map((x, i) => ({ x, i, pic: pics[i] }));
  const cols = items.length > 6 ? 4 : items.length > 4 ? 3 : 2, tw = Math.floor((W - 152 - (cols - 1) * 16) / cols);
  const cover = pics.some(Boolean) && s === "0" ? (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: INK, color: "#fff", fontFamily: "Sans", padding: "64px 76px" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={LOGO_WHITE_DATA_URI} width={236} height={37} alt="" />
        <div style={{ marginLeft: "auto", display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: 5, opacity: 0.8 }}>{week}</div>
      </div>
      <div style={{ display: "flex", marginTop: 56, fontSize: 24, fontWeight: 700, letterSpacing: 6, color: ORANGE }}>NEW LAUNCHES THIS WEEK</div>
      <div style={{ display: "flex", marginTop: 14, fontSize: 92, fontWeight: 900, lineHeight: 1, letterSpacing: -3 }}>This week&apos;s launches</div>
      <div style={{ display: "flex", flexWrap: "wrap", marginTop: 48, gap: 16 }}>
        {tiles.map(({ x, i, pic }) => (
          <div key={x.slug} style={{ display: "flex", flexDirection: "column", width: tw }}>
            <div style={{ display: "flex", width: tw, height: Math.round(tw * (cols === 4 ? 1.3 : 0.9)), background: "#2A2D35", borderRadius: 10, overflow: "hidden", position: "relative" }}>
              {pic && <img src={pic} width={tw} height={Math.round(tw * (cols === 4 ? 1.3 : 0.9))} style={{ objectFit: "cover" }} alt="" />}
              <div style={{ position: "absolute", left: 10, top: 10, display: "flex", background: ORANGE, color: "#fff", fontSize: 20, fontWeight: 900, padding: "4px 10px", borderRadius: 6 }}>{String(i + 1).padStart(2, "0")}</div>
            </div>
            <div style={{ display: "flex", marginTop: 10, fontSize: cols === 4 ? 22 : 26, fontWeight: 700, lineHeight: 1.15 }}>{x.name}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto", display: "flex", fontSize: 30, fontWeight: 700 }}>Swipe →</div>
    </div>
  ) : (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: ORANGE, color: "#fff", fontFamily: "Sans", padding: "70px 76px" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={LOGO_WHITE_DATA_URI} width={236} height={37} alt="" />
        <div style={{ marginLeft: "auto", display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: 5, opacity: 0.85 }}>{week}</div>
      </div>
      <div style={{ display: "flex", marginTop: 90, fontSize: 26, fontWeight: 700, letterSpacing: 6, opacity: 0.85 }}>NEW LAUNCHES THIS WEEK</div>
      <div style={{ display: "flex", marginTop: 18, fontSize: 104, fontWeight: 900, lineHeight: 1, letterSpacing: -3 }}>This week&apos;s launches</div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 60 }}>
        {items.map((x, i) => (
          <div key={x.slug} style={{ display: "flex", alignItems: "baseline", borderTop: "2px solid rgba(255,255,255,.35)", padding: "20px 0" }}>
            <div style={{ display: "flex", width: 70, fontSize: 30, fontWeight: 900, opacity: 0.7 }}>{String(i + 1).padStart(2, "0")}</div>
            <div style={{ display: "flex", fontSize: 38, fontWeight: 700, lineHeight: 1.15, maxWidth: 760 }}>{x.name}</div>
            <div style={{ display: "flex", marginLeft: "auto", fontSize: 20, fontWeight: 700, letterSpacing: 3, opacity: 0.75 }}>{(SEC[x.cat] ?? [x.cat.toUpperCase()])[0]}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto", display: "flex", fontSize: 30, fontWeight: 700 }}>Swipe →</div>
    </div>
  );

  const slide = it && (() => {
    const tag = SEC[it.cat] ?? [it.cat.toUpperCase(), INK];
    const pic = pics[0], photo = !!pic;
    return (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: PAPER, color: INK, fontFamily: "Sans" }}>
        {photo && (
          <div style={{ display: "flex", width: W, height: 760, position: "relative", borderBottom: `9px solid ${tag[1]}` }}>
            <img src={pic!} width={W} height={760} style={{ objectFit: "cover" }} alt="" />
            <div style={{ position: "absolute", left: 40, top: 36, display: "flex", background: ORANGE, color: "#fff", fontSize: 24, fontWeight: 900, padding: "6px 14px", borderRadius: 8 }}>{`${String(k).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`}</div>
            {it.credit && <div style={{ position: "absolute", right: 30, bottom: 22, display: "flex", fontSize: 17, color: "rgba(255,255,255,.92)", textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{`Photo: ${it.credit}`}</div>}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: photo ? "44px 76px 60px" : "70px 76px 60px", position: "relative" }}>
          {!photo && <div style={{ display: "flex", alignItems: "center" }}>
            <img src={LOGO_DATA_URI} width={236} height={37} alt="" />
            <div style={{ marginLeft: "auto", display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: 5 }}>NEW LAUNCHES · {k}/{items.length}</div>
          </div>}
          {!photo && <div style={{ display: "flex", position: "absolute", right: 50, bottom: 110, fontSize: 380, fontWeight: 900, color: "rgba(22,24,29,.06)", letterSpacing: -20 }}>{String(k).padStart(2, "0")}</div>}
          <div style={{ display: "flex", flexDirection: "column", marginTop: photo ? 0 : "auto", marginBottom: photo ? 0 : "auto" }}>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", background: tag[1], color: "#fff", fontSize: 22, fontWeight: 700, letterSpacing: 4, padding: "8px 16px", borderRadius: 6 }}>{tag[0]}</div>
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: photo ? Math.min(78, nameSize(it.name)) : nameSize(it.name), fontWeight: 900, lineHeight: 1.02, letterSpacing: -2 }}>{it.name}</div>
          <div style={{ display: "flex", marginTop: 16, fontSize: 32, fontWeight: 700, color: "#4B5563" }}>{it.brand}</div>
          <div style={{ display: "flex", marginTop: 30, fontSize: photo ? 32 : 40, lineHeight: 1.3, color: INK, maxWidth: 900 }}>{it.line}</div>
          </div>
          <div style={{ marginTop: photo ? "auto" : 0, display: "flex", alignItems: "center", fontSize: 26, color: "#4B5563" }}>
            {flags(it.countries)}
            <div style={{ display: "flex", marginLeft: 6 }}>{`${it.countries.length} ${it.countries.length === 1 ? "country" : "countries"} · ${it.sources} sources`}</div>
            <div style={{ marginLeft: "auto", display: "flex", fontSize: 38, fontWeight: 700, color: INK }}><B text="coda.news" /></div>
          </div>
        </div>
      </div>
    );
  })();

  const story = (
    <div style={{ width: W, height: SH, display: "flex", flexDirection: "column", background: INK, color: "#fff", fontFamily: "Sans", padding: "140px 80px" }}>
      <img src={LOGO_WHITE_DATA_URI} width={300} height={47} alt="" />
      <div style={{ display: "flex", marginTop: 160, fontSize: 30, fontWeight: 700, letterSpacing: 6, color: ORANGE }}>NEW POST</div>
      <div style={{ display: "flex", marginTop: 20, fontSize: 110, fontWeight: 900, lineHeight: 1, letterSpacing: -3 }}>This week&apos;s launches</div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 70 }}>
        {items.map((x, i) => <div key={x.slug} style={{ display: "flex", fontSize: 42, fontWeight: 700, padding: "14px 0", opacity: 0.92 }}>{`${i + 1}. ${x.name}`}</div>)}
      </div>
      <div style={{ marginTop: "auto", display: "flex", fontSize: 36, fontWeight: 700 }}>More on coda.news: link in bio</div>
    </div>
  );

  const img = new ImageResponse(s === "story" ? story : it ? slide! : cover, { width: W, height: s === "story" ? SH : H, fonts, headers: { "cache-control": "public, max-age=0, s-maxage=86400" } });
  if (u.searchParams.get("fmt") === "jpg") {
    const sharp = (await import("sharp")).default;
    const jpg = await sharp(Buffer.from(await img.arrayBuffer())).flatten({ background: "#ffffff" }).jpeg({ quality: 90 }).toBuffer();
    return new Response(new Uint8Array(jpg), { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=0, s-maxage=86400" } });
  }
  return img;
}
