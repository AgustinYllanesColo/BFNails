import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/format";
import { adminInput } from "./ui";
import { SubmitButton } from "./SubmitButton";
import { IconChevron } from "./icons";

export type QuickRow = {
  id: string;
  name: string;
  /** Línea chica debajo del nombre (marca, categoría, qué trae). */
  sub?: string;
  image?: string;
  href: string;
  price: number;
  priceBefore?: number;
  stock?: number;
  active: boolean;
  /** Etiquetas cortas (destacado, video…). */
  tags?: string[];
};

/**
 * Lista para cambiar rápido precio, precio antes, stock y disponible de muchos productos a la vez, con un solo
 * "Guardar cambios" (fijo abajo en el celular). Tocar el nombre o la flecha abre el producto completo (fotos, textos).
 * Se usa en Uñas, Maquillaje y Dijes, así se maneja igual en todos lados.
 */
export function QuickEditList({
  rows,
  action,
  stock,
  before = true,
  empty = "Todavía no hay ninguno.",
}: {
  rows: QuickRow[];
  action: (fd: FormData) => void | Promise<void>;
  stock?: boolean;
  before?: boolean;
  empty?: string;
}) {
  if (!rows.length) return <p className="py-4 text-sm text-ink-soft">{empty}</p>;
  return (
    <form action={action}>
      <ul className="divide-y divide-bordo/10">
        {rows.map((r) => (
          <li key={r.id} className={cn("grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center", !r.active && "opacity-70")}>
            <input type="hidden" name="row" value={r.id} />
            <Link href={r.href} className="group flex min-w-0 items-center gap-3 rounded-md">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-cream-deep">
                {r.image ? (
                  <Image src={r.image} alt="" fill sizes="56px" className="object-cover" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-[10px] text-ink-soft">sin foto</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold leading-snug text-bordo [overflow-wrap:anywhere] group-hover:underline">{r.name}</span>
                {(r.sub || r.tags?.length) && (
                  <span className="mt-0.5 block text-xs text-ink-soft">
                    {r.sub && <span className="mr-1.5">{r.sub}</span>}
                    {r.tags?.map((t) => (
                      <span key={t} className="mr-1 inline-block rounded-pill bg-cream-deep px-2 py-px font-semibold text-bordo">
                        {t}
                      </span>
                    ))}
                  </span>
                )}
              </span>
              <IconChevron className="size-5 shrink-0 text-ink-soft md:hidden" />
            </Link>
            <div className={cn("grid items-end gap-2", stock ? (before ? "grid-cols-[1fr_1fr_0.8fr_auto]" : "grid-cols-[1fr_0.8fr_auto]") : before ? "grid-cols-[1fr_1fr_auto]" : "grid-cols-[1fr_auto]", "md:w-[min(440px,48vw)]")}>
              <label className="block min-w-0">
                <span className="mb-0.5 block text-xs text-ink-soft">Precio</span>
                <input name={`price:${r.id}`} type="number" inputMode="numeric" min={0} step={1} required defaultValue={r.price} aria-label={`Precio de ${r.name}`} className={adminInput + " px-2"} />
              </label>
              {before && (
                <label className="block min-w-0">
                  <span className="mb-0.5 block text-xs text-ink-soft">Antes</span>
                  <input name={`before:${r.id}`} type="number" inputMode="numeric" min={0} step={1} defaultValue={r.priceBefore} placeholder="—" aria-label={`Precio antes de ${r.name}`} className={adminInput + " px-2"} />
                </label>
              )}
              {stock && (
                <label className="block min-w-0">
                  <span className="mb-0.5 block text-xs text-ink-soft">Stock</span>
                  <input name={`stock:${r.id}`} type="number" inputMode="numeric" min={0} step={1} defaultValue={r.stock} placeholder="—" aria-label={`Stock de ${r.name}`} className={adminInput + " px-2"} />
                </label>
              )}
              <label className="flex min-h-11 flex-col items-center justify-end gap-1 px-1 md:min-h-10">
                <span className="text-xs text-ink-soft">Visible</span>
                <input type="checkbox" name={`active:${r.id}`} defaultChecked={r.active} aria-label={`${r.name} visible en la tienda`} className="mb-2.5 size-5 accent-bordo" />
              </label>
            </div>
          </li>
        ))}
      </ul>
      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-bordo/10 bg-white/95 px-5 py-3 backdrop-blur">
        <p className="text-xs text-ink-soft">
          {stock && "Stock vacío = sin control · 0 = agotado. "}
          {before && "\"Antes\" se ve tachado, como oferta; vacío = sin oferta."}
        </p>
        <SubmitButton>Guardar cambios</SubmitButton>
      </div>
    </form>
  );
}
