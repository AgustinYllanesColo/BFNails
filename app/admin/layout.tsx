import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/admin/auth";
import { hasDb } from "@/lib/db/client";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
// El admin siempre se renderiza por request (sesión + datos frescos).
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  // La página de login se renderiza sin shell; el resto exige sesión (cada página llama requireAdmin).
  if (!session) return <div className="min-h-screen bg-cream">{children}</div>;
  return (
    <AdminShell session={session} dbReady={hasDb()}>
      {children}
    </AdminShell>
  );
}
