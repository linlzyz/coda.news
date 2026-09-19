// Lightweight index for instant search suggestions (companies, topics, recent events).
import { allTopics, companyDirectory, listEvents } from "@/lib/data";
import { TOPIC_ZH } from "@/lib/i18n";
export const revalidate = 3600;

export async function GET() {
  const [cos, topics, events] = await Promise.all([companyDirectory(), allTopics(), listEvents({ order: "recent", limit: 300 })]);
  const body = {
    c: cos.sort((a, b) => b.events - a.events).map((c) => [c.name, c.name_zh ?? "", c.slug, c.logo_url ?? "", c.country ?? "", c.events]),
    t: topics.map((t) => [t.name, TOPIC_ZH[t.slug] ?? "", t.slug]),
    e: events.map((e) => [e.title, e.title_zh ?? "", e.slug]),
  };
  return Response.json(body, { headers: { "cache-control": "public, max-age=300, s-maxage=600" } });
}
