/* AVISO: pagos por tarjeta (Mollie) deshabilitados temporalmente.
   Cambia MOLLIE_PAGOS_DESHABILITADOS a false para restaurar el pago. */
const MOLLIE_PAGOS_DESHABILITADOS = true;

function comprarProducto(producto, inputId, btnEl) {
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById('error-' + inputId);

    if (MOLLIE_PAGOS_DESHABILITADOS) {
        return;
    }

    const email = input.value.trim();

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) {
        if (errorEl) {
            errorEl.textContent = 'Introduce un email válido para recibir tu clave.';
            errorEl.style.display = 'block';
        }
        return;
    }
    if (errorEl) errorEl.style.display = 'none';

    const originalHTML = btnEl.innerHTML;
    btnEl.innerHTML = 'Procesando...';
    btnEl.style.pointerEvents = 'none';
    btnEl.style.opacity = '0.7';

    fetch('https://n8n.nagokeys.com/webhook/crear-pago-nagokeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto: producto, email: email })
    })
        .then(function (res) {
            if (!res.ok) throw new Error('Error al crear el pago');
            return res.json();
        })
        .then(function (data) {
            if (data && data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error('No se recibió URL de pago');
            }
        })
        .catch(function () {
            btnEl.innerHTML = originalHTML;
            btnEl.style.pointerEvents = 'auto';
            btnEl.style.opacity = '1';
            if (errorEl) {
                errorEl.textContent = 'Hubo un problema al iniciar el pago. Inténtalo de nuevo.';
                errorEl.style.display = 'block';
            }
        });
}

/* =====================================================================
   PAYPAL · NagoKeys
   Enlaces de Pago (Payment Links) de PayPal creados y configurados.
   El botón abre directamente el enlace de su producto. El email se
   guarda en localStorage para usarlo en la entrega de la clave.

   NOTAS:
   - Crunchyroll ya no se vende (deshabilitado).
   - Los enlaces de los packs se crearon con la API Payment Links
     & Buttons (POST /v1/checkout/payment-resources).
   ===================================================================== */

var PAYPAL_ENLACES = {
    'Windows 11 Home OEM': 'https://www.paypal.com/ncp/payment/KZW83TJYSCZGU',
    'Windows 11 Home Retail': 'https://www.paypal.com/ncp/payment/J6AUSPCNQ8QW4',
    'Windows 11 Pro OEM': 'https://www.paypal.com/ncp/payment/2F4NJSFRFVHKY',
    'Windows 11 Pro Retail': 'https://www.paypal.com/ncp/payment/Z2ZCYLBCAQXJS',
    'McAfee Antivirus 1 Año': 'https://www.paypal.com/ncp/payment/6GD4CGVF9FPMW',
    'Pack Windows 11 Home OEM + McAfee': 'https://www.paypal.com/ncp/payment/PLB-VBCBA9MWEW9A',
    'Pack Windows 11 Home Retail + McAfee': 'https://www.paypal.com/ncp/payment/PLB-HJKNWXJ8D297',
    'Pack Windows 11 Pro OEM + McAfee': 'https://www.paypal.com/ncp/payment/PLB-4V4B83WWN8BQ',
    'Pack Windows 11 Pro Retail + McAfee': 'https://www.paypal.com/ncp/payment/PLB-U2QQUS7BEMRT'
};

function pagarConPaypal(producto, inputId, btnEl) {
    var input = document.getElementById(inputId);
    var errorEl = document.getElementById('error-' + inputId);
    var email = input ? input.value.trim() : '';

    var emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) {
        if (errorEl) {
            errorEl.textContent = 'Introduce un email válido para recibir tu clave.';
            errorEl.style.display = 'block';
        }
        return;
    }
    if (errorEl) errorEl.style.display = 'none';

    var enlace = PAYPAL_ENLACES[producto];
    if (!enlace) {
        if (errorEl) {
            errorEl.textContent = 'El pago con PayPal para este producto estará disponible en breve.';
            errorEl.style.display = 'block';
        }
        return;
    }

    try {
        localStorage.setItem('nagokeys_email', email);
    } catch (e) { }

    var ventana = window.open(enlace, '_blank');
    if (!ventana) {
        window.location.href = enlace;
    }
}

function deshabilitarBotonesMollie() {
    if (!MOLLIE_PAGOS_DESHABILITADOS) return;
    var botones = document.querySelectorAll('button[onclick*="comprarProducto"]');
    for (var i = 0; i < botones.length; i++) {
        var btn = botones[i];
        if (btn.classList.contains('mollie-deshabilitado')) continue;
        btn.classList.add('mollie-deshabilitado');
        btn.style.pointerEvents = 'none';
        btn.style.cursor = 'not-allowed';
        if (!btn.parentNode.querySelector('.mollie-aviso')) {
            var aviso = document.createElement('div');
            aviso.className = 'mollie-aviso';
            aviso.textContent = 'Deshabilitado temporalmente';
            btn.parentNode.insertBefore(aviso, btn.nextSibling);
        }
    }
}

function inyectarBotonesPaypal() {
    var botones = document.querySelectorAll('button[onclick*="comprarProducto"]');
    for (var i = 0; i < botones.length; i++) {
        var btn = botones[i];
        var m = btn.getAttribute('onclick').match(/comprarProducto\(\s*'([^']+)'\s*,\s*'([^']+)'/);
        if (!m) continue;
        var producto = m[1];
        var inputId = m[2];
        if (btn.parentNode && btn.parentNode.querySelector('.btn-paypal-nagokeys')) continue;
        var nuevo = document.createElement('button');
        nuevo.type = 'button';
        nuevo.className = 'btn-buy-big btn-paypal-nagokeys';
        nuevo.setAttribute('style',
            'background:transparent !important; background-color:transparent !important; ' +
            'background-image:none !important; border:2px solid #0070ba; color:#0070ba; ' +
            'box-shadow:none !important;');
        nuevo.innerHTML = '<i class="fab fa-paypal" style="font-size:1.8em; vertical-align:middle; margin-right:10px; ' +
            'color:#003087; position:relative; top:-2px;"></i>Pagar con PayPal ' +
            '<span class="small" style="color:#8a8a8a; display:inline;">Pago seguro · Sin esperas</span>';
        nuevo.setAttribute('data-producto', producto);
        nuevo.setAttribute('data-input-id', inputId);
        nuevo.addEventListener('click', function (ev) {
            var p = ev.currentTarget.getAttribute('data-producto');
            var iid = ev.currentTarget.getAttribute('data-input-id');
            pagarConPaypal(p, iid, ev.currentTarget);
        });
        btn.parentNode.insertBefore(nuevo, btn.nextSibling);
    }
}

function activarCambiosPago() {
    if (MOLLIE_PAGOS_DESHABILITADOS) {
        var style = document.createElement('style');
        style.id = 'mollie-deshabilitado-css';
        style.textContent =
            '.btn-buy-big.mollie-deshabilitado{' +
            'background-color:#d9d9d9 !important;background-image:none !important;' +
            'color:#8a8a8a !important;box-shadow:none !important;' +
            'transform:translateY(0) !important;}' +
            '.mollie-aviso{font-size:0.8em;color:#e67e22;margin:6px 0 6px;font-weight:600;}';
        if (!document.getElementById('mollie-deshabilitado-css')) {
            document.head.appendChild(style);
        }
    }
    inyectarBotonesPaypal();
    deshabilitarBotonesMollie();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', activarCambiosPago);
} else {
    activarCambiosPago();
}