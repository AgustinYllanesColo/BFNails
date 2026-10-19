"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Design, PaymentMethod } from "@/lib/types";
import { PAYMENT_LABEL } from "@/lib/types";
import type { ShippingOption } from "@/lib/shipping/types";
import type { BuilderConfig } from "@/lib/pricing";
import { useHydrated } from "@/lib/hooks";
import { scrollToTarget, stickyOffset } from "@/lib/motion";
import { useCart } from "@/lib/store/cart";
import { toast } from "@/lib/store/toast";
import { cn, formatARS } from "@/lib/format";
import { cartWhatsAppMessage, itemName, waLink } from "@/lib/whatsapp";
import { ErrorSummary, Field, inputClass, textareaClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/Segmented";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { PrinterHead } from "@/components/ui/ticket";
import { StickyActionBar } from "@/components/ui/StickyActionBar";
import { AmbientZone } from "@/components/motion/AmbientZone";
import { Receipt, type ReceiptLine, type ReceiptStamp } from "@/components/ui/Receipt";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { WhatsAppActions, WhatsAppSent, type WhatsAppStatus } from "@/components/cart/WhatsAppSent";

/**
 * Checkout (PLAN W2-E.3-5): datos, entrega y pago en tres `fieldset` (la secuencia la da `CheckoutSteps`), el ticket
 * que se imprime con lo que vas eligiendo y el botón al alcance del pulgar (en línea y en una barra clara que acompaña
 * mientras el botón no se ve).
 *
 * - `mode="web"`: crea el pedido (`/api/checkout`); el ticket imprime el número, el papel se corta y se va, y la
 *   navegación sigue al pedido (Mercado Pago, afuera). Si el servidor contesta 503 (sin base), pasa a WhatsApp.
 * - `mode="whatsapp"` (producción sin pedidos por la web): con el formulario válido se abre WhatsApp con el pedido
 *   entero escrito, en el mismo toque (sin esperas: así el navegador no bloquea la ventana). El ticket imprime
 *   "enviado x whatsapp" y cae el sello "Enviado" cuando la clienta vuelve a la pestaña. Si la ventana se bloqueó,
 *   queda un link real "Abrir WhatsApp" y el sello "Listo".
 * - Errores: un único resumen (`role="alert"`) arriba del botón, el scroll lleva al primer campo con error y lo enfoca.
 */

/* ---------- validación ---------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const formSchema = z
  .object({
    name: z.string().trim().min(2, "Decinos tu nombre"),
    whatsapp: z
      .string()
      .trim()
      .regex(/^\+?[\d\s-]{8,20}$/, "Con característica, sin 0 ni 15: 11 2345 6789"),
    email: z
      .string()
      .trim()
      .refine((v) => v === "" || EMAIL.test(v), "Revisá el email (ej: nombre@gmail.com)"),
    delivery: z.enum(["retiro", "moto", "correo"]),
    correoType: z.enum(["domicilio", "sucursal"]),
    postalCode: z.string().trim(),
    street: z.string().trim(),
    city: z.string().trim(),
    province: z.string().trim(),
    notes: z.string().trim().max(300, "Hasta 300 caracteres"),
    payment: z.enum(["transferencia", "efectivo", "mercadopago"]),
  })
  .superRefine((v, ctx) => {
    if (v.delivery !== "retiro" && !v.street) {
      ctx.addIssue({ code: "custom", path: ["street"], message: "Falta la calle y el número" });
    }
    if (v.delivery === "correo") {
      if (v.postalCode.replace(/\D/g, "").length < 4) {
        ctx.addIssue({ code: "custom", path: ["postalCode"], message: "Necesitamos el código postal para el envío" });
      }
      if (!v.city) ctx.addIssue({ code: "custom", path: ["city"], message: "¿En qué localidad?" });
    }
    if (v.payment === "efectivo" && v.delivery === "correo") {
      ctx.addIssue({ code: "custom", path: ["payment"], message: "El efectivo es solo con retiro o moto" });
    }
  });

type FormValues = z.infer<typeof formSchema>;

/** Orden de los campos en pantalla: el primero con error se lleva el foco. */
const FIELD_ORDER: (keyof FormValues)[] = ["name", "whatsapp", "email", "postalCode", "street", "city", "province", "notes", "payment"];

type Quote = { status: "idle" | "loading" | "ok" | "error"; options: ShippingOption[] };

type Props = {
  transfer: { alias: string; holder: string };
  /** Mercado Pago activo (si no, su opción no existe). */
  mp: boolean;
  /** `whatsapp` cuando la web no toma pedidos (sin base de datos): el flujo termina en WhatsApp. */
  mode?: "web" | "whatsapp";
  /** WhatsApp de Bren (configuración). */
  whatsapp?: string;
  /** Retiro y moto de la tabla de envíos (la página los arma en el servidor: sin espera ni salto al cargar). */
  shipping?: ShippingOption[];
  /** Tarifa más baja del Correo en la tabla ("desde $ …" antes de cotizar). */
  correoFrom?: number | null;
  config?: BuilderConfig;
  suggestions?: Design[];
  /** @deprecated usar `mode="whatsapp"` (compatibilidad). */
  disabled?: boolean;
};

export function CheckoutForm({
  transfer,
  mp,
  mode: initialMode,
  whatsapp,
  shipping = [],
  correoFrom = null,
  config,
  suggestions = [],
  disabled,
}: Props) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const hydrated = useHydrated();

  // Modo: lo decide el servidor; en desarrollo `?modo=whatsapp` lo fuerza (para probar el cierre por WhatsApp).
  const [mode, setMode] = useState<"web" | "whatsapp">(() => {
    if (
      process.env.NODE_ENV !== "production" &&
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("modo") === "whatsapp"
    )
      return "whatsapp";
    return initialMode ?? (disabled ? "whatsapp" : "web");
  });
  const waMode = mode === "whatsapp";
  const mpOn = mp && !waMode;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    shouldFocusError: false,
    defaultValues: {
      name: "",
      whatsapp: "",
      email: "",
      delivery: "retiro",
      correoType: "domicilio",
      postalCode: "",
      street: "",
      city: "",
      province: "",
      notes: "",
      payment: "transferencia",
    },
  });
  const { errors, submitCount } = form.formState;
  const [delivery, correoType, postalCode, payment] = useWatch({
    control: form.control,
    name: ["delivery", "correoType", "postalCode", "payment"],
  });

  /* ---------- envío ---------- */
  const [quote, setQuote] = useState<Quote>({ status: "idle", options: [] });
  const [retry, setRetry] = useState(0);
  const cp = (postalCode ?? "").replace(/\D/g, "");

  useEffect(() => {
    if (delivery !== "correo" || cp.length < 4) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- vuelve a idle cuando el CP deja de ser cotizable (estado de un fetch externo)
      setQuote((q) => (q.status === "idle" ? q : { status: "idle", options: [] }));
      return;
    }
    const ctrl = new AbortController();
    setQuote({ status: "loading", options: [] });
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/shipping/quote", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ postalCode: cp }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { options: ShippingOption[] };
        const correo = data.options.filter((o) => o.method.startsWith("correo"));
        setQuote(correo.length ? { status: "ok", options: correo } : { status: "error", options: [] });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setQuote({ status: "error", options: [] });
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [delivery, cp, retry]);

  const local = useMemo(() => shipping.filter((o) => !o.method.startsWith("correo")), [shipping]);
  const chosen: ShippingOption | undefined =
    delivery === "correo"
      ? quote.options.find((o) => o.method === `correo_${correoType}`)
      : local.find((o) => o.method === delivery);
  const quoteError = delivery === "correo" && quote.status === "error";

  const subtotal = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
  const shippingCost = chosen?.cost ?? 0;
  const total = subtotal + shippingCost;
  const needsConfirmation = items.some((i) => i.kind === "custom" && i.quote.needsConfirmation);
  const motoFrom = chosen?.from === true;
  const shippingPending = delivery === "correo" && !chosen;
  const fromPrice = needsConfirmation || motoFrom || shippingPending;
  const cashAllowed = delivery !== "correo";

  // El efectivo es solo con retiro o moto: si la entrega deja de admitirlo, el pago pasa a transferencia.
  useEffect(() => {
    if (!cashAllowed && payment === "efectivo") form.setValue("payment", "transferencia");
    if (!mpOn && payment === "mercadopago") form.setValue("payment", "transferencia");
  }, [cashAllowed, mpOn, payment, form]);

  /* ---------- envío del pedido ---------- */
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const redirectTo = useRef<string | null>(null);
  const inFlight = useRef(false);
  const summaryRef = useRef<HTMLParagraphElement>(null);
  const submitRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  /* WhatsApp */
  const [wa, setWa] = useState<{ status: WhatsAppStatus; url: string } | null>(null);
  const [snapshot, setSnapshot] = useState<typeof items | null>(null);
  const [cleared, setCleared] = useState(false);
  /** El ticket imprime "enviado" y cae el sello cuando la clienta está mirando (al volver de WhatsApp). */
  const [revealed, setRevealed] = useState(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const askedToast = useRef<number | undefined>(undefined);
  const [printedOn] = useState(() => new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }));

  /** Después de abrir WhatsApp: si la pestaña sigue a la vista (ventana en segundo plano), se sella enseguida. */
  const scheduleReveal = useCallback(() => {
    setRevealed(false);
    clearTimeout(revealTimer.current);
    revealTimer.current = setTimeout(() => {
      if (document.visibilityState === "visible") setRevealed(true);
    }, 700);
  }, []);
  useEffect(() => () => clearTimeout(revealTimer.current), []);

  const [errorCount, setErrorCount] = useState(0);
  const liveErrors = Object.keys(errors).length + (quoteError && !errors.postalCode ? 1 : 0);
  const shownErrors = submitCount > 0 || errorCount > 0 ? liveErrors : 0;

  // Pedido de foco: se resuelve después del commit (los errores ya están en el DOM con aria-invalid).
  const [focusRequest, setFocusRequest] = useState(0);
  const focusFirstError = useCallback(() => setFocusRequest((n) => n + 1), []);
  useEffect(() => {
    if (!focusRequest) return;
    let tries = 0;
    let raf = 0;
    const find = () => {
      const root = formRef.current;
      const target = root
        ? (FIELD_ORDER.map((name) => root.querySelector<HTMLElement>(`[name="${name}"][aria-invalid="true"]`)).find(Boolean) ??
          root.querySelector<HTMLElement>('[aria-invalid="true"]'))
        : null;
      if (!target) {
        if (tries++ < 6) raf = requestAnimationFrame(find);
        return;
      }
      // el campo queda bajo el nav, con su etiqueta a la vista
      scrollToTarget(target, { offset: stickyOffset(40) });
      target.focus({ preventScroll: true });
    };
    raf = requestAnimationFrame(find);
    return () => cancelAnimationFrame(raf);
  }, [focusRequest]);

  const onInvalid = useCallback(
    (errs: FieldErrors<FormValues>) => {
      setErrorCount(Object.keys(errs).length || 1);
      focusFirstError();
    },
    [focusFirstError],
  );

  const details = (v: FormValues) => ({
    name: v.name,
    whatsapp: v.whatsapp,
    email: v.email || undefined,
    delivery: {
      label: chosen?.label ?? (v.delivery === "correo" ? "Correo Argentino" : v.delivery === "moto" ? "Moto en zona" : "Retiro en estación"),
      cost: chosen ? chosen.cost : null,
      from: chosen?.from,
    },
    payment: v.payment as PaymentMethod,
    address:
      v.delivery === "retiro"
        ? undefined
        : { street: v.street, city: v.city, province: v.province, postalCode: v.delivery === "correo" ? v.postalCode : undefined, notes: v.notes },
    total,
    needsConfirmation,
  });

  /** Abre WhatsApp en el mismo toque del botón (sin await antes): el navegador no bloquea la ventana. */
  const sendWhatsApp = (v: FormValues) => {
    const url = waLink(cartWhatsAppMessage(items, details(v), config), whatsapp);
    let opened: Window | null = null;
    try {
      opened = window.open(url, "_blank");
      if (opened) opened.opener = null;
    } catch {
      opened = null;
    }
    setSnapshot(items);
    setWa({ status: opened ? "sent" : "ready", url });
    scheduleReveal();
    requestAnimationFrame(() => {
      if (panelRef.current) {
        scrollToTarget(panelRef.current);
        panelRef.current.focus({ preventScroll: true });
      }
    });
  };

  const submitWeb = async (v: FormValues) => {
    inFlight.current = true;
    setSubmitting(true);
    setServerError(null);
    const d = details(v);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer: { name: v.name, whatsapp: v.whatsapp, email: v.email || undefined },
          delivery: {
            method: chosen?.method ?? v.delivery,
            address: d.address,
          },
          payment: { method: v.payment },
          items: items.map((i) =>
            i.kind === "design"
              ? { kind: "design", designSlug: i.designSlug, qty: i.qty, sizes: i.sizes }
              : { kind: "custom", selection: i.selection, qty: i.qty, sizes: i.sizes },
          ),
        }),
      });
      if (res.status === 503) {
        // La web no está tomando pedidos: el mismo pedido sale por WhatsApp.
        inFlight.current = false;
        setSubmitting(false);
        setMode("whatsapp");
        sendWhatsApp(v);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { redirect?: string; error?: string; orderNumber?: string };
      if (!res.ok || !data.redirect) throw new Error(data.error ?? "No pudimos crear el pedido. Probá de nuevo en un ratito.");
      if (data.orderNumber) {
        try {
          sessionStorage.setItem("bf-pending-order", data.orderNumber);
        } catch {
          // sin almacenamiento: el pedido igual existe; la bolsita se vacía a mano
        }
        setOrderNumber(data.orderNumber);
      }
      redirectTo.current = data.redirect;
      // El ticket imprime el número y, un instante después, el papel se corta y se va
      setTimeout(() => setLeaving(true), 520);
    } catch (err) {
      inFlight.current = false;
      setSubmitting(false);
      setServerError((err as Error).message);
    }
  };

  const go = useCallback(() => {
    const to = redirectTo.current;
    if (!to) return;
    const url = new URL(to, window.location.href);
    if (url.origin === window.location.origin) router.push(url.pathname + url.search);
    else window.location.assign(to);
  }, [router]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inFlight.current || submitting || leaving) return;
    const parsed = formSchema.safeParse(form.getValues());
    if (!parsed.success) {
      void form.handleSubmit(() => {}, onInvalid)();
      return;
    }
    const v = parsed.data;
    // Sin cotización del Correo no hay pedido por la web (por WhatsApp, Bren lo cotiza)
    if (!waMode && v.delivery === "correo" && !chosen) {
      form.setError("postalCode", {
        message:
          quote.status === "loading"
            ? "Estamos cotizando el envío, esperá un segundo"
            : "No pudimos cotizar ese código postal. Revisalo o elegí retiro o moto",
      });
      setErrorCount(1);
      focusFirstError();
      return;
    }
    setErrorCount(0);
    if (waMode) {
      sendWhatsApp(v);
      return;
    }
    void submitWeb(v);
  };

  const emptyBag = () => {
    clear();
    setCleared(true);
    toast.show({ message: "Listo, vaciaste tu bolsita", icon: "check" });
  };

  /* Volver de WhatsApp: recién ahí se imprime "enviado" y cae el sello; después, la pregunta de vaciar. */
  useEffect(() => {
    if (!wa) return;
    let ask: ReturnType<typeof setTimeout> | undefined;
    let show: ReturnType<typeof setTimeout> | undefined;
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(revealTimer.current);
      show = setTimeout(() => setRevealed(true), 250);
      if (wa.status !== "sent" || cleared) return;
      clearTimeout(ask);
      ask = setTimeout(() => {
        if (askedToast.current !== undefined) toast.dismiss(askedToast.current);
        askedToast.current = toast.show({
          message: "¿Ya se lo mandaste a Bren?",
          icon: "whatsapp",
          duration: 8000,
          action: { label: "Vaciar carrito", onClick: emptyBag },
        });
      }, 1800);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clearTimeout(ask);
      clearTimeout(show);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wa, cleared]);

  /* ---------- ticket ---------- */
  const ticketItems = snapshot ?? items;
  const envioValue =
    delivery === "retiro"
      ? "gratis"
      : chosen
        ? `${motoFrom ? "desde " : ""}${formatARS(chosen.cost)}`
        : delivery === "correo"
          ? quote.status === "loading"
            ? "cotizando…"
            : "a confirmar"
          : "a confirmar";
  const lines: ReceiptLine[] = [
    ...ticketItems.map<ReceiptLine>((i) => ({
      kind: "row",
      id: i.id,
      label: `${itemName(i)} ×${i.qty}`,
      value: formatARS(i.unitPrice * i.qty),
      sub: i.sizes.mode === "standard" ? `talle ${i.sizes.size}` : i.sizes.mode === "custom" ? "a medida" : "talle por whatsapp",
    })),
    { kind: "rule", id: "r1" },
    {
      kind: "row",
      id: "envio",
      label: chosen ? chosen.label.toLowerCase().replace("correo argentino", "correo") : delivery === "correo" ? "correo" : "envío",
      value: envioValue,
      tone: shippingPending ? "muted" : "normal",
    },
    { kind: "row", id: "pago", label: "pago", value: PAYMENT_LABEL[payment as PaymentMethod].toLowerCase(), tone: "muted" },
    { kind: "row", id: "total", label: fromPrice ? "Desde" : "Total", value: formatARS(total) },
    ...(orderNumber ? [{ kind: "row", id: "pedido", label: "pedido nº", value: orderNumber, tone: "bold" } as ReceiptLine] : []),
    ...(wa && revealed
      ? [
          wa.status === "sent"
            ? ({ kind: "row", id: "wa", label: "enviado", value: "x whatsapp", tone: "bold" } as ReceiptLine)
            : ({ kind: "row", id: "wa", label: "listo para", value: "mandar", tone: "bold" } as ReceiptLine),
        ]
      : []),
  ];
  const footer: ReceiptLine[] = [
    ...(fromPrice ? [{ kind: "text", id: "conf", text: "* bren confirma el precio final" } as ReceiptLine] : []),
    ...(waMode ? [{ kind: "text", id: "wa-note", text: "* se confirma por whatsapp" } as ReceiptLine] : []),
    { kind: "text", id: "thanks", text: "* hecho a mano en lanús *", align: "center" },
  ];
  const stamp: ReceiptStamp | null =
    wa && revealed
      ? wa.status === "sent"
        ? { label: "Enviado", icon: "bow", size: "md", celebrate: true }
        : { label: "Listo", icon: "bow", size: "md" }
      : null;

  /* ---------- etiquetas ---------- */
  const submitLabel = waMode
    ? "Enviar pedido por WhatsApp"
    : fromPrice
      ? "Enviar pedido"
      : payment === "mercadopago"
        ? "Pagar con Mercado Pago"
        : "Confirmar pedido";
  const barLabel = waMode ? "Enviar por WhatsApp" : submitLabel;

  /* ---------- render ---------- */
  if (!hydrated) return <CheckoutSkeleton />;
  if (items.length === 0 && !wa) {
    return <EmptyCart suggestions={suggestions} title="Todavía no hay nada para pagar" />;
  }

  const done = Boolean(wa);

  return (
    <div className="grid grid-cols-1 gap-12 pb-28 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16 lg:pb-0">
      <div className="min-w-0">
        {done && wa ? (
          <WhatsAppSent status={wa.status} panelRef={panelRef} />
        ) : (
          <form
            ref={formRef}
            id="checkout-form"
            onSubmit={onSubmit}
            noValidate
            aria-label="Datos del pedido"
            className="min-w-0"
          >
            {/* ---------------- Tus datos ---------------- */}
            <fieldset className="min-w-0">
              <legend className="font-display text-h3 text-ink">Tus datos</legend>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <Field label="Nombre" error={errors.name?.message}>
                  <input className={inputClass} autoComplete="name" enterKeyHint="next" {...form.register("name")} />
                </Field>
                <Field
                  label="WhatsApp"
                  hint="Por acá confirmamos todo. Solo lo usamos para tu pedido."
                  error={errors.whatsapp?.message}
                >
                  <input
                    className={inputClass}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    enterKeyHint="next"
                    placeholder="11 2345 6789"
                    {...form.register("whatsapp")}
                  />
                </Field>
                <Field label="Email (opcional)" error={errors.email?.message} className="md:col-span-2">
                  <input
                    className={inputClass}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    {...form.register("email")}
                  />
                </Field>
              </div>
            </fieldset>

            {/* ---------------- Entrega ---------------- */}
            <fieldset className="border-line mt-[var(--stack-heading)] min-w-0 border-t pt-8">
              <legend className="font-display text-h3 text-ink float-left w-full">Entrega</legend>
              <div className="clear-both grid gap-3 pt-6">
                {local.map((o) => (
                  <OptionCard
                    key={o.method}
                    icon={o.method === "moto" ? "moto" : "train"}
                    title={o.label}
                    description={o.description}
                    pill={o.cost === 0 ? "Gratis" : `${o.from ? "desde " : ""}${formatARS(o.cost)}`}
                    input={<input type="radio" value={o.method} className="peer sr-only" {...form.register("delivery")} />}
                    open={delivery === o.method && o.from === true}
                  >
                    <p className="text-meta text-ink-soft">
                      Arranca en {formatARS(o.cost)} y el final depende de tu barrio: Bren te lo confirma por WhatsApp antes de
                      cobrarte.
                    </p>
                  </OptionCard>
                ))}
                <OptionCard
                  icon="mail"
                  title="Correo Argentino"
                  description="A todo el país: a domicilio o a sucursal, con tu código postal."
                  pill={correoFrom ? `desde ${formatARS(correoFrom)}` : undefined}
                  input={<input type="radio" value="correo" className="peer sr-only" {...form.register("delivery")} />}
                  open={delivery === "correo"}
                >
                  <CorreoQuote
                    quote={quote}
                    error={errors.postalCode?.message ?? (quoteError ? "No pudimos cotizar ese código postal. Revisalo o elegí retiro o moto" : undefined)}
                    correoType={correoType}
                    onType={(t) => form.setValue("correoType", t)}
                    onRetry={() => setRetry((n) => n + 1)}
                    input={
                      <input
                        className={cn(inputClass, "max-w-44 tracking-[0.04em]")}
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={8}
                        placeholder="1824"
                        {...form.register("postalCode")}
                      />
                    }
                  />
                </OptionCard>
              </div>

              {/* Dirección: moto y correo */}
              <Expand open={delivery !== "retiro"}>
                <div className="grid gap-5 pt-6 md:grid-cols-2">
                  <Field label="Calle y número" error={errors.street?.message} className="md:col-span-2">
                    <input
                      className={inputClass}
                      autoComplete="street-address"
                      enterKeyHint="next"
                      placeholder="Ej: Av. Hipólito Yrigoyen 4200, 3° B"
                      {...form.register("street")}
                    />
                  </Field>
                  {delivery === "correo" ? (
                    <>
                      <Field label="Localidad" error={errors.city?.message}>
                        <input className={inputClass} autoComplete="address-level2" enterKeyHint="next" {...form.register("city")} />
                      </Field>
                      <Field label="Provincia (opcional)">
                        <input className={inputClass} autoComplete="address-level1" enterKeyHint="next" {...form.register("province")} />
                      </Field>
                    </>
                  ) : null}
                  <Field label="Indicaciones (opcional)" error={errors.notes?.message} className="md:col-span-2">
                    <textarea className={textareaClass} placeholder="Timbre, horario, una referencia…" {...form.register("notes")} />
                  </Field>
                </div>
              </Expand>
            </fieldset>

            {/* ---------------- Pago ---------------- */}
            <fieldset className="border-line mt-[var(--stack-heading)] min-w-0 border-t pt-8">
              <legend className="font-display text-h3 text-ink float-left w-full">Pago</legend>
              <div className="clear-both grid gap-3 pt-6">
                <OptionCard
                  title="Transferencia"
                  description={`Al alias ${transfer.alias} (${transfer.holder}). Le mandás el comprobante a Bren por WhatsApp.`}
                  input={<input type="radio" value="transferencia" className="peer sr-only" {...form.register("payment")} />}
                />
                <OptionCard
                  title="Efectivo"
                  description="Pagás al recibirlo: en la estación o cuando te lo lleva la moto."
                  hint={cashAllowed ? undefined : "Solo con retiro o moto"}
                  input={
                    <input
                      type="radio"
                      value="efectivo"
                      disabled={!cashAllowed}
                      className="peer sr-only"
                      {...form.register("payment")}
                    />
                  }
                />
                {mpOn ? (
                  <OptionCard
                    title="Mercado Pago"
                    description="Tarjeta, dinero en cuenta o cuotas. Te llevamos a pagar a Mercado Pago."
                    input={<input type="radio" value="mercadopago" className="peer sr-only" {...form.register("payment")} />}
                  />
                ) : null}
              </div>
              {needsConfirmation ? (
                <p className="bg-cream-deep text-ink mt-4 flex items-start gap-2.5 rounded-md px-4 py-3 text-sm">
                  <Icon name="brush" size={18} className="text-bordo mt-0.5" />
                  Tenés un set con notas: Bren confirma el precio final por WhatsApp y después pagás.
                </p>
              ) : null}
            </fieldset>
          </form>
        )}
      </div>

      {/* ---------------- Ticket + botón ---------------- */}
      <aside aria-label="Resumen del pedido" className="h-fit min-w-0 lg:sticky lg:top-[calc(var(--nav-h)+32px)]">
        <Receipt
          title={waMode ? "BF Studio · pedido x whatsapp" : "BF Studio · tu pedido"}
          meta={printedOn}
          lines={lines}
          footer={footer}
          stamp={stamp}
          exit={leaving}
          onExited={go}
          className="mx-auto max-w-[400px]"
        />

        <div className="mx-auto mt-8 max-w-[400px]">
          {done && wa ? (
            <WhatsAppActions
              status={wa.status}
              url={wa.url}
              cleared={cleared}
              onOpen={() => {
                setWa((w) => (w ? { ...w, status: "sent" } : w));
                scheduleReveal();
              }}
              onClear={emptyBag}
            />
          ) : (
            <>
              {waMode ? (
                <p className="bg-cream-deep/80 text-ink mb-4 flex items-center gap-3 rounded-md py-2.5 pr-4 pl-3 text-sm font-medium">
                  <Image src="/brand/kitty.webp" alt="" width={508} height={600} sizes="28px" className="h-auto w-7 shrink-0" />
                  Por ahora cerramos los pedidos por WhatsApp
                </p>
              ) : null}
              <ErrorSummary ref={summaryRef} count={shownErrors} className="mb-4" />
              {serverError ? (
                <p
                  role="alert"
                  className="bg-danger-surface text-red mb-4 flex items-start gap-2 rounded-md px-4 py-3 text-sm font-semibold"
                >
                  <Icon name="alert" size={16} className="mt-0.5" />
                  {serverError}
                </p>
              ) : null}
              <div ref={submitRef}>
                <Button
                  type="submit"
                  form="checkout-form"
                  size="lg"
                  className="w-full"
                  loading={submitting || leaving}
                  iconLeft={waMode ? "whatsapp" : undefined}
                  data-cursor={waMode ? "wsp" : "pagar"}
                >
                  {submitLabel}
                </Button>
              </div>
              <p className="text-meta text-ink-soft mt-3 text-center">
                {waMode
                  ? "Se abre WhatsApp con tu pedido escrito. Bren te confirma y recién ahí pagás."
                  : payment === "mercadopago" && !fromPrice
                    ? "Te llevamos a Mercado Pago para pagar. Después confirmás por WhatsApp."
                    : "Después de este paso le confirmás el pedido a Bren por WhatsApp."}
              </p>
              <NextSteps payment={payment as PaymentMethod} waMode={waMode} mp={mpOn && payment === "mercadopago"} />
            </>
          )}
        </div>
      </aside>

      {!done ? (
        <StickyActionBar watchRef={submitRef} mode="outside" variant="light" label="Confirmar pedido">
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-meta text-ink-soft">{fromPrice ? "Desde" : "Total"}</p>
            <PriceTicker value={total} size="md" className="text-bordo" />
          </div>
          <Button
            type="submit"
            form="checkout-form"
            size="md"
            className="px-5"
            loading={submitting || leaving}
            iconLeft={waMode ? "whatsapp" : undefined}
          >
            {barLabel}
          </Button>
        </StickyActionBar>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------- */

/** Panel que se despliega (grid-rows 0fr → 1fr, 300 ms `--ease-out-expo`); cerrado queda inerte. */
function Expand({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-out-expo)]",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
      inert={!open}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

/**
 * Opción de entrega o de pago: un `<label>` con el radio nativo escondido (`peer sr-only`), así teclado, lectores y
 * tests lo ven como lo que es. Elegida: borde bordó y sombra corta; el punto crece de .5 a 1 en 160 ms. Deshabilitada
 * (efectivo con correo): contraste completo y el motivo abajo. `children` se despliega debajo cuando `open`.
 */
function OptionCard({
  title,
  description,
  pill,
  hint,
  icon,
  input,
  open = false,
  children,
}: {
  title: string;
  description: string;
  pill?: string;
  hint?: string;
  icon?: IconName;
  input: ReactNode;
  open?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-surface border-sand/60 shadow-xs rounded-md border transition-[border-color,box-shadow,background-color] duration-150 ease-[var(--ease-ui)]",
        "has-checked:border-bordo has-checked:shadow-sm",
        "has-disabled:bg-cream-deep/50 has-disabled:shadow-none [@media(hover:hover)]:hover:border-bordo/50",
      )}
    >
      <label
        className={cn(
          "flex cursor-pointer items-start gap-3.5 rounded-[calc(var(--radius-md)-1px)] p-4 transition-[scale] duration-150 active:scale-[0.99]",
          "has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-[var(--focus)] has-focus-visible:outline-solid",
          "has-disabled:cursor-not-allowed has-disabled:active:scale-100",
        )}
      >
        {input}
        {/* punto del radio */}
        <span
          aria-hidden
          className="border-sand peer-checked:border-bordo peer-disabled:border-cream-ink mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 bg-white transition-colors duration-150"
        >
          <span className="bg-bordo size-2.5 scale-50 rounded-full opacity-0 transition-[scale,opacity] duration-[160ms] ease-[var(--ease-ui)] [.peer:checked~span>&]:scale-100 [.peer:checked~span>&]:opacity-100" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="text-ink inline-flex items-baseline gap-2 text-[16px] leading-snug font-semibold">
              {icon ? <Icon name={icon} size={18} className="text-bordo relative top-[3px] shrink-0" /> : null}
              {title}
            </span>
            {pill ? (
              <span className="bg-cream-deep text-bordo tabular rounded-pill shrink-0 px-2.5 py-1 text-[13px] leading-none font-semibold">
                {pill}
              </span>
            ) : null}
          </span>
          <span className="text-meta text-ink-soft mt-1 block">{description}</span>
          {hint ? (
            <span className="text-meta text-ink mt-1.5 flex items-center gap-1.5 font-semibold">
              <Icon name="alert" size={14} className="text-ink-soft" />
              {hint}
            </span>
          ) : null}
        </span>
      </label>
      {children ? (
        <Expand open={open}>
          <div className="px-4 pb-4 sm:pl-[3.375rem]">{children}</div>
        </Expand>
      ) : null}
    </div>
  );
}

/** Correo: código postal → cotización (dos esqueletos mientras tanto) → domicilio o sucursal. */
function CorreoQuote({
  quote,
  error,
  correoType,
  onType,
  onRetry,
  input,
}: {
  quote: Quote;
  error?: string;
  correoType: "domicilio" | "sucursal";
  onType: (t: "domicilio" | "sucursal") => void;
  onRetry: () => void;
  input: ReactNode;
}) {
  const opt = (t: "domicilio" | "sucursal") => quote.options.find((o) => o.method === `correo_${t}`);
  const current = opt(correoType);
  const failed = quote.status === "error";
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Código postal" error={error} className="min-w-0 flex-1">
          {input}
        </Field>
        {failed ? (
          <Button variant="secondary" size="sm" onClick={onRetry} className={cn(error ? "mb-[1.65rem]" : "")}>
            Reintentar
          </Button>
        ) : null}
      </div>
      {quote.status === "loading" ? (
        <AmbientZone aria-label="Cotizando el envío" role="status" className="grid grid-cols-2 gap-2">
          {[0, 1].map((i) => (
            <span
              key={i}
              data-ambient="move"
              className="rounded-pill h-11 animate-[shimmer_1.4s_linear_infinite] bg-[linear-gradient(90deg,var(--cream-200)_0%,var(--cream-50)_50%,var(--cream-200)_100%)] bg-[length:200%_100%]"
            />
          ))}
          <span className="sr-only">Cotizando…</span>
        </AmbientZone>
      ) : (
        <Segmented
          label="Tipo de envío"
          value={quote.status === "ok" ? correoType : null}
          onChange={onType}
          disabled={quote.status !== "ok"}
          options={(["domicilio", "sucursal"] as const).map((t) => ({
            value: t,
            label: (
              <span className="flex flex-col items-center leading-tight">
                <span>{t === "domicilio" ? "A domicilio" : "En sucursal"}</span>
                <span className="tabular text-[13px] font-medium opacity-85">{opt(t) ? formatARS(opt(t)!.cost) : "a cotizar"}</span>
              </span>
            ),
          }))}
          className="py-1"
        />
      )}
      <p className="text-meta text-ink-soft">
        {current?.etaDays
          ? `${current.etaDays[0]} a ${current.etaDays[1]} días hábiles${current.estimated ? " · tarifa estimada" : ""}`
          : failed
            ? "Sin cotización, el envío queda a confirmar."
            : "Cotizamos con tu código postal: los días y el precio salen al toque."}
      </p>
    </div>
  );
}

