// Editorial 4:5 images for Instagram / Threads / X carousels (1080×1350).
//   ?s=1  cover: photo card (section tag, photo on top, heavy sans headline + dek, flags) or black/white/orange type cover
//   ?s=2  "How the world reports it": one line per country with its framing and tone
//   ?s=3  "The takeaway": what all reports share, and where the coverage differs
//   ?s=story  9:16 Story announcing the day's post (&p= post id)
//   ?s=t1 / t2  travel post: full-bleed scenic cover, then "what to look for" (&img= photo, &cr= credit from the Instagram job)
import { ImageResponse } from "next/og";
import { withPngMeta } from "@/lib/png-meta";
import QRCode from "qrcode";
import { getEvent, getLatestSummary, getPerspectives, igSlide } from "@/lib/data";

import { COUNTRY_ZH } from "@/lib/i18n";
import { COUNTRY } from "@/lib/ui";
import { LOGO_DATA_URI, LOGO_WHITE_DATA_URI } from "@/lib/logo-data";
import { brandParts, gfont } from "@/lib/og-font";

export const revalidate = 3600;
const W = 1080, H = 1350, ORANGE = "#EA5514", INK = "#16181D", PAPER = "#F4F3F0";
// section tag colors for covers
const SEC: Record<string, [string, string, string]> = {
  fashion: ["BUSINESS OF STYLE", "时尚", "#16181D"], sport: ["SPORTS", "体育", "#1F7A4D"], entertainment: ["SCREEN", "娱乐", "#6B3FD4"],
  technology: ["TECH", "科技", "#1D5FD1"], economy: ["BUSINESS", "经济", "#EA5514"], travel: ["TRAVEL", "旅行", "#0E7490"],
  automotive: ["AUTO", "汽车", "#B42318"], gaming: ["GAMES", "游戏", "#7A2E9E"],
};
const B = ({ text }: { text: string }) => <>{brandParts(text).map((p, i) => <span key={i} style={p.dot ? { color: ORANGE } : {}}>{p.t}</span>)}</>;
const TONE: Record<string, [string, string, string]> = { positive: ["Supportive", "支持性", "#047857"], neutral: ["Descriptive", "描述性", "#4B5563"], negative: ["Cautious", "审慎性", "#BE123C"] };

