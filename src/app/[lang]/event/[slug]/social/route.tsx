// Editorial 4:5 images for Instagram / Threads / X carousels (1080×1350).
//   ?s=1  cover: full-bleed licensed photo (or graphite typographic cover), serif headline, logo
//   ?s=2  "How the world reports it": one line per country with its framing and tone
import { ImageResponse } from "next/og";
import { withPngMeta } from "@/lib/png-meta";
import QRCode from "qrcode";
import { getEvent, getPerspectives } from "@/lib/data";
import { COUNTRY_ZH } from "@/lib/i18n";
import { COUNTRY } from "@/lib/ui";
import { LOGO_DATA_URI, LOGO_WHITE_DATA_URI } from "@/lib/logo-data";
import { brandParts, gfont } from "@/lib/og-font";

export const revalidate = 3600;
const W = 1080, H = 1350, ORANGE = "#EA5514", INK = "#16181D";
const B = ({ text }: { text: string }) => <>{brandParts(text).map((p, i) => <span key={i} style={p.dot ? { color: ORANGE } : {}}>{p.t}</span>)}</>;
const TONE: Record<string, [string, string, string]> = { positive: ["Supportive", "支持性", "#047857"], neutral: ["Descriptive", "描述性", "#4B5563"], negative: ["Cautious", "审慎性", "#BE123C"] };

