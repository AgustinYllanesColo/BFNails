import Image from "next/image";
import { requireAdmin } from "@/lib/admin/auth";
import { hasDb } from "@/lib/db/client";
import { getAllCharms, getAllMakeup, getAllPromos, getKit } from "@/lib/data/content-repo";
import type { Charm, Promo } from "@/lib/data/content";
import { MAKEUP_CATEGORIES, MAKEUP_FORMS, type MakeupForm, type MakeupProduct } from "@/lib/data/makeup";
import { IMAGE_TYPES, MAKEUP_LIMITS } from "@/lib/admin/makeup-form";
import { Card, PageTitle, adminBtn, adminBtnGhost, adminInput } from "@/components/admin/ui";
import { PromoCard } from "@/components/sections/Promos";
import { deleteCharm, deleteMakeup, deletePromo, saveCharm, saveKit, saveMakeup, savePromo } from "./actions";

const THEMES = [
  ["rojo", "Rojo"],
  ["bordo", "Bordó"],
  ["rosa", "Rosa"],
  ["leopardo", "Negro y dorado"],
] as const;

/** Forma del producto (define el dibujo mientras no hay foto). Solo se elige al crearlo. */
const MAKEUP_FORM_LABEL: Record<MakeupForm, string> = {
  combo: "Combo (caja de regalo)",
  labial: "Labial",
  gloss: "Gloss",
  barra: "Barra",
  base: "Base líquida",
  polvo: "Polvo",
  rubor: "Rubor",
  delineador: "Delineador",
  lapiz: "Lápiz",
  mascara: "Máscara",
  pestanas: "Pestañas",
  gel: "Gel",
  brocha: "Brocha",
  brochas: "Set de brochas",
  suelto: "Polvo suelto",
  doble: "Doble punta",
  racimo: "Pestañas en racimo",
  "set-lapices": "Set de lápices",
  "rubor-barra": "Rubor en barra",
  "duo-cejas": "Dúo para cejas",
};

