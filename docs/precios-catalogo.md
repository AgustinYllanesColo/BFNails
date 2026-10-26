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
4. **Precio propuesto = el mayor entre el piso por costo y la cotización del armador, con tope de $24.000** (decisión
   de Brenda: un diseño del catálogo no pasa de ahí por más técnicas que lleve). Cuando manda el piso, es señal
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
| Polka flower | Francesita, Flor 3D, Puntitos | $3.814 | 91 | $12.914 | $17.500 | $23.000 | $22.000 | **$23.000** | +1.000 |
| Pink dots | Puntitos | $3.425 | 69 | $10.325 | $14.000 | $13.000 | $17.000 | **$14.000** | -3.000 |
| Lila perlas | Perlado | $3.411 | 65 | $9.911 | $13.500 | $14.500 | $17.000 | **$14.500** | -2.500 |
| Black snake | Glitter, Dije Serpiente dorada con strass ×2 | $3.687 | 77 | $11.387 | $15.500 | $15.500 | $19.000 | **$15.500** | -3.500 |
| Black stiletto | Degradé / babyboomer | $3.648 | 78 | $11.448 | $15.500 | $14.000 | $18.000 | **$15.500** | -2.500 |
| Black leo | Animal print | $3.521 | 75 | $11.021 | $15.000 | $15.000 | $17.000 | **$15.000** | -2.000 |
| Francesita glitter | Francesita, Glitter | $3.707 | 83 | $12.007 | $16.500 | $18.500 | $16.500 | **$18.500** | +2.000 |
| Verde oliva | liso | $3.323 | 60 | $9.323 | $12.500 | $12.000 | $13.000 | **$12.500** | -500 |
| Violeta | liso | $3.323 | 60 | $9.323 | $12.500 | $12.000 | $13.000 | **$12.500** | -500 |
| Pink babyboomer | Degradé / babyboomer, Glitter | $3.903 | 88 | $12.703 | $17.000 | $19.500 | $17.000 | **$19.500** | +2.500 |
| Pink wave | Glitter, Strass, Ondas | $3.917 | 103 | $14.217 | $19.000 | $21.000 | $21.000 | **$21.000** | 0 |
| Milky star | Puntitos, Estrellitas | $3.419 | 68 | $10.219 | $14.000 | $14.500 | $16.500 | **$14.500** | -2.000 |
| Leo & cherry | Animal print | $3.521 | 75 | $11.021 | $15.000 | $15.000 | $19.500 | **$15.000** | -4.500 |
| Sunset french | Francesita, Degradé / babyboomer | $3.867 | 88 | $12.667 | $17.000 | $20.000 | $17.500 | **$20.000** | +2.500 |
| Bordó aura | Aura | $3.742 | 75 | $11.242 | $15.000 | $15.500 | $18.000 | **$15.500** | -2.500 |
| Leo star gold | Largo: XL, Francesita, Strass, Cadenitas doradas, Animal print, Estrellitas | $6.342 | 110 | $17.342 | $23.500 | $24.500 | $23.000 | **$24.000** | +1.000 |
| Tribal french | Largo: XL, Francesita, Strass, Tribal | $4.316 | 130 | $17.316 | $23.500 | $25.500 | $22.000 | **$24.000** | +2.000 |
| Black french | Francesita, Strass | $3.761 | 90 | $12.761 | $17.500 | $17.500 | $21.000 | **$17.500** | -3.500 |
| Pink zebra | Cat eye, Cebra / tigre | $4.011 | 95 | $13.511 | $18.500 | $19.500 | $18.500 | **$19.500** | +1.000 |
| Candy gems | Francesita, Gemas de colores | $3.957 | 87 | $12.657 | $17.000 | $18.500 | $17.000 | **$18.500** | +1.500 |
| Sunset aurora | Degradé / babyboomer, Efecto aurora / espejo | $3.832 | 90 | $12.832 | $17.500 | $20.000 | $17.000 | **$20.000** | +3.000 |
| Milky pearl | Perlado, Dije Aro piercing ×2 | $3.706 | 74 | $11.106 | $15.000 | $16.500 | $16.500 | **$16.500** | 0 |
| Milky gold | Francesita, Strass, Encapsulado | $4.008 | 99 | $13.908 | $19.000 | $25.000 | $16.000 | **$24.000** | +8.000 |
| Babyboomer | Degradé / babyboomer, Strass | $3.841 | 84 | $12.241 | $16.500 | $18.500 | $14.500 | **$18.500** | +4.000 |
| Gold glitter | Glitter, Cat eye | $3.741 | 78 | $11.541 | $15.500 | $18.000 | $13.500 | **$18.000** | +4.500 |
| Silver cat eye | Francesita, Glitter, Cat eye, Strass, Relieve 3D | $3.816 | 99 | $13.716 | $18.500 | $28.500 | $24.000 | **$24.000** | 0 |
| Pink mix | Francesita, Degradé / babyboomer, Glitter, Strass, Animal print, Ondas, Estrellitas | $4.198 | 118 | $15.998 | $21.500 | $28.000 | $24.000 | **$24.000** | 0 |
| Cherry french | Francesita, Estrellitas | $3.677 | 83 | $11.977 | $16.000 | $17.000 | $17.000 | **$17.000** | 0 |