export async function GET(req: Request, { params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const zh = lang === "zh";
  const slide = new URL(req.url).searchParams.get("s") === "2" ? 2 : 1;
  const e = await getEvent(slug);
  if (!e) return new Response("Not found", { status: 404 });
  const ps = ((await getPerspectives([e.id])).get(e.id) ?? []).sort((a, b) => b.article_count - a.article_count).slice(0, 5);
  const title = (zh && e.title_zh) || e.title;
  const cName = (c: string) => (zh ? COUNTRY_ZH[c] : COUNTRY[c]) ?? c;
  const cat = zh ? ({ technology: "科技", economy: "经济", sport: "体育", entertainment: "娱乐", fashion: "时尚", travel: "旅行", automotive: "汽车", gaming: "游戏" } as Record<string, string>)[e.category] ?? "" : e.category.toUpperCase();
  const meta = zh ? `${e.countries.length} 个国家 · ${e.source_count} 个来源` : `${e.countries.length} ${e.countries.length === 1 ? "country" : "countries"} · ${e.source_count} ${e.source_count === 1 ? "source" : "sources"}`;
  const kicker = zh ? "各国怎么说" : "HOW THE WORLD REPORTS IT";
  const photoOk = !!e.image_url && !!e.image_credit && (/\/ (Pexels|Unsplash|Pixabay)$/.test(e.image_credit) || /\((CC BY \d|CC0|Public domain|PDM)/i.test(e.image_credit));
  const rows = ps.map((p) => ({ c: cName(p.country), f: ((zh && p.framing_zh) || p.framing || "").slice(0, zh ? 30 : 70), t: TONE[p.tone] ?? TONE.neutral }));
  const link = `https://coda.news${zh ? "/zh" : ""}/event/${slug}`;
  const qr = slide === 2 ? await QRCode.toDataURL(link, { margin: 0, width: 220, color: { dark: INK, light: "#ffffff" } }) : "";
  const cta = zh ? "在 coda.news 查看完整对比" : "Full comparison at coda.news";
  const scan = zh ? "扫码阅读" : "Scan to read";
  const credit = photoOk ? `Photo: ${e.image_credit}` : "";

  const all = [title, cat, meta, kicker, cta, scan, credit, "0123456789·→、", ...rows.flatMap((r) => [r.c, r.f, r.t[zh ? 1 : 0]])].join("");
  const serif = zh ? "Noto+Serif+SC" : "Playfair+Display", sans = zh ? "Noto+Sans+SC" : "Inter";
  const [serifB, sansR, sansB] = await Promise.all([gfont(serif, 700, all), gfont(sans, 400, all), gfont(sans, 700, all)]);
  const fonts = [{ name: "Serif", data: serifB, weight: 700 as const }, { name: "Sans", data: sansR, weight: 400 as const }, { name: "Sans", data: sansB, weight: 700 as const }];
  const size = (n: number) => (zh ? (n > 30 ? 64 : n > 18 ? 76 : 88) : (n > 90 ? 62 : n > 60 ? 72 : n > 36 ? 84 : 96));

  const cover = (
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: INK, fontFamily: "Sans" }}>
      {photoOk && <img src={e.image_url!} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover", objectPosition: e.image_focus === "top" ? "center 18%" : "center" }} alt="" />}
      {photoOk && <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex",
        backgroundImage: "linear-gradient(180deg, rgba(10,11,13,0.55) 0%, rgba(10,11,13,0) 20%, rgba(10,11,13,0.15) 45%, rgba(10,11,13,0.88) 70%, rgba(10,11,13,0.97) 100%)" }} />}
      <div style={{ position: "absolute", top: 64, left: 72, right: 72, display: "flex", alignItems: "center" }}>
        <img src={LOGO_WHITE_DATA_URI} width={236} height={37} alt="" />
        <div style={{ marginLeft: "auto", display: "flex", fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: zh ? 2 : 5 }}>{cat}</div>
      </div>
      <div style={{ position: "absolute", left: 72, right: 72, bottom: 168, ...(photoOk ? {} : { top: 150 }), display: "flex", flexDirection: "column", justifyContent: photoOk ? "flex-end" : "center" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 44, height: 4, background: ORANGE, marginRight: 18, display: "flex" }} />
          <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: ORANGE, letterSpacing: zh ? 3 : 5 }}>{kicker}</div>
        </div>
        <div style={{ display: "flex", marginTop: 26, fontFamily: "Serif", fontWeight: 700, fontSize: photoOk ? size(title.length) : Math.round(size(title.length) * 1.12), lineHeight: zh ? 1.22 : 1.06, color: "#fff", letterSpacing: zh ? 1 : -1 }}>{title}</div>
        {!photoOk && rows.length > 0 && <div style={{ display: "flex", marginTop: 34, fontSize: 28, color: "rgba(255,255,255,0.7)" }}>{rows.map((r) => r.c).join(zh ? "、" : " · ")}</div>}
      </div>
      <div style={{ position: "absolute", left: 72, right: 72, bottom: 84, display: "flex", paddingTop: 26, borderTop: "1px solid rgba(255,255,255,0.35)", alignItems: "center", fontSize: 24, color: "rgba(255,255,255,0.85)" }}>
        <div style={{ display: "flex" }}>{meta}</div>
        <div style={{ display: "flex", marginLeft: "auto", fontWeight: 700, color: "#fff" }}><B text="coda.news" /></div>
      </div>
      {credit && <div style={{ position: "absolute", right: 72, bottom: 36, display: "flex", fontSize: 15, color: "rgba(255,255,255,0.6)" }}>{credit}</div>}
    </div>
  );

  const list = (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#fff", fontFamily: "Sans", padding: "64px 72px 60px" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={LOGO_DATA_URI} width={236} height={37} alt="" />
        <div style={{ marginLeft: "auto", display: "flex", fontSize: 22, fontWeight: 700, color: INK, letterSpacing: zh ? 2 : 5 }}>{cat}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", marginTop: 72 }}>
        <div style={{ width: 44, height: 4, background: ORANGE, marginRight: 18, display: "flex" }} />
        <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: ORANGE, letterSpacing: zh ? 3 : 5 }}>{kicker}</div>
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

  const img = new ImageResponse(slide === 1 ? cover : list, { width: W, height: H, fonts, headers: { "cache-control": "public, max-age=0, s-maxage=3600" } });
  const pageUrl = `https://coda.news${zh ? "/zh" : ""}/event/${slug}`;
  return withPngMeta(img, {
    Title: title, Source: pageUrl, Author: "coda.news", Copyright: `© ${new Date().getFullYear()} coda.news. ${pageUrl}`,
    Description: `${title} | coda.news: one story, every perspective. ${pageUrl}`,
    ...(e.image_credit ? { "Photo credit": e.image_credit } : {}),
  }, `coda.news-${slug}${zh ? "-zh" : ""}-${slide}.png`);
}
