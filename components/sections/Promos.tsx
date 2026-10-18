import Image from "next/image";
import Link from "next/link";
import type { Promo, PromoTheme } from "@/lib/data/content";
import { cn, formatARS } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { Heading } from "@/components/ui/Section";

/**
 * Colores de cada tarjeta, siempre lisos para que el texto se lea. "leopardo" quedó como negro y dorado (los tonos
 * del estampado, sin el estampado: de fondo o de marco se veía recargado).
 */
const THEMES: Record<PromoTheme, { card: string; badge: string; text: string; muted: string; cta: string }> = {
  rojo: { card: "bg-red", badge: "bg-yellow text-ink", text: "text-cream", muted: "text-cream/85", cta: "bg-cream text-red" },
  bordo: { card: "bg-bordo", badge: "bg-cream text-bordo", text: "text-cream", muted: "text-cream/80", cta: "bg-cream text-bordo" },
  rosa: { card: "bg-[#f6c3d6]", badge: "bg-bordo text-cream", text: "text-bordo", muted: "text-bordo/80", cta: "bg-bordo text-cream" },
  leopardo: { card: "bg-[#2a2321]", badge: "bg-[#c9a063] text-ink", text: "text-cream", muted: "text-cream/75", cta: "bg-[#c9a063] text-ink" },
};

const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

function untilLabel(until?: string): string | null {
  if (!until) return null;
  const d = new Date(`${until}T12:00:00-03:00`);
  if (Number.isNaN(d.getTime())) return null;
  return `Hasta el ${DAYS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

/**
 * Promos de la semana: tarjetas grandes de color con foto, estilo app de delivery. En el celular se deslizan de
 * costado; desde md van en grilla. Cada tarjeta lleva a su destino (un diseño, el armador) o a WhatsApp si no tiene link.
 */
export function Promos({ promos, title = "Promos de la semana" }: { promos: Promo[]; title?: string }) {
  if (promos.length === 0) return null;
  return (
    <section id="promos" aria-labelledby="promos-t" className="py-12 md:py-16">
      <div className="container-x mb-6">
        <Heading>
          <span id="promos-t">{title}</span>
        </Heading>
      </div>
      <ul className="flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] md:container-x md:grid md:grid-cols-2 md:gap-5 md:overflow-visible lg:grid-cols-3">
        {promos.map((p) => (
          <li key={p.id} className="w-[86%] max-w-[400px] shrink-0 snap-start md:w-auto md:max-w-none">
            <PromoCard promo={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PromoCard({ promo: p }: { promo: Promo }) {
  const t = THEMES[p.theme] ?? THEMES.rojo;
  const until = untilLabel(p.until);
  const external = !p.href;
  const href = p.href || waLink(`Hola Bren! Quiero la promo "${p.title}" 🐱`);
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "group block h-full rounded-[20px] shadow-[0_18px_40px_-24px_rgba(74,14,14,0.55)] transition-transform duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1",
      )}
    >
      <span className={cn("relative flex h-full min-h-[208px] overflow-hidden rounded-[20px]", t.card)}>
        <span className="relative z-[1] flex min-w-0 flex-1 flex-col p-5">
          <span className={cn("font-display w-fit -rotate-2 rounded-lg px-3 py-1.5 text-[32px] leading-none md:text-[36px]", t.badge)}>
            {p.badge}
          </span>
          <span className={cn("mt-4 text-[18px] leading-snug font-bold text-balance", t.text)}>{p.title}</span>
          {p.text && <span className={cn("mt-1 text-[14px] leading-snug", t.muted)}>{p.text}</span>}
          <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-4">
            {p.price ? (
              <span className={cn("flex items-baseline gap-2", t.text)}>
                <span className="text-xl font-bold tabular-nums">{formatARS(p.price)}</span>
                {p.priceBefore ? <span className="text-[13px] tabular-nums line-through opacity-70">{formatARS(p.priceBefore)}</span> : null}
              </span>
            ) : null}
            <span className={cn("rounded-pill px-3 py-1.5 text-[13px] font-bold transition-transform duration-200 group-hover:translate-x-0.5", t.cta)}>
              La quiero →
            </span>
          </span>
        </span>
        {p.image && (
          <span className="relative w-[38%] shrink-0">
            <Image src={p.image} alt="" fill sizes="(min-width: 768px) 180px, 140px" className="object-cover" />
          </span>
        )}
        {until && (
          <span className="absolute top-3 right-3 z-[2] rounded-pill bg-ink/85 px-2.5 py-1 text-[11px] font-bold text-cream">{until}</span>
        )}
      </span>
    </Link>
  );
}
