import type { AccentMode, BuilderSelection, NailDesign } from "./types";

/**
 * Las 10 uñas del set: 0–4 mano derecha y 5–9 mano izquierda, cada mano de pulgar a meñique. Cada uña lleva lo
 * del set (color base y técnicas) salvo que la clienta la cambie: `nailDesigns[i]` tiene su color y su lista de
 * técnicas completa (reemplaza a la del set en esa uña).
 */
export const NAIL_COUNT = 10;
export const HANDS = ["Derecha", "Izquierda"] as const;
export const FINGERS = ["Pulgar", "Índice", "Mayor", "Anular", "Meñique"] as const;
export const FINGER_SHORT = ["P", "Í", "M", "A", "Me"] as const;

export type NailSpec = { color: string; extras: string[]; custom: boolean };

export const handOf = (i: number) => (i < 5 ? 0 : 1);
export const fingerOf = (i: number) => i % 5;

/** Qué lleva la uña i. Los sets viejos con "uñas acento" (anular, pulgar y meñique…) se leen igual. */
export function nailSpec(sel: BuilderSelection, i: number): NailSpec {
  const own = sel.nailDesigns?.[i];
  if (own) return { color: own.color ?? sel.base, extras: own.extras ?? sel.extras, custom: true };
  const mode = accentMode(sel);
  if (!sel.nailDesigns && mode !== "ninguno" && isAccentNail(mode, fingerOf(i))) {
    return { color: sel.accentColor ?? sel.base, extras: [...new Set([...sel.extras, ...(sel.accentExtras ?? [])])], custom: true };
  }
  return { color: sel.base, extras: sel.extras, custom: false };
}

/** Las 10 uñas. */
export function allNails(sel: BuilderSelection): NailSpec[] {
  return Array.from({ length: NAIL_COUNT }, (_, i) => nailSpec(sel, i));
}

/**
 * Pasa los acentos viejos a uña por uña (para editarlos): el armador solo trabaja con `nailDesigns`. Las recetas y
 * los carritos guardados pueden seguir usando los acentos.
 */
export function withNailDesigns(sel: BuilderSelection): BuilderSelection {
  if (sel.nailDesigns) return sel;
  const designs: Array<NailDesign | null> = Array.from({ length: NAIL_COUNT }, (_, i) => {
    const s = nailSpec(sel, i);
    return s.custom ? { color: s.color, extras: s.extras } : null;
  });
  const rest = { ...sel };
  delete rest.accent;
  delete rest.accentColor;
  delete rest.accentExtras;
  return { ...rest, nailDesigns: designs };
}

/** Cambia las uñas `idx` con `fn` (que recibe lo que llevan hoy). Si una queda igual al set, vuelve a "como el set". */
export function editNails(sel: BuilderSelection, idx: number[], fn: (cur: NailSpec) => NailDesign): BuilderSelection {
  const base = withNailDesigns(sel);
  const designs = [...(base.nailDesigns ?? Array(NAIL_COUNT).fill(null))];
  for (const i of idx) {
    const next = fn(nailSpec(base, i));
    const color = next.color ?? base.base;
    const extras = next.extras ?? base.extras;
    const same = color === base.base && extras.length === base.extras.length && extras.every((e) => base.extras.includes(e));
    designs[i] = same ? null : { color, extras };
  }
  return { ...base, nailDesigns: designs };
}

/** Nombre de una uña: "anular derecha". */
export function nailName(i: number): string {
  return `${FINGERS[fingerOf(i)].toLowerCase()} ${HANDS[handOf(i)].toLowerCase()}`;
}

/**
 * "anular de las dos manos, índice derecha": agrupa por dedo para el resumen y el mensaje de WhatsApp.
 */
export function describeNailList(nails: number[] | undefined): string | null {
  if (!nails?.length) return null;
  const set = new Set(nails);
  if (set.size === 5 && [0, 1, 2, 3, 4].every((i) => set.has(i))) return "mano derecha";
  if (set.size === 5 && [5, 6, 7, 8, 9].every((i) => set.has(i))) return "mano izquierda";
  const parts: string[] = [];
  for (let f = 0; f < 5; f++) {
    const r = set.has(f);
    const l = set.has(f + 5);
    if (!r && !l) continue;
    const name = FINGERS[f].toLowerCase();
    parts.push(r && l ? `${name} de las dos manos` : `${name} ${r ? "derecha" : "izquierda"}`);
  }
  if (parts.length === 5 && parts.every((p) => p.endsWith("de las dos manos"))) return "las 10 uñas";
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`;
}

/** Atajos para elegir varias uñas de una (no deciden nada: solo marcan). */
export const QUICK_PICKS: Array<{ label: string; nails: number[] }> = [
  { label: "Las 10", nails: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { label: "Mano derecha", nails: [0, 1, 2, 3, 4] },
  { label: "Mano izquierda", nails: [5, 6, 7, 8, 9] },
  { label: "Anulares", nails: [3, 8] },
  { label: "Pulgares y meñiques", nails: [0, 4, 5, 9] },
  { label: "Una sí, una no", nails: [1, 3, 6, 8] },
];

/** Modo de acento, con los valores viejos traducidos ("todas" = sin acento, "acento" = anular). */
export function accentMode(sel: Pick<BuilderSelection, "accent">): AccentMode {
  const a = sel.accent;
  if (!a || a === "todas") return "ninguno";
  if (a === "acento") return "anular";
  return a;
}

/** ¿La uña i (0 pulgar … 4 meñique) es acento? */
export function isAccentNail(mode: AccentMode, i: number): boolean {
  switch (mode) {
    case "anular":
      return i === 3;
    case "anular-mayor":
      return i === 2 || i === 3;
    case "pulgar-menique":
      return i === 0 || i === 4;
    case "alternadas":
      return i % 2 === 1;
    default:
      return false;
  }
}

export const ACCENT_OPTIONS: Array<{ id: AccentMode; label: string }> = [
  { id: "ninguno", label: "Sin acentos" },
  { id: "anular", label: "Anular" },
  { id: "anular-mayor", label: "Anular y mayor" },
  { id: "pulgar-menique", label: "Pulgar y meñique" },
  { id: "alternadas", label: "Una sí, una no" },
];
