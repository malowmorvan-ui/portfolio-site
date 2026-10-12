import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages d'offre prospects : fichiers statiques dans public/offre/<slug>/index.html
  async rewrites() {
    return [{ source: "/offre/:slug", destination: "/offre/:slug/index.html" }];
  },
  async redirects() {
    return [{ source: "/offre", destination: "/", permanent: false }];
  },
  async headers() {
    return [
      {
        source: "/offre/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default nextConfig;
