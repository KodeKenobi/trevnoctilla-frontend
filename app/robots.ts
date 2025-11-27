import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/favicon.ico",
        "/manifest.json",
        "/api/",
        "/admin/",
        "/_next/",
        "/icons/",
      ],
    },
    sitemap: "https://www.trevnoctilla.com/sitemap.xml",
  };
}
