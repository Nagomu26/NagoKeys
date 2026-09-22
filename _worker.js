export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      if (url.pathname.startsWith('/api/')) {
        return await handleApi(request, env, url);
      }

      if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
        return env.ASSETS.fetch(request);
      }
      return new Response('NagoKeys no disponible en este momento', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    } catch (e) {
      return json({ ok: false, error: String((e && (e.stack || e.message)) || e) }, 500);
    }
  },
};

function json(body, code = 200) {
  return new Response(JSON.stringify(body), {
    status: code,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function corsOk() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-nagokeys-api-key',
      'Access-Control-Max-Age': '86400',
    },
  });
}

async function autorizado(request, env) {
  const secret = env.NAGOKEYS_API_KEY;
  if (!secret) return false;
  return request.headers.get('x-nagokeys-api-key') === secret;
}

async function iniciarTabla(env) {
  await env.DB.batch([
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS claves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Nombre_Producto TEXT NOT NULL,
        Clave_Activacion TEXT NOT NULL UNIQUE,
        Estado TEXT NOT NULL DEFAULT 'Disponible',
        Email_Comprador TEXT,
        Fecha_Venta TEXT,
        creado_en TEXT DEFAULT (datetime('now'))
      )
    `),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_claves_producto_estado ON claves(Nombre_Producto, Estado)'),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS pedidos_paypal (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL UNIQUE,
        producto TEXT NOT NULL,
        email TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'CREADO',
        capture_id TEXT,
        payer_email TEXT,
        importe TEXT,
        creado_en TEXT DEFAULT (datetime('now'))
      )
    `),
  ]);
}

