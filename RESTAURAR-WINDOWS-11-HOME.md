# Restaurar Windows 11 Home (Retail y OEM) a la venta

## Estado actual

| Producto | Estado | Nota |
|---|---|---|
| `Windows 11 Home OEM` | **A la venta** | Restaurado el 2026-10-01 |
| `Windows 11 Home Retail` | **A la venta** | Restaurado el 2026-10-02 |

**Ahora mismo no hay ningun producto agotado**: `PRODUCTOS_AGOTADOS` esta
vacia en `_worker.js`. Este documento queda como guia por si hay que volver a
bloquear alguno mas adelante (los pasos son los mismos para cualquier producto).

Si algun dia hay que bloquear uno, escribe su nombre en la lista, pon
`data-agotado="1"` en su pagina y despliega. Para quitar el bloqueo, borra su
linea de la lista, quita el atributo y despliega.

---

## Como volver a bloquear un producto (por si hace falta)

### 1. Bloquear en el Worker (OBLIGATORIO)

Archivo: `_worker.js`

Anade el nombre exacto del producto (tal cual aparece en `PAYPAL_PRECIOS`)
en la lista `PRODUCTOS_AGOTADOS`:

```js
const PRODUCTOS_AGOTADOS = [
  'Windows 11 Home Retail',
  // 'Nombre exacto del producto tal cual aparece en PAYPAL_PRECIOS',
];
```

Despues despliega:

```
npx --yes wrangler deploy --name nagokeysgithub
```

Comprobacion: `POST /api/paypal/crear` con ese producto devuelve `409` y
**no crea ninguna orden en PayPal**.

### 2. Marcarlo en la pagina de producto

Anade `data-agotado="1"` al div del boton:

```html
<!-- AGOTADO -->
<div class="checkout-paypal-anchor" data-producto="Windows 11 Home Retail" data-input-id="email-home-retail" data-agotado="1"></div>

<!-- A LA VENTA -->
<div class="checkout-paypal-anchor" data-producto="Windows 11 Home Retail" data-input-id="email-home-retail"></div>
```

Con el atributo, `checkout.js` sustituye el boton de PayPal por el aviso gris
de "Agotado" (no hay que tocar el HTML a mano).

Aprovecha el mismo momento para anadir el resto de marcas:

| Cambio | Buscar y sustituir |
|---|---|
| Badge | `<span class="stock-badge">En Stock</span>` -> `<span class="stock-badge agotado">Agotado</span>` |
| Aviso rojo | Anadir en el bloque `delivery-info`: `<p style="color:#c0392b;"><strong>⛔ Agotado temporalmente:</strong> Ya no se puede comprar este producto. Estamos reponiendo stock; vuelve pronto.</p>` |
| Google | `"availability": "https://schema.org/InStock"` -> `"availability": "https://schema.org/OutOfStock"` |

Badges originales antes de marcarlos: Retail `En Stock`, OEM `Oferta Flash`.

### 3. Deploy y verificacion

```
npx --yes wrangler deploy --name nagokeysgithub
```

En la pagina del producto debe verse el badge rojo "Agotado" y el aviso gris
en lugar del boton "Pagar con PayPal".

---

## Nota: la lista tambien sirve para otros productos

`PRODUCTOS_AGOTADOS` acepta cualquier clave de `PAYPAL_PRECIOS` (mismo texto
exacto). Anadir un producto es escribir su nombre en la lista; para ponerlo a
la venta de nuevo es borrar su linea y desplegar.

---

## 3. Deploy y verificacion

```
npx --yes wrangler deploy --name nagokeysgithub
```

En la pagina del producto debe verse el badge rojo "Agotado" y el aviso gris
en lugar del boton "Pagar con PayPal".

---

## Nota: la lista tambien sirve para otros productos

`PRODUCTOS_AGOTADOS` acepta cualquier clave de `PAYPAL_PRECIOS` (mismo texto
exacto). Anadir un producto es escribir su nombre en la lista; para ponerlo a
la venta de nuevo es borrar su linea y desplegar.
