"use client";

import type { BuilderSelection } from "@/lib/types";
import type { BuilderConfig } from "@/lib/pricing";
import { NailPreview2D } from "./NailPreview2D";

/**
 * Vista previa del set: la ilustración de la mano (NailPreview2D), siempre.
 *
 * La mano 3D procedural (NailPreview3D + components/three/hand) queda en el código pero no se carga:
 * la ilustración es la que mejor se ve y no trae three.js (~600 KB) ni trabajo de GPU a la página.
 */
export function NailPreview({ sel, config }: { sel: BuilderSelection; config: BuilderConfig }) {
  const label = describe(sel, config);
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-cream-deep ring-1 ring-bordo/10">
      <div role="img" aria-label={label} className="absolute inset-0 bg-[radial-gradient(120%_90%_at_38%_22%,#fbf0d9_0%,#f5e8c8_55%,#efdcb6_100%)]">
        <NailPreview2D sel={sel} config={config} />
      </div>
      <p className="pointer-events-none absolute bottom-2 left-2 max-w-[calc(100%-1rem)] rounded-pill bg-cream/90 px-2.5 py-0.5 text-[10px] font-semibold text-ink sm:text-[11px]">
        Vista previa ilustrativa, el set real lo pinta Bren a mano
      </p>
    </div>
  );
}

function describe(sel: BuilderSelection, config: BuilderConfig) {
  const name = <T extends { id: string; label: string }>(list: T[], id?: string) => list.find((o) => o.id === id)?.label;
  const parts = [name(config.shapes, sel.shape), name(config.lengths, sel.length), name(config.bases, sel.base), name(config.finishes, sel.finish)].filter(Boolean);
  const extras = sel.extras.map((e) => name(config.extras, e)).filter(Boolean);
  return `Vista previa de tu set: ${parts.join(", ").toLowerCase()}${extras.length ? `, con ${extras.join(", ").toLowerCase()}` : ""}`;
}
