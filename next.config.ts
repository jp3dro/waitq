import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
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
    // In development, allow TinaCMS admin to embed pages in iframe
    const framePolicy = isDev
      ? { key: "X-Frame-Options", value: "SAMEORIGIN" }
      : { key: "X-Frame-Options", value: "DENY" };
    
    const frameAncestors = isDev
      ? "frame-ancestors 'self' http://localhost:3000 http://localhost:4001"
      : "frame-ancestors 'none'";

    return [
      // Exclude /admin from strict CSP - TinaCMS needs to load from localhost:4001 in dev
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
          framePolicy,
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
