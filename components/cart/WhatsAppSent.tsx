"use client";

import Image from "next/image";
import Link from "next/link";
import type { RefObject } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";

/**
 * Cierre del checkout en modo WhatsApp (PLAN W2-E.3): reemplaza al formulario cuando el pedido ya salió para
 * WhatsApp. `sent`: se abrió WhatsApp con el pedido escrito (el ticket imprime "enviado x whatsapp" y lo sella
 * "Enviado"). `ready`: el navegador bloqueó la ventana; el pedido queda listo y el botón es un link real a wa.me que
 * nunca se bloquea. No vacía la bolsita sola: la clienta decide cuando ya se lo mandó a Bren.
 */
export type WhatsAppStatus = "sent" | "ready";

export function WhatsAppSent({
  status,
  panelRef,
}: {
  status: WhatsAppStatus;
  panelRef?: RefObject<HTMLDivElement | null>;
}) {
  const sent = status === "sent";
  return (
    <div ref={panelRef} tabIndex={-1} className="min-w-0 outline-none" aria-live="polite">
      <div className="flex items-start gap-4">
        <h2 className="font-display text-h3 text-ink min-w-0 flex-1 text-balance">
          {sent ? "¡Listo! Mandale el mensaje a Bren" : "Tu pedido está listo para mandar"}
        </h2>
        <Image
          src="/brand/kitty.webp"
          alt=""
          width={508}
          height={600}
          sizes="44px"
          className="mt-1 h-auto w-11 shrink-0 rotate-6 lg:w-14"
        />
      </div>
      <p className="text-ink-soft mt-3 max-w-[46ch]">
        {sent
          ? "Se abrió WhatsApp con tu pedido escrito. Si todavía no lo enviaste, volvé a abrirlo desde acá. Bren te confirma y recién ahí pagás."
          : "Tocá “Abrir WhatsApp” y mandale el mensaje a Bren: ya lleva todo el detalle de tu bolsita. Bren te confirma y recién ahí pagás."}
      </p>

      {/* Qué sigue (en desktop: en el celular el ticket y los botones vienen enseguida) */}
      <ol className="text-ink mt-8 hidden max-w-[46ch] gap-4 lg:grid">
        {[
          { icon: "chat", text: "Bren lee tu pedido y te confirma el precio final y la entrega." },
          { icon: "brush", text: "Lo hace a mano, en general de 3 a 7 días hábiles." },
          { icon: "gift", text: "Lo retirás en la estación, te lo lleva la moto o te llega por correo." },
        ].map((s) => (
          <li key={s.icon} className="flex items-start gap-3">
            <span className="bg-cream-deep text-bordo grid size-9 shrink-0 place-items-center rounded-full">
              <Icon name={s.icon as "chat" | "brush" | "gift"} size={20} />
            </span>
            <span className="pt-1.5 text-sm leading-snug">{s.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Las acciones van debajo del ticket (al alcance del pulgar y junto al sello). */
export function WhatsAppActions({
  status,
  url,
  cleared,
  onOpen,
  onClear,
}: {
  status: WhatsAppStatus;
  url: string;
  cleared: boolean;
  onOpen: () => void;
  onClear: () => void;
}) {
  return (
    <div className="grid gap-2">
      <Button
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        size="lg"
        iconLeft="whatsapp"
        className="w-full"
        onClick={onOpen}
        data-cursor="wsp"
      >
        {status === "sent" ? "Abrir WhatsApp de nuevo" : "Abrir WhatsApp"}
      </Button>
      <div className="grid grid-cols-2 gap-2">
        {cleared ? (
          <p className="text-ink-soft inline-flex h-12 items-center justify-center gap-1.5 text-sm font-semibold">
            <Icon name="check" size={18} className="text-bordo" />
            Bolsita vacía
          </p>
        ) : (
          <Button variant="ghost" size="md" className="px-3" onClick={onClear} iconLeft="trash">
            Vaciar carrito
          </Button>
        )}
        <Link
          href="/catalogo"
          className="text-bordo hover:bg-cream-deep rounded-pill inline-flex h-12 items-center justify-center gap-1.5 text-[15px] font-semibold transition-colors duration-150"
        >
          Seguir mirando
          <Icon name="arrow" size={18} />
        </Link>
      </div>
    </div>
  );
}
