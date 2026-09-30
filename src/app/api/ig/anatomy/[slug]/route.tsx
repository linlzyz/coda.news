// Instagram slides for a Coda Anatomy profile (1080×1350; ?s=story is 9:16).
//   ?s=1 cover (photo card)  explain (optional plain-language slide)  2 the numbers  3 three decisions  4 chart  5 how countries told it  story
//   &l=zh for Chinese. Figures come from src/lib/anatomy.ts, the same data as the page.
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { getProfile, money, photoUrl, type L } from "@/lib/anatomy";
import { LOGO_DATA_URI, LOGO_WHITE_DATA_URI } from "@/lib/logo-data";
import { brandParts, gfont } from "@/lib/og-font";

export const revalidate = 86400;
const W = 1080, H = 1350, ORANGE = "#EA5514", INK = "#16181D", PAPER = "#F4F3F0", MUTED = "#6B7280";
const B = ({ text }: { text: string }) => <>{brandParts(text).map((p, i) => <span key={i} style={p.dot ? { color: ORANGE } : {}}>{p.t}</span>)}</>;

async function dataUri(url: string) {
  const r = await fetch(url, { headers: { "user-agent": "coda.news/1.0 (info@coda.news)" }, signal: AbortSignal.timeout(15000) }).catch(() => null);
  if (!r) return null;
  if (!r.ok) return null;
  return `data:${r.headers.get("content-type") ?? "image/jpeg"};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const u = new URL(req.url);
  const s = u.searchParams.get("s") ?? "1";
  const zh = u.searchParams.get("l") === "zh";
  const pr = getProfile(slug);
  if (!pr) return new Response("Not found", { status: 404 });
  const used: string[] = [];
  const T = (en: string, z: string) => { used.push(en, z); return zh ? z : en; };
  const P = (l: L) => T(l.en, l.zh);
  const ig = pr.ig;
  const title = zh ? pr.title.zh : pr.title.en;
  const hook = zh ? pr.igHook.zh : pr.igHook.en;
  const hookSize = zh ? (hook.length > 18 ? 76 : 92) : (hook.length > 48 ? 70 : hook.length > 32 ? 82 : 96);
  const link = `https://coda.news${zh ? "/zh" : ""}/anatomy/${pr.slug}`;
  const kick = T("CODA ANATOMY", "CODA 剖面") + ` ${String(pr.no).padStart(2, "0")}`;
  const credit = `${T("Photo", "照片")}: ${pr.cover.credit} / Wikimedia Commons (${pr.cover.license})`;

  const head = (dark: boolean, _label: string) => (
    <div style={{ display: "flex", alignItems: "center" }}>
      <img src={dark ? LOGO_WHITE_DATA_URI : LOGO_DATA_URI} width={236} height={37} alt="" />
      <div style={{ marginLeft: "auto", display: "flex", fontSize: 22, fontWeight: 700, color: dark ? "rgba(255,255,255,.7)" : INK, letterSpacing: zh ? 2 : 5 }}>{kick}</div>
    </div>
  );
  const kicker = (t: string, color = ORANGE) => (
    <div style={{ display: "flex", alignItems: "center", marginTop: 64 }}>
      <div style={{ width: 44, height: 4, background: color, marginRight: 18, display: "flex" }} />
      <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color, letterSpacing: zh ? 3 : 5 }}>{t}</div>
    </div>
  );
  const foot = (dark: boolean, left: string, right = T("Swipe →", "左滑 →")) => (
    <div style={{ marginTop: "auto", display: "flex", alignItems: "center", borderTop: `3px solid ${dark ? "rgba(255,255,255,.25)" : INK}`, paddingTop: 22, fontSize: 22, color: dark ? "rgba(255,255,255,.6)" : MUTED }}>
      <div style={{ display: "flex" }}>{left}</div>
      <div style={{ display: "flex", marginLeft: "auto", fontWeight: 700, fontSize: 26, color: dark ? "#fff" : INK }}>{right}</div>
    </div>
  );

  let body: React.ReactElement;
  let size = { width: W, height: H };
  const cover = (s === "1" || s === "story") ? await dataUri(`https://coda.news${photoUrl(pr.cover.file, 1600)}`) : null;
  const st = pr.stats;

  if (s === "story") {
    size = { width: 1080, height: 1920 };
    body = (
      <div style={{ width: 1080, height: 1920, display: "flex", flexDirection: "column", background: "#08090B", fontFamily: "Sans", position: "relative" }}>
        {cover && <img src={cover} width={1080} height={1920} style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1920, objectFit: "cover", opacity: 0.8 }} alt="" />}
        <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1920, display: "flex", backgroundImage: "linear-gradient(180deg, rgba(8,9,11,.2) 0%, rgba(8,9,11,.1) 40%, rgba(8,9,11,.95) 78%)" }} />
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", padding: "0 90px 220px", position: "relative" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 900, color: ORANGE, letterSpacing: 4 }}>{T("NEW · ", "新 · ")}{kick}</div>
          <div style={{ display: "flex", marginTop: 20, fontSize: zh ? (title.length > 14 ? 92 : 110) : (title.length > 30 ? 112 : 128), fontWeight: 900, lineHeight: 1.02, color: "#fff", letterSpacing: zh ? 0 : -4 }}>{title}</div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 60, fontWeight: 700, color: "#fff" }}>{money(st[0].from, zh)} <span style={{ color: ORANGE, margin: "0 18px" }}>→</span> {money(st[0].to, zh)}</div>
          <div style={{ display: "flex", marginTop: 60, fontSize: 38, fontWeight: 700, color: "#fff", background: ORANGE, padding: "18px 34px", borderRadius: 999, alignSelf: "flex-start" }}>{T("Read it: link in bio", "完整剖面：主页链接")}</div>
        </div>
      </div>
    );
  } else if (s === "1") {
    body = (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: PAPER, fontFamily: "Sans" }}>
        <div style={{ display: "flex", width: W, height: 740, position: "relative", background: "#08090B", borderBottom: `9px solid ${ORANGE}` }}>
          {cover && <img src={cover} width={W} height={740} style={{ width: W, height: 740, objectFit: "cover" }} alt="" />}
          <div style={{ position: "absolute", top: 72, left: 84, display: "flex", background: ORANGE, color: "#fff", fontSize: 28, fontWeight: 900, letterSpacing: 3, padding: "12px 22px", borderRadius: 4 }}>{kick}</div>
          <div style={{ position: "absolute", right: 30, bottom: 22, display: "flex", fontSize: 17, color: "rgba(255,255,255,0.85)" }}>{credit}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "52px 84px 60px" }}>
          {/* the hook does the stopping; the page title sits small above it, so the cover never just repeats the title */}
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: ORANGE }}>{title}</div>
          <div style={{ display: "flex", marginTop: 14, fontWeight: 900, fontSize: hookSize, lineHeight: 1.05, color: INK, letterSpacing: zh ? 0 : -2.5 }}>{hook}</div>
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", fontSize: 26, color: MUTED }}>
            <div style={{ display: "flex" }}>{T("An original long read · Swipe →", "原创专题 · 左滑 →")}</div>
            <div style={{ marginLeft: "auto", display: "flex", fontSize: 38, fontWeight: 700, color: INK }}><B text="coda.news" /></div>
          </div>
        </div>
      </div>
    );
  } else if (s === "explain" && ig.explain) {
    // plain-language slide for readers who know none of the names (Lyn, 30 Sept: "零基础的一个人都能看懂")
    const ex = ig.explain;
    body = (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: PAPER, fontFamily: "Sans", padding: "64px 72px 60px" }}>
        {head(false, "")}
        {kicker(P(ex.kicker))}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 30, flexGrow: 1, justifyContent: "space-around" }}>
          {ex.rows.map((r, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", borderTop: i ? "1px solid #DDD8CF" : "none", paddingTop: i ? 34 : 0 }}>
              <div style={{ display: "flex", fontSize: zh ? 50 : 52, fontWeight: 900, color: INK, letterSpacing: zh ? 0 : -1 }}>{P(r.q)}</div>
              <div style={{ display: "flex", marginTop: 16, fontSize: zh ? 36 : 37, lineHeight: 1.4, color: "#374151" }}>{P(r.a)}</div>
            </div>
          ))}
        </div>
        {foot(false, T("Sources on the page", "来源见专题页"))}
      </div>
    );
  } else if (s === "2") {
    const rows = ig.numbers.rows.map((r) => [P(r.big), P(r.label), P(r.sub)] as const);
    body = (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: INK, fontFamily: "Sans", padding: "64px 72px 60px", color: "#fff" }}>
        {head(true, "")}
        {kicker(P(ig.numbers.kicker))}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 40, flexGrow: 1 }}>
          {rows.map(([big, label, sub], i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", padding: "34px 0", borderTop: i ? "1px solid rgba(255,255,255,.14)" : "none" }}>
              <div style={{ display: "flex", fontSize: zh ? 88 : 104, fontWeight: 900, letterSpacing: zh ? 0 : -3, lineHeight: 1 }}>{big}</div>
              <div style={{ display: "flex", marginTop: 14, fontSize: 34, fontWeight: 700, color: ORANGE }}>{label}</div>
              <div style={{ display: "flex", marginTop: 6, fontSize: 26, color: "rgba(255,255,255,.6)" }}>{sub}</div>
            </div>
          ))}
        </div>
        {foot(true, P(ig.numbers.source))}
      </div>
    );
  } else if (s === "3") {
    const ds = ig.decisions.map((d) => [P(d.h), d.tag, P(d.t)] as const);
    body = (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#fff", fontFamily: "Sans", padding: "64px 72px 60px" }}>
        {head(false, "")}
        {kicker(T("THREE DECISIONS", "三个决定"))}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 36, flexGrow: 1 }}>
          {ds.map(([h, tag, t], i) => (
            <div key={i} style={{ display: "flex", padding: "30px 0", borderTop: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", width: 110, fontSize: 96, fontWeight: 900, color: ORANGE, lineHeight: 0.9 }}>{i + 1}</div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ display: "flex", fontSize: zh ? 42 : 44, fontWeight: 900, color: INK, letterSpacing: zh ? 0 : -1 }}>{h}</div>
                </div>
                <div style={{ display: "flex", marginTop: 10, alignSelf: "flex-start", fontSize: 22, fontWeight: 700, color: INK, border: `2px solid ${INK}`, borderRadius: 999, padding: "3px 14px" }}>{tag}</div>
                <div style={{ display: "flex", marginTop: 14, fontSize: 29, lineHeight: 1.38, color: "#374151" }}>{t}</div>
              </div>
            </div>
          ))}
        </div>
        {foot(false, T("Sources on the page", "来源见专题页"))}
      </div>
    );
  } else if (s === "4" && ig.chart.kind === "tags" && pr.priceTags) {
    // horizontal bars: deal prices in grey, market values in orange, value at the end of each bar
    const c = ig.chart, c2 = pr.priceTags, rows = c2.rows, max = Math.max(...rows.map((r) => r.v));
    body = (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: PAPER, fontFamily: "Sans", padding: "64px 72px 60px" }}>
        {head(false, "")}
        {kicker(P(c.kicker))}
        <div style={{ display: "flex", marginTop: 18, fontSize: 30, color: "#3F434A", lineHeight: 1.35 }}>{P(c.sub)}</div>
        <div style={{ display: "flex", marginTop: 22, fontSize: 24, color: MUTED }}>
          <div style={{ display: "flex", alignItems: "center", marginRight: 34 }}><div style={{ width: 26, height: 14, background: "#A3A8B0", marginRight: 10, display: "flex" }} />{c2.legend ? P(c2.legend[0]) : T("Deal price", "交易价格")}</div>
          <div style={{ display: "flex", alignItems: "center" }}><div style={{ width: 26, height: 14, background: ORANGE, marginRight: 10, display: "flex" }} />{c2.legend ? P(c2.legend[1]) : T("Market value", "市值")}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 34, flexGrow: 1, justifyContent: "space-around" }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 26, color: "#3F434A" }}>{P(r.label)}</div>
              <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
                <div style={{ display: "flex", height: 44, width: Math.max(12, (r.v / max) * 700), background: r.kind === "deal" ? "#A3A8B0" : ORANGE, borderRadius: "0 8px 8px 0" }} />
                <div style={{ display: "flex", marginLeft: 16, fontSize: 36, fontWeight: 900, color: INK }}>{money(r.v, zh)}</div>
              </div>
            </div>
          ))}
        </div>
        {foot(false, P(c.foot))}
      </div>
    );
  } else if (s === "4" && ig.chart.kind === "logcap" && pr.cap) {
    // log-scale line, $1bn to $1.5tn, with four direct labels
    const c = ig.chart;
    const cw = 936, ch = 780, l = 110, r = 40, t = 30, b = 60;
    const X0 = 2014.6, X1 = 2026.72, lo = 0, hi = Math.log10(1500);
    const sx = (x: number) => l + ((x - X0) / (X1 - X0)) * (cw - l - r);
    const sy = (v: number) => t + (1 - (Math.log10(v) - lo) / (hi - lo)) * (ch - t - b);
    const d = pr.cap.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.v).toFixed(1)}`).join("");
    const ticks: [number, string][] = [[1, zh ? "10亿" : "$1B"], [10, zh ? "100亿" : "$10B"], [100, zh ? "1000亿" : "$100B"], [1000, zh ? "1万亿" : "$1T"]];
    // [x, value, label, dx, dy, right-aligned]: labels sit in the empty space beside the line
    const marks = c.marks.map(([x, v, lab, dx, dy, right]) => [x, v, P(lab), dx, dy, right] as const);
    const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}" viewBox="0 0 ${cw} ${ch}">
      ${ticks.map(([v, lab]) => `<line x1="${l}" x2="${cw - r}" y1="${sy(v)}" y2="${sy(v)}" stroke="#E4E1DA" stroke-width="2"/><text x="${l - 16}" y="${sy(v) + 9}" text-anchor="end" font-size="26" fill="${MUTED}" font-family="sans-serif">${esc(lab)}</text>`).join("")}
      ${[2016, 2018, 2020, 2022, 2024, 2026].map((y) => `<text x="${sx(y)}" y="${ch - 14}" text-anchor="middle" font-size="24" fill="${MUTED}" font-family="sans-serif">${y}</text>`).join("")}
      <path d="${d}" fill="none" stroke="${ORANGE}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>
      ${marks.map(([x, v]) => `<circle cx="${sx(x)}" cy="${sy(v)}" r="12" fill="#fff" stroke="${INK}" stroke-width="5"/>`).join("")}
    </svg>`;
    const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    body = (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: PAPER, fontFamily: "Sans", padding: "64px 72px 60px" }}>
        {head(false, "")}
        {kicker(P(c.kicker))}
        <div style={{ display: "flex", marginTop: 18, fontSize: 30, color: "#3F434A", lineHeight: 1.35 }}>{P(c.sub)}</div>
        <div style={{ display: "flex", position: "relative", marginTop: 30, width: cw, height: ch }}>
          <img src={src} width={cw} height={ch} alt="" />
          {marks.map(([x, v, lab, dx, dy, right], i) => (
            <div key={i} style={{ position: "absolute", left: right ? sx(x) + dx - 460 : sx(x) + dx, top: sy(v) + dy, width: 460, display: "flex", justifyContent: right ? "flex-end" : "flex-start",
              fontSize: 27, fontWeight: 700, color: INK }}>{lab}</div>
          ))}
        </div>
        {foot(false, P(c.foot))}
      </div>
    );
  } else {
    const qr = await QRCode.toDataURL(link, { margin: 0, width: 220, color: { dark: INK, light: "#ffffff" } });
    const rows = ig.countries.rows.map((r) => [r.flags, P(r.name), P(r.t)] as const);
    body = (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#fff", fontFamily: "Sans", padding: "64px 72px 60px" }}>
        {head(false, "")}
        {kicker(P(ig.countries.kicker))}
        <div style={{ display: "flex", marginTop: 22, fontSize: zh ? 56 : 60, fontWeight: 900, lineHeight: 1.1, color: INK, letterSpacing: zh ? 0 : -1 }}>{P(ig.countries.title)}</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 34, flexGrow: 1 }}>
          {rows.map(([flags, c, t], i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", borderTop: "1px solid #E5E7EB", padding: rows.length < 3 ? "56px 0" : "36px 0" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                {flags.map((f) => <img key={f} src={`https://flagcdn.com/48x36/${f}.png`} width={44} height={33} style={{ marginRight: 12, borderRadius: 3 }} alt="" />)}
                <div style={{ display: "flex", marginLeft: 6, fontSize: rows.length < 3 ? 44 : 36, fontWeight: 900, color: INK }}>{c}</div>
              </div>
              <div style={{ display: "flex", marginTop: 14, fontSize: rows.length < 3 ? 42 : 34, lineHeight: 1.36, color: "#374151" }}>{t}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", borderTop: `4px solid ${INK}`, paddingTop: 24 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 22, color: MUTED }}>{P(ig.countries.foot)}</div>
            <div style={{ display: "flex", marginTop: 10, fontSize: 32, fontWeight: 700, color: INK }}>{T("Full anatomy: link in bio →", "完整剖面：主页链接 →")}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <img src={qr} width={110} height={110} alt="" />
          </div>
        </div>
      </div>
    );
  }

  // only the characters actually drawn, so the font download stays small
  const text = [...new Set([...used, JSON.stringify(pr), "CODA ANATOMY剖面 0123456789$→%·.,:;?'’()/-亿万美元年月日"].join(""))].join("");
  const [r4, r7, r9] = await Promise.all([gfont(zh ? "Noto+Sans+SC" : "Inter", 400, text), gfont(zh ? "Noto+Sans+SC" : "Inter", 700, text), gfont(zh ? "Noto+Sans+SC" : "Inter", 900, text)]);
  return new ImageResponse(body, { ...size, fonts: [{ name: "Sans", data: r4, weight: 400 }, { name: "Sans", data: r7, weight: 700 }, { name: "Sans", data: r9, weight: 900 }],
    headers: { "cache-control": "public, max-age=3600, s-maxage=86400" } });
}
