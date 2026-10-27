# Cómo cerrar pagos online, Correo Argentino y avisos

Lo que hay que conseguir, paso a paso, y qué variable de Vercel carga cada cosa. Todo el código ya está
programado y publicado: cuando se cargan las variables (Vercel → bf-nails → Settings → Environment Variables,
marcar Production y Preview, y después Deployments → último → Redeploy) queda activo sin tocar nada más.

## 1. Mercado Pago (tarjetas, dinero en cuenta, cuotas)

Con la cuenta personal de Brenda (la misma donde quiere recibir la plata). Son 10 minutos.

1. Entrar a https://www.mercadopago.com.ar/developers/panel/app con la cuenta de Brenda.
2. **Crear aplicación**: nombre "BF Nails Studio", tipo de solución "Pagos online", plataforma "No" (no usa
   plataforma de e-commerce), producto **Checkout Pro**. Aceptar y crear.
3. En el menú lateral de la aplicación, **Credenciales** → arriba cambiar a **Producción** → **Activar ambiente de
   producción**: completar el rubro ("Belleza y cuidado personal" o similar), el sitio
   `https://bf-nails.vercel.app`, aceptar privacidad y términos → Activar.
4. Copiar el **Access Token** de producción (empieza con `APP_USR-`). Esa es la variable `MP_ACCESS_TOKEN`.
5. Menú lateral → **Webhooks** (o "Configuración de Webhooks") → switch en **Producción** → URL:
   `https://bf-nails.vercel.app/api/webhooks/mercadopago` → tildar el evento de **Pagos** (si el panel muestra
   "Order (Mercado Pago)" en lugar de "Pagos", tildar ese) → Guardar.
6. En esa misma pantalla, **Firma secreta** → revelar y copiar. Esa es la variable `MP_WEBHOOK_SECRET`.
7. Cargar las dos variables en Vercel y redeployar. En el checkout aparece "Mercado Pago" como primera opción y
   la clienta paga con tarjeta, dinero en cuenta o cuotas; al acreditarse, el pedido pasa solo a "pagado" y salen
   los avisos.

Para probar sin plata real: antes del paso 3, con el selector en **Prueba**, hay un Access Token de prueba
(`TEST-...`) que se puede cargar en Preview y pagar con las tarjetas de prueba del panel.

## 2. Correo Argentino en vivo (MiCorreo)

Según el manual oficial de la API MiCorreo (correoargentino.com.ar/MiCorreo/public/img/pag/apiMiCorreo.pdf),
no hace falta cuenta de empresa: el registro es como consumidor final con **DNI** (el CUIT es solo para
monotributistas o responsables inscriptos). Lo que sí hay que pedir son las credenciales de API, que Correo
entrega por separado para test y producción.

1. Tener la cuenta MiCorreo de Brenda (la de Paq.ar sirve: es la misma plataforma). Si no está, registrarse en
   https://www.correoargentino.com.ar/MiCorreo/public/ con DNI, email y clave.
2. Pedir las credenciales de API: en la página de MiCorreo, sección "Integrá tu tienda" / "API" → **Formulario de
   contacto** (pide nombre o razón social, CUIT/CUIL, email, teléfono, sitio web y motivo). Motivo sugerido:
   "Solicito credenciales de la API MiCorreo (ambiente productivo) para cotizar e imputar envíos desde mi tienda
   https://bf-nails.vercel.app. Usuario MiCorreo: <email de Brenda>". Un ejecutivo comercial responde con
   **usuario** y **password** de API (HTTP Basic) para test y para producción.
3. Cargar en Vercel:
   - `MICORREO_ENABLED=true`
   - `MICORREO_USER` y `MICORREO_PASSWORD`: las credenciales de API que manda Correo.
   - `MICORREO_ACCOUNT_EMAIL` y `MICORREO_ACCOUNT_PASSWORD`: el email y la clave con los que Brenda entra a
     MiCorreo. El sitio obtiene solo el `customerId` llamando a `/users/validate`. (Si Correo lo manda, se puede
     cargar directo como `MICORREO_CUSTOMER_ID`.)
   - `MICORREO_ORIGIN_POSTAL_CODE=1826` (Remedios de Escalada) o el CP desde donde despacha.
   - Para probar primero contra test: `MICORREO_BASE_URL` con la URL de test que indique Correo.
4. Redeployar. El checkout pasa a cotizar en vivo domicilio y sucursal con el precio real de Paq.ar; si la API
   no responde, vuelve sola a la tabla por zona que hay hoy.

Mientras no estén las credenciales, la tabla por zona (Admin → Configuración) sigue funcionando: conviene
actualizarla con los precios actuales de Paq.ar cada tanto.

## 3. Mails de pedido (Gmail bf.nailstudio@gmail.com)

1. En la cuenta de Google bf.nailstudio@gmail.com: Seguridad → activar **Verificación en dos pasos**.
2. Seguridad → **Contraseñas de aplicaciones** (https://myaccount.google.com/apppasswords) → nombre "BF Nails
   web" → Crear. Copiar los 16 caracteres.
3. Variables: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=bf.nailstudio@gmail.com`,
   `SMTP_PASS=<los 16 caracteres>`, `MAIL_FROM="BF Nails Studio <bf.nailstudio@gmail.com>"`.
   `ORDER_NOTIFY_EMAILS` ya está cargada con los mails de Brenda y Tomás.

## 4. WhatsApp a Brenda por cada pedido (CallMeBot, gratis)

1. Brenda agrega a sus contactos el número **+34 644 71 81 99** (CallMeBot).
2. Le manda por WhatsApp exactamente: `I allow callmebot to send me messages`.
3. Le responde con su **apikey** (un número). Variables: `WA_NOTIFY_TO=549<área><número>` (el de Brenda, sin
   el 15) y `CALLMEBOT_APIKEY=<apikey>`.

Con eso cada pedido nuevo y cada pago acreditado le llegan a Brenda por WhatsApp y por mail, y a la clienta
por mail.
