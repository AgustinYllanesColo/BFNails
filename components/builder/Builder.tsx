"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { BuilderSelection, SizeSelection } from "@/lib/types";
import { DEFAULT_SELECTION, defaultDetailColor, extraPrice, extraUnitHint, quoteSelection, type BuilderConfig } from "@/lib/pricing";
import { presetFor } from "@/lib/data/presets";
import { decodeSelection } from "@/lib/share";
import { formatARS } from "@/lib/format";
import type { Charm } from "@/lib/data/content";
import { CharmThumb } from "@/components/charms/CharmThumb";
import { useCharmFilter } from "@/components/charms/CharmFilter";
import { describeNails, qtyForNails, type CharmPick } from "@/lib/charms";
import { NAIL_COUNT, QUICK_PICKS, allNails, describeNailList, editNails, handOf, nailSpec, withNailDesigns } from "@/lib/nails";
import { NailMap } from "./NailMap";
import { useCart } from "@/lib/store/cart";
import { flyToCart } from "@/components/motion/flyToCart";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Field, inputClass, textareaClass } from "@/components/ui/Field";
import { SizePicker, sizesAreValid } from "@/components/cart/SizePicker";
import { NailPreview } from "./NailPreview";
import { cn } from "@/lib/format";
import { CHARMS_ENABLED } from "@/lib/site";

const STEPS = ["Forma", "Largo", "Acabado", "Color base", "Técnicas", "Uña por uña", "Dijes", "Medidas", "Detalles"] as const;
/** Dónde va una técnica: las dos manos o una (la uña suelta se elige en la mano). */
const HAND_PICKS = QUICK_PICKS.filter((q) => ["Las 10", "Mano derecha", "Mano izquierda"].includes(q.label)).map((q) => ({ ...q, label: q.label === "Las 10" ? "Las dos manos" : q.label }));
const ALL_NAILS = Array.from({ length: NAIL_COUNT }, (_, i) => i);
/** Técnicas que se pintan en el color que elijas. */
const COLORED = new Set(["puntitos", "cebra", "ondas", "estrellas", "tribal"]);
/** Con los dijes apagados, Medidas y Detalles suben un número. */
const SHIFT = CHARMS_ENABLED ? 0 : 1;

export type PresetDesign = { slug: string; name: string; image: string };