export default async function ContenidoPage() {
  await requireAdmin();
  const [promos, makeup, charms, kit] = await Promise.all([getAllPromos(), getAllMakeup(), getAllCharms(), getKit()]);
  return (
    <>
      <PageTitle title="Promos, maquillaje, dijes y kit">
        Lo que cargues acá aparece en la home, Maquillaje, el catálogo, Dijes y el armador. {!hasDb() && "Sin base de datos no se guarda."}
      </PageTitle>

      <div className="space-y-8">
        <Card title="Promos de la semana">
          <p className="mb-4 text-sm text-ink-soft">
            Una tarjeta por promo. Con fecha &quot;hasta&quot; se oculta sola cuando vence. Sin link, la tarjeta abre WhatsApp.
          </p>
          <div className="space-y-4">
            <PromoForm />
            {promos.map((p) => (
              <PromoForm key={p.id} promo={p} />
            ))}
          </div>
        </Card>

        <Card title="Maquillaje">
          <p role="note" className="mb-4 flex items-start gap-2 rounded bg-yellow/30 p-3 text-sm text-ink ring-1 ring-yellow/60">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-px shrink-0 text-bordo">
              <path d="M12 3 2.5 20h19L12 3Z" />
              <path d="M12 10v4.5M12 17.5v.01" />
            </svg>
            <span>
              <strong className="font-bold">Precios provisorios (el doble del costo).</strong> Revisalos uno por uno antes
              de publicar.
            </span>
          </p>
          <p className="mb-4 text-sm text-ink-soft">
            Precio por unidad. Stock vacío = sin control; 0 = agotado (se ve, pero no se puede comprar). Los disponibles se
            ven en /maquillaje; los destacados, también en la home.
          </p>
          <div className="space-y-3">
            <MakeupForm />
            {makeup.map((m) => (
              <MakeupForm key={m.id} product={m} />
            ))}
          </div>
        </Card>

        <Card title="Dijes">
          <p className="mb-4 text-sm text-ink-soft">Precio por unidad. Los activos se ven en /dijes y en el armador.</p>
          <div className="space-y-3">
            <CharmForm />
            {charms.map((c) => (
              <CharmForm key={c.id} charm={c} />
            ))}
          </div>
        </Card>

        <Card title="Kit de colocación">
          <form action={saveKit} className="grid gap-4 lg:grid-cols-2">
            <L label="Qué trae (uno por línea; detalle opcional después de |)">
              <textarea
                name="items"
                defaultValue={kit.items.map((i) => (i.detail ? `${i.name} | ${i.detail}` : i.name)).join("\n")}
                className={adminInput + " h-56 py-2"}
              />
            </L>
            <div className="space-y-3">
              <p className="text-xs font-bold tracking-wider text-ink-soft uppercase">Fotos</p>
              <div className="grid grid-cols-3 gap-2">
                {kit.images.map((src) => (
                  <label key={src} className="text-xs">
                    <span className="relative block aspect-square overflow-hidden rounded-md bg-cream-deep">
                      <Image src={src} alt="" fill sizes="120px" className="object-cover" />
                    </span>
                    <span className="mt-1 flex items-center gap-1">
                      <input type="checkbox" name="removeImages" value={src} /> quitar
                    </span>
                  </label>
                ))}
              </div>
              <input type="file" name="newImages" accept={IMAGE_TYPES.join(",")} multiple className="text-sm" />
              <button className={adminBtn}>Guardar kit</button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

function PromoForm({ promo }: { promo?: Promo }) {
  return (
    <form action={savePromo} className="grid gap-4 rounded-lg border border-bordo/10 p-4 lg:grid-cols-[1fr_300px]">
      {promo && <input type="hidden" name="id" value={promo.id} />}
      <div className="space-y-3">
        {!promo && <p className="font-title text-lg">Nueva promo</p>}
        <div className="grid gap-3 md:grid-cols-[120px_1fr]">
          <L label="Destacado">
            <input name="badge" required defaultValue={promo?.badge} placeholder="-20% / 4x3" className={adminInput} />
          </L>
          <L label="Título">
            <input name="title" required defaultValue={promo?.title} placeholder="Francesita de la semana" className={adminInput} />
          </L>
        </div>
        <L label="Texto corto">
          <input name="text" defaultValue={promo?.text} className={adminInput} />
        </L>
        <div className="grid gap-3 md:grid-cols-4">
          <L label="Precio promo">
            <input name="price" type="number" step={100} defaultValue={promo?.price} className={adminInput} />
          </L>
          <L label="Precio antes">
            <input name="priceBefore" type="number" step={100} defaultValue={promo?.priceBefore} className={adminInput} />
          </L>
          <L label="Hasta">
            <input name="until" type="date" defaultValue={promo?.until} className={adminInput} />
          </L>
          <L label="Color">
            <select name="theme" defaultValue={promo?.theme ?? "rojo"} className={adminInput}>
              {THEMES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </L>
        </div>
        <L label="Link (ej: /catalogo/francesita-clasica, /disena). Vacío = WhatsApp">
          <input name="href" defaultValue={promo?.href} className={adminInput} />
        </L>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <input type="file" name="image" accept={IMAGE_TYPES.join(",")} />
          {promo?.image && (
            <label className="flex items-center gap-1">
              <input type="checkbox" name="removeImage" /> quitar foto
            </label>
          )}
          <label className="flex items-center gap-1">
            <input type="checkbox" name="active" defaultChecked={promo?.active ?? true} /> Activa
          </label>
        </div>
        <div className="flex gap-2">
          <button className={adminBtn}>{promo ? "Guardar" : "Agregar promo"}</button>
          {promo && (
            <button formAction={deletePromo} className={adminBtnGhost}>
              Borrar
            </button>
          )}
        </div>
      </div>
      {promo && (
        <div className="pointer-events-none">
          <PromoCard promo={promo} />
        </div>
      )}
    </form>
  );
}

function CharmForm({ charm }: { charm?: Charm }) {
  return (
    <form
      action={saveCharm}
      className="grid items-end gap-3 rounded-lg border border-bordo/10 p-3 md:grid-cols-[64px_1fr_120px_90px_auto]"
    >
      {charm && <input type="hidden" name="id" value={charm.id} />}
      <span className="relative block size-16 overflow-hidden rounded-md bg-cream-deep">
        {charm?.image ? (
          <Image src={charm.image} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <span className="absolute inset-3 rounded-full" style={{ background: charm?.hex ?? "#e8dbcd" }} />
        )}
      </span>
      <div className="space-y-2">
        <L label={charm ? "Nombre" : "Nuevo dije"}>
          <input name="name" required defaultValue={charm?.name} className={adminInput} />
        </L>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <input type="file" name="image" accept={IMAGE_TYPES.join(",")} />
          {charm?.image && (
            <label className="flex items-center gap-1">
              <input type="checkbox" name="removeImage" /> quitar foto
            </label>
          )}
          <label className="flex items-center gap-1">
            <input type="checkbox" name="active" defaultChecked={charm?.active ?? true} /> Disponible
          </label>
        </div>
      </div>
      <L label="Precio c/u">
        <input name="price" type="number" step={50} required defaultValue={charm?.price} className={adminInput} />
      </L>
      <L label="Color">
        <input name="hex" type="color" defaultValue={charm?.hex ?? "#d9b25b"} className={adminInput + " p-1"} />
      </L>
      <div className="flex gap-2">
        <button className={adminBtn}>{charm ? "Guardar" : "Agregar"}</button>
        {charm && (
          <button formAction={deleteCharm} className={adminBtnGhost}>
            Borrar
          </button>
        )}
      </div>
    </form>
  );
}

function MakeupForm({ product }: { product?: MakeupProduct }) {
  return (
    <form action={saveMakeup} className="grid gap-3 rounded-lg border border-bordo/10 p-3 md:grid-cols-[64px_1fr]">
      {product && <input type="hidden" name="id" value={product.id} />}
      <span className="relative block size-16 overflow-hidden rounded-md bg-cream-deep">
        {product?.image ? (
          <Image src={product.image} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <span className="absolute inset-3 rounded-full" style={{ background: product?.hex ?? "#e8dbcd" }} />
        )}
      </span>
      <div className="min-w-0 space-y-2">
        {!product && <p className="font-title text-lg">Nuevo producto</p>}
        <div className="grid gap-3 md:grid-cols-[1fr_160px_160px]">
          <L label="Nombre">
            <input name="name" required minLength={2} maxLength={MAKEUP_LIMITS.name} defaultValue={product?.name} className={adminInput} />
          </L>
          <L label="Marca">
            <input name="brand" maxLength={MAKEUP_LIMITS.brand} defaultValue={product?.brand} className={adminInput} />
          </L>
          <L label="Categoría">
            <select name="category" defaultValue={product?.category ?? "labios"} className={adminInput}>
              {MAKEUP_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </L>
        </div>
        <L label="Descripción (una línea)">
          <input name="description" maxLength={MAKEUP_LIMITS.description} defaultValue={product?.description} className={adminInput} />
        </L>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <L label="Precio c/u">
            <input name="price" type="number" min={0} max={MAKEUP_LIMITS.price} step={1} required defaultValue={product?.price} className={adminInput} />
          </L>
          <L label="Precio antes">
            <input name="priceBefore" type="number" min={0} max={MAKEUP_LIMITS.price} step={1} defaultValue={product?.priceBefore} className={adminInput} />
          </L>
          <L label="Stock">
            <input name="stock" type="number" min={0} max={MAKEUP_LIMITS.stock} step={1} defaultValue={product?.stock} className={adminInput} />
          </L>
          <L label="Color">
            <input name="hex" type="color" defaultValue={product?.hex ?? "#d9667c"} className={adminInput + " p-1"} />
          </L>
          {!product && (
            <L label="Forma">
              <select name="form" defaultValue="labial" className={adminInput}>
                {MAKEUP_FORMS.map((v) => (
                  <option key={v} value={v}>
                    {MAKEUP_FORM_LABEL[v]}
                  </option>
                ))}
              </select>
            </L>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <input type="file" name="image" accept={IMAGE_TYPES.join(",")} aria-label="Foto del producto" />
          {product?.image && (
            <label className="flex items-center gap-1">
              <input type="checkbox" name="removeImage" /> quitar foto
            </label>
          )}
          <label className="flex items-center gap-1">
            <input type="checkbox" name="active" defaultChecked={product?.active ?? true} /> Disponible
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} /> Destacado en la home
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" name="isNew" defaultChecked={product?.isNew ?? true} /> Nuevo
          </label>
          {product?.code && <span className="text-ink-soft">Cód. {product.code}</span>}
        </div>
        <div className="flex gap-2">
          <button className={adminBtn}>{product ? "Guardar" : "Agregar"}</button>
          {product && (
            <button formAction={deleteMakeup} formNoValidate className={adminBtnGhost}>
              Borrar
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold tracking-wider text-ink-soft uppercase">{label}</span>
      {children}
    </label>
  );
}
