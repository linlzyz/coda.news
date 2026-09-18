"use server";
import { subscribe } from "@/lib/data";

export async function join(_: boolean | null, formData: FormData): Promise<boolean> {
  const email = String(formData.get("email") ?? "");
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && (await subscribe(email, String(formData.get("lang") ?? "en")));
}
