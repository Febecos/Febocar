// Migra los 7 productos hoy hardcodeados en cargadores.html a la tabla
// febocar_productos. Correr UNA sola vez, después de aplicar db/schema.sql,
// con DATABASE_URL seteada en el entorno:
//   node db/seed.js
const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL en el entorno');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

const productos = [
  // --- Growatt THOR ---
  {
    marca: 'Growatt', modelo: 'THOR 7 kW', categoria: 'cargador', orden: 1,
    tagline: 'Monofásico · ideal para hogares',
    descripcion: 'Cargador monofásico de 7 kW pensado para instalación residencial. Incluye modo de carga solar (PV Linkage), pantalla propia, RFID y monitoreo por app. Certificado CE bajo IEC 61851-1, protección IP65 para interior o exterior.',
    specs: [{ label: '32 A' }, { label: 'Tipo 2' }, { label: 'Carga solar' }, { label: 'IP65' }],
    imagen_url: '/images/producto-thor.jpeg',
  },
  {
    marca: 'Growatt', modelo: 'THOR 11 kW', categoria: 'cargador', orden: 2,
    tagline: 'Trifásico · casas y PyMEs',
    descripcion: 'Versión trifásica de 11 kW para viviendas con acometida trifásica o pequeños comercios. Misma plataforma de carga solar y monitoreo que el resto de la gama THOR.',
    specs: [{ label: '16 A/fase' }, { label: 'Tipo 2' }, { label: 'Carga solar' }, { label: 'IP65' }],
    imagen_url: '/images/producto-thor.jpeg',
  },
  {
    marca: 'Growatt', modelo: 'THOR 22 kW', categoria: 'cargador', orden: 3,
    tagline: 'Trifásico · comercios y flotas',
    descripcion: 'El tope de gama residencial/comercial de Growatt THOR, 22 kW trifásicos para carga rápida en comercios, estacionamientos o flotas propias.',
    specs: [{ label: '32 A/fase' }, { label: 'Tipo 2' }, { label: 'Carga rápida' }, { label: 'IP65' }],
    imagen_url: '/images/producto-thor.jpeg',
  },
  // --- Circontrol ---
  {
    marca: 'Circontrol', modelo: 'eHome5', categoria: 'cargador', orden: 1,
    tagline: 'Hogar conectado · modo solar propio',
    descripcion: 'Cargador residencial conectado de Circontrol, con modo de carga 100% solar integrado y contador dedicado. Ideal para quien ya tiene o va a instalar paneles solares.',
    specs: [{ label: '7,4 / 22 kW' }, { label: 'OCPP 1.6J' }, { label: 'RFID' }],
    imagen_url: '/images/circontrol-ehome5.jpeg',
  },
  {
    marca: 'Circontrol', modelo: 'eNext Park', categoria: 'cargador', orden: 2,
    tagline: 'Comercios y estacionamientos',
    descripcion: 'Cargador semirrápido pensado para comercios y estacionamientos, con 1 o 2 conectores y OCPP para integrar con un backend de gestión y cobro de terceros.',
    specs: [{ label: '7,4-44 kW' }, { label: '1-2 conectores' }, { label: 'OCPP 2.0-ready' }],
    imagen_url: '/images/circontrol-enext-park.jpeg',
  },
  {
    marca: 'Circontrol', modelo: 'eVolve Smart', categoria: 'cargador', orden: 3,
    tagline: 'Uso intensivo · antivandalismo IK10',
    descripcion: 'Cargador robusto para uso intensivo, con protección antivandalismo IK10, pago contactless y OCPP 2.0.1 — pensado para sitios de alto tránsito.',
    specs: [{ label: '14,7-44 kW' }, { label: 'OCPP 2.0.1' }, { label: 'Contactless' }],
    imagen_url: '/images/circontrol-evolve-smart.jpeg',
  },
  {
    marca: 'Circontrol', modelo: 'Máster-Satélite', categoria: 'cargador', orden: 4,
    tagline: 'Redes de hasta 8 puntos',
    descripcion: 'Arquitectura de un panel maestro que administra hasta 8 puntos satélite de carga con un solo punto de control — pensado para redes de varios puntos en un mismo predio.',
    specs: [{ label: '14,7-44 kW/punto' }, { label: '1 panel de control' }],
    imagen_url: '/images/circontrol-master-satelite.jpeg',
  },
];

async function main() {
  for (const p of productos) {
    await sql`
      INSERT INTO febocar_productos
        (marca, modelo, categoria, tagline, descripcion, specs, imagen_url, orden, activo)
      VALUES (
        ${p.marca}, ${p.modelo}, ${p.categoria}, ${p.tagline}, ${p.descripcion},
        ${JSON.stringify(p.specs)}::jsonb, ${p.imagen_url}, ${p.orden}, true
      )
    `;
    console.log(`✓ ${p.marca} ${p.modelo}`);
  }
  console.log(`Listo — ${productos.length} productos cargados.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
