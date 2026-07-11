const { sql } = require('../lib/db');

// Endpoint público: lista de productos activos para renderizar el catálogo.
// Sin auth (es contenido público del sitio). Solo lectura.
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const db = sql();
    const rows = await db`
      SELECT id, marca, modelo, categoria, tagline, descripcion, specs,
             imagen_url, imagenes, precio, moneda, orden
      FROM febocar_productos
      WHERE activo = true
      ORDER BY categoria, orden, id
    `;
    res.status(200).json({ productos: rows });
  } catch (err) {
    console.error('productos error', err);
    res.status(500).json({ error: 'No se pudo cargar el catálogo' });
  }
};