export async function GET(req: Request, { params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const zh = lang === "zh";
  const sp = new URL(req.url).searchParams.get("s");
  const slide = sp === "3" ? 3 : sp === "2" ? 2 : 1;
  const tslide = sp === "t1" ? 1 : sp === "t2" ? 2 : 0;
  // travel slides: photo and magazine copy live on the Instagram post (&p=id), written when the post was planned
  const pid = Number(new URL(req.url).searchParams.get("p"));
  const isStory = sp === "story";
  const tp = (tslide || isStory) && pid ? await igSlide(pid) : null;
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
  const photoOk = !!e.image_url && !!e.image_credit && (/\/ (Pexels|Unsplash|Pixabay)$/.test(e.image_credit) || /\((CC BY[^)]*|CC0[^)]*|Public domain|PDM)\)/i.test(e.image_credit));
  const rows = ps.map((p) => ({ c: cName(p.country), f: ((zh && p.framing_zh) || p.framing || "").slice(0, zh ? 30 : 70), t: TONE[p.tone] ?? TONE.neutral }));
  const link = `https://coda.news${zh ? "/zh" : ""}/event/${slug}`;
  const qr = slide === 2 ? await QRCode.toDataURL(link, { margin: 0, width: 220, color: { dark: INK, light: "#ffffff" } }) : "";
  const cta = zh ? "在 coda.news 查看完整对比" : "Full comparison at coda.news";
  const bio = zh ? "完整对比：主页链接 →" : "Full comparison: link in bio →";
  const scan = zh ? "扫码阅读" : "Scan to read";
  const credit = photoOk ? `Photo: ${e.image_credit}` : "";
  const SECTION = Object.fromEntries(Object.entries(SEC).map(([k, v]) => [k, [zh ? v[1] : v[0], v[2]] as [string, string]]));
  const firstSentence = (t: string) => (t.match(zh ? /^.+?[。！？]/ : /^.+?[.!?](?=\s|$)/)?.[0] ?? t);
  const dek = cut(firstSentence((zh && e.summary_zh) || e.summary || ""), zh ? 48 : 135);
  const flagsSrc = slide === 1 ? (ps.length ? ps.map((p) => p.country) : e.countries).slice(0, 5).map((c) => `https://flagcdn.com/48x36/${c.toLowerCase()}.png`) : [];
  const inSources = zh ? `在我们的来源里 · ${nC > 1 ? `${nC} 个国家` : `${nS} 家媒体`}` : `In our sources · ${nC > 1 ? `${nC} countries` : `${nS} ${nS === 1 ? "outlet" : "outlets"}`}`;

  const h3a = zh ? "所有报道都提到" : "WHAT ALL REPORTS SHARE", h3b = zh ? "各国侧重不同" : "WHERE THE COVERAGE DIFFERS", h3k = zh ? "要点" : "THE TAKEAWAY";
  const tPhoto = tp?.img ?? (photoOk ? e.image_url : null), tCredit = tp?.credit ?? (photoOk ? e.image_credit ?? "" : "");
  const tc = tp?.copy;
  const tTitle = (zh ? tc?.title_zh : tc?.title) || title, tDek = (zh ? tc?.dek_zh : tc?.dek) || dek;
  const tItems = ((zh && tc?.items_zh?.length ? tc.items_zh : tc?.items) ?? []).slice(0, 5);
  const tPoints = tItems.length ? [] : ((zh && e.points?.zh?.length ? e.points.zh : e.points?.en) ?? []).slice(0, 5).map((x) => cut(x, zh ? 40 : 110));
  const tLabels = zh ? { k: "旅行灵感", look: "值得看的", swipe: "左滑 →", via: "内容来源", more: "更多旅行：主页链接 →" } : { k: "WHERE TO GO NEXT", look: "WHAT TO LOOK FOR", swipe: "Swipe →", via: "As featured by", more: "More travel: link in bio →" };
  const all = [title, cat, meta, bio, "NEW POST今日新帖旅行灵感，去主页看New travel read on our pageHow the world reports it, on our page各国怎么报道，去主页看完整对比：主页链接Full comparison: link in bio", tCredit, tTitle, tDek, ...tItems.flatMap((i) => [i.h, i.d]), ...tPoints, ...Object.values(tLabels), e.lead_source ?? "", dek, inSources, e.image_credit ?? "", "coda.news", ...Object.values(SEC).flatMap((v) => [v[0], v[1]]), kicker, cta, scan, credit, h3a, h3b, h3k, "0123456789·→、•", ...shared, ...diffRows, ...rows.flatMap((r) => [r.c, r.f, r.t[zh ? 1 : 0]])].join("");
  const serif = zh ? "Noto+Serif+SC" : "Playfair+Display", sans = zh ? "Noto+Sans+SC" : "Inter";
  const [serifB, sansR, sansB, sansK] = await Promise.all([gfont(serif, 700, all), gfont(sans, 400, all), gfont(sans, 700, all), gfont(sans, 900, all)]);
  const fonts = [{ name: "Serif", data: serifB, weight: 700 as const }, { name: "Sans", data: sansR, weight: 400 as const }, { name: "Sans", data: sansB, weight: 700 as const }, { name: "Sans", data: sansK, weight: 900 as const }];

  // covers rotate between four looks so the grid never feels like one template: a photo card when we have a usable
  // photo (colored section tag, photo on top, heavy sans headline on warm paper), otherwise black, white or orange type
  const look = photoOk ? "photo" : (["ink", "white", "orange"] as const)[e.id % 3];
  const BG = { ink: INK, white: "#FFFFFF", orange: ORANGE, photo: PAPER }[look];
  const FG = look === "ink" || look === "orange" ? "#FFFFFF" : INK;
  const SUB = look === "ink" ? "rgba(255,255,255,0.7)" : look === "orange" ? "rgba(255,255,255,0.85)" : "#4B5563";
  const TINT = "#F6F5F2";
  const tag = SECTION[e.category] ?? [cat, INK];
  const tsize = (n: number) => (zh ? (n > 30 ? 60 : n > 18 ? 72 : 84) : (n > 75 ? 60 : n > 50 ? 70 : n > 32 ? 82 : 96));
  const foot = (color: string, sub: string) => (
    <div style={{ marginTop: "auto", display: "flex", alignItems: "center", fontSize: 26, color: sub }}>
      {flagsSrc.map((f, i) => <img key={i} src={f} width={40} height={30} style={{ marginRight: 10, borderRadius: 3, objectFit: "cover" }} alt="" />)}
      <div style={{ display: "flex", marginLeft: flagsSrc.length ? 10 : 0 }}>{inSources}</div>
      <div style={{ marginLeft: "auto", display: "flex", fontSize: 38, fontWeight: 700, color, flexShrink: 0 }}>{look === "orange" ? "coda.news" : <B text="coda.news" />}</div>
    </div>
  );
  const cover = look === "photo" ? (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: PAPER, fontFamily: "Sans" }}>
      <div style={{ display: "flex", width: W, height: 720, position: "relative", borderBottom: `9px solid ${tag[1]}` }}>
        <img src={e.image_url!} width={W} height={720} style={{ width: W, height: 720, objectFit: "cover", objectPosition: e.image_focus === "top" ? "center 20%" : "center" }} alt="" />
        <div style={{ position: "absolute", top: 72, left: 84, display: "flex", background: tag[1], color: "#fff", fontSize: 28, fontWeight: 900, letterSpacing: zh ? 3 : 3, padding: "12px 22px", borderRadius: 4 }}>{tag[0]}</div>
        {credit && <div style={{ position: "absolute", right: 30, bottom: 22, display: "flex", fontSize: 17, color: "rgba(255,255,255,0.92)", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>{e.image_credit!.replace(/&amp;/g, "&")}</div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "56px 84px 60px" }}>
        <div style={{ display: "flex", fontWeight: 900, fontSize: tsize(title.length), lineHeight: zh ? 1.2 : 1.0, color: INK, letterSpacing: zh ? 0 : -2 }}>{title}</div>
        {dek && <div style={{ display: "flex", marginTop: 22, fontSize: 32, lineHeight: 1.4, color: "#3F434A" }}>{dek}</div>}
        {foot(INK, "#6B7280")}
      </div>
    </div>
  ) : (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: BG, fontFamily: "Sans", padding: "72px 84px 64px" }}>
      <div style={{ display: "flex" }}>
        <div style={{ display: "flex", background: look === "white" ? tag[1] : FG, color: look === "white" ? "#fff" : BG, fontSize: 28, fontWeight: 900, letterSpacing: 3, padding: "12px 22px", borderRadius: 4 }}>{tag[0]}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", marginBottom: "auto" }}>
        <div style={{ display: "flex", fontWeight: 900, fontSize: Math.round(tsize(title.length) * 1.12), lineHeight: zh ? 1.2 : 1.0, color: FG, letterSpacing: zh ? 0 : -2 }}>{title}</div>
        {dek && <div style={{ display: "flex", marginTop: 32, fontSize: 34, lineHeight: 1.4, color: SUB }}>{dek}</div>}
      </div>
      {foot(FG, SUB)}
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
        <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: ORANGE, letterSpacing: zh ? 3 : 4 }}>{h3a}</div>
        {shared.length ? shared.map((t, i) => bullet(t, i, INK)) : bullet(title, 0, INK)}
      </div>
      {diffRows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", marginTop: 44, paddingTop: 36, borderTop: "1px solid #E7E2DA" }}>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: ORANGE, letterSpacing: zh ? 3 : 4 }}>{h3b}</div>
          {diffRows.map((t, i) => bullet(t, i, ORANGE))}
        </div>
      )}
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", borderTop: `4px solid ${INK}`, paddingTop: 24, fontSize: 24, color: "#6B7280" }}>
        <div style={{ display: "flex" }}>{meta}</div>
        <div style={{ display: "flex", marginLeft: "auto", fontWeight: 700, color: INK, fontSize: 28 }}>{bio}</div>
      </div>
    </div>
  );

  const tHead = (color: string) => (
    <div style={{ display: "flex", alignItems: "center" }}>
      <img src={color === "#fff" ? LOGO_WHITE_DATA_URI : LOGO_DATA_URI} width={236} height={37} alt="" />
      <div style={{ marginLeft: "auto", display: "flex", fontSize: 22, fontWeight: 700, color, letterSpacing: zh ? 2 : 5 }}>{cat}</div>
    </div>
  );
  const travel1 = (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: INK, fontFamily: "Sans", position: "relative" }}>
      {tPhoto && <img src={tPhoto} width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }} alt="" />}
      <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex", backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.78) 100%)" }} />
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "64px 84px 60px", position: "relative" }}>
        {tHead("#fff")}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: "#FDBA8C", letterSpacing: zh ? 3 : 4 }}>{tLabels.k}</div>
          <div style={{ display: "flex", marginTop: 18, fontWeight: 900, fontSize: Math.round(tsize(tTitle.length) * 1.12), lineHeight: zh ? 1.2 : 1.0, color: "#fff", letterSpacing: zh ? 0 : -2 }}>{tTitle}</div>
          {tDek && <div style={{ display: "flex", marginTop: 24, fontSize: 34, lineHeight: 1.4, color: "rgba(255,255,255,0.92)" }}>{tDek}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 44, fontSize: 24, color: "rgba(255,255,255,0.85)" }}>
          <div style={{ display: "flex", fontWeight: 700, color: "#fff", fontSize: 26 }}>{tLabels.swipe}</div>
          {tCredit && <div style={{ display: "flex", marginLeft: "auto", fontSize: 18 }}>{`Photo: ${tCredit}`}</div>}
        </div>
      </div>
    </div>
  );
  const travel2 = (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#fff", fontFamily: "Sans", padding: "64px 84px 60px" }}>
      {tHead(INK)}
      <div style={{ display: "flex", marginTop: 80, fontSize: 26, fontWeight: 700, color: ORANGE, letterSpacing: zh ? 3 : 4 }}>{tLabels.look}</div>
      <div style={{ display: "flex", marginTop: 18, fontWeight: 900, fontSize: zh ? 56 : 62, lineHeight: 1.05, color: INK, letterSpacing: zh ? 0 : -1 }}>{tTitle}</div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 44 }}>
        {tItems.length ? tItems.map((t, i) => (
          <div key={i} style={{ display: "flex", borderTop: "1px solid #E5E7EB", padding: "24px 0" }}>
            <div style={{ display: "flex", width: 60, fontSize: 38, fontWeight: 900, color: ORANGE }}>{i + 1}</div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: INK }}>{t.h}</div>
              <div style={{ display: "flex", marginTop: 6, fontSize: 27, lineHeight: 1.35, color: "#6B7280" }}>{t.d}</div>
            </div>
          </div>
        )) : tPoints.length ? tPoints.map((t, i) => (
          <div key={i} style={{ display: "flex", borderTop: "1px solid #E5E7EB", padding: "26px 0" }}>
            <div style={{ display: "flex", width: 56, fontSize: 36, fontWeight: 900, color: ORANGE }}>{i + 1}</div>
            <div style={{ display: "flex", flex: 1, fontSize: zh ? 32 : 31, lineHeight: 1.38, color: "#1F2937" }}>{t}</div>
          </div>
        )) : <div style={{ display: "flex", fontSize: 32, lineHeight: 1.45, color: "#1F2937" }}>{(zh && e.summary_zh) || e.summary}</div>}
      </div>
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", borderTop: `4px solid ${INK}`, paddingTop: 24, fontSize: 24, color: "#6B7280" }}>
        {e.lead_source && <div style={{ display: "flex" }}>{`${tLabels.via} ${e.lead_source}`}</div>}
        <div style={{ display: "flex", marginLeft: "auto", fontWeight: 700, color: INK, fontSize: 28 }}>{tLabels.more}</div>
      </div>
    </div>
  );

  const SH = 1920;
  const coverSrc = `${new URL(req.url).origin}${zh ? "/zh" : ""}/event/${slug}/social?${tp?.kind === "travel" ? `s=t1&p=${pid}` : "s=1"}&fmt=jpg`;
  const story = (
    <div style={{ width: W, height: SH, display: "flex", flexDirection: "column", alignItems: "center", background: INK, fontFamily: "Sans", padding: "120px 72px 150px" }}>
      <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
        <img src={LOGO_WHITE_DATA_URI} width={236} height={37} alt="" />
        <div style={{ marginLeft: "auto", display: "flex", fontSize: 24, fontWeight: 700, color: ORANGE, letterSpacing: zh ? 3 : 5 }}>{zh ? "今日新帖" : "NEW POST"}</div>
      </div>
      <div style={{ display: "flex", flexGrow: 1 }} />
      <img src={coverSrc} width={936} height={1170} style={{ borderRadius: 24 }} alt="" />
      <div style={{ display: "flex", marginTop: 64, fontSize: 38, fontWeight: 700, color: "#fff" }}>{tp?.kind === "travel" ? (zh ? "旅行灵感，去主页看" : "New travel read on our page") : (zh ? "各国怎么报道，去主页看" : "How the world reports it, on our page")}</div>
      <div style={{ display: "flex", marginTop: 14, fontSize: 28, color: "rgba(255,255,255,0.7)" }}>{zh ? "完整对比：主页链接" : "Full comparison: link in bio"}</div>
      <div style={{ display: "flex", flexGrow: 1 }} />
    </div>
  );

  const img = new ImageResponse(isStory ? story : tslide === 1 ? travel1 : tslide === 2 ? travel2 : slide === 1 ? cover : slide === 2 ? list : takeaway, { width: W, height: isStory ? SH : H, fonts, headers: { "cache-control": "public, max-age=0, s-maxage=3600" } });
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
