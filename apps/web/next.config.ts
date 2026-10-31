import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8080";

const config: NextConfig = {
  // `next dev` and `next build` must not share an output dir: a build overwrites
  // the dev server's .next and crashes it (500s). Builds can opt into a separate one.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@cf/ui"],
  experimental: { optimizePackageImports: ["gsap"] },
  // Same-origin API: refresh cookie stays first-party, no CORS preflights.
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${API_ORIGIN}/api/v1/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withNextIntl(config);
