import { requireAdmin } from "@/lib/admin/auth";
import { PageTitle } from "@/components/admin/ui";
import { DesignForm } from "@/components/admin/DesignForm";

export default async function NuevoDisenoPage() {
  await requireAdmin();
  return (
    <>
      <PageTitle title="Nuevo diseño" />
      <DesignForm />
    </>
  );
}
