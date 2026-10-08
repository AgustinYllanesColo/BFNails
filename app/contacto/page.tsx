import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Contacto" };

export default function ContactoPage() {
  redirect("/faq");
}
