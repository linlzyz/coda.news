import type { MetadataRoute } from "next";

const PRIVATE = ["/search", "/social", "/zh/social", "/follow", "/zh/follow", "/admin", "/zh/admin", "/api/"];
// Crawlers that copy the site for model training or SEO databases and send no readers (4 Oct 2026: a crawler burst
// ran Vercel functions at 15x normal). AI *search* fetchers (OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-User,
// Claude-SearchBot) stay allowed: they cite and link our pages when people ask questions.
const NO_READERS = [
  "GPTBot", "ClaudeBot", "anthropic-ai", "CCBot", "Google-Extended", "Applebot-Extended", "Bytespider", "meta-externalagent",
  "FacebookBot", "cohere-ai", "cohere-training-data-crawler", "Diffbot", "ImagesiftBot", "omgili", "Timpibot", "AI2Bot",
  "AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "DataForSeoBot", "BLEXBot", "PetalBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: NO_READERS, disallow: "/" },
      { userAgent: "*", allow: "/", disallow: PRIVATE },
    ],
    sitemap: ["https://coda.news/sitemap.xml", "https://coda.news/news-sitemap.xml"],
    host: "https://coda.news",
  };
}
