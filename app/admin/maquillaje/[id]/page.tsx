import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getAllMakeup } from "@/lib/data/content-repo";
import { PageTitle, adminBtnGhost } from "@/components/admin/ui";
import { MakeupForm } from "@/components/admin/MakeupForm";

export default async function EditarMaquillajePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ guardado?: string }> }) {
  await requireAdmin();
  const [{ id }, { guardado }] = await Promise.all([params, searchParams]);
  const all = await getAllMakeup();
  const product = all.find((m) => m.id === decodeURIComponent(id));
  if (!product) notFound();
  return (
    <>
      <Link href="/admin/maquillaje" className="mb-3 inline-block text-sm text-bordo underline-offset-4 hover:underline">
        ← Maquillaje
      </Link>
      <PageTitle
        title={product.name}
        action={
          <a href={`/maquillaje#${product.id}`} target="_blank" rel="noreferrer" className={adminBtnGhost}>
            Ver en la tienda ↗
          </a>
        }
      />
      {guardado && (
        <p role="status" className="mb-4 rounded bg-emerald-50 p-3 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-700/30">
          Guardado. Ya se ve en la tienda.
        </p>
      )}
      <MakeupForm product={product} loose={all.filter((m) => m.category !== "combos")} />
    </>
  );
}
