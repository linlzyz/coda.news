// Editorial 4:5 images for Instagram / Threads / X carousels (1080×1350).
//   ?s=1  cover: full-bleed licensed photo (or graphite typographic cover), serif headline, logo
//   ?s=2  "How the world reports it": one line per country with its framing and tone
//   ?s=3  "The takeaway": what all reports share, and where the coverage differs
import { ImageResponse } from "next/og";
import { withPngMeta } from "@/lib/png-meta";
import QRCode from "qrcode";
import { getEvent, getLatestSummary, getPerspectives } from "@/lib/data";
import { COUNTRY_ZH } from "@/lib/i18n";
import { COUNTRY } from "@/lib/ui";
import { LOGO_DATA_URI } from "@/lib/logo-data";
import { brandParts, gfont } from "@/lib/og-font";

export const revalidate = 3600;
const W = 1080, H = 1350, ORANGE = "#EA5514", INK = "#16181D";
const B = ({ text }: { text: string }) => <>{brandParts(text).map((p, i) => <span key={i} style={p.dot ? { color: ORANGE } : {}}>{p.t}</span>)}</>;
const TONE: Record<string, [string, string, string]> = { positive: ["Supportive", "支持性", "#047857"], neutral: ["Descriptive", "描述性", "#4B5563"], negative: ["Cautious", "审慎性", "#BE123C"] };

