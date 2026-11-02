import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getAllMakeup } from "@/lib/data/content-repo";
import { PageTitle } from "@/components/admin/ui";
import { MakeupForm } from "@/components/admin/MakeupForm";

export default async function NuevoMaquillajePage() {
  await requireAdmin();
  const all = await getAllMakeup();
  return (
    <>
      <Link href="/admin/maquillaje" className="mb-3 inline-block text-sm text-bordo underline-offset-4 hover:underline">
        ← Maquillaje
      </Link>
      <PageTitle title="Nuevo producto" />
      <MakeupForm loose={all.filter((m) => m.category !== "combos")} />
    </>
  );
}
