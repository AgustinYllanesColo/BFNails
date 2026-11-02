import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

/** Imagen para compartir mientras no haya una propia de cada página (la misma que usa el layout). */
export const DEFAULT_OG_IMAGE = { url: "/brand/logo-nails.webp", width: 960, height: 580, alt: siteConfig.name };

/**
 * Metadata de una página con canonical, Open Graph y Twitter. Next fusiona la metadata de forma superficial: si una
 * página define `openGraph`, reemplaza entero el del layout, así que acá se repiten locale, siteName e imagen.
 * `path` es relativo (p. ej. "/maquillaje"); `metadataBase` del layout lo vuelve absoluto.
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  const fullTitle = `${title} · ${siteConfig.name}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "es_AR",
      siteName: siteConfig.name,
      url: path,
      title: fullTitle,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}
