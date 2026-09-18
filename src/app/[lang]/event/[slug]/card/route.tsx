// 4:5 share image (1080×1350) for Instagram, Threads and X, with the coda.news logo.
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { getEvent, getPerspectives } from "@/lib/data";
import { COUNTRY_ZH } from "@/lib/i18n";
import { COUNTRY } from "@/lib/ui";
import { LOGO_DATA_URI } from "@/lib/logo-data";
import { brandParts } from "@/lib/og-font";

export const revalidate = 3600;
const W = 1080, H = 1350;

async function font(family: string, weight: number, text: string) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`)).text();
  const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error("font");
  return (await fetch(url)).arrayBuffer();
}

export async function GET(_: Request, { params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const zh = lang === "zh";
  const e = await getEvent(slug);
  if (!e) return new Response("Not found", { status: 404 });
  const photoOk = !!e.image_url && !!e.image_credit && (/\/ (Pexels|Unsplash|Pixabay)$/.test(e.image_credit) || /\((CC BY \d|CC0|Public domain|PDM)/i.test(e.image_credit));
  const ps = ((await getPerspectives([e.id])).get(e.id) ?? []).slice(0, photoOk ? 3 : 4);
  const cut = (s: string, n: number) => {
    if (s.length <= n) return s;
    const c = s.slice(0, n);
    return (zh ? c.replace(/[，、；：,;:]$/, "") : c.replace(/[\s,;:]+\S*$/, "")) + "…";
  };
  const title = (zh && e.title_zh) || e.title;
  const rows = ps.map((p) => ({ c: (zh ? COUNTRY_ZH[p.country] : COUNTRY[p.country]) ?? p.country, f: cut((zh && p.framing_zh) || p.framing || "", zh ? 34 : 80) }));
  const labels = zh
    ? { how: "各国怎么说", meta: `${e.countries.length} 个国家 · ${e.source_count} 个来源`, cta: "在 coda.news 对比各国报道", cat: { technology: "科技", economy: "经济", sport: "体育", entertainment: "娱乐", fashion: "时尚" }[e.category] ?? "" }
    : { how: "How the world reports it", meta: `${e.countries.length} ${e.countries.length === 1 ? "country" : "countries"} · ${e.source_count} ${e.source_count === 1 ? "source" : "sources"}`, cta: "Compare the coverage at coda.news", cat: e.category.toUpperCase() };
  // photos only from sources whose licence allows use in a composed image (checked above)
  const sum = (zh && e.summary_zh) || e.summary || "";
  const summary = cut(sum.replace(/\s+/g, " "), zh ? (photoOk ? 92 : rows.length ? 140 : 200) : (photoOk ? 200 : rows.length ? 300 : 420));
  const link = `https://coda.news${zh ? "/zh" : ""}/event/${slug}`;
  const qr = await QRCode.toDataURL(link, { margin: 0, width: 240, color: { dark: "#16181D", light: "#ffffff" } });
  const scan = zh ? "扫码阅读全文" : "Scan to read";
  const text = [title, summary, "…", labels.how, labels.how.toUpperCase(), labels.meta, labels.cta, labels.cat, scan, e.image_credit ?? "", "Photo:", ...rows.flatMap((r) => [r.c, r.f]), "0123456789·"].join("");
  const family = zh ? "Noto+Sans+SC" : "Inter";
  const [bold, regular] = await Promise.all([font(family, 700, text), font(family, 400, text)]);

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#ffffff", fontFamily: "F" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "56px 64px 36px" }}>
          <img src={LOGO_DATA_URI} width={300} height={47} alt="" />
          <div style={{ marginLeft: "auto", display: "flex", fontSize: 24, fontWeight: 700, color: "#16181D", border: "2px solid #16181D", borderRadius: 999, padding: "6px 20px", letterSpacing: zh ? 0 : 2 }}>{labels.cat}</div>
        </div>
        {photoOk ? (
          <div style={{ display: "flex", position: "relative", margin: "0 64px", height: 340, overflow: "hidden", borderRadius: 16 }}>
            <img src={e.image_url!} width={952} height={340} style={{ objectFit: "cover", width: 952, height: 340 }} alt="" />
            {e.image_credit && <div style={{ position: "absolute", right: 12, bottom: 10, display: "flex", fontSize: 16, color: "#fff", background: "rgba(0,0,0,.5)", padding: "3px 10px", borderRadius: 6 }}>Photo: {e.image_credit}</div>}
          </div>
        ) : <div style={{ display: "flex", margin: "0 64px", height: 8, background: "#EA5514", borderRadius: 4 }} />}
        <div style={{ display: "flex", padding: "36px 64px 0", fontSize: !photoOk && rows.length === 0 ? 72 : title.length > (zh ? 30 : 60) ? 50 : 58, fontWeight: 700, lineHeight: 1.12, color: "#16181D", letterSpacing: zh ? 0 : -1.5 }}>{title}</div>
        {summary && <div style={{ display: "flex", padding: "20px 64px 0", fontSize: photoOk ? 27 : rows.length === 0 ? 36 : 30, lineHeight: 1.42, color: "#4B5563" }}>{summary}</div>}
        <div style={{ display: "flex", flexDirection: "column", padding: "30px 64px 0", flexGrow: 1, overflow: "hidden" }}>
          {rows.length > 0 && <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#C2410C", letterSpacing: zh ? 0 : 2, marginBottom: 10 }}>{zh ? labels.how : labels.how.toUpperCase()}</div>}
          {rows.map((r) => (
            <div key={r.c} style={{ display: "flex", borderTop: "2px solid #E5E7EB", padding: "12px 0", fontSize: 27 }}>
              <div style={{ display: "flex", width: 270, fontWeight: 700, color: "#16181D" }}>{r.c}</div>
              <div style={{ display: "flex", flex: 1, color: "#374151", fontWeight: 400 }}>{r.f}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", padding: "20px 64px 44px" }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 25 }}>
            <div style={{ display: "flex", color: "#6B7280" }}>{labels.meta}</div>
            <div style={{ display: "flex", marginTop: 8, fontWeight: 700, color: "#16181D", fontSize: 28 }}>{brandParts(labels.cta).map((p, i) => <span key={i} style={p.dot ? { color: "#EA5514" } : {}}>{p.t}</span>)}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginLeft: "auto" }}>
            <img src={qr} width={120} height={120} alt="" />
            <div style={{ display: "flex", marginTop: 8, fontSize: 18, color: "#6B7280" }}>{scan}</div>
          </div>
        </div>
        <div style={{ display: "flex", height: 14, background: "#EA5514" }} />
      </div>
    ),
    { width: W, height: H, fonts: [{ name: "F", data: bold, weight: 700 }, { name: "F", data: regular, weight: 400 }],
      headers: { "cache-control": "public, max-age=0, s-maxage=3600" } },
  );
}
