"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { BuilderSelection, SizeSelection } from "@/lib/types";
import { DEFAULT_SELECTION, quoteSelection, type BuilderConfig } from "@/lib/pricing";
import { formatARS } from "@/lib/format";
import type { Charm } from "@/lib/data/content";
import { CharmThumb } from "@/components/charms/CharmThumb";
import { useCart } from "@/lib/store/cart";
import { flyToCart } from "@/components/motion/flyToCart";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Field, inputClass, textareaClass } from "@/components/ui/Field";
import { SizePicker, sizesAreValid } from "@/components/cart/SizePicker";
import { NailPreview } from "./NailPreview";
import { cn } from "@/lib/format";

const STEPS = ["Forma", "Largo", "Acabado", "Color base", "Técnicas", "Dijes", "Detalles", "Medidas"] as const;

export function Builder({ config }: { config: BuilderConfig }) {
  const [sel, setSel] = useState<BuilderSelection>(DEFAULT_SELECTION);
  const [sizes, setSizes] = useState<SizeSelection>({ mode: "standard", size: "S" });
  const [added, setAdded] = useState(false);
  const add = useCart((s) => s.add);
  const addBtn = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const quote = useMemo(() => quoteSelection(sel, config), [sel, config]);
  const valid = sizesAreValid(sizes);

  const toggleExtra = (id: string) =>
    setSel((s) => ({ ...s, extras: s.extras.includes(id) ? s.extras.filter((e) => e !== id) : [...s.extras, id] }));

  const setCharm = (id: string, qty: number) =>
    setSel((s) => {
      const rest = (s.charms ?? []).filter((c) => c.id !== id);
      return { ...s, charms: qty > 0 ? [...rest, { id, qty }] : rest };
    });

  const groups = useMemo(() => {
    const m = new Map<string, BuilderConfig["extras"]>();
    config.extras.forEach((e) => m.set(e.group, [...(m.get(e.group) ?? []), e]));
    return [...m.entries()];
  }, [config]);

  const addToCart = (fly = true) => {
    if (fly) flyToCart(addBtn.current);
    add({
      kind: "custom",
      name: `Set a medida · ${config.shapes.find((s) => s.id === sel.shape)?.label} ${config.lengths.find((l) => l.id === sel.length)?.label?.toLowerCase()}`,
      selection: sel,
      quote,
      unitPrice: quote.total,
      qty: 1,
      sizes,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-12">
      <div className="space-y-10">
        <div className="lg:hidden">
          <NailPreview sel={sel} config={config} />
        </div>

        <Step n={1} title={STEPS[0]} hint="Todas quedan bien, es gusto.">
          {config.shapes.map((o) => (
            <Chip key={o.id} selected={sel.shape === o.id} onClick={() => setSel({ ...sel, shape: o.id })} hint={o.delta ? `+${formatARS(o.delta)}` : undefined}>
              {o.label}
            </Chip>
          ))}
        </Step>

        <Step n={2} title={STEPS[1]} hint="Corto y medio son los más cómodos para el día a día.">
          {config.lengths.map((o) => (
            <Chip key={o.id} selected={sel.length === o.id} onClick={() => setSel({ ...sel, length: o.id })} hint={o.delta ? `+${formatARS(o.delta)}` : undefined}>
              {o.label}
            </Chip>
          ))}
        </Step>

        <Step n={3} title={STEPS[2]}>
          {config.finishes.map((o) => (
            <Chip key={o.id} selected={sel.finish === o.id} onClick={() => setSel({ ...sel, finish: o.id })} hint={o.delta ? `+${formatARS(o.delta)}` : undefined}>
              {o.label}
            </Chip>
          ))}
        </Step>

        <Step n={4} title={STEPS[3]} hint="Si querés otro color, anotalo en detalles.">
          {config.bases.map((o) => (
            <Chip key={o.id} selected={sel.base === o.id} onClick={() => setSel({ ...sel, base: o.id })} swatch={o.hex}>
              {o.label}
            </Chip>
          ))}
        </Step>

        <div>
          <StepHeader n={5} title={STEPS[4]} hint="Sumá las que quieras." />
          <div className="space-y-5">
            {groups.map(([group, extras]) => (
              <div key={group}>
                <p className="mb-2 text-xs font-bold tracking-wider text-bordo uppercase">{group}</p>
                <div className="flex flex-wrap gap-2">
                  {extras.map((e) => (
                    <Chip key={e.id} selected={sel.extras.includes(e.id)} onClick={() => toggleExtra(e.id)} hint={`+${formatARS(e.delta)}`}>
                      {e.label}
                    </Chip>
                  ))}
                </div>
                <AnimatePresence initial={false}>
                  {group === "Clásicos" && sel.extras.includes("francesita-color") && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                      <div className="mt-3 rounded-lg bg-white/70 p-3 ring-1 ring-bordo/10">
                        <p className="mb-2 text-xs font-semibold text-ink-soft">Color de la punta</p>
                        <div className="flex flex-wrap gap-2">
                          {config.bases.map((b) => (
                            <Chip key={b.id} selected={(sel.tipColor ?? "bordo") === b.id} onClick={() => setSel({ ...sel, tipColor: b.id })} swatch={b.hex}>
                              {b.label}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div id="paso-6" className="scroll-mt-28">
          <StepHeader n={6} title={STEPS[5]} hint="Opcional. Elegí cuántos de cada uno." />
          <CharmPicker charms={config.charms ?? []} picked={sel.charms ?? []} onChange={setCharm} />
        </div>

        <div>
          <StepHeader n={7} title={STEPS[6]} hint="Opcional. Si pedís algo que no está en la lista, te lo cotizo antes de que pagues." />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Referencia (link de Pinterest, IG, TikTok)" htmlFor="ref">
              <input id="ref" type="url" className={inputClass} placeholder="https://" value={sel.referenceUrl ?? ""} onChange={(e) => setSel({ ...sel, referenceUrl: e.target.value })} />
            </Field>
            <Field label="Notas para tu set" htmlFor="notes" hint={sel.notes ? "Con notas, el precio final se confirma por WhatsApp." : undefined}>
              <textarea id="notes" className={textareaClass} placeholder="Ej: la del anular con una K dorada, el resto liso" value={sel.notes ?? ""} onChange={(e) => setSel({ ...sel, notes: e.target.value })} />
            </Field>
          </div>
        </div>

        <div>
          <StepHeader n={8} title={STEPS[7]} hint="Universal, personalizada o te la paso por WhatsApp." />
          <SizePicker value={sizes} onChange={setSizes} />
        </div>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="hidden lg:block">
          <NailPreview sel={sel} config={config} />
        </div>
        <div className="mt-4 rounded-lg bg-white/80 p-5 ring-1 ring-bordo/10">
          <p className="text-xs font-bold tracking-wider text-ink-soft uppercase">Tu set</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <AnimatePresence initial={false}>
              {quote.lines.map((l) => (
                <motion.li
                  key={l.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.25 }}
                  className="flex justify-between gap-3"
                >
                  <span className="text-ink-soft">{l.label}</span>
                  <span className="font-semibold">{formatARS(l.amount)}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-bordo/10 pt-4">
            <span className="font-semibold">{quote.needsConfirmation ? "Desde" : "Total"}</span>
            <motion.span key={quote.total} initial={{ scale: 1.15, color: "#b51c1c" }} animate={{ scale: 1, color: "#4a0e0e" }} className="font-display text-3xl text-bordo">
              {formatARS(quote.total)}
            </motion.span>
          </div>
          {quote.needsConfirmation && (
            <p className="mt-2 text-xs text-ink-soft">Tus notas pueden cambiar el precio. Te lo confirmo por WhatsApp antes de cobrar.</p>
          )}
          <div className="mt-5 grid gap-2">
            <Button ref={addBtn} onClick={() => addToCart()} size="lg" disabled={!valid}>
              <motion.span key={String(added)} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                {added ? "¡Sumado al carrito! ✦" : "Agregar al carrito"}
              </motion.span>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              disabled={!valid}
              onClick={() => {
                addToCart(false);
                router.push("/checkout");
              }}
            >
              Pedir ahora
            </Button>
          </div>
          {!valid && <p className="mt-2 text-xs text-red">Completá las 10 medidas (entre 0,5 y 2,5 cm).</p>}
        </div>
      </aside>
    </div>
  );
}

function StepHeader({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <span className="font-display text-2xl text-bordo">0{n}</span>
      <div>
        <h2 className="font-display text-2xl">{title}</h2>
        {hint && <p className="text-xs text-ink-soft">{hint}</p>}
      </div>
    </div>
  );
}

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <StepHeader n={n} title={title} hint={hint} />
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/** Dijes con contador: tocar la foto suma uno; el menos resta. */
function CharmPicker({
  charms,
  picked,
  onChange,
}: {
  charms: Charm[];
  picked: Array<{ id: string; qty: number }>;
  onChange: (id: string, qty: number) => void;
}) {
  if (charms.length === 0) return <p className="text-sm text-ink-soft">Ahora no tengo dijes cargados.</p>;
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {charms.map((c) => {
        const qty = picked.find((p) => p.id === c.id)?.qty ?? 0;
        return (
          <li key={c.id} className={cn("rounded-lg bg-white/80 p-2 ring-1 transition-shadow", qty > 0 ? "ring-2 ring-bordo" : "ring-bordo/10")}>
            <button type="button" onClick={() => onChange(c.id, Math.min(20, qty + 1))} aria-label={`Sumar ${c.name}`} className="block w-full">
              <CharmThumb charm={c} />
            </button>
            <p className="mt-2 px-1 text-[13px] leading-tight font-semibold">{c.name}</p>
            <p className="mt-0.5 px-1 text-[13px] text-ink-soft">+{formatARS(c.price)}</p>
            {qty > 0 && (
              <div className="mt-1.5 flex items-center justify-between gap-1 px-1">
                <button type="button" onClick={() => onChange(c.id, qty - 1)} aria-label={`Sacar un ${c.name}`} className="grid size-7 place-items-center rounded-full bg-cream-deep font-bold text-bordo">
                  −
                </button>
                <span className="w-4 text-center text-sm font-bold tabular-nums" aria-live="polite">
                  {qty}
                </span>
                <button type="button" onClick={() => onChange(c.id, Math.min(20, qty + 1))} aria-label={`Sumar ${c.name}`} className="grid size-7 place-items-center rounded-full bg-bordo font-bold text-cream">
                  +
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
