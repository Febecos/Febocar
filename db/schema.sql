-- Esquema de productos de Febocar, para crear DENTRO de febecos-core.
-- Reglas acordadas con el Coordinador/GESTIÓN antes de correr esto en prod:
--   1) Solo tablas nuevas con prefijo febocar_ — no tocar nada existente.
--   2) Sin foreign keys a tablas de otros sistemas.
--   3) CERO datos de cliente acá — los leads van al CRM central vía
--      POST /api/clientes/upsert (febo-gestion), nunca a una tabla propia.
-- Este archivo es solo el DDL: NO ejecutar hasta tener el OK explícito.

CREATE TABLE IF NOT EXISTS febocar_productos (
  id            SERIAL PRIMARY KEY,
  marca         TEXT NOT NULL,              -- 'Growatt' | 'Circontrol' | ...
  modelo        TEXT NOT NULL,              -- 'THOR 7 kW', 'eHome5', ...
  categoria     TEXT NOT NULL DEFAULT 'cargador', -- 'cargador' | 'combo' | ...
  tagline       TEXT,                       -- linea corta bajo el nombre
  descripcion   TEXT,                       -- descripción larga (detalle del producto)
  specs         JSONB NOT NULL DEFAULT '[]', -- [{"label":"32 A"}, {"label":"Tipo 2"}, ...] -> badges
  imagen_url    TEXT,                       -- foto principal (Vercel Blob)
  imagenes      JSONB NOT NULL DEFAULT '[]', -- fotos adicionales, mismo formato de URL
  precio        NUMERIC,                    -- NULL = "Consultar precio"
  moneda        TEXT DEFAULT 'ARS',
  orden         INTEGER NOT NULL DEFAULT 0, -- orden de aparición dentro de su categoría
  activo        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_febocar_productos_activo_orden
  ON febocar_productos (activo, categoria, orden);

-- Tabla de sesiones de admin (simple, un solo usuario — Guille).
-- Guarda tokens de sesión firmados con expiración, para poder invalidarlos
-- (logout / rotación) sin depender solo de la firma HMAC.
CREATE TABLE IF NOT EXISTS febocar_admin_sesiones (
  token         TEXT PRIMARY KEY,
  creada_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_at     TIMESTAMPTZ NOT NULL
);
