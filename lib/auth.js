const crypto = require('crypto');
const { sql } = require('./db');

const COOKIE_NAME = 'febocar_admin';
const SESSION_HOURS = 12;

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(
    header.split(';').filter(Boolean).map((p) => {
      const idx = p.indexOf('=');
      return [p.slice(0, idx).trim(), decodeURIComponent(p.slice(idx + 1).trim())];
    })
  );
}

// Login: compara contra process.env.ADMIN_PASSWORD (constant-time) y, si
// coincide, crea una sesión opaca guardada en la DB (revocable por token,
// no depende de un secreto de firma aparte).
async function login(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error('ADMIN_PASSWORD no está seteada en Vercel');
  const a = Buffer.from(String(password || ''));
  const b = Buffer.from(expected);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const db = sql();
  await db`
    INSERT INTO febocar_admin_sesiones (token, expira_at)
    VALUES (${token}, NOW() + INTERVAL '${SESSION_HOURS} hours')
  `;
  return token;
}

async function logout(token) {
  if (!token) return;
  const db = sql();
  await db`DELETE FROM febocar_admin_sesiones WHERE token = ${token}`;
}

async function requireAdmin(req, res) {
  const { [COOKIE_NAME]: token } = parseCookies(req);
  if (!token) {
    res.status(401).json({ error: 'No autenticado' });
    return null;
  }
  const db = sql();
  const rows = await db`
    SELECT token FROM febocar_admin_sesiones
    WHERE token = ${token} AND expira_at > NOW()
  `;
  if (rows.length === 0) {
    res.status(401).json({ error: 'Sesión inválida o vencida' });
    return null;
  }
  return token;
}

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_HOURS * 3600}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
}

module.exports = { login, logout, requireAdmin, setSessionCookie, clearSessionCookie, parseCookies, COOKIE_NAME };
