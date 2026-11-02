# BF Studio — reglas del negocio (leer antes de tocar maquillaje o el admin)

## Combos de maquillaje
- Un combo es solo una oferta armada con productos sueltos. **No tiene stock propio y armarlo no reserva ni descuenta nada.**
- El stock de los productos sueltos solo baja cuando hay una venta:
  - Si se vende el combo, baja lo que trae ese combo.
  - Si se vende un producto suelto, baja solo ese producto (y el combo se ve agotado si ya no alcanza algo de lo que trae).
- Desde el admin se elige qué trae cada combo (productos sueltos y cantidades). El campo stock no aplica a los combos.
- No volver a preguntarle esto a Tomás: ya lo explicó varias veces.

## Admin
- Todo lo de maquillaje se tiene que poder cargar desde el admin, en su propia sección (/admin/maquillaje, como el catálogo de uñas), sin links ni pasos técnicos:
  fotos y videos se suben como archivo. Los videos se achican en el navegador antes de subirse.
- La forma del dibujo no importa (van fotos). El código de proveedor lo administra Claude a partir de los tickets
  de compra (lib/data/makeup.ts), no Brenda.

## Forma de trabajo
- Tomás prefiere que se resuelvan los problemas directamente, sin preguntarle cada paso. Usar siempre las skills.
