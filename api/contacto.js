const { Resend } = require('resend');

// Formulario de contacto público de Febocar. Molde reusado de
// febecos-cursos/src/app/api/contacto/route.ts (honeypot + rate-limit + Resend).
// NUNCA hardcodear la API key: siempre process.env.RESEND_API_KEY (Vercel).
// Remitente/destino: febocar@febecos.com — reusa el dominio febecos.com ya
// verificado en Resend (mismo usado por cursos@/cotiza@), sin necesidad de
// verificar febocar.com aparte ni de resolver recepción de mail nueva.

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

// Enganche al CRM único de FEBECOS (patrón D1, mismo que Selector/ROI/
// Revendedores/Cursos). Origen "febocar" confirmado por GESTIÓN vía
// Coordinador — se guarda en columna origen + se mergea en origenes[].
// Best-effort: si falla, se loguea pero NO tira la respuesta al cliente
// (el email a febocar@febecos.com ya es la vía principal de aviso).
async function upsertCRM({ nombre, telefono, email, localidad, consulta, mensaje }) {
  try {
    const notas = [consulta, mensaje].filter(Boolean).join(' — ') || undefined;
    const res = await fetch('https://gestion.febecos.com/api/clientes/upsert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.INTERNAL_SERVICE_SECRET}`,
      },
      body: JSON.stringify({ nombre, whatsapp: telefono, email, localidad: localidad || undefined, notas, origen: 'febocar' }),
    });
    if (!res.ok) {
      console.error('[contacto] CRM upsert rechazado:', res.status, await res.text().catch(() => ''));
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('[contacto] CRM upsert error:', err);
    return null;
  }
}

function brandedEmail(bodyHtml) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1c1c1c">
      <div style="background:#0e4a78;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center">
        <span style="color:#ffffff;font-size:22px;font-weight:800;">Febo<span style="color:#a4c639">car</span></span>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        ${bodyHtml}
        <p style="color:#6b7280;font-size:13px;margin-top:24px">Febocar · un desarrollo de FEBECOS® · <a href="https://car.febecos.com" style="color:#0e4a78">car.febecos.com</a></p>
      </div>
    </div>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { nombre, telefono, email, localidad, consulta, mensaje, website } = req.body || {};

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

    if (!nombre?.trim() || !telefono?.trim() || !email?.trim()) {
      res.status(400).json({ error: 'Completá nombre, WhatsApp y email' });
      return;
    }
    if (!EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'Email inválido' });
      return;
    }
    const dom = (email.split('@')[1] || '').toLowerCase();
    if (DISPOSABLE.has(dom)) {
      res.status(200).json({ ok: true });
      return;
    }

    // CRM y email en paralelo — el CRM es best-effort (no bloquea la
    // respuesta al usuario), el email sí se valida abajo.
    const crmPromise = upsertCRM({ nombre, telefono, email, localidad, consulta, mensaje });

    const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: `Febocar <${process.env.RESEND_FROM ?? 'febocar@febecos.com'}>`,
      to: process.env.FEBOCAR_CONTACT_TO ?? 'febocar@febecos.com',
      replyTo: email?.trim() || undefined,
      subject: `🔌 Nueva consulta Febocar — ${nombre}`,
      html: brandedEmail(`
        <h2 style="color:#0e4a78;margin-top:0">🔌 Nueva consulta desde febocar.com</h2>
        <p style="font-size:14px;line-height:1.8">
          <strong>Nombre:</strong> ${esc(nombre)}<br/>
          <strong>Teléfono/WhatsApp:</strong> ${esc(telefono)}<br/>
          ${email ? `<strong>Email:</strong> ${esc(email)}<br/>` : ''}
          ${localidad ? `<strong>Localidad:</strong> ${esc(localidad)}<br/>` : ''}
          ${consulta ? `<strong>Consulta:</strong> ${esc(consulta)}<br/>` : ''}
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

    const crm = await crmPromise; // asegura que termine antes de que la función se corte
    if (crm) console.log('[contacto] CRM upsert ok:', crm.accion, crm.cliente_id);

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contacto error', err);
    res.status(500).json({ error: 'Error interno, intentá de nuevo o escribinos por WhatsApp' });
  }
};