Suma de los 25 diseños que ya estaban: $441.000 hoy → $450.000 propuesto (+2 %). Los tres sets nuevos (Silver cat
eye, Pink mix y Cherry french, fotos del 26/10) entran con el precio que cotiza el armador para su receta; Silver cat
eye y Pink mix cotizan arriba de $28.000 en el armador, pero quedan en el tope de $24.000, igual que Tribal french,
Milky gold y Leo star gold. Se cargan en la base con `pnpm db:seed` (o el SQL de `pnpm db:seed:sql`), no con los UPDATE de abajo. Suben los sets con técnicas en las 10 uñas (la
francesita y el degradé se cobran por mano) y bajan los que tienen un diseño en pocas uñas (los diseños se cobran
por uña).

## Reglas del armador (lista de precios de Brenda)

- **Forma**: no cambia el precio. **Largo**: solo XL suma, $1.500. **Acabado**: brillo y mate valen lo mismo.
- Cada técnica tiene una unidad. **Por mano**: se cobra por cada mano que la lleve en 2 o más uñas; en una sola uña de
  una mano, el precio de una uña (la mitad, redondeado a $100). **Por uña**: por cada uña que la lleve. **Por set**:
  una vez, vaya donde vaya. En el armador, al tocar una técnica aparecen "Las dos manos", "Mano derecha", "Mano
  izquierda" y "Una uña", el mapa para tocar uñas sueltas, el precio según eso y el color cuando corresponde.

| Técnica | Precio | Unidad | Origen |
|---|---|---|---|
| Francesita (blanca o de color, con color de punta) | $1.500 | por mano | lista |
| Degradé / babyboomer | $2.000 | por mano | lista |
| Cat eye | $1.200 | por mano | lista |
| Aura | $1.700 | por mano | lista |
| Efecto aurora / espejo | $1.500 | por mano | lista |
| Glitter | $1.200 | por mano | sin precio en la lista, se mantuvo |
| Cromado | $500 | por uña | lista |
| Strass (hasta 10) | $1.200 | por set | lista |
| Perlado | $2.500 | por set | sin precio en la lista, se mantuvo |
| Flor 3D | $1.500 | por uña | lista |
| Animal print | $400 | por uña | lista |
| Carey | $450 | por uña | lista |
| Cebra / tigre | $400 | por uña | lista |
| Ondas | $400 | por uña | lista |
| Estrellitas | $400 | por uña | lista |
| Puntitos | $250 | por uña | lista |
| Blooming | $300 | por uña | lista |

Brenda sacó del armador tribal, flores a mano alzada, encapsulado, personajes, dibujo a mano alzada, relieve 3D,
strass full, gemas de colores, perlado y cadenitas: no se ofrecen, pero se siguen cobrando y dibujando en las recetas
del catálogo que las usan (Lila perlas, Milky pearl, Tribal french, Candy gems, Milky gold, Leo star gold), que por
eso tampoco se ofrecen para modificar en el armador. Carey y cromado son nuevas y la vista previa en 3D las dibuja:
el carey como ámbar translúcido con manchas café, el cromado como espejo metálico del color de la base, uña por uña.

## Lo que conviene mirar con Brenda

- **Suben**: Milky gold $16.000 → $25.000 (francesita por mano, strass y encapsulado en las 10 uñas), Gold glitter
  $13.500 → $18.000, Babyboomer $14.500 → $18.500, Tribal french +$3.500, Sunset aurora +$3.000, Sunset french y Pink
  babyboomer +$2.500, Francesita glitter +$2.000.
