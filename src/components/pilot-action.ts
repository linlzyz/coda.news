"use server";
import { requestPilot } from "@/lib/data";

export async function applyPilot(_: "ok" | "bad" | null, fd: FormData): Promise<"ok" | "bad"> {
  const g = (k: string) => String(fd.get(k) ?? "").trim();
  if (g("website")) return "ok";   // honeypot: bots fill every field
  const ok = await requestPilot({ name: g("name"), company: g("company"), email: g("email"), brands: g("brands"), note: g("note"), lang: g("lang") });
  return ok ? "ok" : "bad";
}
