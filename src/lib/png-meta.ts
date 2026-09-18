// Adds text metadata (source URL, credit) to a PNG so shared images always carry coda.news with them.
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf: Uint8Array) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

function iTXt(key: string, text: string) {
  // iTXt keeps UTF-8 text (Chinese titles): keyword\0 compression-flag\0 method\0 language\0 translated-keyword\0 text
  const enc = new TextEncoder();
  const data = new Uint8Array([...enc.encode(key), 0, 0, 0, 0, 0, ...enc.encode(text)]);
  const type = enc.encode("iTXt");
  const chunk = new Uint8Array(12 + data.length);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, data.length); chunk.set(type, 4); chunk.set(data, 8);
  dv.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));
  return chunk;
}

export async function withPngMeta(res: Response, meta: Record<string, string>, filename: string): Promise<Response> {
  const png = new Uint8Array(await res.arrayBuffer());
  const ihdrEnd = 8 + 8 + 13 + 4;   // signature + IHDR chunk
  const extra = Object.entries(meta).map(([k, v]) => iTXt(k, v));
  const out = new Uint8Array(png.length + extra.reduce((n, c) => n + c.length, 0));
  out.set(png.subarray(0, ihdrEnd), 0);
  let o = ihdrEnd; for (const c of extra) { out.set(c, o); o += c.length; }
  out.set(png.subarray(ihdrEnd), o);
  const headers = new Headers(res.headers);
  headers.set("content-type", "image/png");
  headers.set("content-disposition", `inline; filename="${filename}"`);
  headers.delete("content-length");
  return new Response(out, { status: res.status, headers });
}
