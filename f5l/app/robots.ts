import type { MetadataRoute } from "next";

function siteUrl(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").origin;
  } catch {
    return "http://localhost:3000";
  }
}

export default function robots(): MetadataRoute.Robots {
  const host = siteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/p/"],
        disallow: [
          "/",
          "/api/",
          "/auth/",
          "/login",
          "/locked",
          "/crm",
          "/site",
          "/loyalty",
          "/loyalty-agent",
          "/manager",
          "/reputation",
          "/carte/",
          "/feedback/",
        ],
      },
    ],
    sitemap: `${host}/sitemap.xml`,
  };
}
