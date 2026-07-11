const { neon } = require('@neondatabase/serverless');

// Conexión a febecos-core (Neon serverless driver, HTTP — evita pools TCP
// en funciones serverless). Requiere process.env.DATABASE_URL seteada en
// Vercel una vez que GESTIÓN confirme el acceso. NUNCA hardcodear el valor.
// Ver [[neon-sin-fragmentos-anidados]]: no anidar sql`` dentro de otro sql``.

let _sql = null;
function sql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no está seteada — falta conectar la base (ver db/schema.sql)');
  }
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

module.exports = { sql };