/** Debajo del botón: qué pasa después, cuándo se paga y la confianza (sin promesas que no estén en los términos). */
function NextSteps({ payment, waMode, mp }: { payment: PaymentMethod; waMode: boolean; mp: boolean }) {
  const steps: { icon: IconName; text: string }[] = [
    { icon: "chat", text: "Confirmás tu pedido con Bren por WhatsApp." },
    { icon: "brush", text: "Lo hace a mano, en general de 3 a 7 días hábiles." },
    { icon: "gift", text: "Lo retirás, te lo lleva la moto o te llega por correo." },
  ];
  const payNote = mp
    ? null
    : waMode
      ? "Todavía no pagás nada: Bren te confirma y recién ahí pagás."
      : payment === "efectivo"
        ? "Todavía no pagás nada: pagás en efectivo cuando lo recibís."
        : "Todavía no pagás nada: el alias te queda a mano en el próximo paso.";
  return (
    <div className="border-line mt-8 border-t pt-6">
      <h3 className="text-ink text-sm font-semibold">Qué pasa después</h3>
      <ol className="mt-3 grid gap-3">
        {steps.map((s) => (
          <li key={s.icon} className="flex items-start gap-3">
            <span className="bg-cream-deep text-bordo grid size-8 shrink-0 place-items-center rounded-full">
              <Icon name={s.icon} size={18} />
            </span>
            <span className="text-ink-soft pt-1.5 text-sm leading-snug">{s.text}</span>
          </li>
        ))}
      </ol>
      <ul className="text-meta text-ink-soft mt-5 grid gap-2">
        {payNote ? (
          <li className="flex items-start gap-2">
            <Icon name="check" size={16} className="text-bordo mt-px" />
            {payNote}
          </li>
        ) : null}
        <li className="flex items-start gap-2">
          <Icon name="check" size={16} className="text-bordo mt-px" />
          Bren te confirma por WhatsApp antes de prepararlo.
        </li>
        <li className="flex items-start gap-2">
          <Icon name="check" size={16} className="text-bordo mt-px" />
          <span>
            Tenés 10 días para{" "}
            <Link href="/arrepentimiento" className="text-bordo font-semibold underline">
              arrepentirte
            </Link>
            .
          </span>
        </li>
        {mp ? (
          <li className="flex items-start gap-2">
            <Icon name="card" size={16} className="text-bordo mt-px" />
            Pago protegido por Mercado Pago.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

/** Antes de hidratar (la bolsita vive en el navegador): la forma del formulario y la impresora en espera. */
function CheckoutSkeleton() {
  const bar =
    "rounded-md bg-[linear-gradient(90deg,var(--cream-200)_0%,var(--cream-100)_50%,var(--cream-200)_100%)] bg-[length:200%_100%] animate-[shimmer_1.6s_linear_infinite]";
  return (
    <AmbientZone aria-hidden className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
      <div className="min-w-0">
        <div data-ambient="move" className={cn(bar, "h-8 w-40")} />
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="grid gap-1.5">
              <div data-ambient="move" className={cn(bar, "h-4 w-20 rounded-xs")} />
              <div data-ambient="move" className={cn(bar, "h-12")} />
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto w-full max-w-[400px]">
        <PrinterHead status="waiting" label="cargando tu pedido" />
      </div>
    </AmbientZone>
  );
}