- **Bajan**: Leo & cherry $19.500 → $15.000 (animal print en 4 uñas son $1.600), Black snake y Black french −$3.500,
  Pink dots −$3.000, Lila perlas, Black stiletto y Bordó aura −$2.500, Black leo y Milky star −$2.000.
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
-- precios por técnica según la lista (la unidad mano/uña/set la pone el código)
UPDATE bfnails.builder_options SET delta = 1500 WHERE id IN ('francesita', 'aurora', 'flor-3d');
UPDATE bfnails.builder_options SET delta = 1200 WHERE id IN ('cat-eye', 'strass', '3d');
UPDATE bfnails.builder_options SET delta = 1700 WHERE id = 'aura';
UPDATE bfnails.builder_options SET delta = 400 WHERE id IN ('animal-print', 'cebra', 'ondas', 'estrellas');
UPDATE bfnails.builder_options SET delta = 250 WHERE id = 'puntitos';
UPDATE bfnails.builder_options SET delta = 300 WHERE id = 'blooming';
UPDATE bfnails.builder_options SET delta = 500 WHERE id = 'tribal';
UPDATE bfnails.builder_options SET delta = 600 WHERE id IN ('flores', 'encapsulado');
UPDATE bfnails.builder_options SET delta = 800 WHERE id = 'personajes';
UPDATE bfnails.builder_options SET delta = 900 WHERE id = 'a-mano';
UPDATE bfnails.builder_options SET label = 'Flor 3D' WHERE id = 'flor-3d';
UPDATE bfnails.builder_options SET label = 'Perlado' WHERE id = 'perlas';
-- carey y cromado son nuevas: aparecen solas con su precio del código hasta que se guarden desde el admin
```

1. Insumos y recetas: `DATABASE_URL=... pnpm db:seed` (o `pnpm db:seed:sql > seed.sql` y pegarlo en el SQL editor de
   Supabase). Los 8 insumos de ejemplo que ya estaban quedan: conviene desactivarlos desde Admin → Insumos.
2. Margen objetivo: Admin → Configuración → 25 %.
3. Precios (o ajustarlos uno por uno desde Admin → Catálogo):

```sql
UPDATE bfnails.designs SET price = 23000, updated_at = now() WHERE slug = 'polka-flower';
UPDATE bfnails.designs SET price = 14000, updated_at = now() WHERE slug = 'pink-dots';
UPDATE bfnails.designs SET price = 14500, updated_at = now() WHERE slug = 'lila-perlas';
UPDATE bfnails.designs SET price = 15500, updated_at = now() WHERE slug = 'black-snake';
UPDATE bfnails.designs SET price = 15500, updated_at = now() WHERE slug = 'black-stiletto';
UPDATE bfnails.designs SET price = 15000, updated_at = now() WHERE slug = 'black-leo';
UPDATE bfnails.designs SET price = 18500, updated_at = now() WHERE slug = 'french-glitter';
UPDATE bfnails.designs SET price = 12500, updated_at = now() WHERE slug = 'verde-oliva';
UPDATE bfnails.designs SET price = 12500, updated_at = now() WHERE slug = 'violeta';
UPDATE bfnails.designs SET price = 19500, updated_at = now() WHERE slug = 'pink-babyboomer';
UPDATE bfnails.designs SET price = 21000, updated_at = now() WHERE slug = 'pink-wave';
UPDATE bfnails.designs SET price = 14500, updated_at = now() WHERE slug = 'milky-star';
UPDATE bfnails.designs SET price = 15000, updated_at = now() WHERE slug = 'leo-cherry';
UPDATE bfnails.designs SET price = 20000, updated_at = now() WHERE slug = 'sunset-french';
UPDATE bfnails.designs SET price = 15500, updated_at = now() WHERE slug = 'bordo-aura';
UPDATE bfnails.designs SET price = 24000, updated_at = now() WHERE slug = 'leo-star-gold';
UPDATE bfnails.designs SET price = 24000, updated_at = now() WHERE slug = 'tribal-french';
UPDATE bfnails.designs SET price = 17500, updated_at = now() WHERE slug = 'black-french';
UPDATE bfnails.designs SET price = 19500, updated_at = now() WHERE slug = 'pink-zebra';
UPDATE bfnails.designs SET price = 18500, updated_at = now() WHERE slug = 'candy-gems';
UPDATE bfnails.designs SET price = 20000, updated_at = now() WHERE slug = 'sunset-aurora';
UPDATE bfnails.designs SET price = 16500, updated_at = now() WHERE slug = 'milky-pearl';
UPDATE bfnails.designs SET price = 24000, updated_at = now() WHERE slug = 'milky-gold';
UPDATE bfnails.designs SET price = 18500, updated_at = now() WHERE slug = 'babyboomer';
UPDATE bfnails.designs SET price = 18000, updated_at = now() WHERE slug = 'gold-glitter';
```
