import { requireAdmin } from "@/lib/admin/auth";
import { hasDb } from "@/lib/db/client";
import { getSettings } from "@/lib/data/settings";
import { ZONE_LABEL, type ShippingZone } from "@/lib/shipping/table";
import { Card, Field as L, Notice, PageTitle, adminCheck, adminInput } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { saveSettings } from "./actions";
import { mpEnabled } from "@/lib/mercadopago";
import { supabaseConfigured } from "@/lib/supabase/server";
import { mailEnabled } from "@/lib/mail";
import { whatsappNotifyEnabled } from "@/lib/whatsapp-notify";

export default async function ConfiguracionPage() {
  await requireAdmin();
  const s = await getSettings();
  const zones = Object.keys(ZONE_LABEL) as ShippingZone[];
  const env = [
    ["Base de datos (Supabase)", hasDb()],
    ["Login admin (Supabase Auth)", supabaseConfigured()],
    ["Mercado Pago", mpEnabled()],
    ["Webhook MP firmado", Boolean(process.env.MP_WEBHOOK_SECRET)],
    ["API MiCorreo (cotización en vivo)", process.env.MICORREO_ENABLED === "true"],
    ["Mails de pedido (clienta y Brenda)", mailEnabled()],
    ["WhatsApp a Brenda por cada pedido", whatsappNotifyEnabled()],
  ] as const;

  return (
    <>
      <PageTitle title="Configuración">Tu WhatsApp, los datos para transferir y lo que cobrás de envío.</PageTitle>
      {!hasDb() && <Notice tone="warn">Sin base de datos: los cambios no se guardan.</Notice>}
      <form action={saveSettings} className="max-w-4xl">
        <div className="space-y-6">
          <Card title="Contacto y pago">
            <div className="grid gap-4 md:grid-cols-3">
              <L label="Tu WhatsApp" hint="549 + código de área + número, sin espacios.">
                <input name="whatsapp" inputMode="numeric" defaultValue={s.whatsapp} className={adminInput} placeholder="5491155551234" />
              </L>
              <L label="Alias para transferencias">
                <input name="transferAlias" defaultValue={s.transferAlias} className={adminInput} />
              </L>
              <L label="Titular">
                <input name="transferHolder" defaultValue={s.transferHolder} className={adminInput} />
              </L>
            </div>
          </Card>
          <Card title="Entregas y envíos">
            <div className="grid gap-4 md:grid-cols-2">
              <L label="Retiro: qué dice" hint="Dónde y cómo se retira.">
                <input name="pickupDescription" defaultValue={s.shipping.pickup.description} className={adminInput} />
              </L>
              <div className="space-y-3">
                <label className={adminCheck}>
                  <input type="checkbox" name="motoEnabled" defaultChecked={s.shipping.moto.enabled} /> Ofrezco envío en moto
                </label>
                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <L label="Precio moto">
                    <input name="motoCost" type="number" inputMode="numeric" min={0} step={1} defaultValue={s.shipping.moto.cost} className={adminInput} />
                  </L>
                  <L label="Moto: qué dice">
                    <input name="motoDescription" defaultValue={s.shipping.moto.description} className={adminInput} />
                  </L>
                </div>
              </div>
            </div>
            <h3 className="mt-6 font-semibold">Correo Argentino por zona</h3>
            <p className="mb-3 text-sm text-ink-soft">Cotizá en MiCorreo y cargá lo que sale. Los días son cuánto tarda en llegar (desde–hasta).</p>
            <div className="divide-y divide-bordo/10">
              {zones.map((z) => (
                <fieldset key={z} className="grid grid-cols-2 gap-3 py-3 md:grid-cols-[1.2fr_1fr_1fr_0.6fr_0.6fr] md:items-end">
                  <legend className="col-span-2 mb-1 font-semibold md:float-left md:col-span-1 md:mb-0 md:self-center">{ZONE_LABEL[z]}</legend>
                  <L label="A domicilio">
                    <input name={`${z}:domicilio`} type="number" inputMode="numeric" min={0} step={1} defaultValue={s.shipping.correo[z].domicilio} className={adminInput} />
                  </L>
                  <L label="A sucursal">
                    <input name={`${z}:sucursal`} type="number" inputMode="numeric" min={0} step={1} defaultValue={s.shipping.correo[z].sucursal} className={adminInput} />
                  </L>
                  <L label="Días desde">
                    <input name={`${z}:etaMin`} type="number" inputMode="numeric" min={0} defaultValue={s.shipping.correo[z].etaDays[0]} className={adminInput} />
                  </L>
                  <L label="hasta">
                    <input name={`${z}:etaMax`} type="number" inputMode="numeric" min={0} defaultValue={s.shipping.correo[z].etaDays[1]} className={adminInput} />
                  </L>
                </fieldset>
              ))}
            </div>
            {s.shipping.updatedAt && <p className="mt-2 text-xs text-ink-soft">Última actualización: {new Date(s.shipping.updatedAt).toLocaleDateString("es-AR")}</p>}
          </Card>
          <Card title="Precios y costos">
            <div className="grid gap-4 md:grid-cols-3">
              <L label="Precio base del set" hint="Lo mismo que en Precios del armador.">
                <input name="basePrice" type="number" inputMode="numeric" min={0} step={1} defaultValue={s.basePrice} className={adminInput} />
              </L>
              <L label="Tu valor hora" hint="Para calcular costos.">
                <input name="hourlyRate" type="number" inputMode="numeric" min={0} step={1} defaultValue={s.hourlyRate} className={adminInput} />
              </L>
              <L label="Ganancia buscada (%)" hint="Para el precio sugerido en Costos.">
                <input name="targetMargin" type="number" inputMode="numeric" min={0} max={95} defaultValue={Math.round(s.targetMargin * 100)} className={adminInput} />
              </L>
            </div>
          </Card>
          <div className="sticky bottom-0 z-10 -mx-4 border-t border-bordo/10 bg-cream/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-lg md:px-0">
            <SubmitButton>Guardar configuración</SubmitButton>
          </div>
        </div>
        <details className="mt-8 rounded-lg bg-white/60 p-4 ring-1 ring-bordo/10">
          <summary className="min-h-9 cursor-pointer font-semibold text-ink-soft">Estado técnico (para Tomás)</summary>
          <div className="mt-3">
          <ul className="space-y-2 text-sm">
            {env.map(([label, ok]) => (
              <li key={label} className="flex items-center justify-between">
                <span>{label}</span>
                <span className={ok ? "font-bold text-emerald-700" : "font-bold text-red"}>{ok ? "activa" : "falta"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink-soft">Se configuran con variables de entorno en Vercel (ver .env.example en el repo).</p>
          </div>
        </details>
      </form>
    </>
  );
}
