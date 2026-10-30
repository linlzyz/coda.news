// Feasibility probe for game price comparison (28 Sept 2026). Fetches the given URLs from Supabase's servers and
// reports status, blocking headers and a body excerpt. Read-only, touches no tables. POST [{url, headers?, method?, body?}]
Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) return new Response("forbidden", { status: 403 });
  const list = (await req.json()) as { url: string; headers?: Record<string, string>; method?: string; body?: string; full?: boolean; grep?: string }[];
  const out = await Promise.all(list.slice(0, 40).map(async (x) => {
    const t0 = Date.now();
    try {
      const r = await fetch(x.url, { method: x.method ?? "GET", body: x.body, headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36", "accept-language": "en-AU,en;q=0.9", ...(x.headers ?? {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
      const text = await r.text();
      const h = Object.fromEntries(["server", "cf-ray", "x-akamai-transformed", "akamai-grn", "retry-after", "x-ratelimit-remaining", "content-type"].map((k) => [k, r.headers.get(k)]).filter(([, v]) => v));
      return { url: x.url, status: r.status, ms: Date.now() - t0, h, len: text.length, body: x.grep ? JSON.stringify([...text.matchAll(new RegExp(x.grep, "g"))].slice(0, 12).map((m) => m[0])) : x.full ? text.slice(0, 60000) : text.slice(0, 600) };
    } catch (e) { return { url: x.url, error: (e as Error).message, ms: Date.now() - t0 }; }
  }));
  return Response.json(out);
});
