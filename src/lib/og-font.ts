// Google Fonts subset loader for generated images (only the characters used are downloaded).
export async function gfont(family: string, weight: number, text: string) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`)).text();
  const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`font ${family}`);
  return (await fetch(url)).arrayBuffer();
}

/** Splits text so every "coda.news" gets an orange dot (for generated images). */
export function brandParts(text: string): { t: string; dot?: boolean }[] {
  const out: { t: string; dot?: boolean }[] = [];
  text.split(/(coda\.news)/).forEach((p) => {
    if (p === "coda.news") out.push({ t: "coda" }, { t: ".", dot: true }, { t: "news" });
    else if (p) out.push({ t: p.replace(/^ | $/g, "\u00a0") });   // satori drops spaces at span edges
  });
  return out;
}
