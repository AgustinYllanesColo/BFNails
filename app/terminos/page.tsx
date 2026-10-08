import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TerminosPage() {
  return (
    <LegalPage eyebrow="Legales" title={<>Términos y <span className="text-bordo">condiciones</span></>} updated="octubre 2026">
      <section>
        <h2>1. Quiénes somos</h2>
        <p>
          {siteConfig.name} («BF Studio», «nosotros») es un emprendimiento con base en Lanús, Provincia de Buenos Aires, Argentina, dedicado a la fabricación artesanal de uñas press-on en soft gel. Al hacer un pedido a través de este sitio aceptás estos términos. Si tenés dudas, escribinos por WhatsApp antes de comprar.
        </p>
      </section>
      <section>
        <h2>2. Productos y personalización</h2>
        <p>
          Cada set se fabrica a pedido, a mano y según el talle y el diseño que elegís. Las fotos del catálogo y la vista previa del armador son ilustrativas: al ser un producto artesanal pueden existir pequeñas variaciones de color, brillo o detalle respecto de la imagen. El kit incluye 10 uñas, pegamento y lima.
        </p>
        <p>
          Cuando pedís un diseño con notas libres o una referencia de internet, el precio mostrado es orientativo y se confirma por WhatsApp antes de cobrar. Los diseños inspirados en imágenes de terceros se realizan como interpretación artesanal, no como copia exacta.
        </p>
      </section>
      <section>
        <h2>3. Talles</h2>
        <p>
          El talle es responsabilidad de quien compra. Ofrecemos una guía de talles estándar y la opción de enviarnos las medidas de cada uña en milímetros para un set personalizado. Un set hecho con medidas enviadas por la clienta no se rehace sin cargo si las medidas eran incorrectas, aunque siempre vamos a buscar la mejor solución.
        </p>
      </section>
      <section>
        <h2>4. Precios y pagos</h2>
        <p>
          Los precios están expresados en pesos argentinos e incluyen el kit completo; el envío se cotiza aparte y se muestra antes de confirmar. Podés pagar con Mercado Pago, transferencia bancaria o en efectivo al recibir (solo retiro en estación o entrega en moto). La producción comienza una vez acreditado el pago o confirmado el pedido por WhatsApp.
        </p>
      </section>
      <section>
        <h2>5. Plazos, entregas y envíos</h2>
        <p>
          El tiempo de producción habitual es de 3 a 7 días hábiles según la complejidad del diseño y la cantidad de pedidos. Las entregas en estación (Lanús, Banfield, Remedios de Escalada) y en moto se coordinan por WhatsApp. Los envíos por Correo Argentino tienen los plazos informados por el correo; una vez despachado el paquete, te enviamos el número de seguimiento. No nos hacemos responsables por demoras atribuibles al correo, pero te ayudamos con el reclamo.
        </p>
      </section>
      <section>
        <h2>6. Cambios, devoluciones y arrepentimiento</h2>
        <p>
          De acuerdo con la Ley 24.240 de Defensa del Consumidor, podés revocar la compra dentro de los 10 días corridos desde la recepción del producto o la celebración del contrato, lo que ocurra último, usando el <Link href="/arrepentimiento" className="font-semibold text-bordo underline underline-offset-4">botón de arrepentimiento</Link>. Como los sets se fabrican a medida para cada clienta, te pedimos que, de ser posible, nos avises antes de que comience la producción. Si el producto llega con un defecto de fabricación, lo reponemos o devolvemos el dinero. Las uñas press-on son un producto de higiene personal: si el kit fue abierto y usado, solo aceptamos devoluciones por defectos.
        </p>
      </section>
      <section>
        <h2>7. Uso y cuidado</h2>
        <p>
          Seguí la guía de aplicación incluida en el kit. No usamos materiales de uso profesional prohibidos; aun así, si tenés alergias conocidas a geles, acrílicos o adhesivos, consultá antes de comprar. No somos responsables por reacciones derivadas de un uso distinto al indicado.
        </p>
      </section>
      <section>
        <h2>8. Propiedad intelectual</h2>
        <p>
          Los textos, fotos y diseños de este sitio pertenecen a BF Studio. Los personajes mencionados o representados en los diseños pertenecen a sus respectivos titulares y se utilizan como referencia de estilo a pedido de la clienta.
        </p>
      </section>
      <section>
        <h2>9. Contacto y ley aplicable</h2>
        <p>
          Para cualquier consulta escribinos por WhatsApp desde el sitio. Estos términos se rigen por las leyes de la República Argentina. Defensa del Consumidor: para reclamos podés ingresar a www.argentina.gob.ar/defensadelconsumidor o llamar al 0800-666-1518.
        </p>
      </section>
    </LegalPage>
  );
}
