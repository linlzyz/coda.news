import Link from "next/link";
import { trendingCompanies } from "@/lib/data";
import { getLang, t } from "@/lib/i18n";
export const metadata = { title: "Companies" };
export default async function Page() {
  const [cos, l] = await Promise.all([trendingCompanies(60), getLang()]);
  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      <h1 className="border-b-2 border-[#111111] pb-4 text-[40px] font-semibold tracking-[-0.03em]">{t(l, "companies")}</h1>
      <p className="mt-2 text-neutral-600">{t(l, "mostActive")}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {cos.map((c) => <Link key={c.id} href={`/company/${c.slug}`} className="border-b border-[#E6E6E6] py-2 pr-6 text-[16px] font-medium hover:text-[#C2410C]">{c.name}</Link>)}
      </div>
    </div>
  );
}
