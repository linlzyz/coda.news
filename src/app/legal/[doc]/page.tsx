import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DOCS } from "./docs";

export function generateStaticParams() { return Object.keys(DOCS).map((doc) => ({ doc })); }
export async function generateMetadata({ params }: PageProps<"/legal/[doc]">): Promise<Metadata> {
  const d = DOCS[(await params).doc]; return d ? { title: d.title } : {};
}

export default async function Legal({ params }: PageProps<"/legal/[doc]">) {
  const d = DOCS[(await params).doc];
  if (!d) notFound();
  return (
    <article className="mx-auto max-w-[760px] px-4 py-12 sm:px-6">
      <h1 className="text-[36px] font-semibold tracking-[-0.03em]">{d.title}</h1>
      <p className="mt-2 text-[13px] text-slate-500">Last updated: {d.updated}</p>
      <div className="mt-8 space-y-8">
        {d.sections.map(([h, body]) => (
          <section key={h}>
            <h2 className="text-[19px] font-semibold tracking-[-0.015em]">{h}</h2>
            <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-slate-700">{body.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div>
          </section>
        ))}
      </div>
    </article>
  );
}
