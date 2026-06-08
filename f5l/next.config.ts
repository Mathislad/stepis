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
  // DECISION: pivot F5L Acquisition. Les anciens chemins (legacy V0) sont
  // redirigés vers les nouveaux pour ne pas casser les bookmarks existants.
  async redirects() {
    return [
      // Modules actifs renommés
      { source: "/crm", destination: "/prospects", permanent: false },
      { source: "/crm/leads", destination: "/prospects?filter=new", permanent: false },
      { source: "/crm/new", destination: "/prospects/nouveau", permanent: false },
      { source: "/crm/:contactId", destination: "/prospects/:contactId", permanent: false },
      { source: "/acquisition", destination: "/campagnes", permanent: false },
      { source: "/acquisition/new", destination: "/campagnes/nouvelle", permanent: false },
      { source: "/acquisition/:campaignId", destination: "/campagnes/:campaignId", permanent: false },
      { source: "/site", destination: "/ma-page", permanent: false },
      { source: "/site/offers", destination: "/ma-page/offres", permanent: false },
      { source: "/site/edit/:blockKey", destination: "/ma-page/edit", permanent: false },
      // Modules verrouillés (renvoient tous vers /bientot/[key])
      { source: "/loyalty", destination: "/bientot/loyalty", permanent: false },
      { source: "/loyalty/:path*", destination: "/bientot/loyalty", permanent: false },
      { source: "/loyalty-agent", destination: "/bientot/loyalty-agent", permanent: false },
      { source: "/loyalty-agent/:path*", destination: "/bientot/loyalty-agent", permanent: false },
      { source: "/telephone", destination: "/bientot/phone", permanent: false },
      { source: "/telephone/:path*", destination: "/bientot/phone", permanent: false },
      { source: "/reputation", destination: "/bientot/reputation", permanent: false },
      { source: "/reputation/:path*", destination: "/bientot/reputation", permanent: false },
      { source: "/admin", destination: "/bientot/admin", permanent: false },
      { source: "/admin/:path*", destination: "/bientot/admin", permanent: false },
      { source: "/manager", destination: "/bientot/manager", permanent: false },
      { source: "/manager/:path*", destination: "/bientot/manager", permanent: false },
    ];
  },
};

export default nextConfig;
