"use client";

import type { BuilderSelection, Quote, SizeSelection } from "@/lib/types";
import type { BuilderConfig } from "@/lib/pricing";
import { formatARS } from "@/lib/format";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Receipt, type ReceiptLine } from "@/components/ui/Receipt";

type Props = {
  open: boolean;
  onClose: () => void;
  /** "Diseñar otro": vuelve el armador a cero. */
  onReset: () => void;
  sel: BuilderSelection;
  sizes: SizeSelection;
  quote: Quote;
  config: BuilderConfig;
  /** Hora de impresión ("14:32"), fijada al agregar. */
  printedAt: string;
};

function sizeLabel(sizes: SizeSelection): string {
  if (sizes.mode === "standard") return `Talle ${sizes.size}`;
  if (sizes.mode === "custom") return "A medida";
  return "Por WhatsApp";
}

/**
 * Las filas de la receta: primero el diseño (cómo es el set y su talle), después el precio línea por línea (las mismas
 * líneas del panel "Tu set": base, recargos, técnicas y nivel) y el total. Las líneas suman el total.
 */
export function recipeLines(
  sel: BuilderSelection,
  sizes: SizeSelection,
  quote: Quote,
  config: BuilderConfig,
): ReceiptLine[] {
  const name = <T extends { id: string; label: string }>(list: T[], id?: string) =>
    list.find((o) => o.id === id)?.label ?? "Sin elegir";
  const lines: ReceiptLine[] = [
    { kind: "row", id: "forma", label: "Forma", value: name(config.shapes, sel.shape) },
    { kind: "row", id: "largo", label: "Largo", value: name(config.lengths, sel.length) },
    { kind: "row", id: "acabado", label: "Acabado", value: name(config.finishes, sel.finish) },
    { kind: "row", id: "color", label: "Color", value: name(config.bases, sel.base) },
  ];
  if (sel.extras.includes("francesita-color")) {
    lines.push({ kind: "row", id: "punta", label: "Punta", value: name(config.bases, sel.tipColor ?? "bordo") });
  }
  lines.push({ kind: "row", id: "talle", label: "Talle", value: sizeLabel(sizes) });
  if (sel.notes?.trim()) lines.push({ kind: "row", id: "notas", label: "Notas", value: "para Bren", tone: "muted" });
  lines.push({ kind: "rule", id: "r-precio" });
  for (const l of quote.lines) {
    lines.push({
      kind: "row",
      id: `p-${l.id}`,
      label: l.id === "base" ? "Set base (10 uñas)" : l.label,
      value: formatARS(l.amount),
      tone: l.id === "base" ? "normal" : "muted",
    });
  }
  lines.push({ kind: "rule", id: "r-total" });
  lines.push({
    kind: "row",
    id: "total",
    label: quote.needsConfirmation ? "Desde" : "Total",
    value: formatARS(quote.total),
    tone: "bold",
  });
  return lines;
}

/**
 * Cierre del armador (PLAN W2-D.6): después del vuelo a la bolsita y del barrido de laca, se imprime la "receta" del
 * set en el ticket térmico (`Receipt`), con "Ver carrito" y "Diseñar otro". Sin ráfaga de estrellas (es del sello del
 * pedido). Con reduced-motion la hoja solo funde y el papel aparece sin deslizarse.
 */
export function BuildCelebration({ open, onClose, onReset, sel, sizes, quote, config, printedAt }: Props) {
  const footer: ReceiptLine[] = [
    { kind: "text", id: "hecho", text: "* hecho a mano por bren · 3 a 7 días *", align: "center" },
  ];
  if (quote.needsConfirmation) {
    footer.unshift({
      kind: "text",
      id: "confirma",
      text: "Tus notas pueden cambiar el precio: Bren te lo confirma por WhatsApp.",
      align: "center",
    });
  }
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Tu set ya está en el carrito"
      description="Esta es la receta que le llega a Bren."
      footer={
        <div className="grid grid-cols-2 gap-2 pb-1">
          <Button href="/carrito" variant="primary" size="md" className="px-4" data-cursor="carrito">
            Ver carrito
          </Button>
          <Button variant="secondary" size="md" className="px-4" onClick={onReset}>
            Diseñar otro
          </Button>
        </div>
      }
    >
      <Receipt
        title="BF STUDIO · TU DISEÑO"
        meta={printedAt}
        lines={recipeLines(sel, sizes, quote, config)}
        footer={footer}
        printingLabel="imprimiendo tu receta…"
        idleLabel="lista"
        className="mx-auto max-w-sm pt-1"
      />
    </BottomSheet>
  );
}
