import Link from "next/link";
import { cn } from "@/lib/format";
import { Icon } from "@/components/ui/icons";
import { LogoStar } from "@/components/brand/LogoStar";

/**
 * Los tres pasos de la compra (PLAN W2-E.2): Bolsita · Datos y pago · Pedido. Reemplaza al kicker de arriba del
 * titular y a los números de las secciones: la secuencia la da esta fila. El paso actual va en bordó con la estrella
 * del logo, los cumplidos con un tilde (y, si se puede volver, como link), los que faltan en tinta suave. Las uniones
 * son el punteado del ticket.
 */
const STEPS = [
  { label: "Bolsita", href: "/carrito" },
  { label: "Datos y pago", href: "/checkout" },
  { label: "Pedido", href: null },
] as const;

export function CheckoutSteps({
  current,
  linkBack = false,
  className,
}: {
  /** 0 = Bolsita, 1 = Datos y pago, 2 = Pedido. */
  current: 0 | 1 | 2;
  /** Los pasos cumplidos son links (en el checkout se puede volver a la bolsita; en el pedido ya no). */
  linkBack?: boolean;
  className?: string;
}) {
  return (
    <nav aria-label="Pasos de la compra" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-none font-semibold">
        {STEPS.map((step, i) => {
          const done = i < current;
          const now = i === current;
          const inner = (
            <>
              {done ? (
                <span className="bg-bordo text-cream grid size-4 place-items-center rounded-full">
                  <Icon name="check" size={12} className="[&_g]:[stroke-width:2.5]" />
                </span>
              ) : now ? (
                <LogoStar size={12} tilt />
              ) : (
                <span aria-hidden className="border-ink-faint/60 size-2.5 rounded-full border border-dashed" />
              )}
              <span>{step.label}</span>
              {done ? <span className="sr-only">(listo)</span> : null}
            </>
          );
          return (
            <li key={step.label} className="flex items-center gap-2">
              {i > 0 ? (
                <span
                  aria-hidden
                  className={cn(
                    "h-px w-5 sm:w-8",
                    "bg-[repeating-linear-gradient(90deg,currentColor_0_3px,transparent_3px_6px)]",
                    i <= current ? "text-bordo/50" : "text-ink-faint/40",
                  )}
                />
              ) : null}
              {done && linkBack && step.href ? (
                <Link
                  href={step.href}
                  className="text-ink-soft hover:text-bordo -mx-1.5 -my-4 inline-flex items-center gap-1.5 rounded-pill px-1.5 py-4 transition-colors duration-150"
                >
                  {inner}
                </Link>
              ) : (
                <span
                  aria-current={now ? "step" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5",
                    now ? "text-bordo" : done ? "text-ink-soft" : "text-ink-faint",
                  )}
                >
                  {inner}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
