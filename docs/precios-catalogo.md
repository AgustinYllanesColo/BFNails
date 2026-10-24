# Precios del catálogo: cómo se calculan

Propuesta de precios para los 25 diseños del catálogo, armada con tres patas: **insumos** (lo que cuesta lo que lleva
cada set), **tiempo** (minutos activos de Brenda, a valor hora) y **detalle** (las técnicas, según el armador).

## El modelo

1. **Costo = insumos + minutos × valor hora.** Los insumos salen de la receta del diseño (`lib/data/recipes.ts`): el set
   base (12 tips, base rubber, color, top, pegamento, lima, caja y kit de alcohol) más lo que agrega cada técnica,
   escalado por la cantidad de uñas en que va (con un piso del 40 %: preparar el color y el pincel se hace igual para
   2 uñas que para 10). Los minutos son de trabajo activo; el curado y la espera se solapan con otros sets.
2. **Piso de precio = costo ÷ (1 − margen objetivo)**, redondeado hacia arriba a $500. Con valor hora $6.000 y margen
   25 % (lo que queda *después* de pagarse la hora), el set base liso da $12.500; hoy se vende a $12.000 (margen 22 %).
3. **Cotización del armador**: el mismo diseño, armado con las reglas de Brenda (base + técnicas + "trabajo de
   detalle"). Es lo que pagaría una clienta que lo arma ella misma, así que el catálogo no debería estar por debajo.
4. **Precio propuesto = el mayor entre el piso por costo y la cotización del armador.** Cuando manda el piso, es señal
   de que esa técnica está barata en el armador (pasa con tribal, cebra, aurora y los largos XL).

Los precios de los insumos son los de **Bella Central** (bellacentral.com.ar, mayorista de Once, octubre 2026). La
Manola Mayorista tiene la tienda cerrada con contraseña y no se pudieron ver sus precios. Donde Bella Central no informa
la cantidad por pack (perlas, gemas, flores, dijes, rollo de papel oro) o no tiene el producto (glitter), el insumo
queda anotado como estimado: se corrige en Admin → Insumos y la receta se recalcula sola.

## La tabla

Insumos, minutos y costo por set; piso con 25 % de margen; cotización del armador; precio actual y propuesto.

| Diseño | Técnicas | Insumos | Min. | Costo | Piso (25 %) | Armador | Hoy | Propuesto | Dif. |
|---|---|---|---|---|---|---|---|---|---|
| Set base (liso, 10 uñas + kit) | – | $3.323 | 60 | $9.323 | $12.500 | $12.000 | $12.000 | $12.000 | 0 |
| Polka flower | Francesita, Flor 3D, Puntitos | $3.814 | 91 | $12.914 | $17.500 | $24.500 | $22.000 | **$24.500** | +2.500 |
| Pink dots | Puntitos | $3.425 | 69 | $10.325 | $14.000 | $15.000 | $17.000 | **$15.000** | -2.000 |
| Lila perlas | Perlas | $3.411 | 65 | $9.911 | $13.500 | $15.000 | $17.000 | **$15.000** | -2.000 |
| Black snake | Glitter, Dije Serpiente dorada con strass ×2 | $3.687 | 77 | $11.387 | $15.500 | $15.500 | $19.000 | **$15.500** | -3.500 |
| Black stiletto | Degradé / babyboomer | $3.648 | 78 | $11.448 | $15.500 | $14.000 | $18.000 | **$15.500** | -2.500 |
| Black leo | Animal print | $3.521 | 75 | $11.021 | $15.000 | $18.000 | $17.000 | **$18.000** | +1.000 |
| Francesita glitter | Francesita, Glitter | $3.707 | 83 | $12.007 | $16.500 | $18.500 | $16.500 | **$18.500** | +2.000 |
| Verde oliva | liso | $3.323 | 60 | $9.323 | $12.500 | $12.000 | $13.000 | **$12.500** | -500 |
| Violeta | liso | $3.323 | 60 | $9.323 | $12.500 | $12.000 | $13.000 | **$12.500** | -500 |
| Pink babyboomer | Degradé / babyboomer, Glitter | $3.903 | 88 | $12.703 | $17.000 | $19.500 | $17.000 | **$19.500** | +2.500 |
| Pink wave | Glitter, Strass, Ondas | $3.917 | 103 | $14.217 | $19.000 | $23.500 | $21.000 | **$23.500** | +2.500 |
| Milky star | Puntitos, Estrellitas | $3.419 | 68 | $10.219 | $14.000 | $16.500 | $16.500 | **$16.500** | 0 |
| Leo & cherry | Animal print | $3.521 | 75 | $11.021 | $15.000 | $18.000 | $19.500 | **$18.000** | -1.500 |
| Sunset french | Francesita, Degradé / babyboomer | $3.867 | 88 | $12.667 | $17.000 | $20.000 | $17.500 | **$20.000** | +2.500 |
| Bordó aura | Aura | $3.742 | 75 | $11.242 | $15.000 | $16.000 | $18.000 | **$16.000** | -2.000 |
| Leo star gold | Largo: XL, Francesita, Strass, Cadenitas doradas, Animal print, Estrellitas | $6.342 | 110 | $17.342 | $23.500 | $35.000 | $23.000 | **$35.000** | +12.000 |
| Tribal french | Largo: XL, Francesita, Strass, Tribal | $4.316 | 130 | $17.316 | $23.500 | $29.000 | $22.000 | **$29.000** | +7.000 |
| Black french | Francesita, Strass | $3.761 | 90 | $12.761 | $17.500 | $20.000 | $21.000 | **$20.000** | -1.000 |
| Pink zebra | Cat eye, Cebra / tigre | $4.011 | 95 | $13.511 | $18.500 | $22.000 | $18.500 | **$22.000** | +3.500 |
| Candy gems | Francesita, Gemas de colores | $3.957 | 87 | $12.657 | $17.000 | $21.000 | $17.000 | **$21.000** | +4.000 |
| Sunset aurora | Degradé / babyboomer, Efecto aurora / espejo | $3.832 | 90 | $12.832 | $17.500 | $21.500 | $17.000 | **$21.500** | +4.500 |
| Milky pearl | Perlas, Dije Aro piercing ×2 | $3.706 | 74 | $11.106 | $15.000 | $17.000 | $16.500 | **$17.000** | +500 |
| Milky gold | Francesita, Strass, Encapsulado | $4.008 | 99 | $13.908 | $19.000 | $25.500 | $16.000 | **$25.500** | +9.500 |
| Babyboomer | Degradé / babyboomer, Strass | $3.841 | 84 | $12.241 | $16.500 | $19.000 | $14.500 | **$19.000** | +4.500 |
| Gold glitter | Glitter, Cat eye | $3.741 | 78 | $11.541 | $15.500 | $19.000 | $13.500 | **$19.000** | +5.500 |

Suma del catálogo: $441.000 hoy → $489.500 propuesto (+11 %). La suba viene de la regla nueva del armador (cada
técnica se cobra **por mano**): un set con francesita en las 10 uñas paga $3.000 de francesita, no $1.500.

## Reglas del armador (las de Brenda)

- **Forma**: no cambia el precio. **Largo**: solo XL suma, $1.500. **Acabado**: brillo y mate valen lo mismo.
- **Francesita**: una sola técnica, $1.500 por mano, con el color de la punta a elección (blanca si no eligen). La
  "francesita de color" desaparece del armador; los carritos y links viejos que la traían se leen como francesita.
- **Degradé / babyboomer**: $2.000 por mano.
- **Por mano y por uña**: toda técnica se cobra por cada mano que la lleve en 2 o más uñas. Si en una mano va en una
  sola uña, se cobra el precio de una uña (por defecto la mitad del precio por mano, redondeado a $100: francesita
  $800, degradé $1.000). En el armador, al tocar una técnica aparecen las opciones "Las dos manos", "Mano derecha",
  "Mano izquierda" y "Una uña", más el mapa para tocar uñas sueltas y el color cuando corresponde.
- Pendiente de confirmar con Brenda: (1) si el precio de una uña sola es la mitad del de la mano o un valor fijo;
  (2) si **todas** las técnicas van por mano o solo francesita y degradé. Si alguna va "por set", la forma de dejarlo
  es bajar su precio por mano a la mitad en Admin → Armador.

## Lo que conviene mirar con Brenda

- **Suben fuerte** por tener varias técnicas en las 10 uñas: Leo star gold $23.000 → $35.000, Milky gold $16.000 →
  $25.500, Tribal french $22.000 → $29.000, Gold glitter $13.500 → $19.000, Babyboomer y Sunset aurora +$4.500,
  Candy gems +$4.000. Es exactamente lo que cotiza el armador con las reglas nuevas; si parece mucho, el ajuste es
  en el precio por mano de esas técnicas (strass, cat eye, encapsulado, aurora), no en el diseño suelto.
- **Bajan** los sets con una sola técnica en pocas uñas: Black snake $19.000 → $15.500, Black stiletto −$2.500, Pink
  dots, Lila perlas y Bordó aura −$2.000, Leo & cherry −$1.500.
- **Set base**: con estos insumos cuesta $9.300 (de los cuales $6.000 es la hora de Brenda). A $12.000 el margen es 22 %;
  subirlo a $12.500 lo deja en 25 %. Como todo el catálogo se apoya en la base, es la decisión que más mueve.
- **Valor hora**: $6.000/h es el valor cargado en la configuración. Si Brenda considera que su hora vale más, el piso
  sube en proporción (a $8.000/h el set base liso pasa a $15.000).

## Qué cambió en el código

- `lib/data/recipes.ts`: insumos con precios de Bella Central, receta del set base, receta incremental de cada técnica
  del armador y la función que arma la receta completa de un diseño a partir de su preset (uña por uña).
- `lib/data/catalog.ts`: precios del seed actualizados a los propuestos.
- `scripts/seed.ts` y `scripts/seed-sql.ts`: cargan los insumos y las recetas (base, técnicas y diseños) en la base.
  Los insumos se enlazan por nombre y una receta que Brenda ya editó no se pisa. El margen objetivo por defecto pasa de
  55 % a 25 % (el 55 % era sobre un costo sin tiempo y dejaba todo en rojo).
- `lib/admin/costs.ts`: sin base de datos, Admin → Costos muestra las recetas del seed (antes salía "sin receta").
- `tests/unit/recipes.test.ts`: cada diseño del catálogo cubre su costo con el margen objetivo y no cobra menos que el
  armador para la misma receta.
- Los dijes del armador y de la página de dijes tienen el precio nuevo por unidad (de $400 a $1.500; metálicos $1.000,
  Kitty $1.300) y se pueden comprar sueltos desde `/dijes`: entran al carrito por unidad, sin medidas, y el checkout
  los cobra con el precio del servidor. Milky pearl sube a $17.500 porque lleva dos aros piercing que ahora valen $1.000.

## Cómo llevarlo a producción

Los precios del sitio salen de la tabla `bfnails.designs`, no del código. Para aplicar la propuesta:

0. Reglas del armador (largo, acabado, francesita de color): `pnpm db:seed` las actualiza; a mano es

```sql
UPDATE bfnails.builder_options SET delta = 0 WHERE id IN ('largo', 'mate');
UPDATE bfnails.builder_options SET delta = 1500 WHERE id = 'xl';
UPDATE bfnails.builder_options SET active = false WHERE id = 'francesita-color';
```

1. Insumos y recetas: `DATABASE_URL=... pnpm db:seed` (o `pnpm db:seed:sql > seed.sql` y pegarlo en el SQL editor de
   Supabase). Los 8 insumos de ejemplo que ya estaban quedan: conviene desactivarlos desde Admin → Insumos.
2. Margen objetivo: Admin → Configuración → 25 %.
3. Precios (o ajustarlos uno por uno desde Admin → Catálogo):

```sql
UPDATE bfnails.designs SET price = 24500, updated_at = now() WHERE slug = 'polka-flower';
UPDATE bfnails.designs SET price = 15000, updated_at = now() WHERE slug = 'pink-dots';
UPDATE bfnails.designs SET price = 15000, updated_at = now() WHERE slug = 'lila-perlas';
UPDATE bfnails.designs SET price = 15500, updated_at = now() WHERE slug = 'black-snake';
UPDATE bfnails.designs SET price = 15500, updated_at = now() WHERE slug = 'black-stiletto';
UPDATE bfnails.designs SET price = 18000, updated_at = now() WHERE slug = 'black-leo';
UPDATE bfnails.designs SET price = 18500, updated_at = now() WHERE slug = 'french-glitter';
UPDATE bfnails.designs SET price = 12500, updated_at = now() WHERE slug = 'verde-oliva';
UPDATE bfnails.designs SET price = 12500, updated_at = now() WHERE slug = 'violeta';
UPDATE bfnails.designs SET price = 19500, updated_at = now() WHERE slug = 'pink-babyboomer';
UPDATE bfnails.designs SET price = 23500, updated_at = now() WHERE slug = 'pink-wave';
UPDATE bfnails.designs SET price = 16500, updated_at = now() WHERE slug = 'milky-star';
UPDATE bfnails.designs SET price = 18000, updated_at = now() WHERE slug = 'leo-cherry';
UPDATE bfnails.designs SET price = 20000, updated_at = now() WHERE slug = 'sunset-french';
UPDATE bfnails.designs SET price = 16000, updated_at = now() WHERE slug = 'bordo-aura';
UPDATE bfnails.designs SET price = 35000, updated_at = now() WHERE slug = 'leo-star-gold';
UPDATE bfnails.designs SET price = 29000, updated_at = now() WHERE slug = 'tribal-french';
UPDATE bfnails.designs SET price = 20000, updated_at = now() WHERE slug = 'black-french';
UPDATE bfnails.designs SET price = 22000, updated_at = now() WHERE slug = 'pink-zebra';
UPDATE bfnails.designs SET price = 21000, updated_at = now() WHERE slug = 'candy-gems';
UPDATE bfnails.designs SET price = 21500, updated_at = now() WHERE slug = 'sunset-aurora';
UPDATE bfnails.designs SET price = 17000, updated_at = now() WHERE slug = 'milky-pearl';
UPDATE bfnails.designs SET price = 25500, updated_at = now() WHERE slug = 'milky-gold';
UPDATE bfnails.designs SET price = 19000, updated_at = now() WHERE slug = 'babyboomer';
UPDATE bfnails.designs SET price = 19000, updated_at = now() WHERE slug = 'gold-glitter';
```
