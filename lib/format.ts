const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatARS(amount: number): string {
  return ars.format(Math.round(amount));
}

/** Ancho en cm con coma, como en la guía de Brenda (15 mm → "1,5"). Internamente las medidas se guardan en mm. */
export function formatCm(mm: number): string {
  return (mm / 10).toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

/** "1,5" o "1.5" (cm) → 15 (mm). Devuelve 0 si no es un número. */
export function parseCmToMm(text: string): number {
  const n = Number(text.trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 10 : 0;
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
