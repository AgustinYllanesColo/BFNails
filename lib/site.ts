export const siteConfig = {
  name: "BF Nails Studio",
  shortName: "BF Nails",
  description:
    "Uñas press-on soft gel semipermanentes, diseñadas a pedido y a tu talle. Kit con 10 uñas, pegamento y lima. Lanús, Banfield, Remedios de Escalada y envíos a todo el país.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5491100000000",
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/",
  facebook: "https://facebook.com/",
  zones: ["Lanús", "Banfield", "Remedios de Escalada"],
  transfer: {
    alias: process.env.NEXT_PUBLIC_TRANSFER_ALIAS ?? "bfnails.studio",
    holder: process.env.NEXT_PUBLIC_TRANSFER_HOLDER ?? "Brenda",
  },
};

export const nav = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/disena", label: "Diseñá tu set" },
  { href: "/talles", label: "Talles" },
  { href: "/faq", label: "Preguntas" },
] as const;
