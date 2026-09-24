// Instagram slides for a Coda Anatomy profile (1080×1350; ?s=story is 9:16).
//   ?s=1 cover (photo card)  2 the numbers  3 three decisions  4 market value chart  5 how countries told it  story
//   &l=zh for Chinese. Figures come from src/lib/anatomy.ts, the same data as the page.
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { getProfile, money, photoUrl } from "@/lib/anatomy";
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
          <div style={{ display: "flex", marginTop: 20, fontSize: zh ? 110 : 128, fontWeight: 900, lineHeight: 1.02, color: "#fff", letterSpacing: zh ? 0 : -4 }}>{title}</div>
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
  } else if (s === "2") {
    const rows: [string, string, string][] = [
      [`${money(st[0].from, zh)} → ${money(st[0].to, zh)}`, T("Market value", "市值"), T("End of 2014 → 21 September 2026", "2014 年底 → 2026 年 9 月 21 日")],
      [`${money(st[1].from, zh)} → ${money(st[1].to, zh)}`, T("Annual revenue", "年营收"), T("2014 → 2025", "2014 年 → 2025 年")],
      [`${st[2].to}%`, T("of revenue from data centres", "营收来自数据中心"), T("2025", "2025 年")],
    ];
    body = (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: INK, fontFamily: "Sans", padding: "64px 72px 60px", color: "#fff" }}>
        {head(true, "")}
        {kicker(T("TWELVE YEARS IN THREE NUMBERS", "十二年，三个数字"))}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 40, flexGrow: 1 }}>
          {rows.map(([big, label, sub], i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", padding: "34px 0", borderTop: i ? "1px solid rgba(255,255,255,.14)" : "none" }}>
              <div style={{ display: "flex", fontSize: zh ? 88 : 104, fontWeight: 900, letterSpacing: zh ? 0 : -3, lineHeight: 1 }}>{big}</div>
              <div style={{ display: "flex", marginTop: 14, fontSize: 34, fontWeight: 700, color: ORANGE }}>{label}</div>
              <div style={{ display: "flex", marginTop: 6, fontSize: 26, color: "rgba(255,255,255,.6)" }}>{sub}</div>
            </div>
          ))}
        </div>
        {foot(true, T("Sources: CompaniesMarketCap, AMD results", "来源：CompaniesMarketCap、AMD 财报"))}
      </div>
    );
  } else if (s === "3") {
    const ds: [string, string, string][] = [
      [T("A new design, not a patch", "重新设计，而不是修补"), "Zen", T("Instead of fixing old chips, AMD bet on a new design. The first Ryzen chips went on sale in March 2017.", "AMD 没有修补旧芯片，而是押注全新设计。2017 年 3 月，第一批 Ryzen 上市。")],
      [T("Let TSMC build it, in pieces", "交给台积电，拆成小块来造"), "Chiplets", T("From 2019, small compute dies made by TSMC sit next to one input/output die in a single package.", "从 2019 年起，台积电生产的小计算芯片和一块输入输出芯片封装在一起。")],
      [T("Go where the servers are", "去服务器所在的地方"), "EPYC", T("Data centres brought in $16.6 billion in 2025, about half of all revenue.", "2025 年，数据中心带来 166 亿美元收入，约占一半。")],
    ];
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
  } else if (s === "4") {
    // log-scale line, $1bn to $1.5tn, with four direct labels
    const cw = 936, ch = 780, l = 110, r = 40, t = 30, b = 60;
    const X0 = 2014.6, X1 = 2026.72, lo = 0, hi = Math.log10(1500);
    const sx = (x: number) => l + ((x - X0) / (X1 - X0)) * (cw - l - r);
    const sy = (v: number) => t + (1 - (Math.log10(v) - lo) / (hi - lo)) * (ch - t - b);
    const d = pr.cap.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.v).toFixed(1)}`).join("");
    const ticks: [number, string][] = [[1, zh ? "10亿" : "$1B"], [10, zh ? "100亿" : "$10B"], [100, zh ? "1000亿" : "$100B"], [1000, zh ? "1万亿" : "$1T"]];
    // [x, value, label, dx, dy, right-aligned]: labels sit in the empty space beside the line
    const marks: [number, number, string, number, number, boolean][] = [
      [2014.99, 2.07, T("2014: Lisa Su becomes CEO", "2014 苏姿丰上任"), 24, 12, false],
      [2016.99, 9.91, T("2017: first Zen chips", "2017 首批 Zen 芯片"), 24, 14, false],
      [2021.99, 173.77, T("2022: Xilinx, passes Intel", "2022 收购 Xilinx，超过 Intel"), -24, -58, true],
      [2026.72, 1003, T("Sep 2026: $1 trillion", "2026.9 破 1 万亿美元"), -26, -12, true],
    ];
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
        {kicker(T("MARKET VALUE, 2014 TO 2026", "市值，2014 至 2026"))}
        <div style={{ display: "flex", marginTop: 18, fontSize: 30, color: "#3F434A", lineHeight: 1.35 }}>{T("Each gridline is ten times the one below.", "对数刻度：每条横线是下面一条的 10 倍。")}</div>
        <div style={{ display: "flex", position: "relative", marginTop: 30, width: cw, height: ch }}>
          <img src={src} width={cw} height={ch} alt="" />
          {marks.map(([x, v, lab, dx, dy, right], i) => (
            <div key={i} style={{ position: "absolute", left: right ? sx(x) + dx - 460 : sx(x) + dx, top: sy(v) + dy, width: 460, display: "flex", justifyContent: right ? "flex-end" : "flex-start",
              fontSize: 27, fontWeight: 700, color: INK }}>{lab}</div>
          ))}
        </div>
        {foot(false, T("Year-end values · CompaniesMarketCap", "年末市值 · CompaniesMarketCap"))}
      </div>
    );
  } else {
    const qr = await QRCode.toDataURL(link, { margin: 0, width: 220, color: { dark: INK, light: "#ffffff" } });
    const rows: [string[], string, string][] = [
      [["us"], T("United States", "美国"), T("The stock: a five-day rally, a 10% chip price rise, and is it still worth buying?", "股票本身：连涨五天、芯片提价 10%、还值不值得买。")],
      [["sg", "in"], T("Singapore and India", "新加坡、印度"), T("The industry: one of several chipmakers lifted by demand for AI computing.", "整个行业：被 AI 算力需求带动的几家芯片公司之一。")],
      [["cn"], T("China", "中国"), T("First the milestone, often in yuan; then long reads on Lisa Su's twelve years.", "先报里程碑，常换算成人民币；再写苏姿丰的十二年。")],
    ];
    body = (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#fff", fontFamily: "Sans", padding: "64px 72px 60px" }}>
        {head(false, "")}
        {kicker(T("ONE MILESTONE, THREE STORIES", "同一个里程碑，三种讲法"))}
        <div style={{ display: "flex", marginTop: 22, fontSize: zh ? 56 : 60, fontWeight: 900, lineHeight: 1.1, color: INK, letterSpacing: zh ? 0 : -1 }}>{T("How outlets in four countries reported AMD's $1 trillion day", "四个国家的媒体，怎么报道 AMD 破万亿")}</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 34, flexGrow: 1 }}>
          {rows.map(([flags, c, t], i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", borderTop: "1px solid #E5E7EB", padding: "36px 0" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                {flags.map((f) => <img key={f} src={`https://flagcdn.com/48x36/${f}.png`} width={44} height={33} style={{ marginRight: 12, borderRadius: 3 }} alt="" />)}
                <div style={{ display: "flex", marginLeft: 6, fontSize: 36, fontWeight: 900, color: INK }}>{c}</div>
              </div>
              <div style={{ display: "flex", marginTop: 14, fontSize: 34, lineHeight: 1.36, color: "#374151" }}>{t}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", borderTop: `4px solid ${INK}`, paddingTop: 24 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 22, color: MUTED }}>{T("22 articles in our sources, 21 to 23 September 2026", "我们收录的 22 篇报道，2026 年 9 月 21 至 23 日")}</div>
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
