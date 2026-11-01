import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/** Origin of the API the browser talks to directly (REST, SSE, live updates), e.g. `https://api.example.com`. */
function originOf(value: string | undefined) {
  try {
    return value ? new URL(value).origin : "";
  } catch {
    return "";
  }
}
const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_URL);
/** Public origin of the R2 bucket that serves audio and video (e.g. `https://media.example.com`). Allowed in `media-src` only. */
const mediaOrigin = originOf(process.env.NEXT_PUBLIC_MEDIA_URL);

/**
 * Content-Security-Policy. Next's own bootstrap and the JSON-LD blocks are inline scripts, so `script-src` keeps
 * 'unsafe-inline' (a per-request nonce would force every page to render dynamically); it still refuses scripts from
 * any other origin, and `connect-src` limits where a script could send data. 'unsafe-eval' is development only.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // API (REST + SSE), live updates, text-to-speech, and Iconify's public icon API (flags, provider logos).
  ["connect-src 'self'", apiOrigin, apiOrigin.replace(/^http/, "ws"), "https://api.elevenlabs.io", "https://api.iconify.design", "https://api.simplesvg.com", "https://api.unisvg.com"]
    .filter(Boolean)
    .join(" "),
  ["media-src 'self' blob: data:", mediaOrigin].filter(Boolean).join(" "),
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Mira's voice mode needs the microphone on this origin only.
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), payment=(), microphone=(self)" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  allowedDevOrigins: ["192.168.1.6"],
  // The Mira conversation moved from /diagnostic to /orientation (query strings are kept).
  async redirects() {
    return [
      // "/" is the home page; /home would be a duplicate URL for search engines.
      { source: "/home", destination: "/", permanent: true },
      { source: "/psy", destination: "/clinician", permanent: true },
      { source: "/diagnostic", destination: "/orientation", permanent: true },
      { source: "/diagnostic/:path*", destination: "/orientation/:path*", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "pplx-res.cloudinary.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;