export async function GET(req: Request, { params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const zh = lang === "zh";
  const sp = new URL(req.url).searchParams.get("s");
  const slide = sp === "3" ? 3 : sp === "2" ? 2 : 1;
  const e = await getEvent(slug);
  if (!e) return new Response("Not found", { status: 404 });
  const ps = ((await getPerspectives([e.id])).get(e.id) ?? []).sort((a, b) => b.article_count - a.article_count).slice(0, 5);
  const title = (zh && e.title_zh) || e.title;
  const cut = (t: string, n: number) => { if (t.length <= n) return t; const c = t.slice(0, n); const i = Math.max(c.lastIndexOf(zh ? "，" : ", "), c.lastIndexOf(" ")); return (i > n * 0.6 ? c.slice(0, i) : c).replace(/[,，;；]$/, "") + "…"; };
  const latest = slide === 3 ? await getLatestSummary(e.id) : undefined;
  const shared = ((zh && latest?.agreed_zh?.length ? latest.agreed_zh : latest?.agreed) ?? []).slice(0, 3).map((x) => cut(x, zh ? 60 : 150));
  const differ = ((zh && latest?.differ_zh?.length ? latest.differ_zh : latest?.differ) ?? []).slice(0, 3).map((x) => cut(x, zh ? 60 : 160));
  const diffRows = differ.length ? differ : ps.filter((p) => p.emphasis).slice(0, 3).map((p) => `${(zh ? COUNTRY_ZH[p.country] : COUNTRY[p.country]) ?? p.country}${zh ? "：" : ": "}${cut((zh && p.emphasis_zh) || p.emphasis || "", zh ? 50 : 140)}`);
  const cName = (c: string) => (zh ? COUNTRY_ZH[c] : COUNTRY[c]) ?? c;
  const cat = zh ? ({ technology: "科技", economy: "经济", sport: "体育", entertainment: "娱乐", fashion: "时尚", travel: "旅行", automotive: "汽车", gaming: "游戏" } as Record<string, string>)[e.category] ?? "" : e.category.toUpperCase();
  // count countries from the country cards too: e.countries can lag behind when later reports add a country
  const nC = Math.max(e.countries.length, ps.length);
  const nS = Math.max(e.source_count, ps.reduce((a, p) => a + (p.article_count ?? 0), 0));
  const meta = zh ? `${nC} 个国家 · ${nS} 个来源` : `${nC} ${nC === 1 ? "country" : "countries"} · ${nS} ${nS === 1 ? "source" : "sources"}`;
  const kicker = zh ? "各国怎么说" : "HOW THE WORLD REPORTS IT";
  const photoOk = !!e.image_url && !!e.image_credit && (/\/ (Pexels|Unsplash|Pixabay)$/.test(e.image_credit) || /\((CC BY \d|CC0|Public domain|PDM)/i.test(e.image_credit));
  const rows = ps.map((p) => ({ c: cName(p.country), f: ((zh && p.framing_zh) || p.framing || "").slice(0, zh ? 30 : 70), t: TONE[p.tone] ?? TONE.neutral }));
  const link = `https://coda.news${zh ? "/zh" : ""}/event/${slug}`;
  const qr = slide === 2 ? await QRCode.toDataURL(link, { margin: 0, width: 220, color: { dark: INK, light: "#ffffff" } }) : "";
  const cta = zh ? "在 coda.news 查看完整对比" : "Full comparison at coda.news";
  const scan = zh ? "扫码阅读" : "Scan to read";
  const credit = photoOk ? `Photo: ${e.image_credit}` : "";

  const h3a = zh ? "所有报道都提到" : "WHAT ALL REPORTS SHARE", h3b = zh ? "各国侧重不同" : "WHERE THE COVERAGE DIFFERS", h3k = zh ? "要点" : "THE TAKEAWAY";
  const all = [title, cat, meta, kicker, cta, scan, credit, h3a, h3b, h3k, "0123456789·→、•", ...shared, ...diffRows, ...rows.flatMap((r) => [r.c, r.f, r.t[zh ? 1 : 0]])].join("");
  const serif = zh ? "Noto+Serif+SC" : "Playfair+Display", sans = zh ? "Noto+Sans+SC" : "Inter";
  const [serifB, sansR, sansB] = await Promise.all([gfont(serif, 700, all), gfont(sans, 400, all), gfont(sans, 700, all)]);
  const fonts = [{ name: "Serif", data: serifB, weight: 700 as const }, { name: "Sans", data: sansR, weight: 400 as const }, { name: "Sans", data: sansB, weight: 700 as const }];
  const size = (n: number) => (zh ? (n > 30 ? 64 : n > 18 ? 76 : 88) : (n > 90 ? 62 : n > 60 ? 72 : n > 36 ? 84 : 96));

  // light, per-section palette: a pale ground and one accent, never a dark slab
  const PAL: Record<string, [string, string]> = { technology: ["#EAF1FF", "#2C55F0"], economy: ["#E7F5EE", "#0F7A4A"], sport: ["#ECF6E7", "#2F7A2A"], entertainment: ["#F3EDFF", "#6D3FC0"],
    fashion: ["#FBEEF2", "#B03A5B"], travel: ["#E6F5F6", "#0E7C86"], automotive: ["#F0F1EE", "#3F4750"], gaming: ["#EEEFFF", "#4B45C6"] };
  const [TINT, ACC] = PAL[e.category] ?? ["#FFF3EC", ORANGE];
  const cover = (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: TINT, fontFamily: "Sans", padding: "64px 72px 60px" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={LOGO_DATA_URI} width={236} height={37} alt="" />
        <div style={{ marginLeft: "auto", display: "flex", fontSize: 22, fontWeight: 700, color: ACC, letterSpacing: zh ? 2 : 5 }}>{cat}</div>
      </div>
      {photoOk && (
        <div style={{ display: "flex", marginTop: 48, width: W - 144, height: 560, borderRadius: 28, overflow: "hidden", position: "relative" }}>
          <img src={e.image_url!} width={W - 144} height={560} style={{ width: W - 144, height: 560, objectFit: "cover", objectPosition: e.image_focus === "top" ? "center 22%" : "center" }} alt="" />
          {credit && <div style={{ position: "absolute", right: 16, bottom: 12, display: "flex", fontSize: 14, color: "#fff", background: "rgba(0,0,0,0.35)", padding: "3px 10px", borderRadius: 999 }}>{credit}</div>}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", marginTop: photoOk ? 44 : "auto", marginBottom: photoOk ? 0 : "auto" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 44, height: 4, background: ACC, marginRight: 18, display: "flex" }} />
          <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: ACC, letterSpacing: zh ? 3 : 5 }}>{kicker}</div>
        </div>
        <div style={{ display: "flex", marginTop: 22, fontFamily: "Serif", fontWeight: 700, fontSize: photoOk ? Math.round(size(title.length) * 0.78) : Math.round(size(title.length) * 1.05), lineHeight: zh ? 1.22 : 1.08, color: INK, letterSpacing: zh ? 1 : -1 }}>{title}</div>
        {!photoOk && rows.length > 0 && <div style={{ display: "flex", marginTop: 34, fontSize: 28, color: "#4B5563" }}>{rows.map((r) => r.c).join(zh ? "、" : " · ")}</div>}
      </div>
      <div style={{ marginTop: "auto", display: "flex", paddingTop: 24, borderTop: `2px solid ${ACC}`, alignItems: "center", fontSize: 24, color: "#4B5563" }}>
        <div style={{ display: "flex" }}>{meta}</div>
        <div style={{ display: "flex", marginLeft: "auto", fontWeight: 700, color: INK }}>{zh ? "左滑查看各国报道 →" : "Swipe for every country's view →"}</div>
      </div>
    </div>
  );

  const list = (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#fff", fontFamily: "Sans", padding: "64px 72px 60px" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={LOGO_DATA_URI} width={236} height={37} alt="" />
        <div style={{ marginLeft: "auto", display: "flex", fontSize: 22, fontWeight: 700, color: INK, letterSpacing: zh ? 2 : 5 }}>{cat}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", marginTop: 72 }}>
        <div style={{ width: 44, height: 4, background: ACC, marginRight: 18, display: "flex" }} />
        <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: ACC, letterSpacing: zh ? 3 : 5 }}>{kicker}</div>
      </div>
      <div style={{ display: "flex", marginTop: 22, fontFamily: "Serif", fontWeight: 700, fontSize: zh ? 46 : 48, lineHeight: 1.18, color: INK }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 40, flexGrow: 1 }}>
        {rows.length === 0 && <div style={{ display: "flex", fontSize: 30, color: "#6B7280" }}>{zh ? "目前我们的来源里只有一个国家报道。" : "One country in our sources so far."}</div>}
        {rows.map((r) => (
          <div key={r.c} style={{ display: "flex", flexDirection: "column", borderTop: "1px solid #E5E7EB", padding: "22px 0" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", fontFamily: "Serif", fontWeight: 700, fontSize: 36, color: INK }}>{r.c}</div>
              <div style={{ marginLeft: "auto", display: "flex", fontSize: 20, fontWeight: 700, color: r.t[2], border: `2px solid ${r.t[2]}`, borderRadius: 999, padding: "4px 16px" }}>{r.t[zh ? 1 : 0]}</div>
            </div>
            <div style={{ display: "flex", marginTop: 8, fontSize: 28, color: "#374151", lineHeight: 1.35 }}>{r.f}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", borderTop: `4px solid ${INK}`, paddingTop: 24 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 24, color: "#6B7280" }}>{meta}</div>
          <div style={{ display: "flex", marginTop: 8, fontSize: 30, fontWeight: 700, color: INK }}><B text={cta} />{"\u00a0→"}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src={qr} width={110} height={110} alt="" />
          <div style={{ display: "flex", marginTop: 6, fontSize: 16, color: "#6B7280" }}>{scan}</div>
        </div>
      </div>
    </div>
  );

  const bullet = (t: string, i: number, color: string) => (
    <div key={i} style={{ display: "flex", marginTop: 18, fontSize: zh ? 30 : 29, lineHeight: 1.36, color: "#1F2937" }}>
      <div style={{ display: "flex", width: 12, height: 12, borderRadius: 999, background: color, marginTop: 16, marginRight: 20, flexShrink: 0 }} />
      <div style={{ display: "flex", flex: 1 }}>{t}</div>
    </div>
  );
  const takeaway = (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: TINT, fontFamily: "Sans", padding: "64px 72px 60px" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={LOGO_DATA_URI} width={236} height={37} alt="" />
        <div style={{ marginLeft: "auto", display: "flex", fontSize: 22, fontWeight: 700, color: INK, letterSpacing: zh ? 2 : 5 }}>{h3k}</div>
      </div>
      <div style={{ display: "flex", marginTop: 56, fontFamily: "Serif", fontWeight: 700, fontSize: zh ? 44 : 44, lineHeight: 1.18, color: INK }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 44 }}>
        <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: ACC, letterSpacing: zh ? 3 : 4 }}>{h3a}</div>
        {shared.length ? shared.map((t, i) => bullet(t, i, INK)) : bullet(title, 0, INK)}
      </div>
      {diffRows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", marginTop: 44, paddingTop: 36, borderTop: `1px solid ${ACC}33` }}>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: ACC, letterSpacing: zh ? 3 : 4 }}>{h3b}</div>
          {diffRows.map((t, i) => bullet(t, i, ACC))}
        </div>
      )}
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", borderTop: `4px solid ${INK}`, paddingTop: 24, fontSize: 24, color: "#6B7280" }}>
        <div style={{ display: "flex" }}>{meta}</div>
        <div style={{ display: "flex", marginLeft: "auto", fontWeight: 700, color: INK, fontSize: 28 }}><B text={cta} /></div>
      </div>
    </div>
  );

  const img = new ImageResponse(slide === 1 ? cover : slide === 2 ? list : takeaway, { width: W, height: H, fonts, headers: { "cache-control": "public, max-age=0, s-maxage=3600" } });
  // Instagram's publishing API only takes JPEG
  if (new URL(req.url).searchParams.get("fmt") === "jpg") {
    const sharp = (await import("sharp")).default;
    const jpg = await sharp(Buffer.from(await img.arrayBuffer())).flatten({ background: "#ffffff" }).jpeg({ quality: 90 }).toBuffer();
    return new Response(new Uint8Array(jpg), { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=0, s-maxage=3600" } });
  }
  const pageUrl = `https://coda.news${zh ? "/zh" : ""}/event/${slug}`;
  return withPngMeta(img, {
    Title: title, Source: pageUrl, Author: "coda.news", Copyright: `© ${new Date().getFullYear()} coda.news. ${pageUrl}`,
    Description: `${title} | coda.news: one story, every perspective. ${pageUrl}`,
    ...(e.image_credit ? { "Photo credit": e.image_credit } : {}),
  }, `coda.news-${slug}${zh ? "-zh" : ""}-${slide}.png`);
}
