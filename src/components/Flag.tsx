import { countryName } from "@/lib/ui";

// Flags are static files in /public/flags (from country-flag-icons, 3x2), not inline SVG: inline paths were repeated in
// every list row and made section pages ~600 KB (Vercel cost, 29 Oct 2026). The CDN and the browser cache the files.
const HAVE = new Set("AC AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET EU FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU IC ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TA TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(" "));

export function Flag({ code, size = 16 }: { code: string; size?: number }) {
  // Taiwan is shown as part of China
  if (code === "TW") code = "CN";
  const style = { width: size * 1.5, height: size, borderRadius: 3, boxShadow: "0 0 0 1px rgba(22,24,29,.12)" };
  if (!HAVE.has(code)) return <span className="inline-block bg-[#E5E7EB]" style={style} aria-label={countryName(code)} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/flags/${code}.svg`} width={size * 1.5} height={size} alt={countryName(code)} loading="lazy" decoding="async" style={style} className="inline-block shrink-0" />;
}

export function Flags({ codes, max = 8, size = 12 }: { codes: string[]; max?: number; size?: number }) {
  const shown = codes.slice(0, max);
  return (
    <span className="inline-flex items-center gap-1" title={codes.map(countryName).join(", ")}>
      {shown.map((c) => <Flag key={c} code={c} size={size} />)}
      {codes.length > max && <span className="text-xs text-neutral-500">+{codes.length - max}</span>}
    </span>
  );
}
