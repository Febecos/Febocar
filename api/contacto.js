const { Resend } = require('resend');

// Formulario de contacto público de Febocar. Molde reusado de
// febecos-cursos/src/app/api/contacto/route.ts (honeypot + rate-limit + Resend).
// NUNCA hardcodear la API key: siempre process.env.RESEND_API_KEY (Vercel).
// Requiere el dominio febocar.com verificado en Resend (SPF/DKIM/DMARC) antes
// de poder enviar como info@febocar.com — hasta entonces este endpoint
// responderá 500 al intentar el envío real (coordinado con DEV ENVIOS).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 4;
const DISPOSABLE = new Set([
  'jmailservice.com', 'mailinator.com', 'guerrillamail.com', 'sharklasers.com',
  'tempmail.com', 'temp-mail.org', 'yopmail.com', '10minutemail.com',
  'trashmail.com', 'getnada.com', 'maildrop.cc', 'dispostable.com',
]);

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
}

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]
  ));
}

function brandedEmail(bodyHtml) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1c1c1c">
      <div style="background:#0e4a78;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center">
        <span style="color:#ffffff;font-size:22px;font-weight:800;">Febo<span style="color:#a4c639">car</span></span>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        ${bodyHtml}
        <p style="color:#6b7280;font-size:13px;margin-top:24px">Febocar · un desarrollo de FEBECOS® · <a href="https://febocar.com" style="color:#0e4a78">febocar.com</a></p>
      </div>
    </div>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { nombre, telefono, email, interes, mensaje, website } = req.body || {};

    // Honeypot: si vino lleno, es un bot — responder 200 sin mandar nada.
    if (website) {
      res.status(200).json({ ok: true });
      return;
    }

    const ip = clientIp(req);
    const now = Date.now();
    const arr = (RATE.get(ip) || []).filter((t) => now - t < WINDOW_MS);
    arr.push(now);
    RATE.set(ip, arr);
    if (RATE.size > 5000) RATE.clear();
    if (arr.length > MAX_PER_WINDOW) {
      res.status(429).json({ error: 'Demasiados intentos. Esperá un minuto.' });
      return;
    }

    if (!nombre?.trim() || !telefono?.trim()) {
      res.status(400).json({ error: 'Completá nombre y teléfono' });
      return;
    }
    if (email && !EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'Email inválido' });
      return;
    }
    const dom = (email?.split('@')[1] || '').toLowerCase();
    if (dom && DISPOSABLE.has(dom)) {
      res.status(200).json({ ok: true });
      return;
    }

    const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: `Febocar <${process.env.RESEND_FROM ?? 'info@febocar.com'}>`,
      to: process.env.FEBOCAR_CONTACT_TO ?? 'info@febocar.com',
      replyTo: email?.trim() || undefined,
      subject: `🔌 Nueva consulta Febocar — ${nombre}`,
      html: brandedEmail(`
        <h2 style="color:#0e4a78;margin-top:0">🔌 Nueva consulta desde febocar.com</h2>
        <p style="font-size:14px;line-height:1.8">
          <strong>Nombre:</strong> ${esc(nombre)}<br/>
          <strong>Teléfono/WhatsApp:</strong> ${esc(telefono)}<br/>
          ${email ? `<strong>Email:</strong> ${esc(email)}<br/>` : ''}
          ${interes ? `<strong>Interés:</strong> ${esc(interes)}<br/>` : ''}
          ${mensaje ? `<strong>Mensaje:</strong> ${esc(mensaje)}<br/>` : ''}
        </p>`),
    });

    // El SDK de Resend NO tira excepción cuando la API rechaza el envío
    // (dominio no verificado, remitente inválido, rate limit) — devuelve
    // { data, error }. Sin este chequeo, un rechazo queda invisible y el
    // usuario ve "listo" aunque no haya salido nada (bug detectado por
    // DEV ENVIOS en el molde original de Cursos — no repetirlo acá).
    if (result.error) {
      console.error('[contacto] Resend rechazó el envío:', result.error);
      res.status(502).json({ error: 'No se pudo enviar, intentá de nuevo o escribinos por WhatsApp' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contacto error', err);
    res.status(500).json({ error: 'Error interno, intentá de nuevo o escribinos por WhatsApp' });
  }
};
