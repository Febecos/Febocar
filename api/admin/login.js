const { login, setSessionCookie } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { password } = req.body || {};
    const token = await login(password);
    if (!token) {
      res.status(401).json({ error: 'Contraseña incorrecta' });
      return;
    }
    setSessionCookie(res, token);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('admin login error', err);
    res.status(500).json({ error: 'Error interno' });
  }
};
