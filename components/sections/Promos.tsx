import Image from "next/image";
import Link from "next/link";
import type { Promo, PromoTheme } from "@/lib/data/content";
import { cn, formatARS } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";

const THEMES: Record<PromoTheme, { card: string; badge: string; text: string; muted: string }> = {
  rojo: { card: "bg-red", badge: "bg-yellow text-ink", text: "text-cream", muted: "text-cream/85" },
  bordo: { card: "bg-bordo", badge: "bg-cream text-bordo", text: "text-cream", muted: "text-cream/80" },
  rosa: { card: "bg-[#f2a7c3]", badge: "bg-bordo text-cream", text: "text-bordo", muted: "text-bordo/80" },
  leopardo: { card: "leopard-bg", badge: "bg-red text-cream", text: "text-ink", muted: "text-ink" },
};

const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

function untilLabel(until?: string): string | null {
  if (!until) return null;
  const d = new Date(`${until}T12:00:00-03:00`);
  if (Number.isNaN(d.getTime())) return null;
  return `Hasta el ${DAYS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

/**
 * Promos de la semana: tarjetas grandes de color, estilo app de delivery. En el celular se deslizan de costado; desde
 * md van en grilla. Cada tarjeta lleva a su destino (un diseño, el armador) o a WhatsApp si no tiene link.
 */
export function Promos({ promos, title = "Promos de la semana" }: { promos: Promo[]; title?: string }) {
  if (promos.length === 0) return null;
  return (
    <section id="promos" aria-labelledby="promos-t" className="py-12 md:py-16">
      <div className="container-x">
        <h2 id="promos-t" className="font-display mb-5 text-3xl md:text-4xl">
          <span className="text-bordo">✦</span> {title}
        </h2>
      </div>
      <ul className="flex snap-x snap-mandatory gap-4 scroll-px-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] md:container-x md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3">
        {promos.map((p) => (
          <li key={p.id} className="w-[84%] max-w-[380px] shrink-0 snap-start md:w-auto md:max-w-none">
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
        "group relative flex min-h-[200px] overflow-hidden rounded-2xl shadow-md transition-transform duration-200 hover:-translate-y-1",
        t.card,
      )}
    >
      {p.theme === "leopardo" && <span aria-hidden className="absolute inset-0 bg-cream/55" />}
      <div className="relative z-[1] flex flex-1 flex-col p-5 pr-2">
        <span className={cn("font-display w-fit -rotate-3 rounded-md px-3 py-1 text-[34px] leading-none shadow-sm md:text-[40px]", t.badge)}>
          {p.badge}
        </span>
        <p className={cn("mt-4 text-[19px] leading-tight font-bold", t.text)}>{p.title}</p>
        {p.text && <p className={cn("mt-1 text-[14px] leading-snug", t.muted)}>{p.text}</p>}
        <div className="mt-auto flex flex-wrap items-end gap-x-3 gap-y-1 pt-4">
          {p.price ? (
            <span className={cn("flex items-baseline gap-2", t.text)}>
              <span className="text-2xl font-bold">{formatARS(p.price)}</span>
              {p.priceBefore ? <span className="text-[14px] line-through opacity-70">{formatARS(p.priceBefore)}</span> : null}
            </span>
          ) : (
            <span className={cn("text-[14px] font-semibold", t.text)}>La quiero →</span>
          )}
        </div>
        {until && (
          <span className="absolute top-4 right-4 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-bold text-cream">{until}</span>
        )}
      </div>
      {p.image && (
        <div className="relative w-[40%] shrink-0">
          <Image src={p.image} alt="" fill sizes="200px" className="object-cover" />
        </div>
      )}
    </Link>
  );
}
