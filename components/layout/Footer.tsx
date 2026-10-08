"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav, siteConfig } from "@/lib/site";
import { Marquee } from "@/components/motion/Marquee";
import { waLink } from "@/lib/whatsapp";

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return (
    <footer className="relative overflow-hidden bg-bordo text-cream">
      <Marquee
        items={["press-on", "soft gel", "semipermanente", "a tu talle", "Lanús", "envíos a todo el país"]}
        className="border-b border-cream/15 py-4 font-display text-2xl md:text-3xl"
        speed={34}
      />
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Image src="/brand/logo-nails.webp" alt="BF Nails Studio" width={320} height={193} sizes="256px" className="w-64 brightness-0 invert" />
          <p className="mt-6 max-w-sm text-cream/80">{siteConfig.description}</p>
        </div>
        <div>
          <p className="mb-4 text-xs font-bold tracking-[0.2em] uppercase opacity-70">Navegá</p>
          <ul className="space-y-2 text-lg">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="hover:underline underline-offset-4">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/carrito" className="hover:underline underline-offset-4">
                Carrito
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-xs font-bold tracking-[0.2em] uppercase opacity-70">Hablemos</p>
          <ul className="space-y-2 text-lg">
            <li>
              <a href={waLink("Hola Bren! Te escribo desde la web 🐱")} target="_blank" rel="noreferrer" className="hover:underline underline-offset-4">
                WhatsApp
              </a>
            </li>
            <li>
              <a href={siteConfig.instagram} target="_blank" rel="noreferrer" className="hover:underline underline-offset-4">
                Instagram
              </a>
            </li>
            <li>
              <a href={siteConfig.tiktok} target="_blank" rel="noreferrer" className="hover:underline underline-offset-4">
                TikTok
              </a>
            </li>
            <li>
              <a href={siteConfig.facebook} target="_blank" rel="noreferrer" className="hover:underline underline-offset-4">
                Facebook
              </a>
            </li>
          </ul>
          <p className="mt-6 text-sm text-cream/70">
            Entregas en {siteConfig.zones.join(", ")}. Envíos por Correo Argentino.
          </p>
        </div>
      </div>
      <div className="container-x flex flex-col items-start justify-between gap-2 border-t border-cream/15 py-6 text-xs text-cream/60 md:flex-row md:items-center">
        <span>© {new Date().getFullYear()} BF Nails Studio · Lanús, Buenos Aires</span>
        <span>Hecho con mucho soft gel ✨</span>
      </div>
    </footer>
  );
}