async function handleApi(request, env, url) {
  if (request.method === 'OPTIONS') return corsOk();

  const esPaypal = url.pathname.startsWith('/api/paypal');
  if (!esPaypal) {
    const ok = await autorizado(request, env);
    if (!ok) return json({ ok: false, error: 'No autorizado' }, 401);
  }
  await iniciarTabla(env);

  if (request.method === 'GET' && url.pathname === '/api/keys') {
    const producto = (url.searchParams.get('producto') || '').trim();
    if (!producto) return json({ ok: false, error: 'Falta el parámetro producto' }, 400);
    const res = await env.DB
      .prepare(
        'SELECT id, Nombre_Producto, Clave_Activacion, Estado FROM claves WHERE Estado = ? AND Nombre_Producto = ? ORDER BY id LIMIT 50'
      )
      .bind('Disponible', producto)
      .all();
    return json({ ok: true, keys: res.results || [] });
  }

  if (request.method === 'POST' && url.pathname === '/api/keys/vender') {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ ok: false, error: 'JSON inválido' }, 400);
    }
    const id = Number(body.id);
    const email = (body.email || '').trim();
    if (!Number.isInteger(id) || id <= 0) {
      return json({ ok: false, error: 'Falta el id de la clave' }, 400);
    }
    const res = await env.DB
      .prepare(
        "UPDATE claves SET Estado = 'Vendido', Email_Comprador = ?, Fecha_Venta = datetime('now') WHERE id = ? AND Estado = 'Disponible'"
      )
      .bind(email, id)
      .run();
    if (!(res.meta && res.meta.changes > 0)) {
      return json({ ok: false, error: 'Clave no disponible o no existe' }, 409);
    }
    const row = await env.DB
      .prepare(
        'SELECT id, Nombre_Producto, Clave_Activacion, Estado, Email_Comprador, Fecha_Venta FROM claves WHERE id = ?'
      )
      .bind(id)
      .first();
    return json({ ok: true, ...row });
  }

  if (request.method === 'POST' && url.pathname === '/api/admin/import') {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ ok: false, error: 'JSON inválido' }, 400);
    }
    const claves = body && Array.isArray(body.claves) ? body.claves : [];
    if (!claves.length) return json({ ok: false, error: 'Falta el array claves' }, 400);
    const st = env.DB.prepare('INSERT OR IGNORE INTO claves (Nombre_Producto, Clave_Activacion, Estado) VALUES (?, ?, ?)');
    const batch = claves.map((k) =>
      st.bind(String((k.producto || k.Nombre_Producto) || '').trim(), String((k.clave || k.Clave_Activacion) || '').trim(), 'Disponible')
    );
    const res = await env.DB.batch(batch);
    const insertadas = res.reduce((a, r) => a + (r.meta && r.meta.changes ? r.meta.changes : 0), 0);
    return json({ ok: true, procesadas: claves.length, insertadas });
  }

  if (request.method === 'GET' && url.pathname === '/api/admin/claves') {
    const res = await env.DB.prepare('SELECT * FROM claves ORDER BY id').all();
    return json({ ok: true, claves: res.results || [] });
  }

  if (request.method === 'POST' && url.pathname === '/api/paypal/crear') {
    // Público (lo llama el navegador). Crea una orden de PayPal y la registra.
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ ok: false, error: 'JSON inválido' }, 400);
    }
    const producto = ((body.producto) || '').trim();
    const email = ((body.email) || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ ok: false, error: 'Email no válido' }, 400);
    }
    const precio = PAYPAL_PRECIOS[producto];
    if (!precio) return json({ ok: false, error: 'Producto no válido' }, 400);
    const token = await paypalToken(env);
    if (!token) return json({ ok: false, error: 'PayPal no configurado' }, 500);
    const base = getPaypalBase(env);
    const returnUrl = (env.PAYPAL_RETURN_URL || 'https://nagokeys.com/gracias').replace(/\/$/, '') + '?paypal=ok';
    const resp = await fetch(base + '/v2/checkout/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: 'EUR', value: precio }, custom_id: producto }],
        application_context: {
          brand_name: 'NagoKeys',
          user_action: 'PAY_NOW',
          return_url: returnUrl,
          cancel_url: env.PAYPAL_CANCEL_URL || 'https://nagokeys.com/',
        },
      }),
    });
    const data = await resp.json();
    if (!resp.ok) return json({ ok: false, error: 'PayPal: ' + (data.message || resp.status) }, 502);
    const aprobar = (data.links || []).find((l) => l.rel === 'approve');
    if (!aprobar) return json({ ok: false, error: 'PayPal no devolvió enlace de pago' }, 502);
    await env.DB
      .prepare('INSERT OR IGNORE INTO pedidos_paypal (order_id, producto, email, estado) VALUES (?, ?, ?, ?)')
      .bind(data.id, producto, email, 'CREADO')
      .run();
    return json({ ok: true, id: data.id, status: data.status, checkoutUrl: aprobar.href });
  }

  if (request.method === 'GET' && url.pathname === '/api/paypal/confirmar') {
    // Público (lo llama gracias.html). Captura la orden si estaba APPROVED
    // y, solo si PayPal confirma COMPLETED, avisa al webhook de n8n.
    const id = (url.searchParams.get('id') || '').trim();
    if (!id) return json({ ok: false, error: 'Falta el id' }, 400);
    const token = await paypalToken(env);
    if (!token) return json({ ok: false, error: 'PayPal no configurado' }, 500);
    const base = getPaypalBase(env);

    const fila = await env.DB.prepare('SELECT * FROM pedidos_paypal WHERE order_id = ?').bind(id).first();
    if (!fila) return json({ ok: false, error: 'Pedido no encontrado' }, 404);

    if (fila.estado === 'AVISADO') {
      return json({ ok: true, estado: 'AVISADO', aviso: true, repetido: true }, 200);
    }
    if (fila.estado === 'CAPTURADO') {
      // El pago ya se cobró pero n8n no fue avisado (p. ej. estaba caído).
      // Reintenta el aviso para no perder la entrega de la clave.
      const n8nOk = await avisarN8n(env, {
        pagoId: id,
        captureId: fila.capture_id || '',
        producto: fila.producto,
        email: fila.email,
        importe: fila.importe || '',
      });
      if (n8nOk) {
        await env.DB.prepare("UPDATE pedidos_paypal SET estado = 'AVISADO' WHERE order_id = ?").bind(id).run();
        return json({ ok: true, estado: 'AVISADO', aviso: true, repetido: true }, 200);
      }
      return json({ ok: true, estado: 'CAPTURADO', aviso: false, repetido: true }, 200);
    }

    let data = await pedirPaypalOrder(base, id, token);
    if (!data) return json({ ok: false, error: 'No se pudo consultar PayPal' }, 502);

    if (data.status === 'APPROVED') {
      const cap = await fetch(base + '/v2/checkout/orders/' + encodeURIComponent(id) + '/capture', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
      });
      const capData = await cap.json();
      if (capData && capData.id) {
        data = capData;
      } else {
        data = await pedirPaypalOrder(base, id, token);
      }
    }

    const captura = comprobarCaptura(data);
    if (!captura.ok) {
      await env.DB.prepare('UPDATE pedidos_paypal SET estado = ? WHERE order_id = ?').bind('NO_CAPTURADO', id).run();
      return json({ ok: false, error: 'El pago no está completado (' + (data.status || '') + ')' }, 402);
    }

    const payerEmail = (data.payer && data.payer.email_address) || fila.email;
    await env.DB
      .prepare('UPDATE pedidos_paypal SET estado = ?, capture_id = ?, payer_email = ?, importe = ? WHERE order_id = ?')
      .bind('CAPTURADO', captura.captureId, payerEmail, captura.importe, id)
      .run();

    const n8nOk = await avisarN8n(env, {
      pagoId: id,
      captureId: captura.captureId,
      producto: fila.producto,
      email: fila.email || payerEmail,
      importe: captura.importe,
    });
    if (n8nOk) {
      await env.DB.prepare("UPDATE pedidos_paypal SET estado = 'AVISADO' WHERE order_id = ?").bind(id).run();
      return json({ ok: true, estado: 'AVISADO', aviso: true, producto: fila.producto, email: fila.email || payerEmail });
    }
    return json({
      ok: true,
      estado: 'CAPTURADO',
      aviso: false,
      error: 'Pago recibido pero no se pudo avisar a n8n. Contacta con el cliente y reenvía la clave manualmente.',
    });
  }

  if (request.method === 'GET' && url.pathname === '/api/paypal/pedido') {
    // Diagnóstico: estado de una orden sin capturar.
    const id = (url.searchParams.get('id') || '').trim();
    if (!id) return json({ ok: false, error: 'Falta el id' }, 400);
    const token = await paypalToken(env);
    if (!token) return json({ ok: false, error: 'PayPal no configurado' }, 500);
    const base = getPaypalBase(env);
    const data = await pedirPaypalOrder(base, id, token);
    if (!data) return json({ ok: false, error: 'No se pudo consultar PayPal' }, 502);
    return json({
      ok: true,
      estado: data.status || '',
      producto: ((data.purchase_units || [])[0] || {}).custom_id || '',
      email: (data.payer && data.payer.email_address) || '',
    });
  }

  return json({ ok: false, error: 'Ruta no encontrada' }, 404);
}

