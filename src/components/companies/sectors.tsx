// Sector tags for the companies directory: labels and simple line icons.
export const SECTORS = ["technology", "finance", "automotive", "luxury", "beauty", "fashion", "entertainment", "sport", "energy", "retail", "industrial", "institution", "other"] as const;
export const SECTOR_LABEL: Record<string, [string, string]> = {
  technology: ["Technology", "科技"], finance: ["Finance", "金融"], automotive: ["Automotive", "汽车"], luxury: ["Luxury", "奢侈品"],
  beauty: ["Beauty", "美妆"], fashion: ["Fashion", "服装"], entertainment: ["Entertainment & Media", "娱乐传媒"], sport: ["Sport", "体育"],
  energy: ["Energy", "能源"], retail: ["Retail & Consumer", "零售消费"], industrial: ["Industry", "工业制造"], institution: ["Institutions", "机构"], other: ["Other", "其他"],
};
export const sectorLabel = (s: string | null, zh: boolean) => (SECTOR_LABEL[s ?? "other"] ?? SECTOR_LABEL.other)[zh ? 1 : 0];

const P: Record<string, string> = {
  technology: "M4 5h16v11H4zM2 19h20M9 16v3M15 16v3",
  finance: "M3 10h18L12 4 3 10zM5 10v8M10 10v8M14 10v8M19 10v8M3 20h18",
  automotive: "M5 16h14l-1.5-6h-11zM7 10l1.5-4h7L17 10M7.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM16.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  luxury: "M6 3h12l3 6-9 12L3 9zM3 9h18M9 3l3 18M15 3l-3 18",
  beauty: "M9 3h6v4H9zM8 7h8v14H8zM8 12h8",
  fashion: "M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3c0 2-2 3-4 3s-4-1-4-3z",
  entertainment: "M4 6h16v12H4zM4 10h16M8 6l2 4M13 6l2 4",
  sport: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 3v18M3 12h18M5.6 5.6c3.5 3 3.5 9.8 0 12.8M18.4 5.6c-3.5 3-3.5 9.8 0 12.8",
  energy: "M13 2 4 14h7l-1 8 9-12h-7z",
  retail: "M4 7h16l-1 13H5zM9 7a3 3 0 0 1 6 0",
  industrial: "M3 21V11l6 4V11l6 4V7l6 3v11zM3 21h18",
  institution: "M12 3 3 8h18zM5 8v10M9.5 8v10M14.5 8v10M19 8v10M3 20h18",
  other: "M5 12h.01M12 12h.01M19 12h.01",
};
export function SectorIcon({ s, size = 22 }: { s: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={P[s] ?? P.other} /></svg>;
}
