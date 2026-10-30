// Draft preview of a Coda Anatomy issue stored in the database: /anatomy-draft/<slug>/<draft_key>. Never indexed, never cached.
import { notFound } from "next/navigation";
import { langFrom } from "@/lib/i18n";
import { draftProfile } from "@/lib/anatomy-db";
import { AnatomyArticle } from "@/components/anatomy/Article";

export const dynamic = "force-dynamic";
export const metadata = { title: "Draft · Coda Anatomy", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ lang: string; slug: string; key: string }> }) {
  const p = await params;
  const pr = await draftProfile(p.slug, p.key);
  if (!pr) notFound();
  const l = await langFrom(params);
  return (
    <>
      <div className="bg-[#FFF4E5] px-4 py-2 text-center text-[13px] text-[#9A3412]">{l === "zh" ? "草稿预览，读者看不到" : "Draft preview, not visible to readers"}</div>
      <AnatomyArticle pr={pr} l={l} />
    </>
  );
}
