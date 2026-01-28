import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.tina.io",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  async headers() {
    // TinaCMS visual editing requires embedding pages in iframe
    // In dev: allow localhost, in prod: allow TinaCloud
    const frameAncestors = isDev
      ? "frame-ancestors 'self' http://localhost:3000 http://localhost:4001"
      : "frame-ancestors 'self' https://app.tina.io https://*.tina.io";

    return [
      // Exclude /admin from strict CSP - TinaCMS admin page
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/((?!admin).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Note: X-Frame-Options removed - using CSP frame-ancestors instead for TinaCMS compatibility
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            // NOTE: Kept intentionally permissive to avoid breaking Next.js and third-party integrations.
            // Tighten over time (e.g. nonces, remove unsafe-eval) once audited in production.
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              frameAncestors,
              // Allow embedding trusted third-party iframes (e.g. YouTube lightbox)
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
              "object-src 'none'",
              "img-src 'self' data: https:",
              "font-src 'self' data: https:",
              "style-src 'self' 'unsafe-inline' https:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
              "connect-src 'self' https: wss:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
