-- Esquema inicial de la base de claves de NagoKeys (D1).
-- Se ejecuta automáticamente la primera vez que uses la API, pero puedes
-- crearla tú desde el panel de D1 (Consola) si prefieres hacerlo así.

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