export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isStaticAsset =
      url.pathname.startsWith('/images/') ||
      url.pathname === '/styles.css';
    if (isStaticAsset && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    const maintenancePage = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>NagoKeys | En Mantenimiento</title>
    <link rel="icon" type="image/png" href="/images/pruebas.png">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
        body {
            background: linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%);
            background-attachment: fixed;
            color: #333333;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            max-width: 520px;
            width: 100%;
            padding: 45px 40px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .logo {
            font-weight: bold;
            font-size: 2rem;
            color: #00d4ff;
            margin-bottom: 25px;
        }
        .logo img {
            width: 90px;
            height: 90px;
            border-radius: 18px;
            object-fit: cover;
        }
        .icon {
            font-size: 3.5rem;
            margin-bottom: 15px;
        }
        h1 {
            color: #1a1a1a;
            font-size: 1.8rem;
            margin-bottom: 12px;
        }
        p {
            color: #555555;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .badge {
            display: inline-block;
            background: #f47521;
            color: #ffffff;
            font-weight: 600;
            font-size: 0.85rem;
            letter-spacing: 0.5px;
            border-radius: 999px;
            padding: 6px 16px;
            margin-bottom: 18px;
            text-transform: uppercase;
        }
        a.btn {
            display: inline-block;
            background: #1a1a1a;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 999px;
            font-weight: 600;
            transition: background 0.3s ease;
        }
        a.btn:hover { background: #333333; }
        .footer {
            margin-top: 22px;
            font-size: 0.85rem;
            color: #888888;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo"><img src="/images/pruebas.png" alt="NagoKeys"></div>
        <div class="icon">🛠️</div>
        <span class="badge">Fuera de servicio temporalmente</span>
        <h1>Estamos mejorando NagoKeys</h1>
        <p>Estamos trabajando en la web para ofrecerte una mejor experiencia. Volveremos muy pronto con novedades.</p>
        <a class="btn" href="mailto:contacto.nagokeys@gmail.com">✉️ Contáctanos</a>
        <div class="footer">© 2026 NagoKeys</div>
    </div>
</body>
</html>`;

    return new Response(maintenancePage, {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Retry-After': '86400',
        'Cache-Control': 'no-store',
      },
    });
  },
};