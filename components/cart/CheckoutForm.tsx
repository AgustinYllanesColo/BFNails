"use client";

import { useEffect, useMemo, useState } from "react";
import { useHydrated } from "@/lib/hooks";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "@/lib/store/cart";
import { formatARS, cn } from "@/lib/format";
import type { DeliveryMethod, PaymentMethod } from "@/lib/types";
import type { ShippingOption } from "@/lib/shipping/types";
import { Field, inputClass, textareaClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const formSchema = z.object({
  name: z.string().trim().min(2, "Decinos tu nombre"),
  whatsapp: z.string().trim().regex(/^\+?[\d\s-]{8,20}$/, "Con característica, ej: 11 2345 6789"),
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
  street: z.string().trim().optional(),
  city: z.string().trim().optional(),
  province: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  notes: z.string().trim().max(300).optional(),
});
type FormValues = z.infer<typeof formSchema>;

type Props = { transfer: { alias: string; holder: string }; mp: boolean; disabled?: boolean };

export function CheckoutForm({ transfer, mp, disabled }: Props) {
  const { items, clear } = useCart();
  const mounted = useHydrated();
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [delivery, setDelivery] = useState<DeliveryMethod>("retiro");
  const [payment, setPayment] = useState<PaymentMethod>(mp ? "mercadopago" : "transferencia");
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { name: "", whatsapp: "", email: "" } });
  const postalCode = useWatch({ control: form.control, name: "postalCode" });

  // Cotiza envíos cuando cambia el CP (debounce)
  useEffect(() => {
    const cp = (postalCode ?? "").replace(/\D/g, "");
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoadingQuote(true);
      try {
        const res = await fetch("/api/shipping/quote", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(cp.length >= 4 ? { postalCode: cp } : {}),
          signal: ctrl.signal,
        });
        const data = (await res.json()) as { options: ShippingOption[] };
        setOptions(data.options);
        if (!data.options.some((o) => o.method === delivery)) setDelivery("retiro");
      } catch {
        /* abort o red */
      } finally {
        setLoadingQuote(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCode]);

  const subtotal = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
  const chosen = options.find((o) => o.method === delivery);
  const shippingCost = chosen?.cost ?? 0;
  const total = subtotal + shippingCost;
  const needsConfirmation = items.some((i) => i.kind === "custom" && i.quote.needsConfirmation);
  const needsAddress = delivery !== "retiro";
  const needsFullAddress = delivery.startsWith("correo");

  const correoOptions = useMemo(() => options.filter((o) => o.method.startsWith("correo")), [options]);

  const onSubmit = form.handleSubmit(async (v) => {
    setServerError(null);
    if (needsAddress && !v.street) return form.setError("street", { message: "Necesitamos tu dirección" });
    if (needsFullAddress && (!v.city || !v.postalCode)) {
      if (!v.city) form.setError("city", { message: "Localidad" });
      if (!v.postalCode) form.setError("postalCode", { message: "Código postal" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer: { name: v.name, whatsapp: v.whatsapp, email: v.email || undefined },
          delivery: {
            method: delivery,
            address: needsAddress ? { street: v.street, city: v.city, province: v.province, postalCode: v.postalCode, notes: v.notes } : undefined,
          },
          payment: { method: payment },
          items: items.map((i) =>
            i.kind === "design"
              ? { kind: "design", designSlug: i.designSlug, qty: i.qty, sizes: i.sizes }
              : { kind: "custom", selection: i.selection, qty: i.qty, sizes: i.sizes },
          ),
        }),
      });
      const data = (await res.json()) as { redirect?: string; error?: string };
      if (!res.ok || !data.redirect) throw new Error(data.error ?? "No pudimos crear el pedido");
      clear();
      window.location.assign(data.redirect);
    } catch (err) {
      setServerError((err as Error).message);
      setSubmitting(false);
    }
  });

  if (!mounted) return <div className="h-40" />;
  if (items.length === 0) {
    return (
      <div className="rounded-lg bg-cream-deep p-12 text-center">
        <p className="font-display text-3xl">Tu carrito está vacío</p>
        <Button href="/catalogo" className="mt-6">
          Ver catálogo
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_380px]" noValidate>
      <div className="space-y-10">
        <section>
          <h2 className="mb-4 font-display text-2xl">
            <span className="mr-2 text-bordo">01</span>Tus datos
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre" htmlFor="name" error={form.formState.errors.name?.message}>
              <input id="name" className={inputClass} autoComplete="name" {...form.register("name")} />
            </Field>
            <Field label="WhatsApp" htmlFor="whatsapp" hint="Por acá confirmamos todo." error={form.formState.errors.whatsapp?.message}>
              <input id="whatsapp" className={inputClass} inputMode="tel" autoComplete="tel" placeholder="11 2345 6789" {...form.register("whatsapp")} />
            </Field>
            <Field label="Email (opcional)" htmlFor="email" error={form.formState.errors.email?.message} className="md:col-span-2">
              <input id="email" className={inputClass} type="email" autoComplete="email" {...form.register("email")} />
            </Field>
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-2xl">
            <span className="mr-2 text-bordo">02</span>Entrega
          </h2>
          <div className="grid gap-3">
            {options
              .filter((o) => !o.method.startsWith("correo"))
              .map((o) => (
                <OptionCard key={o.method} selected={delivery === o.method} onClick={() => setDelivery(o.method)} title={o.label} description={o.description} price={o.cost === 0 ? "Gratis" : formatARS(o.cost)} />
              ))}
            <div className={cn("rounded-lg border p-4 transition-colors", delivery.startsWith("correo") ? "border-bordo bg-white" : "border-cream-ink bg-white/60")}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Correo Argentino</p>
                  <p className="text-xs text-ink-soft">A todo el país. Ingresá tu código postal para cotizar.</p>
                </div>
                <input
                  className={cn(inputClass, "h-10 w-32 text-center")}
                  placeholder="CP"
                  inputMode="numeric"
                  aria-label="Código postal"
                  {...form.register("postalCode")}
                />
              </div>
              <AnimatePresence initial={false}>
                {(correoOptions.length > 0 || loadingQuote) && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-3 grid gap-2">
                      {loadingQuote && correoOptions.length === 0 && <p className="text-sm text-ink-soft">Cotizando…</p>}
                      {correoOptions.map((o) => (
                        <OptionCard
                          key={o.method}
                          compact
                          selected={delivery === o.method}
                          onClick={() => setDelivery(o.method)}
                          title={o.label}
                          description={`${o.description}${o.estimated ? " · tarifa estimada" : ""}`}
                          price={formatARS(o.cost)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {needsAddress && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Dirección" htmlFor="street" error={form.formState.errors.street?.message} className="md:col-span-2">
                    <input id="street" className={inputClass} autoComplete="street-address" placeholder="Calle, número, piso/depto" {...form.register("street")} />
                  </Field>
                  {needsFullAddress && (
                    <>
                      <Field label="Localidad" htmlFor="city" error={form.formState.errors.city?.message}>
                        <input id="city" className={inputClass} autoComplete="address-level2" {...form.register("city")} />
                      </Field>
                      <Field label="Provincia" htmlFor="province">
                        <input id="province" className={inputClass} autoComplete="address-level1" {...form.register("province")} />
                      </Field>
                    </>
                  )}
                  <Field label="Indicaciones (opcional)" htmlFor="notes" className="md:col-span-2">
                    <textarea id="notes" className={textareaClass} placeholder="Timbre, horario, referencia…" {...form.register("notes")} />
                  </Field>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section>
          <h2 className="mb-4 font-display text-2xl">
            <span className="mr-2 text-bordo">03</span>Pago
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <OptionCard
              selected={payment === "mercadopago"}
              onClick={() => setPayment("mercadopago")}
              title="Mercado Pago"
              description={mp ? "Tarjetas, dinero en cuenta, cuotas. Te redirigimos a pagar." : "Todavía no está activo. Elegí transferencia."}
              disabled={!mp}
            />
            <OptionCard selected={payment === "transferencia"} onClick={() => setPayment("transferencia")} title="Transferencia" description={`Al alias ${transfer.alias} (${transfer.holder}). Mandás el comprobante por WhatsApp.`} />
          </div>
          {needsConfirmation && (
            <p className="mt-3 rounded-md bg-yellow/30 p-3 text-sm">
              Tenés un set con notas: Bren confirma el precio final por WhatsApp y después pagás.
            </p>
          )}
        </section>
      </div>

      <aside className="h-fit rounded-lg bg-white/80 p-5 ring-1 ring-bordo/10 lg:sticky lg:top-28">
        <p className="text-xs font-bold tracking-wider text-ink-soft uppercase">Resumen</p>
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span className="text-ink-soft">
                {i.name} × {i.qty}
              </span>
              <span className="font-semibold">{formatARS(i.unitPrice * i.qty)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-3">
            <span className="text-ink-soft">Envío{chosen ? `: ${chosen.label}` : ""}</span>
            <span className="font-semibold">{shippingCost === 0 ? "Gratis" : formatARS(shippingCost)}</span>
          </li>
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t border-bordo/10 pt-4">
          <span className="font-semibold">{needsConfirmation ? "Desde" : "Total"}</span>
          <motion.span key={total} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="font-display text-3xl text-bordo">
            {formatARS(total)}
          </motion.span>
        </div>
        {serverError && <p className="mt-3 text-sm font-medium text-red">{serverError}</p>}
        <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting || disabled}>
          {disabled ? "Pedidos por la web no disponibles" : submitting ? "Creando tu pedido…" : needsConfirmation ? "Enviar pedido" : payment === "mercadopago" ? "Pagar con Mercado Pago" : "Confirmar pedido"}
        </Button>
        <p className="mt-3 text-center text-xs text-ink-soft">Después de este paso confirmás por WhatsApp con un toque.</p>
      </aside>
    </form>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  description,
  price,
  compact,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  price?: string;
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start justify-between gap-3 rounded-lg border text-left transition-all duration-300 ease-[var(--ease-out-expo)] disabled:opacity-50",
        compact ? "p-3" : "p-4",
        selected ? "border-bordo bg-white shadow-[0_10px_30px_-18px_rgba(74,14,14,0.6)]" : "border-cream-ink bg-white/60 hover:border-bordo/50",
      )}
    >
      <span className="flex items-start gap-3">
        <span className={cn("mt-1 grid size-5 shrink-0 place-items-center rounded-pill border-2", selected ? "border-bordo" : "border-cream-ink")}>
          {selected && <span className="size-2.5 rounded-pill bg-bordo" />}
        </span>
        <span>
          <span className="block font-semibold">{title}</span>
          <span className="block text-xs text-ink-soft">{description}</span>
        </span>
      </span>
      {price && <span className="shrink-0 rounded-pill bg-cream-deep px-3 py-1 text-xs font-bold text-bordo">{price}</span>}
    </button>
  );
}
