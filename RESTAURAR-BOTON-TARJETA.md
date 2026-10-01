# Restaurar el botón de pago por tarjeta (Mollie)

Estos botones se retiraron de las páginas de producto de **Windows** y **McAfee**
(commit `fcf15cf`, 2026-10-01) porque el pago por tarjeta está deshabilitado
globalmente y solo quedaba el aviso rojo **"Deshabilitado temporalmente"** al lado
del botón PayPal.

Motivo del aviso: en `checkout.js` la constante `MOLLIE_PAGOS_DESHABILITADOS = true`
hace que `deshabilitarBotonesMollie()` aplique la clase `mollie-deshabilitado` al
botón y le inserte el div `.mollie-aviso` con el texto "Deshabilitado temporalmente".

## Cómo restaurar

### 1. En cada HTML, sustituir el ancla PayPal por el botón original

Buscar el bloque:

```html
<div class="checkout-paypal-anchor" data-producto="NOMBRE" data-input-id="ID"></div>
```

y sustituirlo por:

```html
<button type="button" class="btn-buy-big"
        onclick="comprarProducto('NOMBRE', 'ID', this)">
        Comprar Ahora
        <span class="small">Pago seguro con tarjeta</span>
    </button>
```

`checkout.js` volverá a inyectar automáticamente el botón "Pagar con PayPal"
justo debajo.

### 2. Tabla de valores por página

| Archivo | Primer botón (producto) | Botón de Pack |
|---|---|---|
| `productos/windows-11-home-oem.html` | `('Windows 11 Home OEM', 'email-home-oem')` | `('Pack Windows 11 Home OEM + McAfee', 'email-pack-home-oem')` |
| `productos/windows-11-home-retail.html` | `('Windows 11 Home Retail', 'email-home-retail')` | `('Pack Windows 11 Home Retail + McAfee', 'email-pack-home-retail')` |
| `productos/windows-11-pro-oem.html` | `('Windows 11 Pro OEM', 'email-pro-oem')` | `('Pack Windows 11 Pro OEM + McAfee', 'email-pack-pro-oem')` |
| `productos/windows-11-pro-retail.html` | `('Windows 11 Pro Retail', 'email-pro-retail')` | `('Pack Windows 11 Pro Retail + McAfee', 'email-pack-pro-retail')` |
| `productos/mcafee-antivirus-1-ano.html` | `('McAfee Antivirus 1 Año', 'email-mcafee')` | — |

El botón de Pack usaba además estilos propios (fondo negro, ancho mínimo 280px):

```html
<button type="button" class="btn-buy-big"
        style="background-color: #1a1a1a; margin: 0; display: inline-block; width: auto; min-width: 280px; padding: 15px 30px; box-shadow: 0 10px 20px rgba(0,0,0,0.15); border-radius: 8px; cursor: pointer; border: none;"
        onclick="comprarProducto('Pack ...', '...', this)">
        Comprar Pack
        <span style="display: block; font-size: 0.8em; font-weight: normal; opacity: 0.8; margin-top: 4px;">Activación inmediata · Soporte 24/7</span>
    </button>
```

### 3. Activar el pago por Mollie de verdad (opcional)

En `checkout.js` cambiar:

```js
const MOLLIE_PAGOS_DESHABILITADOS = true;   // -> false
```

Con `false` el botón de tarjeta se rehabilita y `comprarProducto()` llama al webhook
de n8n (`https://n8n.nagokeys.com/webhook/crear-pago-nagokeys`).

### 4. Alternativa rápida con Git

Volver al estado con los botones de tarjeta:

```bash
git checkout fcf15cf -- productos/windows-11-*.html productos/mcafee-antivirus-1-ano.html
```

> Ojo: ese commit es el estado **anterior** a la eliminación. Si se han hecho más
> cambios después, conviene restaurar solo el fragmento del botón (paso 1).

## Nota

`checkout.js` **no** se modificó al quitar los botones: las funciones
`comprarProducto`, `pagarConPaypal`, `crearBotonPaypal`, `inyectarBotonesPaypal`
y `deshabilitarBotonesMollie` siguen intactas, por lo que la restauración es solo
HTML.
