import Link from "@/components/LLink";
import { trendingCompanies } from "@/lib/data";
import { langFrom, t } from "@/lib/i18n";
export const revalidate = 600;
export const metadata = { title: "Companies" };
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const [cos, l] = await Promise.all([trendingCompanies(60), langFrom(params)]);
  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      <h1 className="text-[36px] font-semibold tracking-[-0.03em]">{t(l, "companies")}</h1>
      <p className="mt-2 text-neutral-600">{t(l, "mostActive")}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {cos.map((c) => <Link key={c.id} href={`/company/${c.slug}`} className="rounded-full border border-[#E5E7EB] px-4 py-2 text-[14px] font-medium hover:border-[#F0A57F]">{c.name}</Link>)}
      </div>
    </div>
  );
}
