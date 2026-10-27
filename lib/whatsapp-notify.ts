import "server-only";

/**
 * Aviso por WhatsApp a Brenda (o a quien esté en WA_NOTIFY_TO) cuando entra un pedido o se acredita un pago.
 * Dos caminos, el primero que esté configurado:
 * - CallMeBot (gratis, para avisos a un número propio): WA_NOTIFY_TO=549... y CALLMEBOT_APIKEY. Brenda activa el
 *   servicio una sola vez mandando "I allow callmebot to send me messages" al número de CallMeBot y recibe su clave.
 * - WhatsApp Cloud API (Meta): WA_CLOUD_TOKEN, WA_CLOUD_PHONE_ID y WA_NOTIFY_TO. Manda texto libre; fuera de la
 *   ventana de 24 h de una conversación abierta, Meta exige una plantilla aprobada (WA_CLOUD_TEMPLATE, un solo
 *   parámetro de texto con el mensaje).
 * Sin configuración, `whatsappNotifyEnabled()` es false y no se manda nada.
 */
export function whatsappNotifyEnabled(): boolean {
  const to = process.env.WA_NOTIFY_TO;
  return Boolean(to && (process.env.CALLMEBOT_APIKEY || (process.env.WA_CLOUD_TOKEN && process.env.WA_CLOUD_PHONE_ID)));
}

export async function sendWhatsapp(text: string): Promise<boolean> {
  if (!whatsappNotifyEnabled()) return false;
  const to = (process.env.WA_NOTIFY_TO ?? "").replace(/\D/g, "");
  if (process.env.CALLMEBOT_APIKEY) {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${to}&apikey=${encodeURIComponent(process.env.CALLMEBOT_APIKEY)}&text=${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`CallMeBot ${res.status}`);
    return true;
  }
  const template = process.env.WA_CLOUD_TEMPLATE;
  const body = template
    ? { messaging_product: "whatsapp", to, type: "template", template: { name: template, language: { code: "es_AR" }, components: [{ type: "body", parameters: [{ type: "text", text }] }] } }
    : { messaging_product: "whatsapp", to, type: "text", text: { body: text } };
  const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WA_CLOUD_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WA_CLOUD_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`WhatsApp Cloud API ${res.status}: ${await res.text()}`);
  return true;
}
