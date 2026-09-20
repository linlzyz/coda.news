import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the Reel renderer runs the bundled ffmpeg binary
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: { "/api/ig/reel/[id]": ["./node_modules/ffmpeg-static/ffmpeg"] },
};

export default nextConfig;
