import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getAllCharms } from "@/lib/data/content-repo";
import { Notice, PageTitle } from "@/components/admin/ui";
import { CharmForm } from "@/components/admin/CharmForm";

export default async function EditarDijePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ guardado?: string }> }) {
  await requireAdmin();
  const [{ id }, { guardado }] = await Promise.all([params, searchParams]);
  const charm = (await getAllCharms()).find((c) => c.id === decodeURIComponent(id));
  if (!charm) notFound();
  return (
    <>
      <Link href="/admin/dijes" className="mb-3 inline-flex min-h-11 items-center text-sm font-semibold text-bordo">
        ← Dijes
      </Link>
      <PageTitle title={charm.name} />
      {guardado && <Notice>Guardado. Ya se ve en la tienda.</Notice>}
      <CharmForm charm={charm} />
    </>
  );
}
