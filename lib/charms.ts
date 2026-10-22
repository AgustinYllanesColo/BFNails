import type { BuilderSelection } from "./types";
import { accentMode, isAccentNail } from "./pricing";

/** Dedos de una mano, en el orden de la vista previa (0 pulgar … 4 meñique). */
export const FINGERS = ["Pulgar", "Índice", "Mayor", "Anular", "Meñique"] as const;

export type CharmPick = NonNullable<BuilderSelection["charms"]>[number];

/** Un dije ubicado va en esas uñas de las dos manos: 2 por uña elegida. */
export function qtyForNails(nails: number[]): number {
  return nails.length * 2;
}

/** Dónde arranca un dije nuevo: en las uñas acento si hay, si no en el anular (donde lo pone Brenda). */
export function defaultCharmNails(sel: Pick<BuilderSelection, "accent">): number[] {
  const mode = accentMode(sel);
  const acc = FINGERS.map((_, i) => i).filter((i) => isAccentNail(mode, i));
  return acc.length ? acc : [3];
}

/** "anular y mayor de las dos manos" para el resumen y el mensaje de WhatsApp. */
export function describeNails(nails: number[] | undefined): string | null {
  if (!nails?.length) return null;
  const names = [...nails].sort((a, b) => a - b).map((i) => FINGERS[i].toLowerCase());
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
  return `${list} de las dos manos`;
}
