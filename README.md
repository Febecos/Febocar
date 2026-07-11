# Febocar.com — Home nueva (julio 2026)

Sitio estático listo para producción. Sin dependencias de build: HTML + CSS + JS vanilla.

## Contenido
```
index.html              → HOME OFICIAL (hero con video de la casa)
index-alternativa.html  → variante con los videos intercambiados (para A/B o respaldo)
img/                    → 25 imágenes optimizadas (renders oficiales, fotos reales con patentes pixeladas, logo, favicon)
video/                  → hero.mp4 + solar.mp4 (720p) y hero-480.mp4 + solar-480.mp4 (móvil)
docs/                   → datasheets y catálogo descargables (botones "Ficha técnica" de las tarjetas)
```

## Deploy
1. Subir TODO el contenido de esta carpeta a la raíz del hosting de febocar.com (reemplaza lo anterior).
2. Verificar que `/docs/*.pdf` se sirvan con `Content-Type: application/pdf`.
3. Nada que compilar: es estático puro.

## Videos → Cloudflare R2 (opcional, recomendado)
En `index.html`, cerca del final, está la ÚNICA línea a tocar:
```js
const VIDEO_BASE = 'video/';
```
Para servir desde R2: subir los 4 .mp4 al bucket y reemplazar por la URL pública con barra final,
p. ej. `const VIDEO_BASE = 'https://<bucket>.r2.dev/febocar/';`
Habilitar CORS del bucket para https://febocar.com. Mismo procedimiento que Febecos.

## Formulario de contacto
Envía por FormSubmit a febocar@febecos.com (action del <form> en la sección #contacto).
⚠ El PRIMER envío dispara un mail de activación de FormSubmit: hay que confirmarlo una vez.
Para conectarlo a FEBO AI / backend propio: reemplazar el `action` del form (hay comentario en el código).

## Pendientes conocidos
- [ ] Verificar patentes pixeladas en las 6 fotos del carport (en especial carport-v1.jpg, sin detecciones).
- [ ] OK escrito de Growatt y Circontrol por imágenes/datasheets de catálogo.
- [ ] Video del carport (se sumará a la galería cuando exista).
- [ ] Páginas interiores (hoy el menú ancla dentro de la home).
- [ ] Ajuste fino de cortes del video si hiciera falta: constantes CORTE_1 / CORTE_2 en el JS (comentadas).
