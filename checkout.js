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
