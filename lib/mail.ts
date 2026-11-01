import "server-only";
import nodemailer from "nodemailer";

/**
 * Envío de mails transaccionales (pedido recibido, pago confirmado). Dos proveedores, el primero que esté
 * configurado:
 * - Resend: RESEND_API_KEY (y MAIL_FROM con un remitente del dominio verificado).
 * - SMTP (por ejemplo Gmail con contraseña de aplicación): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.
 * Sin ninguno, `mailEnabled()` es false y los avisos se saltean sin romper el pedido.
 */
export type Mail = { to: string | string[]; subject: string; text: string; html?: string; replyTo?: string };

export function mailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS));
}

export function mailFrom(): string {
  return process.env.MAIL_FROM ?? (process.env.SMTP_USER ? `BF Nails Studio <${process.env.SMTP_USER}>` : "BF Nails Studio <onboarding@resend.dev>");
}

/** A quién le llega el aviso interno de cada pedido: ORDER_NOTIFY_EMAILS o, si falta, los admins. */
export function notifyEmails(): string[] {
  return (process.env.ORDER_NOTIFY_EMAILS ?? process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

export async function sendMail(mail: Mail): Promise<boolean> {
  const to = Array.isArray(mail.to) ? mail.to.filter(Boolean) : [mail.to].filter(Boolean);
  if (to.length === 0 || !mailEnabled()) return false;
  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: mailFrom(), to, subject: mail.subject, text: mail.text, html: mail.html, reply_to: mail.replyTo }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return true;
  }
  const port = Number(process.env.SMTP_PORT ?? 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // los defaults de nodemailer son de minutos: un SMTP colgado no puede dejar esperando al pedido
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  await transport.sendMail({ from: mailFrom(), to, subject: mail.subject, text: mail.text, html: mail.html, replyTo: mail.replyTo });
  return true;
}
