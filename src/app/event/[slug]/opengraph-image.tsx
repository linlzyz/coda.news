// Share card: the event and how each country frames it.
import { ImageResponse } from "next/og";
import { getEvent, getPerspectives } from "@/lib/data";
import { COUNTRY } from "@/lib/ui";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "coda.news: one story, every perspective";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const e = await getEvent((await params).slug);
  const ps = e ? (await getPerspectives([e.id])).get(e.id) ?? [] : [];
  const title = e?.title ?? "coda.news";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#ffffff", padding: "56px 64px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 34, fontWeight: 700, color: "#231815", letterSpacing: -1 }}>
          coda<span style={{ color: "#EA5514" }}>.</span>news
          <span style={{ marginLeft: 20, fontSize: 22, fontWeight: 400, color: "#6B7280" }}>One story. Every perspective.</span>
        </div>
        <div style={{ display: "flex", marginTop: 36, fontSize: title.length > 80 ? 46 : 56, fontWeight: 700, lineHeight: 1.1, color: "#16181D", letterSpacing: -1.5 }}>{title}</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", gap: 12 }}>
          {ps.slice(0, 3).map((p) => (
            <div key={p.country} style={{ display: "flex", fontSize: 26, color: "#374151", borderTop: "2px solid #E5E7EB", paddingTop: 10 }}>
              <span style={{ width: 280, fontWeight: 700, color: "#16181D" }}>{COUNTRY[p.country] ?? p.country}</span>
              <span>{p.framing}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", marginTop: 22, fontSize: 22, color: "#6B7280" }}>
          {e ? `${e.countries.length} ${e.countries.length === 1 ? "country" : "countries"} · ${e.source_count} ${e.source_count === 1 ? "source" : "sources"}` : ""}
          <span style={{ marginLeft: "auto", color: "#EA5514", fontWeight: 700 }}>Compare the coverage →</span>
        </div>
      </div>
    ),
    size,
  );
}
