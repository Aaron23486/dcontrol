# 0011 — Sistema de diseño «Enterprise Minimal»

**Estado:** APROBADO (2026-10-23, rediseño de la interfaz)

## Contexto
La interfaz funcionaba, pero cada pantalla tenía sus propios colores escritos a mano (grises de Tailwind repartidos en 46 archivos), sin íconos ni tipografía propia. «Ingreso y salida» medía 1041 px de alto en una pantalla de 1280 × 720: el guarda tenía que desplazarse para ver la actividad reciente. El responsable aprobó una imagen de referencia para esa pantalla y pidió que el resto de los módulos siga el mismo lenguaje visual.

## Decisión
- **Tokens en un solo lugar** (`apps/web/src/index.css`, bloque `@theme` de Tailwind 4): colores por uso (`canvas`, `surface`, `line`, `ink`, `primary`, `success`, `danger`, `warning` y sus variantes suaves), radios y sombras. Los componentes usan esos nombres, nunca un color suelto. Los valores salen de medir la imagen de referencia y cumplen contraste AA.
- **Significado fijo de los colores:** azul = acciones y navegación; verde = dentro y entradas; azul = salidas en la actividad; rojo suave = salidas en los indicadores y errores; ámbar = requiere atención. El estado nunca se comunica solo con color: siempre va con texto o ícono.
- **Tipografía Inter autoalojada** (`@fontsource-variable/inter`): se empaqueta con la web, así la política de seguridad (`font-src 'self'`) no cambia y no depende de terceros. El campo de cédula conserva la letra monoespaciada.
- **Íconos SVG propios** (`components/atoms/Icon.tsx`), lineales y decorativos (`aria-hidden`): sin librería de íconos.
- **Navegación horizontal** de 56 px; «Auditoría» sigue apareciendo solo para Admin.
- **«Ingreso y salida» ocupa exactamente la ventana en escritorio** (≥ 1024 px de ancho): escaneo, indicadores y paneles se ven sin desplazarse; «Actividad reciente» y, si no caben, «Personas dentro» se desplazan por dentro. Si la ventana es baja o el guarda abre un formulario del flujo (persona nueva, visita olvidada, motivo y área), vuelve el scroll de la página para no ocultar nada. En tablet y móvil, scroll normal.
- **Componentes compartidos** (Atomic Design): se restilizan los que existen (`Button`, `Badge`, `Input`, `StatTile`…) y se agregan solo los que faltaban (`Card`, `PageHeader`, `Icon`, ilustración del escaneo).

## Alternativas descartadas
- **Librería de componentes (shadcn/ui, MUI):** obligaría a reescribir componentes que funcionan y agrega dependencias para algo que Tailwind ya resuelve.
- **Inter desde Google Fonts:** exige abrir la CSP a otro dominio y depende de un tercero en una app interna.
- **Barra lateral:** la referencia aprobada usa navegación horizontal y deja más ancho a las tablas.

## Consecuencias
- Cambiar la paleta es editar `index.css`. Un color nuevo se agrega como token, no en el componente.
- No cambia ninguna regla de negocio, contrato de la API, permiso ni dato: solo presentación.
- Las pruebas E2E verifican que «Ingreso y salida» no tenga scroll global en 1280 × 720 y 1920 × 1080 y que «Actividad reciente» se desplace por dentro.
