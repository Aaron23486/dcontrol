# 0011 — "Enterprise Minimal" design system

**Status:** APPROVED (2026-10-23, interface redesign)

## Context

The interface worked, but each screen had its own hand-written colors (Tailwind grays spread across 46 files), with no icons or typeface of its own. "Ingreso y salida" (entry and exit) was 1041 px tall on a 1280 × 720 screen: the guard had to scroll to see the recent activity. The owner approved a reference image for that screen and asked the rest of the modules to follow the same visual language.

## Decision

- **Tokens in a single place** (`apps/web/src/index.css`, Tailwind 4 `@theme` block): colors by purpose (`canvas`, `surface`, `line`, `ink`, `primary`, `success`, `danger`, `warning` and their soft variants), radii and shadows. Components use those names, never a loose color. The values come from measuring the reference image and meet AA contrast.
- **Fixed meaning of colors:** blue = actions and navigation; green = inside and entries; blue = exits in the activity feed; soft red = exits in the indicators, and errors; amber = needs attention. Status is never communicated by color alone: it always comes with text or an icon.
- **Self-hosted Inter typeface** (`@fontsource-variable/inter`): bundled with the web app, so the security policy (`font-src 'self'`) does not change and there is no third-party dependency. The ID-number field keeps the monospaced font.
- **Custom SVG icons** (`components/atoms/Icon.tsx`), line-style and decorative (`aria-hidden`): no icon library.
- **Horizontal navigation**, 56 px tall; "Auditoría" (audit log) still appears only for Admin.
- **"Ingreso y salida" fills exactly the window on desktop** (≥ 1024 px wide): scanning, indicators and panels are visible without scrolling; "Actividad reciente" (recent activity) and, if they do not fit, "Personas dentro" (people inside) scroll internally. If the window is short or the guard opens a form of the flow (new person, forgotten visit, purpose and area), page scrolling comes back so nothing is hidden. On tablet and mobile, normal scrolling.
- **Shared components** (Atomic Design): the existing ones are restyled (`Button`, `Badge`, `Input`, `StatTile`…) and only the missing ones are added (`Card`, `PageHeader`, `Icon`, the scan illustration).

## Rejected alternatives

- **Component library (shadcn/ui, MUI):** it would require rewriting components that work and adds dependencies for something Tailwind already solves.
- **Inter from Google Fonts:** requires opening the CSP to another domain and depends on a third party in an internal app.
- **Sidebar:** the approved reference uses horizontal navigation and leaves more width for tables.

## Consequences

- Changing the palette means editing `index.css`. A new color is added as a token, not in the component.
- No business rule, API contract, permission or data changes: presentation only.
- The E2E tests verify that "Ingreso y salida" has no page scroll at 1280 × 720 and 1920 × 1080 and that "Actividad reciente" scrolls internally.
