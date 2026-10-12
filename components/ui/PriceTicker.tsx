"use client";

import { useEffect, useRef } from "react";
import { cn, formatARS, formatARSParts } from "@/lib/format";
import { EASE, MQ } from "@/lib/motion";

/**
 * Precio que rueda como un odómetro (PLAN W1-F2.8): cada cifra es una tira 0–9 que se traslada
 * `translateY(-d · 10 %)` en 240 ms `--ease-ui`, con un leve escalonado de derecha a izquierda.
 * - Un `0` invisible en cada celda da el ancho exacto (cifras tabulares): el precio no tiembla.
 * - Las keys cuentan desde la derecha: al pasar de 9.800 a 10.200 solo entra la cifra nueva a la izquierda.
 * - Se monta una vez y **nunca** lleva `key={value}`.
 * - `delta`: al cambiar, muestra "+$ 2.000" (o "−$ 2.000") que sube 14 px y se desvanece en 600 ms.
 * - `announce`: el valor se anuncia (`aria-live="polite"`); si no, solo se lee.
 * Reduced-motion: las cifras cambian sin rodar y la diferencia solo se desvanece.
 */
type Size = "xl" | "lg" | "md" | "sm";

const sizes: Record<Size, string> = {
  xl: "text-price",
  lg: "text-[24px]",
  md: "text-[17px]",
  sm: "text-[15px]",
};

type Props = {
  value: number;
  size?: Size;
  className?: string;
  delta?: boolean;
  announce?: boolean;
};

export function PriceTicker({
  value,
  size = "lg",
  className,
  delta = false,
  announce = false,
}: Props) {
  const { sign, number } = formatARSParts(value);
  const chars = [...number];
  const deltaHost = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);

  useEffect(() => {
    const diff = value - prev.current;
    prev.current = value;
    const host = deltaHost.current;
    if (!delta || diff === 0 || !host) return;
    const parts = formatARSParts(Math.abs(diff));
    const tag = document.createElement("span");
    tag.textContent = `${diff > 0 ? "+" : "−"}${parts.sign} ${parts.number}`;
    tag.className =
      "pointer-events-none absolute bottom-full left-0 mb-1 text-[13px] leading-none font-semibold whitespace-nowrap";
    host.appendChild(tag);
    const reduced = window.matchMedia(MQ.reduced).matches;
    const anim = tag.animate(
      reduced
        ? [{ opacity: 1 }, { opacity: 0 }]
        : [
            { opacity: 0, transform: "translateY(4px)" },
            { opacity: 1, offset: 0.18 },
            { opacity: 0, transform: "translateY(-14px)" },
          ],
      { duration: 600, easing: `cubic-bezier(${EASE.ui.join(",")})`, fill: "forwards" },
    );
    anim.onfinish = () => tag.remove();
    return () => {
      anim.cancel();
      tag.remove();
    };
  }, [value, delta]);

  return (
    <span
      data-price-ticker
      className={cn(
        "tabular relative inline-flex items-baseline font-sans font-bold whitespace-nowrap",
        sizes[size],
        className,
      )}
    >
      <span className="sr-only" aria-live={announce ? "polite" : undefined}>
        {formatARS(value)}
      </span>
      <span aria-hidden className="inline-flex h-[1em] leading-none">
        <span className="mr-[0.08em] inline-block h-[1em] translate-y-[0.06em] text-[0.6em] leading-none font-semibold">
          {sign}
        </span>
        {chars.map((ch, i) => {
          const fromRight = chars.length - i;
          if (!/\d/.test(ch)) {
            return (
              <span key={`s${fromRight}`} className="inline-block h-[1em]">
                {ch}
              </span>
            );
          }
          const d = Number(ch);
          return (
            <span key={`d${fromRight}`} className="relative inline-block h-[1em] overflow-hidden">
              <span className="invisible">0</span>
              <span
                className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-[240ms] ease-[var(--ease-ui)] motion-reduce:transition-none"
                style={{
                  transform: `translateY(-${d * 10}%)`,
                  transitionDelay: `${Math.min(fromRight - 1, 6) * 16}ms`,
                }}
              >
                {DIGITS.map((n) => (
                  <span key={n} className="block h-[1em] text-center">
                    {n}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
      <span ref={deltaHost} aria-hidden className="absolute inset-0 opacity-80" />
    </span>
  );
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
