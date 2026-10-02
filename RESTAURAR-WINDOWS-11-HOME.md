# Restaurar Windows 11 Home (Retail y OEM) a la venta

## Estado actual

| Producto | Estado | Nota |
|---|---|---|
| `Windows 11 Home OEM` | **A la venta** | Restaurado el 2026-10-01 |
| `Windows 11 Home Retail` | **Agotado** | Sigue bloqueado |

Para volver a poner **Retail** a la venta, sigue los pasos de abajo. Los pasos
son los mismos para cualquier producto: solo cambia el nombre.

Son 3 sitios, todos marcados con `AGOTADO` o con comentarios evidentes.
El paso 1 es el obligatorio: sin el, se puede comprar igual.

---

## 1. Quitar el bloqueo en el Worker (OBLIGATORIO)

Archivo: `_worker.js`

En `productos/windows-11-home-retail.html` el producto bloqueado se llama
`Windows 11 Home Retail`. Quita su linea de `PRODUCTOS_AGOTADOS`:

```js
const PRODUCTOS_AGOTADOS = [
  'Windows 11 Home Retail',   // <- borra esta linea
  // 'Windows 11 Home OEM',   // <- disponible otra vez desde 2026-10-01
];
```

Dejalo asi:

```js
const PRODUCTOS_AGOTADOS = [
  // sin productos bloqueados
];
```

Despues despliega (esto es lo que hace que se pueda volver a comprar):

```
npx --yes wrangler deploy --name nagokeysgithub
```

Comprobacion: `POST /api/paypal/crear` con `Windows 11 Home Retail` ya no
devuelve `409`, crea la orden en PayPal y sale `checkoutUrl`.

---

## 2. Quitar el aviso de la pagina de producto

Archivo: `productos/windows-11-home-retail.html`
(para el OEM seria `productos/windows-11-home-oem.html`, mismo cambio)

En el, borra el atributo `data-agotado="1"` del div del boton:

```html
<!-- ANTES (agotado) -->
<div class="checkout-paypal-anchor" data-producto="Windows 11 Home Retail" data-input-id="email-home-retail" data-agotado="1"></div>

<!-- DESPUES (a la venta) -->
<div class="checkout-paypal-anchor" data-producto="Windows 11 Home Retail" data-input-id="email-home-retail"></div>
```

Con esto el boton de PayPal vuelve a aparecer solo (lo inyecta `checkout.js`).

Aprovecha el mismo momento para quitar el resto de marcas de agotado:

| Cambio | Buscar y sustituir |
|---|---|
| Badge | `<span class="stock-badge agotado">Agotado</span>` -> `<span class="stock-badge">En Stock</span>` |
| Aviso rojo | Borrar el `<p style="color:#c0392b;"><strong>⛔ Agotado temporalmente:...` |
| Google | `"availability": "https://schema.org/OutOfStock"` -> `"availability": "https://schema.org/InStock"` |

El badge de Retail decia `En Stock` y el del OEM `Oferta Flash` antes de
marcarlos como agotados. Pon el que te gusto en su momento.

---

## 3. Deploy y verificacion

```
npx --yes wrangler deploy --name nagokeysgithub
```

Comprueba en `https://nagokeys.com/productos/windows-11-home-oem` que:

- aparece el boton "Pagar con PayPal" (no el aviso gris de Agotado),
- el badge ya no dice Agotado,
- no sale el aviso rojo.

Y que el boton lleva a PayPal de verdad (no a un error 409).

---

## Nota: la lista tambien sirve para otros productos

`PRODUCTOS_AGOTADOS` acepta cualquier clave de `PAYPAL_PRECIOS` (mismo texto
exacto). Anadir un producto es escribir su nombre en la lista; para ponerlo a
la venta de nuevo es borrar su linea y desplegar.
