# Restaurar Windows 11 Home (Retail y OEM) a la venta

## Estado actual

| Producto | Estado | Nota |
|---|---|---|
| `Windows 11 Pro Retail` | **Agotado** | Bloqueado el 2026-10-07 |
| `Windows 11 Pro OEM` | **Agotado** | Bloqueado el 2026-10-07 |
| `Pack Windows 11 Pro Retail + McAfee` | **Agotado** | Bloqueado el 2026-10-07 |
| `Pack Windows 11 Pro OEM + McAfee` | **Agotado** | Bloqueado el 2026-10-07 |
| `Windows 11 Home Retail` | **A la venta** | Restaurado el 2026-10-02 |
| `Windows 11 Home OEM` | **A la venta** | Restaurado el 2026-10-01 |

**Los packs se bloquearon tambien**: incluyen la misma clave Pro, asi que si no
hay claves Pro no se pueden entregar.

`PRODUCTOS_AGOTADOS` en `_worker.js` contiene esos 4 productos y sus paginas
(`productos/windows-11-pro-retail.html` y `productos/windows-11-pro-oem.html`)
llevan `data-agotado="1"`, badge rojo "Agotado", aviso rojo en `delivery-info`
y `availability: OutOfStock`.

Para volver a vender cualquiera de ellos, borra su linea de la lista, quita
`data-agotado="1"` de su pagina (y devuelve badge/aviso/schema a como estaban)
y despliega. Los pasos son los mismos para cualquier producto.

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
