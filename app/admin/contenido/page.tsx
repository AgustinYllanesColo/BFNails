import { redirect } from "next/navigation";

/** "Promos, dijes y kit" se separó en tres secciones (Promos, Dijes, Kit): los links viejos llevan a Promos. */
export default function ContenidoPage() {
  redirect("/admin/promos");
}
