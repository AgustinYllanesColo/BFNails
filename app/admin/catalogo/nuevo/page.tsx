import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { PageTitle } from "@/components/admin/ui";
import { DesignForm } from "@/components/admin/DesignForm";

export default async function NuevoDisenoPage() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/catalogo" className="mb-3 inline-flex min-h-11 items-center text-sm font-semibold text-bordo">
        ← Uñas
      </Link>
      <PageTitle title="Nuevo diseño" />
      <DesignForm />
    </>
  );
}
