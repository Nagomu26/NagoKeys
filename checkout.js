function comprarProducto(producto, inputId, btnEl) {
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById('error-' + inputId);
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
   Si creas un producto nuevo: crea el enlace en PayPal y añádelo aquí.
   ===================================================================== */
var PAYPAL_ENLACES = {
    'Windows 11 Home OEM':   'https://www.paypal.com/ncp/payment/KZW83TJYSCZGU',
    'Windows 11 Home Retail': 'https://www.paypal.com/ncp/payment/J6AUSPCNQ8QW4',
    'Windows 11 Pro OEM':    'https://www.paypal.com/ncp/payment/2F4NJSFRFVHKY',
    'Windows 11 Pro Retail':  'https://www.paypal.com/ncp/payment/Z2ZCYLBCAQXJS',
    'McAfee Antivirus 1 Año': 'https://www.paypal.com/ncp/payment/6GD4CGVF9FPMW'
};

function pagarConPaypal(producto, btnEl) {
    var enlace = PAYPAL_ENLACES[producto];
    if (!enlace || enlace.indexOf('COLOCA_AQUI') === 0) {
        if (btnEl) {
            btnEl.innerHTML = 'PayPal disponible en breve';
            setTimeout(function () { location.reload(); }, 2200);
        }
        return;
    }
    var email = '';
    var input = btnEl && btnEl.closest('.checkout-box')
        ? btnEl.closest('.checkout-box').querySelector('input[type=email]')
        : null;
    if (input) email = input.value.trim();
    if (email) {
        try { localStorage.setItem('nagokeys_email', email); } catch (e) { }
    }
    window.open(enlace, '_blank');
}

function inyectarBotonesPaypal() {
    var botones = document.querySelectorAll('button[onclick*="comprarProducto"]');
    for (var i = 0; i < botones.length; i++) {
        var btn = botones[i];
        var m = btn.getAttribute('onclick').match(/comprarProducto\(\s*'([^']+)'/);
        if (!m) continue;
        var producto = m[1];
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
        nuevo.addEventListener('click', function (ev) {
            var p = ev.currentTarget.getAttribute('data-producto');
            pagarConPaypal(p, ev.currentTarget);
        });
        nuevo.setAttribute('data-producto', producto);
        btn.parentNode.insertBefore(nuevo, btn.nextSibling);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inyectarBotonesPaypal);
} else {
    inyectarBotonesPaypal();
}
