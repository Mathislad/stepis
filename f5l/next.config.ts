import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Origine Supabase (pour autoriser auth/realtime dans le CSP `connect-src`).
 * Dérivée de NEXT_PUBLIC_SUPABASE_URL au moment du build.
 */
let supabaseOrigin = "";
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
  }
} catch {
  /* URL invalide / absente : on retombe sur 'self' uniquement */
}
const supabaseWss = supabaseOrigin ? supabaseOrigin.replace(/^https/, "wss") : "";
const connectSrc = ["'self'", supabaseOrigin, supabaseWss].filter(Boolean).join(" ");

const csp = [
  `default-src 'self'`,
  isDev ? `script-src 'self' 'unsafe-inline' 'unsafe-eval'` : `script-src 'self' 'unsafe-inline'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' https: data: blob:`,
  `font-src 'self' data:`,
  isDev ? `connect-src ${connectSrc} ws: wss: https:` : `connect-src ${connectSrc}`,
  `worker-src 'self'`,
  `manifest-src 'self'`,
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `upgrade-insecure-requests`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
