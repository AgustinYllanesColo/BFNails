import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/format";
import { WordReveal } from "@/components/motion/WordReveal";

/**
 * Sección y titular (PLAN W1-F2.6).
 * - `tone`: cream (lienzo) · deep (banda suave) · bordo (campo de marca: `data-surface="inverse"`, texto crema, foco y
 *   acentos amarillos) · white (superficie elevada `cream-50`).
 * - `spacing`: ritmo vertical de los tokens `--section-y` (64 → 128), `-tight` (40 → 72), `-peak` (96 → 160) o nada.
 */
type Tone = "cream" | "deep" | "bordo" | "white";
type Spacing = "default" | "tight" | "peak" | "none";

const tones: Record<Tone, string> = {
  cream: "bg-cream",
  deep: "bg-cream-deep",
  bordo: "bg-bordo text-on-bordo",
  white: "bg-surface",
};

const spacings: Record<Spacing, string> = {
  default: "py-[var(--section-y)]",
  tight: "py-[var(--section-y-tight)]",
  peak: "py-[var(--section-y-peak)]",
  none: "",
};

type SectionProps = Omit<HTMLAttributes<HTMLElement>, "className" | "children"> & {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: Tone;
  spacing?: Spacing;
  as?: "section" | "div" | "aside" | "header" | "footer";
};

export function Section({
  children,
  className,
  tone = "cream",
  spacing = "default",
  as: Tag = "section",
  ...rest
}: SectionProps) {
  return (
    <Tag
      {...rest}
      data-surface={tone === "bordo" ? "inverse" : undefined}
      className={cn("relative", tones[tone], spacings[spacing], className)}
    >
      {children}
    </Tag>
  );
}

/**
 * @deprecated Los kickers sobre titulares no van más (PLAN §1): cada paquete borra sus usos y W3 lo elimina.
 */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("mb-3 text-xs font-bold tracking-[0.2em] uppercase opacity-90", className)}>
      {children}
    </p>
  );
}

type HeadingSize = "display" | "h1" | "h2" | "h3";

const headingSizes: Record<HeadingSize, string> = {
  display: "text-display",
  h1: "text-h1",
  h2: "text-h2",
  h3: "text-h3",
};

/**
 * Titular en la display (Imbue, ≤ 7 palabras, una palabra acento con `Brush`). El tamaño sigue a la etiqueta
 * (`h1` → `text-h1`, el resto → `text-h2`) salvo que se pida otro con `size`. `reveal` lo envuelve en `WordReveal`
 * (palabras que suben desde su máscara al entrar por scroll; solo Destacados, Teaser y Outro).
 */
export function Heading({
  children,
  className,
  as: Tag = "h2",
  size,
  id,
  reveal = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
  size?: HeadingSize;
  id?: string;
  reveal?: boolean;
}) {
  const cls = cn(
    "font-display text-balance",
    headingSizes[size ?? (Tag === "h1" ? "h1" : "h2")],
    className,
  );
  if (reveal) {
    return (
      <WordReveal as={Tag} id={id} className={cls}>
        {children}
      </WordReveal>
    );
  }
  return (
    <Tag id={id} className={cls}>
      {children}
    </Tag>
  );
}
