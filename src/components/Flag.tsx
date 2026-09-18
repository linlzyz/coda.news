import * as FlagSet from "country-flag-icons/react/3x2";
import { countryName } from "@/lib/ui";

export function Flag({ code, size = 16 }: { code: string; size?: number }) {
  const F = (FlagSet as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>)[code];
  const style = { width: size * 1.5, height: size, borderRadius: 3, boxShadow: "0 0 0 1px rgba(22,24,29,.12)" };
  if (!F) return <span className="inline-block bg-[#E5E7EB]" style={style} aria-label={countryName(code)} />;
  return <F style={style} role="img" aria-label={countryName(code)} className="inline-block shrink-0" />;
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
