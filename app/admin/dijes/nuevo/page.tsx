import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { PageTitle } from "@/components/admin/ui";
import { CharmForm } from "@/components/admin/CharmForm";

export default async function NuevoDijePage() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/dijes" className="mb-3 inline-flex min-h-11 items-center text-sm font-semibold text-bordo">
        ← Dijes
      </Link>
      <PageTitle title="Nuevo dije" />
      <CharmForm />
    </>
  );
}
