import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getDesign } from "@/lib/data/repo";
import { PageTitle, adminBtnGhost } from "@/components/admin/ui";
import { DesignForm } from "@/components/admin/DesignForm";

export default async function EditarDisenoPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const design = await getDesign(slug);
  if (!design) notFound();
  return (
    <>
      <PageTitle
        title={design.name}
        action={
          <a href={`/catalogo/${design.slug}`} target="_blank" rel="noreferrer" className={adminBtnGhost}>
            Ver en el sitio ↗
          </a>
        }
      />
      <DesignForm design={design} />
    </>
  );
}
