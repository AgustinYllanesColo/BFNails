/**
 * Carga rápida desde las listas del admin: precio, precio antes, stock y disponible de muchas filas a la vez, con un solo
 * "Guardar cambios". Campos del formulario: `row` (un id por fila), `price:<id>`, `before:<id>`, `stock:<id>`, `active:<id>`.
 */
export type QuickEdit = { price?: number; priceBefore?: number; stock?: number; active: boolean };

const MAX = 10_000_000;
function nat(v: FormDataEntryValue | null): number | undefined {
  if (typeof v !== "string" || !v.trim()) return undefined;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= MAX ? n : undefined;
}

export function parseQuickEdits(formData: FormData): Map<string, QuickEdit> {
  const out = new Map<string, QuickEdit>();
  for (const raw of formData.getAll("row")) {
    const id = String(raw);
    if (!id || out.has(id)) continue;
    out.set(id, {
      price: nat(formData.get(`price:${id}`)),
      priceBefore: nat(formData.get(`before:${id}`)),
      stock: nat(formData.get(`stock:${id}`)),
      active: formData.get(`active:${id}`) === "on",
    });
  }
  return out;
}

type Row = { id: string; price: number; priceBefore?: number; stock?: number; active: boolean };

/**
 * Aplica la carga rápida: solo a las filas enviadas. Precio inválido o vacío = queda el anterior. Precio antes vacío =
 * sin oferta (y si no supera al precio, tampoco). Con `stock`, el stock vacío = sin control.
 */
export function applyQuickEdits<T extends Row>(list: T[], edits: Map<string, QuickEdit>, opts: { stock?: boolean }): T[] {
  return list.map((m) => {
    const e = edits.get(m.id);
    if (!e) return m;
    const price = e.price ?? m.price;
    const next = { ...m, price, priceBefore: e.priceBefore != null && e.priceBefore > price ? e.priceBefore : undefined, active: e.active };
    if (opts.stock) next.stock = e.stock;
    return next;
  });
}
