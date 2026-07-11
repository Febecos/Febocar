const { sql } = require('../../lib/db');
const { requireAdmin } = require('../../lib/auth');

module.exports = async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) return; // requireAdmin ya respondió 401

  const db = sql();

  try {
    if (req.method === 'GET') {
      const rows = await db`
        SELECT id, marca, modelo, categoria, tagline, descripcion, specs,
               imagen_url, imagenes, precio, moneda, orden, activo,
               created_at, updated_at
        FROM febocar_productos
        ORDER BY categoria, orden, id
      `;
      res.status(200).json({ productos: rows });
      return;
    }

    if (req.method === 'POST') {
      const p = req.body || {};
      if (!p.marca?.trim() || !p.modelo?.trim()) {
        res.status(400).json({ error: 'Marca y modelo son obligatorios' });
        return;
      }
      const rows = await db`
        INSERT INTO febocar_productos
          (marca, modelo, categoria, tagline, descripcion, specs, imagen_url, imagenes, precio, moneda, orden, activo)
        VALUES (
          ${p.marca.trim()}, ${p.modelo.trim()}, ${p.categoria || 'cargador'},
          ${p.tagline || null}, ${p.descripcion || null},
          ${JSON.stringify(p.specs || [])}::jsonb,
          ${p.imagen_url || null}, ${JSON.stringify(p.imagenes || [])}::jsonb,
          ${p.precio ?? null}, ${p.moneda || 'ARS'}, ${p.orden ?? 0}, ${p.activo ?? true}
        )
        RETURNING id
      `;
      res.status(201).json({ ok: true, id: rows[0].id });
      return;
    }

    if (req.method === 'PUT') {
      const p = req.body || {};
      if (!p.id) {
        res.status(400).json({ error: 'Falta id' });
        return;
      }
      await db`
        UPDATE febocar_productos SET
          marca = ${p.marca}, modelo = ${p.modelo}, categoria = ${p.categoria || 'cargador'},
          tagline = ${p.tagline || null}, descripcion = ${p.descripcion || null},
          specs = ${JSON.stringify(p.specs || [])}::jsonb,
          imagen_url = ${p.imagen_url || null}, imagenes = ${JSON.stringify(p.imagenes || [])}::jsonb,
          precio = ${p.precio ?? null}, moneda = ${p.moneda || 'ARS'},
          orden = ${p.orden ?? 0}, activo = ${p.activo ?? true},
          updated_at = NOW()
        WHERE id = ${p.id}
      `;
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        res.status(400).json({ error: 'Falta id' });
        return;
      }
      await db`DELETE FROM febocar_productos WHERE id = ${id}`;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin productos error', err);
    res.status(500).json({ error: 'Error interno' });
  }
};
