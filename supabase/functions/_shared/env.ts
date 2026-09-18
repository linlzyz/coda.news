// Works in both Deno (Supabase Edge Functions) and Node (local scripts).
// deno-lint-ignore no-explicit-any
const g = globalThis as any;
export function env(key: string, fallback = ""): string {
  const v = g.Deno?.env?.get?.(key) ?? g.process?.env?.[key];
  return v ?? fallback;
}
export const log = (...a: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...a);
