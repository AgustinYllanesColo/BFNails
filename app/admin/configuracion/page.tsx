import { requireAdmin } from "@/lib/admin/auth";
import { hasDb } from "@/lib/db/client";
import { getSettings } from "@/lib/data/settings";
import { ZONE_LABEL, type ShippingZone } from "@/lib/shipping/table";
import { Card, PageTitle, adminBtn, adminInput, tableClass } from "@/components/admin/ui";
import { saveSettings } from "./actions";
import { mpEnabled } from "@/lib/mercadopago";
import { supabaseConfigured } from "@/lib/supabase/server";

export default async function ConfiguracionPage() {
  await requireAdmin();
  const s = await getSettings();
  const zones = Object.keys(ZONE_LABEL) as ShippingZone[];
  const env = [
    ["Base de datos (Supabase)", hasDb()],
    ["Login admin (Supabase Auth)", supabaseConfigured()],
    ["Mercado Pago", mpEnabled()],
    ["Webhook MP firmado", Boolean(process.env.MP_WEBHOOK_SECRET)],
    ["API MiCorreo", process.env.MICORREO_ENABLED === "true"],
  ] as const;

  return (
    <>
      <PageTitle title="Configuración">Precios, contacto y tarifas de envío. {!hasDb() && "Sin base de datos no se guarda."}</PageTitle>
      <form action={saveSettings} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card title="Precios y costos">
            <div className="grid gap-4 md:grid-cols-3">
              <L label="Precio base del set">
                <input name="basePrice" type="number" step={100} defaultValue={s.basePrice} className={adminInput} />
              </L>
              <L label="Valor hora de Bren">
                <input name="hourlyRate" type="number" step={100} defaultValue={s.hourlyRate} className={adminInput} />
              </L>
              <L label="Margen objetivo (%)">
                <input name="targetMargin" type="number" min={0} max={95} defaultValue={Math.round(s.targetMargin * 100)} className={adminInput} />
              </L>
            </div>
          </Card>
          <Card title="Contacto y pago">
            <div className="grid gap-4 md:grid-cols-3">
              <L label="WhatsApp (549 + área + número)">
                <input name="whatsapp" defaultValue={s.whatsapp} className={adminInput} placeholder="5491155551234" />
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
              <L label="Retiro en estación: texto">
                <input name="pickupDescription" defaultValue={s.shipping.pickup.description} className={adminInput} />
              </L>
              <div className="grid grid-cols-[auto_1fr_1fr] items-end gap-3">
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <input type="checkbox" name="motoEnabled" defaultChecked={s.shipping.moto.enabled} /> Moto
                </label>
                <L label="Precio moto">
                  <input name="motoCost" type="number" step={100} defaultValue={s.shipping.moto.cost} className={adminInput} />
                </L>
                <L label="Texto moto">
                  <input name="motoDescription" defaultValue={s.shipping.moto.description} className={adminInput} />
                </L>
              </div>
            </div>
            <p className="mt-5 mb-2 text-xs font-bold tracking-wider text-ink-soft uppercase">Correo Argentino por zona (cotizá en MiCorreo y cargá acá)</p>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>Zona</th>
                  <th>A domicilio</th>
                  <th>A sucursal</th>
                  <th>Días (min–máx)</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z}>
                    <td className="font-semibold">{ZONE_LABEL[z]}</td>
                    <td>
                      <input name={`${z}:domicilio`} type="number" step={100} defaultValue={s.shipping.correo[z].domicilio} className={adminInput + " w-32"} />
                    </td>
                    <td>
                      <input name={`${z}:sucursal`} type="number" step={100} defaultValue={s.shipping.correo[z].sucursal} className={adminInput + " w-32"} />
                    </td>
                    <td className="flex gap-2">
                      <input name={`${z}:etaMin`} type="number" defaultValue={s.shipping.correo[z].etaDays[0]} className={adminInput + " w-16"} />
                      <input name={`${z}:etaMax`} type="number" defaultValue={s.shipping.correo[z].etaDays[1]} className={adminInput + " w-16"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {s.shipping.updatedAt && <p className="mt-2 text-xs text-ink-soft">Última actualización: {new Date(s.shipping.updatedAt).toLocaleDateString("es-AR")}</p>}
          </Card>
          <button className={adminBtn} disabled={!hasDb()}>
            Guardar configuración
          </button>
        </div>
        <Card title="Integraciones">
          <ul className="space-y-2 text-sm">
            {env.map(([label, ok]) => (
              <li key={label} className="flex items-center justify-between">
                <span>{label}</span>
                <span className={ok ? "font-bold text-emerald-700" : "font-bold text-red"}>{ok ? "activa" : "falta"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink-soft">Se configuran con variables de entorno en Vercel (ver .env.example en el repo).</p>
        </Card>
      </form>
    </>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-bold tracking-wider text-ink-soft uppercase">{label}</span>
      {children}
    </label>
  );
}
