export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env, url);
    }

    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }
    return new Response('NagoKeys no disponible en este momento', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  },
};

function json(body, code = 200) {
  return new Response(JSON.stringify(body), {
    status: code,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function autorizado(request, env) {
  const secret = env.NAGOKEYS_API_KEY;
  if (!secret) return false;
  return request.headers.get('x-nagokeys-api-key') === secret;
}

async function iniciarTabla(env) {
  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS claves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Nombre_Producto TEXT NOT NULL,
      Clave_Activacion TEXT NOT NULL UNIQUE,
      Estado TEXT NOT NULL DEFAULT 'Disponible',
      Email_Comprador TEXT,
      Fecha_Venta TEXT,
      creado_en TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_claves_producto_estado ON claves(Nombre_Producto, Estado);
  `);
}

async function handleApi(request, env, url) {
  const ok = await autorizado(request, env);
  if (!ok) return json({ ok: false, error: 'No autorizado' }, 401);
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

  return json({ ok: false, error: 'Ruta no encontrada' }, 404);
}