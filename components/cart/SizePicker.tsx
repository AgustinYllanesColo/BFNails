"use client";

import Link from "next/link";
import type { SizeSelection, StandardSize } from "@/lib/types";
import { FINGERS, SIZE_ORDER, STANDARD_SIZES } from "@/lib/data/sizes";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/format";
import { CmInput } from "@/components/ui/CmInput";

type Props = { value: SizeSelection; onChange: (v: SizeSelection) => void; compact?: boolean };

const HANDS = ["Der.", "Izq."] as const;

export function SizePicker({ value, onChange, compact }: Props) {
  const mode = value.mode;
  const mm = value.mode === "custom" ? value.mm : Array(10).fill(0);

  const setMm = (i: number, v: number) => {
    const next = [...mm];
    next[i] = v;
    onChange({ mode: "custom", mm: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Chip selected={mode === "standard"} onClick={() => onChange({ mode: "standard", size: "S" })}>
          Universal (S · M · L)
        </Chip>
        <Chip selected={mode === "custom"} onClick={() => onChange({ mode: "custom", mm: Array(10).fill(0) })}>
          Personalizada
        </Chip>
        <Chip selected={mode === "kit"} onClick={() => onChange({ mode: "kit" })}>
          Te la paso por WhatsApp
        </Chip>
      </div>

      {mode === "standard" && (
        <div>
          <div className="grid grid-cols-3 gap-2">
            {SIZE_ORDER.map((s: StandardSize) => {
              const selected = value.mode === "standard" && value.size === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange({ mode: "standard", size: s })}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-md border p-3 text-center transition-all duration-300 ease-[var(--ease-out-expo)]",
                    selected ? "border-bordo bg-bordo text-cream" : "border-cream-ink bg-white/60 hover:border-bordo/50",
                  )}
                >
                  <span className="font-display text-2xl">{s}</span>
                  <span className={cn("block text-[11px]", selected ? "text-cream/80" : "text-ink-soft")}>
                    {STANDARD_SIZES[s].hint}
                  </span>
                </button>
              );
            })}
          </div>
          {!compact && (
            <p className="mt-2 text-xs text-ink-soft">
              ¿No sabés cuál sos?{" "}
              <Link href="/medidas#universal" className="font-semibold text-bordo underline underline-offset-4">
                Mirá la tabla
              </Link>
              .
            </p>
          )}
        </div>
      )}

      {mode === "custom" && (
        <div>
          <p className="mb-3 text-xs text-ink-soft">
            Ancho de cada uña en cm (por ejemplo 1,2).{" "}
            <Link href="/medidas#personalizada" className="font-semibold text-bordo underline underline-offset-4">
              Cómo medir
            </Link>
          </p>
          <div className="grid grid-cols-2 gap-4">
            {HANDS.map((hand, h) => (
              <div key={hand} className="space-y-2">
                <p className="text-xs font-bold tracking-wider text-bordo uppercase">Mano {hand}</p>
                {FINGERS.map((finger, f) => {
                  const i = h * 5 + f;
                  return (
                    <label key={finger} className="flex items-center gap-2 text-sm">
                      <span className="w-16 text-ink-soft">{finger}</span>
                      <CmInput
                        mm={mm[i] || 0}
                        onChange={(v) => setMm(i, v)}
                        placeholder="1,2"
                        className="h-10 px-3 text-center"
                        aria-label={`${finger} mano ${hand === "Der." ? "derecha" : "izquierda"} en centímetros`}
                      />
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "kit" && (
        <p className="rounded-md bg-cream-deep p-4 text-sm text-ink-soft">
          Después de confirmar el pedido te paso la guía por WhatsApp y lo vemos juntas.
        </p>
      )}
    </div>
  );
}

export function sizesAreValid(sizes: SizeSelection): boolean {
  if (sizes.mode === "custom") return sizes.mm.length === 10 && sizes.mm.every((v) => v >= 5 && v <= 25);
  return true;
}
