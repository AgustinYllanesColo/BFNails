# BF Nails Studio

Sitio web + tienda + panel admin para el emprendimiento de uñas press-on soft gel de Brenda (Lanús).

- **Público**: home, catálogo con precios, armador "Diseñá tu set" con precio en vivo, guía de talles, carrito, checkout (Mercado Pago o transferencia), página de pedido con confirmación por WhatsApp.
- **Admin** (`/admin`): resumen, pedidos (estados, tracking, avisos por WhatsApp), catálogo con fotos, opciones y precios del armador, insumos, recetas de costo con rentabilidad y configuración (precios, envíos por zona, contacto).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · GSAP + Lenis + Motion · Supabase (Postgres, Auth, Storage) con Drizzle · Mercado Pago Checkout Pro · Vitest + Playwright.

## Correr en local

```bash
pnpm install
cp .env.example .env.local   # completá lo que tengas; sin nada, corre con datos locales
pnpm dev
```

Sin `DATABASE_URL` el catálogo sale del seed (`lib/data/catalog.ts`) y los pedidos se guardan en `.data/orders.json`. El admin entra sin login en desarrollo.

## Vercel: cómo sale un cambio a `bf-nails.vercel.app`

Cada push a una rama genera un **Preview** con su propia URL (la ves en Vercel → bf-nails → Deployments, o en GitHub en el
commit). **Producción no se publica sola**: hoy el proyecto no tiene una "Production Branch" que coincida con las ramas
del repo, así que hay dos caminos.

- **Publicar un deploy ya hecho (1 minuto)**: Vercel → bf-nails → Deployments → el deploy que querés (fijate el commit)
  → menú `⋯` → **Promote to Production**. Queda en `bf-nails.vercel.app` al instante.
- **Que salga solo en cada push (una vez)**: Vercel → bf-nails → Settings → **Git** → "Production Branch" →
  escribir `claude/peaceful-einstein-bf36wj` → Save. A partir de ahí, cada push a esa rama construye y publica
  producción. (Vercel no vuelve a construir un commit que ya tuvo deploy desde otra rama: los cambios tienen que
  llegar primero a la rama de producción.)

Las variables de entorno se cargan en Settings → **Environment Variables** (marcar Production y Preview) y después
hay que redeployar: Deployments → último → `⋯` → Redeploy. Sin `DATABASE_URL` el sitio funciona, pero los pedidos por
la web quedan apagados ("Pedidos por la web no disponibles") y el catálogo sale del código.

```bash
pnpm lint && pnpm typecheck && pnpm test   # chequeos
pnpm build                                  # build de producción
```

## Puesta en producción (checklist)

1. **Supabase**: la base vive en el esquema `bfnails` del proyecto `gpjmnjlronubqrnfolih` (sa-east-1). La migración y el seed ya están aplicados.
   - `NEXT_PUBLIC_SUPABASE_URL=https://gpjmnjlronubqrnfolih.supabase.co` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API Keys → anon).
   - `DATABASE_URL`: Dashboard → Connect → Transaction pooler (puerto 6543), con la contraseña de la base. `SUPABASE_SERVICE_ROLE_KEY`: Project Settings → API Keys → service_role (solo en Vercel, nunca en el cliente).
   - Para una base nueva: `pnpm db:migrate` aplica `drizzle/*.sql` y `pnpm db:seed` (o `pnpm db:seed:sql` para generar el SQL) carga catálogo, opciones del armador, configuración e insumos de ejemplo.
   - En Authentication → Providers activar **Email** (magic link). En Authentication → URL configuration agregar `https://<dominio>/admin/auth/callback`.
   - `ADMIN_EMAILS=bren@...,tomas@...` define quién entra al panel.
2. **Mercado Pago**: desde la cuenta personal de Brenda en [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers) → "Tus integraciones" → crear aplicación (Checkout Pro). Copiar `MP_ACCESS_TOKEN` (primero el de prueba, después el de producción). En Webhooks configurar `https://<dominio>/api/webhooks/mercadopago` con el evento **Pagos** y copiar la clave en `MP_WEBHOOK_SECRET`.
3. **Transferencias**: `NEXT_PUBLIC_TRANSFER_ALIAS`, `NEXT_PUBLIC_TRANSFER_HOLDER` (o desde Admin → Configuración).
4. **WhatsApp**: `NEXT_PUBLIC_WHATSAPP_NUMBER=549 + área + número` (o desde Admin → Configuración).
5. **Correo Argentino**: cotizar en [MiCorreo](https://www.correoargentino.com.ar/MiCorreo) y cargar la tabla por zona en Admin → Configuración. Si más adelante Correo entrega credenciales de API, setear `MICORREO_ENABLED=true` + `MICORREO_USER/PASSWORD/CUSTOMER_ID` y la cotización pasa a ser en vivo sin tocar código.
6. **Vercel**: importar el repo, cargar las variables, `NEXT_PUBLIC_SITE_URL=https://<dominio>`.

## Estructura

```
app/            rutas públicas, admin y API (checkout, webhook MP, cotización de envío, placeholder)
components/     ui/ motion/ layout/ sections/ catalog/ builder/ cart/ admin/
lib/            pricing.ts (motor de precios), shipping/ (tabla + MiCorreo), mercadopago.ts, whatsapp.ts,
                checkout.ts (validación), data/ (repositorios), db/ (schema Drizzle), admin/
drizzle/        migraciones SQL
scripts/seed.ts seed inicial
tests/unit      Vitest (precios, envíos, MiCorreo, WhatsApp, firma de webhook, talles)
tests/e2e       scripts Playwright de flujo y capturas
```

## Modelo de precios del armador

`precio = base + Σ deltas (forma, largo, acabado, color) + Σ extras + recargo por nivel`.
Cada extra suma puntos de complejidad; los puntos definen el nivel (Simple / Intermedio / Elaborado / Premium) y su recargo. Todo se edita en Admin → Armador. Si la clienta escribe notas libres, el pedido nace **a confirmar** y Brenda fija el precio final antes del pago.

## Precios del catálogo y costos

Cada diseño tiene una receta de costo (`lib/data/recipes.ts`): insumos a precio de Bella Central más minutos de trabajo a valor hora. El precio del catálogo es el mayor entre el piso por costo (margen objetivo, 25 % por defecto) y lo que cotiza el armador para la misma receta; un test lo verifica. Admin → Costos muestra costo, margen y precio sugerido de cada diseño y técnica. El detalle y la propuesta de precios están en `docs/precios-catalogo.md`.
