// Share and search images. Google Discover and social cards want a real picture at least 1200px wide:
// brand logos and SVGs are swapped for the generated 1200x630 story card, Commons photos are asked for at 1600px.
type E = { slug: string; image_url: string | null; image_focus?: string | null; image_credit?: string | null };

export const isLogo = (e: E) => !e.image_url || e.image_focus === "logo" || /^Logo:/.test(e.image_credit ?? "") || /\.svg(\?|$)/i.test(e.image_url);

export const cardUrl = (slug: string) => `https://coda.news/event/${slug}/opengraph-image`;

export function bigImage(url: string) {
  if (/commons\.wikimedia\.org\/wiki\/Special:FilePath\//.test(url)) return url.replace(/([?&])width=\d+/, "$1width=1600");
  return url.replace(/[?&]utm_[^&]*/g, "").replace(/\?&/, "?").replace(/\?$/, "");
}

/** Best images for a story, largest first. */
export const shareImages = (e: E) => (isLogo(e) ? [cardUrl(e.slug)] : [bigImage(e.image_url!), cardUrl(e.slug)]);
