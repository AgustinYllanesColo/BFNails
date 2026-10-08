"use client";

import { useState } from "react";
import { Field, inputClass, textareaClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { waLink } from "@/lib/whatsapp";

export function ArrepentimientoForm() {
  const [name, setName] = useState("");
  const [order, setOrder] = useState("");
  const [reason, setReason] = useState("");
  const msg = `Hola, quiero ejercer el botón de arrepentimiento.\nNombre: ${name}\nPedido: ${order}\n${reason ? `Motivo (opcional): ${reason}\n` : ""}Solicito la revocación de la compra según la Ley 24.240.`;
  const ok = name.trim().length > 1 && order.trim().length > 1;
  return (
    <div className="rounded-lg bg-white/80 p-6 ring-1 ring-bordo/10">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tu nombre" htmlFor="r-name">
          <input id="r-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Número de pedido" htmlFor="r-order" hint="Ej: BF-0012. Está en el link que te mandamos.">
          <input id="r-order" className={inputClass} value={order} onChange={(e) => setOrder(e.target.value)} />
        </Field>
        <Field label="Motivo (opcional)" htmlFor="r-reason" className="md:col-span-2">
          <textarea id="r-reason" className={textareaClass} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </div>
      <Button href={ok ? waLink(msg) : "#"} target="_blank" rel="noreferrer" className={ok ? "mt-5" : "mt-5 pointer-events-none opacity-50"}>
        Enviar solicitud por WhatsApp
      </Button>
    </div>
  );
}
