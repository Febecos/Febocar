const { put } = require('@vercel/blob');
const { requireAdmin } = require('../../lib/auth');

// Recibe la foto como base64 en JSON (evita depender de un parser multipart
// aparte). Vercel limita el body de funciones serverless a ~4.5MB — de sobra
// para una foto de producto ya comprimida.
module.exports = async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { filename, contentType, dataBase64 } = req.body || {};
    if (!filename || !dataBase64) {
      res.status(400).json({ error: 'Falta el archivo' });
      return;
    }
    const buffer = Buffer.from(dataBase64, 'base64');
    const safeName = `productos/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const blob = await put(safeName, buffer, {
      access: 'public',
      contentType: contentType || 'application/octet-stream',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    res.status(200).json({ ok: true, url: blob.url });
  } catch (err) {
    console.error('upload error', err);
    res.status(500).json({ error: 'No se pudo subir la imagen' });
  }
};
