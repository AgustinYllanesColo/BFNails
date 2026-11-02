import type { MakeupProduct } from "@/lib/data/makeup";
import { siteConfig } from "@/lib/site";

/** URL absoluta: las rutas de /public se resuelven contra la URL del sitio; las externas quedan como están. */
function absolute(url: string) {
  return new URL(url, siteConfig.url).toString();
}

/**
 * JSON-LD del catálogo de maquillaje: un ItemList con un Product (y su Offer en ARS) por producto visible.
 * La imagen va solo si hay foto real: el dibujo provisorio no es una foto del producto.
 * Sin `stock` no hay control de stock, así que se publica como disponible.
 */
export function MakeupJsonLd({ products }: { products: MakeupProduct[] }) {
  const pageUrl = absolute("/maquillaje");
  const seller = { "@type": "Organization", name: siteConfig.name, url: absolute("/") };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Catálogo de maquillaje",
    url: pageUrl,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => {
      const url = `${pageUrl}#${encodeURIComponent(p.id)}`;
      return {
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          "@id": url,
          name: p.brand ? `${p.name} ${p.brand}` : p.name,
          ...(p.description ? { description: p.description } : {}),
          ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
          ...(p.image ? { image: absolute(p.image) } : {}),
          url,
          offers: {
            "@type": "Offer",
            url,
            price: p.price,
            priceCurrency: "ARS",
            availability: p.stock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            seller,
          },
        },
      };
    }),
  };

  return (
    <script
      type="application/ld+json"
      // Escapa "<" para que un texto cargado desde el admin no pueda cerrar el <script> (recomendación de Next).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}
