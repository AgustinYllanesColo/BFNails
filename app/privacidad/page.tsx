import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacidadPage() {
  return (
    <LegalPage eyebrow="Legales" title={<>Política de <span className="text-bordo">privacidad</span></>} updated="octubre 2026">
      <section>
        <h2>Qué datos pedimos</h2>
        <p>Para armar tu pedido necesitamos tu nombre, un número de WhatsApp y, si elegís envío o moto, tu dirección. El email es opcional. Si nos pasás medidas de tus uñas o una foto de referencia, también quedan asociadas al pedido.</p>
      </section>
      <section>
        <h2>Para qué los usamos</h2>
        <ul>
          <li>Fabricar y entregar tu pedido, y comunicarnos con vos por WhatsApp sobre su estado.</li>
          <li>Emitir el cobro a través de Mercado Pago o verificar una transferencia.</li>
          <li>Despachar por Correo Argentino cuando elegís envío.</li>
        </ul>
        <p>No vendemos ni cedemos tus datos a terceros con fines publicitarios. No te mandamos promociones si no las pediste.</p>
      </section>
      <section>
        <h2>Dónde se guardan</h2>
        <p>Los pedidos se almacenan en una base de datos protegida (Supabase) con acceso restringido a BF Studio. Los pagos los procesa Mercado Pago bajo su propia política; nosotros no vemos ni guardamos datos de tu tarjeta. El carrito se guarda solo en tu navegador.</p>
      </section>
      <section>
        <h2>Tus derechos</h2>
        <p>Conforme a la Ley 25.326 de Protección de Datos Personales, podés pedir el acceso, la corrección o la eliminación de tus datos escribiéndonos por WhatsApp desde el sitio. La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, tiene la atribución de atender denuncias y reclamos por incumplimiento de las normas de protección de datos personales.</p>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>Este sitio no usa cookies publicitarias. Solo usamos almacenamiento local del navegador para recordar tu carrito, y cookies técnicas de sesión en el panel de administración.</p>
      </section>
    </LegalPage>
  );
}
