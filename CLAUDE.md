# CLAUDE.md — febocar.com

## Qué es
Home estática de Febocar (cargadores VE + solar + batería), sub-marca de FEBECOS®.
HTML/CSS/JS vanilla en un solo archivo por página. Sin frameworks, sin build.

## Convenciones que NO se rompen
- Paleta = variables CSS en :root de index.html (azul #003d72, lima #a8c61b, naranja #d4870a). Es la paleta de febecos.com.
- Íconos: Lucide (SVG inline, stroke 1.25–1.6, sin fondos). No mezclar con otros sets ni emojis.
- Tipografías: Archivo (títulos) + Inter (texto), vía Google Fonts.
- Logo: img/logo-light.png (nav, fondo claro) / img/logo-full.png (footer, fondo oscuro) / logo-iso.png + favicon.png.
- Imágenes de producto: renders OFICIALES de los fabricantes compuestos sobre degradé #eef3f9→#fff. Nunca recortes de PDF procesados.

## Piezas con lógica JS (todas al final de index.html, comentadas)
1. VIDEO_BASE: origen de los videos (local o R2). Selección automática de versión -480 en móvil.
2. Palabras rotantes "Tu casa / Tu energía / Tu auto": sincronizadas por requestAnimationFrame
   al video data-video="solar" con cortes de escena reales (CORTE_1=2.50s, CORTE_2=4.96s) y
   ADELANTO=0.32s para que el cambio aterrice en el corte. Fallback por timer si el video no corre.
3. Videos de sección: IntersectionObserver (play al entrar en viewport, pause al salir).
4. Diagrama día/noche del hero: alterna cada 6 s (modo noche = batería→auto, paneles apagados).

## index-alternativa.html
Idéntica a index.html con los videos intercambiados (hero↔solar). Si se edita index.html,
regenerar la alternativa intercambiando SOLO los atributos data-video y poster de las DOS
etiquetas <video> (¡no hacer buscar-y-reemplazar global: rompe el selector del JS!).

## Formulario (#contacto)
FormSubmit → febocar@febecos.com. Objetivo futuro: POST al endpoint de FEBO AI (CRM en Neon).
El select "consulta" ya precalifica el lead (hogar / solar+batería / batería / empresa / carport).