export function Builder({ config, presets = [] }: { config: BuilderConfig; presets?: PresetDesign[] }) {
  const [sel, setSel] = useState<BuilderSelection>(DEFAULT_SELECTION);
  const [from, setFrom] = useState<string | null>(null);

  // /disena?desde=slug: arranca desde ese diseño del catálogo; /disena?s=…: un set compartido (el link del pedido).
  // Se lee en el cliente: la página sigue siendo estática.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const shared = decodeSelection(q.get("s"));
    if (shared) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- viene de la URL, que no se conoce en el servidor
      setSel(withNailDesigns(shared));
      setFrom(shared.from ?? shared.art ?? null);
      return;
    }
    const slug = q.get("desde");
    const p = presetFor(slug);
    if (!p) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la receta sale de la URL, que no se conoce en el render del servidor
    setSel(withNailDesigns(p));
    setFrom(slug);
  }, []);

  const startFrom = (slug: string) => {
    const p = presetFor(slug);
    if (!p) return;
    setSel((s) => ({ ...withNailDesigns(p), notes: s.notes, referenceUrl: s.referenceUrl }));
    setFocus([]);
    setFrom(slug);
  };
  const [sizes, setSizes] = useState<SizeSelection>({ mode: "standard", size: "S" });
  const [added, setAdded] = useState(false);
  const add = useCart((s) => s.add);
  const addBtn = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const quote = useMemo(() => quoteSelection(sel, config), [sel, config]);
  const valid = sizesAreValid(sizes);

  /** Uñas que llevan la técnica `id` (de las 10). */
  const nailsWith = (id: string) => ALL_NAILS.filter((i) => nailSpec(sel, i).extras.includes(id));
  /**
   * Pone la técnica `id` exactamente en `nails` (como se ubican los dijes): en las 10 es del set; en menos, va
   * uña por uña y el resto queda sin ella. Con ninguna, se saca.
   */
  const setExtraNails = (id: string, nails: number[]) =>
    setSel((s) => {
      const base = withNailDesigns(s);
      const extras = nails.length === NAIL_COUNT ? [...new Set([...base.extras, id])] : base.extras.filter((e) => e !== id);
      let next: BuilderSelection = { ...base, art: undefined, extras };
      next = editNails(next, ALL_NAILS.filter((i) => nails.includes(i)), (cur) => ({ color: cur.color, extras: [...new Set([...cur.extras, id])] }));
      next = editNails(next, ALL_NAILS.filter((i) => !nails.includes(i)), (cur) => ({ color: cur.color, extras: cur.extras.filter((e) => e !== id) }));
      return next;
    });

  /** Uñas marcadas en "Uña por uña" (lo que se edita) y mano que muestra la vista previa. */
  const [focus, setFocus] = useState<number[]>([]);
  const [hand, setHand] = useState<0 | 1>(0);
  const toggleFocus = (i: number) => {
    setFocus((f) => (f.includes(i) ? f.filter((x) => x !== i) : [...f, i]));
    setHand(handOf(i) as 0 | 1);
  };
  const focusSpecs = focus.map((i) => nailSpec(sel, i));
  const focusColor = focusSpecs.length && focusSpecs.every((sp) => sp.color === focusSpecs[0].color) ? focusSpecs[0].color : "";
  const toggleFocusExtra = (id: string) => {
    const all = focusSpecs.every((sp) => sp.extras.includes(id));
    setSel((s) => editNails({ ...s, art: undefined }, focus, (cur) => ({ color: cur.color, extras: all ? cur.extras.filter((e) => e !== id) : [...new Set([...cur.extras, id])] })));
  };

  /**
   * Reemplaza un dije elegido sin moverlo de lugar en la lista. Se saca con qty 0 y sin uñas (la ×, o tocarlo de
   * nuevo en la grilla); uno ubicable sin uñas todavía queda en la lista para que le elijan dónde va.
   */
  const putCharm = (pick: CharmPick) =>
    setSel((s) => {
      const list = s.charms ?? [];
      const i = list.findIndex((c) => c.id === pick.id);
      if (pick.qty <= 0 && !pick.nails) return { ...s, charms: list.filter((c) => c.id !== pick.id) };
      return { ...s, charms: i < 0 ? [...list, pick] : list.map((c, k) => (k === i ? pick : c)) };
    });
  /** Dije nuevo: no se ubica solo. Va en las uñas que estén marcadas en "Uña por uña", o en ninguna hasta que elijas. */
  const addCharm = (c: Charm) => {
    if (!c.piece) return putCharm({ id: c.id, qty: 1 });
    const nails = [...focus];
    putCharm({ id: c.id, qty: qtyForNails(nails), nails });
  };

  const allExtras = [...new Set(allNails(sel).flatMap((sp) => sp.extras))];
  const hasColored = allExtras.some((e) => COLORED.has(e));

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
      <div className="min-w-0 space-y-10">
        {/* En el celu la mano queda fija arriba mientras elegís: si no, al bajar a los colores ya no se veía el cambio */}
        <div className="sticky top-[72px] z-20 bg-cream pt-2 pb-3 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-5 after:bg-linear-to-b after:from-cream after:to-transparent md:top-[88px] lg:hidden">
          <div className="mx-auto max-w-[min(100%,calc(36svh*4/3))]">
            <NailPreview sel={sel} config={config} hand={hand} onHand={setHand} />
          </div>
        </div>

        {presets.length > 0 && (
          <div>
            <p className="mb-1 font-title text-xl">Partí de un diseño de Brenda</p>
            <p className="mb-3 text-sm text-ink-soft">Tocá uno y cambiale lo que quieras: forma, colores, acentos.</p>
            <div className="-mx-[var(--gutter,16px)] flex snap-x gap-3 overflow-x-auto px-[var(--gutter,16px)] pb-2 [scrollbar-width:none] md:mx-0 md:px-0">
              {presets.map((d) => (
                <button
                  key={d.slug}
                  type="button"
                  onClick={() => startFrom(d.slug)}
                  aria-pressed={from === d.slug}
                  className={cn(
                    "group w-24 shrink-0 snap-start text-left transition-[scale] duration-150 ease-[var(--ease-out-expo)] active:scale-[0.96]",
                  )}
                >
                  <span
                    className={cn(
                      "block aspect-[4/5] overflow-hidden rounded-md ring-2 transition-[box-shadow] duration-200",
                      from === d.slug ? "ring-bordo" : "ring-transparent group-hover:ring-bordo/30",
                    )}
                  >
                    <Image src={d.image} alt="" width={96} height={120} sizes="96px" className="size-full object-cover" />
                  </span>
                  <span className={cn("mt-1 block truncate text-xs", from === d.slug ? "font-bold text-bordo" : "text-ink-soft")}>{d.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

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
          <StepHeader n={5} title={STEPS[4]} hint="Sumá las que quieras. Los diseños se cobran por uña, las bases por mano y los apliques por set: elegí si va en las dos manos, en una o en una sola uña." />
          <div className="space-y-5">
            {groups.map(([group, extras]) => (
              <div key={group}>
                <p className="mb-2 text-xs font-bold tracking-wider text-bordo uppercase">{group}</p>
                <div className="flex flex-wrap gap-2">
                  {extras.map((e) => (
                    <Chip key={e.id} selected={allExtras.includes(e.id)} onClick={() => setExtraNails(e.id, allExtras.includes(e.id) ? [] : ALL_NAILS)} hint={extraUnitHint(e, formatARS)}>
                      {e.label}
                    </Chip>
                  ))}
                </div>
                <AnimatePresence initial={false}>
                  {extras
                    .filter((e) => allExtras.includes(e.id))
                    .map((e) => {
                      const nails = nailsWith(e.id);
                      const scope = (q: { nails: number[] }) => nails.length === q.nails.length && q.nails.every((i) => nails.includes(i));
                      const oneNail = nails.length === 1;
                      return (
                        <motion.div key={e.id} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                          <div className="mt-3 space-y-3 rounded-lg bg-white/70 p-3 ring-1 ring-bordo/10">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                              <p className="text-sm">
                                <span className="font-semibold">{e.label}</span> <span className="text-ink-soft">· {describeNailList(nails) ?? "en ninguna"}</span>
                              </p>
                              <p className="text-sm font-bold text-bordo">+{formatARS(extraPrice(e, nails))}</p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {HAND_PICKS.map((q) => (
                                <Chip key={q.label} selected={scope(q)} onClick={() => setExtraNails(e.id, q.nails)} hint={formatARS(extraPrice(e, q.nails))}>
                                  {q.label}
                                </Chip>
                              ))}
                              <Chip selected={oneNail} onClick={() => setExtraNails(e.id, [3])} hint={formatARS(extraPrice(e, [3]))}>
                                Una uña
                              </Chip>
                            </div>
                            <p className="text-xs text-ink-soft">
                              {oneNail ? "Tocá la uña donde va." : e.unit === "uña" ? "O tocá las uñas una por una: se cobra por cada uña." : e.unit === "set" ? "O tocá las uñas una por una: se cobra una vez, vaya donde vaya." : "O tocá las uñas una por una. Por mano se cobra con 2 o más uñas; una sola uña, el precio de una uña."}
                            </p>
                            <NailMap
                              sel={sel}
                              config={config}
                              selected={nails}
                              onToggle={(i) => {
                                setExtraNails(e.id, nails.includes(i) ? nails.filter((x) => x !== i) : [...nails, i]);
                                setHand(handOf(i) as 0 | 1);
                              }}
                              marked={() => false}
                              label={`Uñas con ${e.label}`}
                              size="sm"
                            />
                            {e.id === "francesita" && (
                              <ColorRow label="Color de la punta" bases={config.bases} value={sel.tipColor ?? "blanco"} onChange={(id) => setSel({ ...sel, tipColor: id })} />
                            )}
                            {e.id === "degrade" && (
                              <ColorRow label="El degradé va hacia" bases={config.bases} value={sel.degradeColor ?? "blanco"} onChange={(id) => setSel({ ...sel, degradeColor: id })} />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {hasColored && (
          <div className="-mt-4 space-y-4 rounded-lg bg-white/70 p-4 ring-1 ring-bordo/10">
            <ColorRow
              label="Color del diseño (puntitos, cebra, ondas, estrellitas, tribal)"
              bases={config.bases}
              value={sel.detailColor ?? defaultDetailColor(sel.base)}
              onChange={(id) => setSel({ ...sel, detailColor: id })}
            />
          </div>
        )}

        <div id="acentos" className="scroll-mt-[22.5rem] lg:scroll-mt-28">
          <StepHeader n={6} title={STEPS[5]} hint="Tocá una o varias uñas y cambiales el color o el diseño. Las que no toques quedan como el set." />
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_PICKS.map((q) => (
              <Chip
                key={q.label}
                selected={focus.length === q.nails.length && q.nails.every((i) => focus.includes(i))}
                onClick={() => {
                  setFocus(q.nails);
                  setHand(handOf(q.nails[0]) as 0 | 1);
                }}
              >
                {q.label}
              </Chip>
            ))}
          </div>
          <NailMap sel={sel} config={config} selected={focus} onToggle={toggleFocus} label="Uñas del set" />
          <AnimatePresence initial={false}>
            {focus.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                <div className="mt-4 space-y-4 rounded-lg bg-white/70 p-4 ring-1 ring-bordo/10">
                  <p className="text-sm font-semibold">
                    Cambiando: <span className="text-bordo">{describeNailList(focus)}</span>
                  </p>
                  <ColorRow
                    label="Color de estas uñas"
                    bases={config.bases}
                    value={focusColor}
                    onChange={(id) => setSel((s) => editNails({ ...s, art: undefined }, focus, (cur) => ({ color: id, extras: cur.extras })))}
                  />
                  <div>
                    <p className="mb-2 text-xs font-semibold text-ink-soft">Qué llevan estas uñas</p>
                    <div className="flex flex-wrap gap-2">
                      {config.extras.map((e) => {
                        const all = focusSpecs.every((sp) => sp.extras.includes(e.id));
                        const some = !all && focusSpecs.some((sp) => sp.extras.includes(e.id));
                        return (
                          <Chip key={e.id} selected={all} onClick={() => toggleFocusExtra(e.id)} hint={some ? "en algunas" : undefined}>
                            {e.label}
                          </Chip>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSel((s) => editNails({ ...s, art: undefined }, focus, () => ({ color: s.base, extras: s.extras })))}
                    >
                      Igual que el resto del set
                    </Button>
                    <Button size="sm" onClick={() => setFocus([])}>
                      Listo
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {CHARMS_ENABLED && (
          <div id="paso-6" className="scroll-mt-[22.5rem] lg:scroll-mt-28">
            <StepHeader n={7} title={STEPS[6]} hint="Opcional. Tocá un dije y elegí en qué uñas va, de cualquier mano." />
            <CharmPicker
              charms={config.charms ?? []}
              picked={sel.charms ?? []}
              onAdd={addCharm}
              onChange={putCharm}
              renderNails={(pick, charm) => (
                <NailMap
                  sel={sel}
                  config={config}
                  size="sm"
                  label={`Uñas con ${charm.name}`}
                  selected={pick.nails ?? []}
                  marked={() => false}
                  onToggle={(i) => {
                    const cur = pick.nails ?? [];
                    const nails = cur.includes(i) ? cur.filter((n) => n !== i) : [...cur, i];
                    putCharm({ ...pick, nails, qty: qtyForNails(nails) });
                    setHand(handOf(i) as 0 | 1);
                  }}
                />
              )}
            />
          </div>
        )}

        <div>
          <StepHeader n={8 - SHIFT} title={STEPS[7]} hint="Universal, personalizada o te la paso por WhatsApp." />
          <SizePicker value={sizes} onChange={setSizes} />
        </div>
        <div>
          <StepHeader n={9 - SHIFT} title={STEPS[8]} hint="Opcional. Si pedís algo que no está en la lista, te lo cotizo antes de que pagues." />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Referencia (link de Pinterest, IG, TikTok)" htmlFor="ref">
              <input id="ref" type="url" className={inputClass} placeholder="https://" value={sel.referenceUrl ?? ""} onChange={(e) => setSel({ ...sel, referenceUrl: e.target.value })} />
            </Field>
            <Field label="Notas para tu set" htmlFor="notes" hint={sel.notes ? "Con notas, el precio final se confirma por WhatsApp." : undefined}>
              <textarea id="notes" className={textareaClass} placeholder="Ej: la del anular con una K dorada, el resto liso" value={sel.notes ?? ""} onChange={(e) => setSel({ ...sel, notes: e.target.value })} />
            </Field>
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="hidden lg:block">
          <NailPreview sel={sel} config={config} hand={hand} onHand={setHand} />
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
            {/* initial={false}: al cargar la página el precio ya está; solo late cuando cambia */}
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span key={quote.total} initial={{ scale: 1.15, color: "#b51c1c" }} animate={{ scale: 1, color: "#4a0e0e" }} className="font-title text-3xl text-bordo">
                {formatARS(quote.total)}
              </motion.span>
            </AnimatePresence>
          </div>
          {quote.needsConfirmation && (
            <p className="mt-2 text-xs text-ink-soft">Tus notas pueden cambiar el precio. Te lo confirmo por WhatsApp antes de cobrar.</p>
          )}
          <div className="mt-5 grid gap-2">
            <Button ref={addBtn} onClick={() => addToCart()} size="lg" disabled={!valid}>
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span key={String(added)} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                  {added ? "¡Sumado al carrito! ✦" : "Agregar al carrito"}
                </motion.span>
              </AnimatePresence>
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
      <span className="font-title text-2xl text-bordo">0{n}</span>
      <div>
        <h2 className="font-title text-2xl">{title}</h2>
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
  onAdd,
  onChange,
  renderNails,
}: {
  charms: Charm[];
  picked: CharmPick[];
  onAdd: (c: Charm) => void;
  onChange: (pick: CharmPick) => void;
  renderNails: (pick: CharmPick, charm: Charm) => React.ReactNode;
}) {
  const { chips, visible } = useCharmFilter(charms);
  if (charms.length === 0) return <p className="text-sm text-ink-soft">Ahora no tengo dijes cargados.</p>;
  const chosen = picked
    .map((p) => ({ pick: p, charm: charms.find((c) => c.id === p.id) }))
    .filter((x): x is { pick: CharmPick; charm: Charm } => Boolean(x.charm));
  return (
    <>
      {chosen.length > 0 && (
        <div className="mb-6 space-y-2 rounded-lg bg-white/80 p-3 ring-1 ring-bordo/15">
          <p className="text-sm font-semibold">Tus dijes</p>
          {chosen.map(({ pick, charm }) => (
            <div key={charm.id} className="flex items-start gap-3 border-t border-bordo/10 pt-2 first:border-t-0 first:pt-0">
              <CharmThumb charm={charm} className="w-14 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{charm.name}</p>
                  <p className="shrink-0 text-sm tabular-nums text-ink-soft">{formatARS(charm.price * pick.qty)}</p>
                </div>
                {charm.piece ? (
                  <>
                    <div className="mt-2">{renderNails(pick, charm)}</div>
                    <p className="mt-1 text-xs text-ink-soft">
                      {pick.qty > 0 ? `${pick.qty} en total: ${describeNails(pick.nails)}` : "Tocá las uñas donde va"}
                    </p>
                  </>
                ) : (
                  <div className="mt-1.5 flex items-center gap-2">
                    <button type="button" onClick={() => onChange({ ...pick, qty: pick.qty - 1 })} aria-label={`Sacar un ${charm.name}`} className="grid size-7 place-items-center rounded-full bg-cream-deep font-bold text-bordo">
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-bold tabular-nums" aria-live="polite">
                      {pick.qty}
                    </span>
                    <button type="button" onClick={() => onChange({ ...pick, qty: Math.min(20, pick.qty + 1) })} aria-label={`Sumar ${charm.name}`} className="grid size-7 place-items-center rounded-full bg-bordo font-bold text-cream">
                      +
                    </button>
                    <span className="text-xs text-ink-soft">Brenda los ubica en el diseño</span>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => onChange({ ...pick, qty: 0 })} aria-label={`Quitar ${charm.name}`} className="grid size-7 shrink-0 place-items-center rounded-full text-lg text-ink-soft hover:bg-cream-deep hover:text-bordo">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {chips}
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {visible.map((c) => {
          const on = picked.some((p) => p.id === c.id);
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => (on ? onChange({ id: c.id, qty: 0 }) : onAdd(c))}
                aria-pressed={on}
                aria-label={on ? `Quitar ${c.name}` : `Sumar ${c.name}`}
                className={cn("relative block h-full w-full rounded-lg bg-white/80 p-2 text-left ring-1 transition-shadow", on ? "ring-2 ring-bordo" : "ring-bordo/10 hover:ring-bordo/30")}
              >
                <CharmThumb charm={c} />
                <span className="mt-2 block px-1 text-[13px] leading-tight font-semibold">{c.name}</span>
                <span className="mt-0.5 block px-1 text-[13px] text-ink-soft">+{formatARS(c.price)} c/u</span>
                {on && (
                  <span aria-hidden className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-bordo text-xs font-bold text-cream">
                    ✓
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Fila de colores con su título (color del diseño, del degradé, de los acentos). */
function ColorRow({
  label,
  bases,
  value,
  onChange,
}: {
  label: string;
  bases: BuilderConfig["bases"];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-ink-soft">{label}</p>
      <div className="flex flex-wrap gap-2">
        {bases.map((b) => (
          <Chip key={b.id} selected={value === b.id} onClick={() => onChange(b.id)} swatch={b.hex}>
            {b.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
