import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cdn.digitaloceanspaces.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudflare.com" },
      { protocol: "https", hostname: "**.ggpht.com" },
      { protocol: "https", hostname: "**.wp.com" },
      { protocol: "https", hostname: "**" }, // catch-all; tighten later if needed
    ],
  },
};

export default nextConfig;
