import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://falsify-app.web.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/", // block any dynamic API paths if present
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
