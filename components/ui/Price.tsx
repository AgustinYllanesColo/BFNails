import { cn, formatARSParts } from "@/lib/format";

/**
 * Precio tipográfico (PLAN W1-F2.7): Figtree 700 con cifras tabulares y el signo chico y elevado, como en una
 * etiqueta. `textContent` es exactamente `"$22.000"` (lo leen los tests y los lectores de pantalla).
 * Tamaños: xl `text-price` (34 → 44) · lg 24 · md 17 · sm 15.
 */
type Size = "xl" | "lg" | "md" | "sm";

const sizes: Record<Size, string> = {
  xl: "text-price",
  lg: "text-[24px] leading-none",
  md: "text-[17px] leading-tight",
  sm: "text-[15px] leading-tight",
};

export function Price({
  value,
  size = "md",
  className,
}: {
  value: number;
  size?: Size;
  className?: string;
}) {
  const { sign, number } = formatARSParts(value);
  return (
    <span
      data-price
      className={cn("tabular font-sans font-bold whitespace-nowrap", sizes[size], className)}
    >
      <span className="mr-[0.08em] align-[0.42em] text-[0.6em] font-semibold">{sign}</span>
      {number}
    </span>
  );
}
