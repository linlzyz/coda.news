"use server";
import { followRpc } from "@/lib/data";

export async function follow(_: boolean | null, fd: FormData): Promise<boolean> {
  const email = String(fd.get("email") ?? "");
  if (String(fd.get("website") ?? "")) return true;   // honeypot: bots fill hidden fields
  const cid = Number(fd.get("cid")) || null, tid = Number(fd.get("tid")) || null;
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && (await followRpc(email, String(fd.get("lang") ?? "en"), cid, tid));
}
