import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getDesign } from "@/lib/data/repo";
import Link from "next/link";
import { Notice, PageTitle, adminBtnGhost } from "@/components/admin/ui";
import { DesignForm } from "@/components/admin/DesignForm";

export default async function EditarDisenoPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ guardado?: string }> }) {
  await requireAdmin();
  const [{ slug }, { guardado }] = await Promise.all([params, searchParams]);
  const design = await getDesign(slug);
  if (!design) notFound();
  return (
    <>
      <Link href="/admin/catalogo" className="mb-3 inline-flex min-h-11 items-center text-sm font-semibold text-bordo">
        ← Uñas
      </Link>
      <PageTitle
        title={design.name}
        action={
          <a href={`/catalogo/${design.slug}`} target="_blank" rel="noreferrer" className={adminBtnGhost}>
            Ver en la tienda ↗
          </a>
        }
      />
      {guardado && <Notice>Guardado. Ya se ve en la tienda.</Notice>}
      <DesignForm design={design} />
    </>
  );
}
