import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, priority: 1 },
    { url: `${base}/mapa`, lastModified: now, priority: 0.9 },
    { url: `${base}/reportar`, lastModified: now, priority: 0.8 },
    { url: `${base}/ranking`, lastModified: now, priority: 0.7 },
  ];
}
