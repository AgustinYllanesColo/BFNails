---
name: video-redes
description: Graba un video vertical (reel 9:16, 1080x1920) recorriendo la web de BF Nails para subir a Instagram, TikTok o YouTube Shorts, y escribe el caption. Usar cuando pidan "un video de la página", "un reel", "contenido para redes" o "mostrar la web en Instagram".
---

# Video de la web para redes

## Cómo se graba

1. Correr `pnpm video:reel out/reel` (o `BASE=http://localhost:3000 pnpm video:reel out/reel` contra el dev server). Sale `out/reel/bf-nails-reel.mp4`, 1080x1920, 30 fps, H.264, ~40 s, sin audio.
2. Revisar con una hoja de contactos antes de entregar:
   `ffmpeg -y -i out/reel/bf-nails-reel.mp4 -vf "fps=1/2,scale=270:480,tile=8x3" -frames:v 1 -update 1 out/reel/sheet.png`
   y mirar el último cuadro (`-sseof -0.3`) para confirmar que la tarjeta final con `bf-nails.vercel.app` aparece.
3. Entregar el MP4 y un caption (ver abajo). La música se agrega al subir (Instagram y TikTok ofrecen la biblioteca con licencia; no incrustar canciones comerciales en el archivo).

## Cómo funciona el script (`scripts/video/reel.mjs`)

- Viewport móvil 540x960 con `deviceScaleFactor: 2` y captura por CDP `Page.startScreencast` a 1080x1920. `recordVideo` de Playwright no sirve: graba en píxeles CSS (540x960) y queda borroso.
- Chromium se lanza con `--enable-gpu --use-gl=angle --use-angle=swiftshader`: sin eso la vista 3D del builder (`/disena`) tarda 2-3 s por click.
- Los cortes entre páginas no suman tiempo (segmentos); dentro de cada segmento se respetan las pausas reales. Antes de cada corte se vacía la cola del screencast (`drain`), porque entrega los cuadros con retraso.
- `cutIn()` / `cutOut()` descartan cuadros del segmento actual antes/después de un instante: se usan para saltar la transición catálogo → detalle (muy lenta sin GPU) y los primeros cuadros a baja resolución del detalle.
- Los subtítulos (`caption`) y la tarjeta final (`endCard`) se inyectan en el DOM con los colores de la marca (bordó `#4a0e0e` sobre crema `#fef7e7`) y las fuentes del sitio.
- Guion actual: hero (intro) → puertas uñas/maquillaje → `/maquillaje` → `/catalogo` + detalle + "Agregar al carrito" → `/disena` eligiendo Coffin, Largo, Bordó, Francesita y Strass → tarjeta final. Para cambiar el guion, editar solo el bloque `// --- storyboard ---`.

## Caption

Escribirlo en la voz de la marca (vos, cercano, sin mayúsculas gritadas), con un gancho en la primera línea, una línea por sección mostrada, llamado a la acción con el link en bio y 8-12 hashtags mezclando nicho (#pressonnails #uñaspresson) y zona. Hay un ejemplo en `docs/redes/reel-caption.md`.

## Otros formatos

- 16:9 para YouTube o web: cambiar `viewport` a 960x540 y `maxWidth/maxHeight` a 1920x1080, y en el filtro de ffmpeg `scale=1920:1080`.
- 1:1 para feed: recortar el 9:16 con `-vf "crop=1080:1080:0:420"`.
