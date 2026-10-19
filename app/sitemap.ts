import { CHARMS_ENABLED } from "@/lib/site";
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { getDesigns } from "@/lib/data/repo";

// Se regenera como máximo cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const designs = await getDesigns();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/catalogo`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/disena`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/medidas`, changeFrequency: "monthly", priority: 0.6 },
    ...(CHARMS_ENABLED ? [{ url: `${base}/dijes`, changeFrequency: "weekly" as const, priority: 0.6 }] : []),
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.5 },
    ...designs.map((d) => ({ url: `${base}/catalogo/${d.slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
