import { redirect } from "next/navigation";
import { langFrom } from "@/lib/i18n";
export const dynamic = "force-dynamic";
// /brief always opens today's brief (Melbourne date)
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const l = await langFrom(params);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });
  redirect(`${l === "zh" ? "/zh" : ""}/archive/${today}`);
}
