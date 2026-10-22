import type { BuilderSelection } from "./types";
import { describeNailList } from "./nails";

export type CharmPick = NonNullable<BuilderSelection["charms"]>[number];

/** Un dije ubicado va uno por uña elegida (las uñas son las 10 del set, de las dos manos). */
export function qtyForNails(nails: number[]): number {
  return nails.length;
}

/** "anular de las dos manos y índice derecha" para el resumen y el mensaje de WhatsApp. */
export const describeNails = describeNailList;
