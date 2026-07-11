const { logout, clearSessionCookie, parseCookies, COOKIE_NAME } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { [COOKIE_NAME]: token } = parseCookies(req);
  await logout(token);
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
};
