# ✅ CheckList · PayPal para NagoKeys (hazlo tú, a tu ritmo)

> Todas las contraseñas y accesos quedan **entre tú y tu PayPal / tu servidor**.
> No las pegues en ningún chat. Este checklist solo te ordena los pasos.

---

## FASE 1 · Cuenta y claves API de PayPal (10-15 min, online)

- [ ] Confirma que tu cuenta **PayPal Business** está verificada.
- [ ] Crea una app en **https://developer.paypal.com → Apps & Credentials**
      y activa el modo **LIVE** (no el sandbox).
- [ ] Anota el **Client ID** y el **Client Secret LIVE**.

### Precios REALES que se cobran (verificados en los enlaces de pago)
  - Windows 11 Home OEM .......... 4,99 €
  - Windows 11 Pro OEM ........... 4,99 €
  - Windows 11 Home Retail ....... 9,99 €
  - Windows 11 Pro Retail ........ 10,99 €
  - McAfee Antivirus 1 Año ....... 7,99 €
  - Pack Home OEM + McAfee ....... 10,49 €
  - Pack Pro OEM + McAfee ........ 10,49 €
  - Pack Home Retail + McAfee .... 15,49 €
  - Pack Pro Retail + McAfee ..... 16,49 €

Estos mismos precios ya están en `PAYPAL_PRECIOS` del Worker y en las
páginas de producto.

---

## FASE 2 · Configurar el Worker en Cloudflare (5 min)

En el panel de Cloudflare (o con `wrangler secret put`), configura:
- `NAGOKEYS_API_KEY`  → la MISMA clave que usan los nodos n8n (ver Fase 4).
- `PAYPAL_CLIENT_ID`  → Client ID LIVE de la app de PayPal.
- `PAYPAL_CLIENT_SECRET` → Client Secret LIVE de la app de PayPal.

Asegúrate de que `wrangler.jsonc` tenga `PAYPAL_SANDBOX: "false"` (ya está
así tras el arreglo) y despliega:

- [ ] `npm install`
- [ ] `npx wrangler deploy`
- [ ] Prueba: `curl "https://nagokeys.com/api/paypal/pedido?id=TEST"` →
      debe responder `{"ok":true,...}` o un error de PayPal, NO
      `"PayPal no configurado"`.

> No subas nunca las credenciales al repositorio. Usa secrets de Cloudflare.

---

## FASE 3 · Importar claves a la BD (D1)

- [ ] Convierte tu hoja/CSV con `node importar-claves.js claves.csv`
      (o usa un archivo SQL) y carga las claves en la tabla `claves`
      de D1 con Estado `Disponible`.
- [ ] Comprueba con `/api/admin/claves` que hay stock.

---

## FASE 4 · Importar el workflow n8n y configurarlo

1. Importa `plantilla-workflow-paypal-nagokeys-n8n.json` en n8n.
2. Configura las credenciales que pida n8n:
   - **SMTP account** (para enviar las claves por email),
   - **Telegram account 2** (para avisos).
3. En n8n → Settings → Variables define:
   - `PAYPAL_LIVE_BASIC` = `base64(ClientID:ClientSecret)` de las credenciales
     LIVE de PayPal (el nodo "Obtener token PayPal" la lee automáticamente).
4. El webhook de entrada (`/webhook/pago-paypal-nagokeys`) debe quedar
   **en modo producción** y el workflow **Activo** (el Worker espera la
   respuesta del último nodo para confirmar el aviso).
5. IMPORTANTE: la `apiKey` la recibe n8n dentro del payload enviado por el
   Worker (campo `apiKey`); debe coincidir con la `NAGOKEYS_API_KEY` de
   Cloudflare. No hay claves hardcodeadas en el repositorio.

---

## FASE 5 · Probar el circuito completo

1. Haz una **venta de prueba** real desde una página de producto.
2. Comprueba que:
   - Se crea la orden en `/api/paypal/crear` y redirige al checkout de PayPal.
   - Al volver a `gracias`, el Worker captura el pago (estado `COMPLETED`).
   - n8n recibe el webhook, rebusca la clave de Windows, la marca como
     **Vendida** y envía el email al cliente con la clave.
3. Si algo falla, revisa los logs del Worker (Cloudflare → Workers → Logs)
   y el historial de ejecución en n8n.

---

## Nota de seguridad (importante)
- Guarda las contraseñas en un gestor (Bitwarden, KeePass, 1Password).
  **Nunca las pegues en el chat de un asistente.**
- El host n8n no debe usar contraseña en claro: activa la **clave SSH**.
- No subas al repositorio ningún secret (Client ID/Secret, apiKey).