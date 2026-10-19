export const siteConfig = {
  name: "BF Nails Studio",
  shortName: "BF Nails",
  description:
    "Uñas press-on personalizadas, con kit de colocación. Remedios de Escalada, Lanús, Banfield, Lomas y envíos a todo el país.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5491128253431",
  instagram: "https://instagram.com/bf.nailstudio_",
  instagramHandle: "@bf.nailstudio_",
  tiktok: "https://www.tiktok.com/@bfnails_studio",
  tiktokHandle: "@bfnails_studio",
  /** Zonas de moto y retiro (sur del conurbano). */
  zones: ["Remedios de Escalada", "Lanús", "Banfield", "Lomas de Zamora"],
  transfer: {
    alias: process.env.NEXT_PUBLIC_TRANSFER_ALIAS ?? "brenda.f00",
    holder: process.env.NEXT_PUBLIC_TRANSFER_HOLDER ?? "Brenda",
  },
  /** Servicio presencial: aparece en una sección chica de la home y manda a WhatsApp o Instagram. */
  studio: {
    area: "Remedios de Escalada",
    note: "a 4 cuadras de la estación",
    services: ["soft gel", "kapping", "esmaltado semipermanente"],
  },
};

/**
 * Dijes apagados hasta tener las fotos reales (y sus precios): sin sección, sin menú y sin paso en el armador.
 * El código queda; para volver a mostrarlos alcanza con poner esto en true.
 */
export const CHARMS_ENABLED = false;

export const nav = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/disena", label: "Diseñá tu set" },
  ...(CHARMS_ENABLED ? [{ href: "/dijes", label: "Dijes" }] : []),
  { href: "/medidas", label: "Medidas" },
  { href: "/faq", label: "Preguntas" },
];
