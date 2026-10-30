import { notFound } from "next/navigation";
import { alternates, langFrom } from "@/lib/i18n";
import { PROFILES, photoUrl, pick } from "@/lib/anatomy";
import { findProfile } from "@/lib/anatomy-db";
import { AnatomyArticle } from "@/components/anatomy/Article";

export const revalidate = 86400;
export function generateStaticParams() { return PROFILES.map((p) => ({ slug: p.slug })); }
// issues stored in the database render on first visit; /api/revalidate (tag "anatomy") refreshes them when one goes live
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps<"/[lang]/anatomy/[slug]">) {
  const p = await params;
  const pr = await findProfile(p.slug);
  if (!pr) return {};
  const zh = p.lang === "zh";
  return {
    title: { absolute: `${pick(pr.seoTitle, zh)} | ${zh ? "Coda 剖面" : "Coda Anatomy"} · coda.news` },
    description: pick(pr.seoDesc, zh),
    keywords: pr.keywords,
    alternates: alternates(`/anatomy/${pr.slug}`, zh ? "zh" : "en"),
    openGraph: { type: "article", title: pick(pr.title, zh), description: pick(pr.dek, zh), publishedTime: pr.published, modifiedTime: pr.updated, images: [{ url: photoUrl(pr.cover.file, 1200), alt: pick(pr.cover.alt, zh) }] },
    twitter: { card: "summary_large_image", images: [photoUrl(pr.cover.file, 1200)] },
  };
}


export default async function Page({ params }: PageProps<"/[lang]/anatomy/[slug]">) {
  const p = await params;
  const pr = await findProfile(p.slug);
  if (!pr) notFound();
  return <AnatomyArticle pr={pr} l={await langFrom(params)} />;
}