const PAYPAL_PRECIOS = {
  'Windows 11 Home Retail': '9.99',
  'Windows 11 Pro Retail': '10.99',
  'Windows 11 Home OEM': '4.99',
  'Windows 11 Pro OEM': '4.99',
  'McAfee Antivirus 1 Año': '7.99',
  'Pack Windows 11 Home Retail + McAfee': '15.49',
  'Pack Windows 11 Pro Retail + McAfee': '16.49',
  'Pack Windows 11 Home OEM + McAfee': '10.49',
  'Pack Windows 11 Pro OEM + McAfee': '10.49',
};

function getPaypalBase(env) {
  return env.PAYPAL_SANDBOX === 'true' || env.PAYPAL_SANDBOX === true
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
}

async function paypalToken(env) {
  const id = env.PAYPAL_CLIENT_ID;
  const secret = env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) return null;
  const base = getPaypalBase(env);
  const auth = 'Basic ' + btoa(id + ':' + secret);
  const resp = await fetch(base + '/v1/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: auth },
    body: 'grant_type=client_credentials',
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.access_token || null;
}

async function pedirPaypalOrder(base, id, token) {
  const resp = await fetch(base + '/v2/checkout/orders/' + encodeURIComponent(id), {
    headers: { authorization: 'Bearer ' + token },
  });
  if (!resp.ok) return null;
  return resp.json();
}

function comprobarCaptura(data) {
  if (!data || data.status !== 'COMPLETED') return { ok: false };
  const pu = (data.purchase_units || [])[0] || {};
  const caps = (pu.payments && pu.payments.captures) || [];
  const c = caps[0];
  if (!c || c.status !== 'COMPLETED') return { ok: false };
  return { ok: true, captureId: c.id, importe: c.amount && c.amount.value };
}

async function avisarN8n(env, datos) {
  const url = env.N8N_WEBHOOK_URL || 'https://n8n.nagokeys.com/webhook/pago-paypal-nagokeys';
  const payload = Object.assign({}, datos, { apiKey: env.NAGOKEYS_API_KEY || '' });
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (r.ok) return true;
    } catch (e) {
      // reintenta
    }
    await new Promise((res) => setTimeout(res, 1000 + i * 1000));
  }
  return false;
}