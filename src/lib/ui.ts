import type { Status } from "./data";

export const COUNTRY: Record<string, string> = {
  US: "United States", CN: "China", HK: "Hong Kong", TW: "Taiwan", JP: "Japan", KR: "South Korea", GB: "United Kingdom",
  DE: "Germany", FR: "France", ES: "Spain", EU: "European Union", IN: "India", AU: "Australia", SG: "Singapore",
  AE: "United Arab Emirates", QA: "Qatar", CA: "Canada",
};
export const countryName = (c: string) => COUNTRY[c] ?? c;

export const STATUS: Record<Status, { label: string; cls: string }> = {
  rumor:      { label: "Rumor",      cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  breaking:   { label: "Breaking",   cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  developing: { label: "Developing", cls: "bg-sky-50 text-sky-800 ring-sky-200" },
  confirmed:  { label: "Confirmed",  cls: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  resolved:   { label: "Resolved",   cls: "bg-slate-100 text-slate-700 ring-slate-200" },
  archived:   { label: "Archived",   cls: "bg-slate-100 text-slate-500 ring-slate-200" },
};

export const TONE: Record<string, { label: string; cls: string; x: number }> = {
  positive: { label: "Positive", cls: "bg-emerald-50 text-emerald-800", x: 18 },
  neutral:  { label: "Neutral",  cls: "bg-slate-100 text-slate-700", x: 50 },
  negative: { label: "Cautious", cls: "bg-rose-50 text-rose-800", x: 82 },
};

export function timeAgo(iso: string) {
  const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
