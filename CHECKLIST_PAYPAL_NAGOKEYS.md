# ✅ CheckList · PayPal para NagoKeys (hazlo tú, a tu ritmo)

> Todas las contraseñas y accesos quedan **entre tú y tu PayPal / tu servidor**.
> No las pegues en ningún chat. Este checklist solo te ordena los pasos.

---

## FASE 1 · Cuenta y enlaces (10-15 min, online)

- [ ] Crea **PayPal Business** (Cuenta Empresa) con un correo corporativo tipo
      `pagos@nagokeys.com`. Vincula una tarjeta/cuenta bancaria real.
- [ ] Confirma el correo y verifica la identidad (te lo pide PayPal).
- [ ] **Configura el dominio** para el "Pago con PayPal" (opcional pero
      recomendado): en tu cuenta añade `nagokeys.com` y verifica con el
      archivo TXT (un solo `n8n`, no necesitas tocar credenciales).

### Crear los ENLACES DE PAGO (uno por producto)
En el panel: **Centro de ventas → Enlaces de pago → Crear enlace**
  - Windows 11 Home OEM .......... precio 4,99 €
  - Windows 11 Pro OEM ........... precio 4,99 €
  - Windows 11 Pro Retail ........ precio 6,99 €
  - Windows 11 Home Retail ....... precio 5,99 €
  - Pack Windows 11 + McAfee ..... el precio del pack
  - McAfee Antivirus 1 Año ....... precio 1,99 €
  - Crunchyroll (los 4 variantes) . según producto

Cada enlace te dará una URL tipo:
`https://www.paypal.com/ncp/payment/XXXXXXX`
Guárdala en un sitio seguro (notas privadas). **Anota junto a cada URL a qué
producto pertenece.**

- [ ] Opcional: activa en el enlace la casilla **"Recopilar email del cliente"**
      para que nos llegue el correo de entrega sin pasos extra.

---

## FASE 2 · Activar en la web (2 min)

- [ ] Abre `checkout.js` → bloque `PAYPAL_ENLACES`.
- [ ] Windows (Home/Pro, OEM/Retail) y McAfee ya llevan su enlace real.
- [ ] Los 4 PACKS tienen `''`: crea el enlace de cada pack en PayPal
      (Centro de ventas → Enlaces de pago → Crear enlace) y pégalo aquí.
      Hasta entonces su botón avisará de que estará disponible en breve.
- [ ] Guarda y sube el archivo. Los botones "Pagar con PayPal" ya enlazan.

---

## FASE 3 · Automatización n8n (después de tu primera venta PayPal)

Usa el archivo `plantilla-workflow-paypal-nagokeys-n8n.json` (te lo he generado) y
respeta las notas dentro: sustituye `TU_CLIENT_ID` / `TU_CLIENT_SECRET`
(PayPal Developer → Apps) y el texto de los nodos antes de importar.

1. Importa el workflow en tu n8n (importar desde archivo).
2. Rellena las credenciales: SMTP, Google Sheets, Telegram, PayPal API.
3. Activa el workflow. Haz una **venta de prueba** (paypal sandbox) y
   comprueba que llega el webhook, la clave y el aviso de Telegram.
4. Cuando PayPal apruebe la cuenta real, cambia de sandbox a producción.

---

## Nota de seguridad (importante)
- Guarda la contraseña de PayPal y de tu servidor en un gestor (Bitwarden,
  KeePass, 1Password). **Nunca las pegues en el chat de un asistente.**
- El host n8n (nagokeys) ya no debe usar la contraseña en claro: cuando puedas,
  activa la **clave SSH** (acceso por llave) para acceso sin contraseña.
