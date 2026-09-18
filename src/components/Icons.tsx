// Minimal stroke icons (24px grid). currentColor.
const P: Record<string, string> = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  economy: "M4 20V10M10 20V4M16 20v-8M22 20H2",
  technology: "M7 7h10v10H7zM10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3",
  markets: "M3 17l6-6 4 4 8-8M15 7h6v6",
  companies: "M4 21V5l8-3v19M12 9h8v12M7 8h1M7 12h1M7 16h1M15 13h1M15 17h1",
  topics: "M4 7h16M4 12h16M4 17h10",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5",
  sport: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 3v18M3 12h18M5.6 5.6c3.5 3.5 3.5 9.3 0 12.8M18.4 5.6c-3.5 3.5-3.5 9.3 0 12.8",
  entertainment: "M4 5h16v14H4zM4 9h16M8 5l2 4M13 5l2 4M10 13l4 2-4 2z",
  fashion: "M9 3l3 3 3-3 5 3-2 4-3-1v12H9V9l-3 1-2-4z",
  automotive: "M5 16h14l-1.5-6h-11zM7 10l1.5-4h7L17 10M7.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM16.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  gaming: "M6 9h12a4 4 0 0 1 4 4v1a3 3 0 0 1-5.4 1.8L15 14H9l-1.6 1.8A3 3 0 0 1 2 14v-1a4 4 0 0 1 4-4zM8 11v4M6 13h4M16 12h.01M18 14h.01",
  china: "M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  travel: "M2 16l8-3V6.5a2 2 0 0 1 4 0V13l8 3v2l-8-2v4l2 1.5V23l-4-1-4 1v-1.5l2-1.5v-4l-8 2z",
  australia: "M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  flame: "M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-4 5-4 7-1-1-2-2-2-4-2 2-3 5-3 9 0 4 3 7 7 7z",
  "artificial-intelligence": "M9 3h6M12 3v3M6 8h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM9 13h.01M15 13h.01M9.5 16.5h5",
  semiconductors: "M7 7h10v10H7zM10 10h4v4h-4zM10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3",
  "big-tech": "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2",
  trade: "M3 17h18l-2 4H5zM6 17V9h12v8M9 9V5h6v4",
  "electric-vehicles": "M5 16h14l-1.5-6a2 2 0 0 0-2-1.5h-7a2 2 0 0 0-2 1.5zM7 19.5a1.5 1.5 0 1 0 0-3M17 19.5a1.5 1.5 0 1 0 0-3M13 3l-2 4h3l-2 4",
  energy: "M13 2L4 14h7l-1 8 9-12h-7z",
  startups: "M5 19c0-3 1-5 3-6M14 4c3 0 6 3 6 6l-7 7-6-6 7-7zM15 9h.01",
  crypto: "M9 6h5a3 3 0 0 1 0 6H9zM9 12h6a3 3 0 0 1 0 6H9zM9 4v16M12 4v2M12 18v2",
};
export function Icon({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={P[name] ?? P.topics} />
    </svg>
  );
}
