import type { Metadata, Viewport } from "next";
import { Figtree, Imbue, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Providers } from "@/components/motion/Providers";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { siteConfig } from "@/lib/site";

/* Display: Imbue con eje de tamaño óptico. Sin `weight` (con "700" fijo se pierde el opsz); el peso lo pone la
   utilidad font-display con var(--display-weight). Es el único punto de cambio de la display (PLAN §1, F0). */
const display = Imbue({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-imbue",
  display: "swap",
});

const sans = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

/* Solo dentro del ticket (carrito, checkout, pedido): que no se precargue en la home. */
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} · Press-on nails soft gel a tu talle`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [{ url: "/brand/logo-nails.webp", width: 960, height: 582, alt: siteConfig.name }],
  },
  icons: { icon: "/brand/kitty-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#fef7e7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es-AR"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="bg-cream text-ink flex min-h-full flex-col">
        <a
          href="#contenido"
          className="focus:rounded-pill focus:bg-bordo focus:text-cream sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:shadow-lg"
        >
          Saltar al contenido
        </a>
        <Providers>
          <SmoothScroll>
            <Nav />
            <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
              {children}
            </main>
            <Footer />
          </SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}
