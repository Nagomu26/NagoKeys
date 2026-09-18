// Importar claves desde un CSV (exportado de Google Sheets) a D1.
//
// Uso (opción A, vía API si el Worker ya está desplegado):
//   node importar-claves.js claves.csv https://nagokeys.com TU_SECRETO
//
// Uso (opción B, genera un archivo SQL para pegar en la consola de D1):
//   node importar-claves.js claves.csv
//   -> crea "importar-en-d1.sql"
const fs = require('fs');
const path = require('path');

function parseCsv(texto) {
  const filas = [];
  let fila = [];
  let celda = '';
  let enComilla = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enComilla) {
      if (c === '"' && texto[i + 1] === '"') { celda += '"'; i++; }
      else if (c === '"') enComilla = false;
      else celda += c;
    } else {
      if (c === '"') enComilla = true;
      else if (c === ',') { fila.push(celda); celda = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && texto[i + 1] === '\n') i++;
        fila.push(celda); celda = '';
        if (fila.some((v) => v.trim() !== '')) filas.push(fila);
        fila = [];
      } else celda += c;
    }
  }
  if (fila.length) filas.push(fila);
  return filas;
}

function col(filas, nombres) {
  const cab = filas[0].map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
  for (const n of nombres) {
    const i = cab.findIndex((h) => h === n.toLowerCase());
    if (i >= 0) return i;
  }
  return -1;
}

(async () => {
  const ruta = process.argv[2];
  const urlApi = process.argv[3];
  const secreto = process.argv[4];
  if (!ruta) { console.error('Falta el archivo CSV. Uso: node importar-claves.js claves.csv [urlApi] [secreto]'); process.exit(1); }

  const filas = parseCsv(fs.readFileSync(ruta, 'utf8'));
  if (filas.length < 2) { console.error('El CSV está vacío o solo tiene cabecera.'); process.exit(1); }

  const cProducto = col(filas, ['Nombre_Producto', 'Producto', 'producto', 'name']);
  const cClave = col(filas, ['Clave_Activacion', 'Clave', 'clave', 'key', 'activation code']);
  const cEstado = col(filas, ['Estado', 'estado', 'status', 'vendido']);
  if (cProducto < 0 || cClave < 0) {
    console.error('No encuentro las columnas de producto y clave en la cabecera.');
    console.error('Cabecera detectada:', filas[0].join(' | '));
    process.exit(1);
  }

  const claves = [];
  const duplicados = new Set();
  for (let i = 1; i < filas.length; i++) {
    const f = filas[i];
    const producto = (f[cProducto] || '').trim();
    const clave = (f[cClave] || '').trim();
    let estado = cEstado >= 0 ? (f[cEstado] || '').trim().toLowerCase() : 'disponible';
    if (!clave || /^coloca/i.test(clave)) continue;
    if (estado && estado !== 'disponible' && !estado.includes('no')) continue;
    if (duplicados.has(clave)) continue;
    duplicados.add(clave);
    claves.push({ producto, clave });
  }

  console.log(`Leídas ${filas.length - 1} filas. Claves válidas y disponibles a importar: ${claves.length}`);

  if (urlApi && secreto) {
    const res = await fetch(urlApi + '/api/admin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-nagokeys-api-key': secreto },
      body: JSON.stringify({ claves }),
    });
    const txt = await res.text();
    console.log(`API respondió ${res.status}: ${txt.slice(0, 300)}`);
    return;
  }

  const salida = path.join(path.dirname(ruta), 'importar-en-d1.sql');
  const lineas = claves.map((k) =>
    `INSERT OR IGNORE INTO claves (Nombre_Producto, Clave_Activacion, Estado) VALUES ('${k.producto.replace(/'/g, "''")}', '${k.clave.replace(/'/g, "''")}', 'Disponible');`
  );
  fs.writeFileSync(salida, '-- Generado por importar-claves.js\n' + lineas.join('\n'));
  console.log(`SQL creado: ${salida}  (pégalo en la Consola de D1 del panel de Cloudflare o ejecuta: wrangler d1 execute nagokeys --remote --file=${salida})`);
})();