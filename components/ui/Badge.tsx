import type { ReactNode } from "react";
import { cn } from "@/lib/format";
import { Icon, type IconName } from "@/components/ui/icons";

/**
 * Etiqueta corta de 24 px de alto (PLAN W1-F2.3). Nunca parte en dos líneas.
 * - `casing="upper"` (default): MAYÚSCULAS de 12 px con aire (`text-label`): estados, "Favorito", "Signature".
 * - `casing="normal"`: minúsculas en `text-meta` (13 px, sin el tracking ancho de las mayúsculas, regla §0 h): tags
 *   como "animal print" o "personajes". El uso viejo `className="normal-case"` se toma como `casing="normal"`.
 * - cream: `bg-cream-deep`, prohibida sobre fondos `bg-cream-deep` (desaparece).
 * - onImage: sobre fotos, sólida al 90 % sin blur.
 * - sticker: amarillo nariz con troquel crema; la inclinación (-4°) la pone un wrapper, nunca este nodo.
 */
export type BadgeTone =
  "bordo" | "cream" | "yellow" | "ink" | "red" | "green" | "onImage" | "sticker";

const tones: Record<BadgeTone, string> = {
  bordo: "bg-bordo text-cream",
  cream: "bg-cream-deep text-bordo",
  yellow: "bg-yellow text-ink",
  ink: "bg-ink text-cream",
  red: "bg-red text-cream",
  green: "bg-success text-cream",
  onImage: "bg-cream/90 text-bordo ring-1 ring-bordo/10",
  sticker: "h-7 border-[3px] border-cream bg-yellow px-3 text-ink shadow-sticker",
};

const LEGACY_NORMAL_CASE = /(?:^|\s)normal-case(?:\s|$)/;

export function Badge({
  children,
  className,
  tone = "bordo",
  casing,
  icon,
}: {
  children: ReactNode;
  className?: string;
  tone?: BadgeTone;
  /** `upper` (default) o `normal` para tags en minúscula. */
  casing?: "upper" | "normal";
  /** Ícono de 12 px antes del texto. */
  icon?: IconName;
}) {
  const lower = casing === "normal" || (!casing && LEGACY_NORMAL_CASE.test(className ?? ""));
  return (
    <span
      className={cn(
        "rounded-pill inline-flex h-6 items-center gap-1 px-2.5 whitespace-nowrap",
        lower ? "text-meta normal-case" : "text-label uppercase",
        tones[tone],
        className,
      )}
    >
      {icon ? <Icon name={icon} size={12} className="-ml-0.5" /> : null}
      {children}
    </span>
  );
}
