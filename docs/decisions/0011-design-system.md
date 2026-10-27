# ADR 0011: Design system

**Status:** Accepted · 2026-10-23

## Context

The first version of the interface worked, but each screen had hand-written colors (Tailwind grays spread across 46 files), no icons and no typeface of its own. The entry and exit screen was 1041 px tall on a 1280 × 720 display, so the guard had to scroll to see recent activity. I defined a reference design for that screen and wanted every other module to follow the same visual language.

## Decision

- **Tokens in one place** (`apps/web/src/index.css`, Tailwind 4 `@theme`): colors by purpose (`canvas`, `surface`, `line`, `ink`, `primary`, `success`, `danger`, `warning` and their soft variants), radii and shadows. Components use those names, never raw colors, and every pair meets AA contrast.
- **Fixed color meaning:** blue for actions and navigation; green for inside and entries; blue for exits in the activity feed; soft red for exits in the indicators and for errors; amber for things that need attention. Status always comes with text or an icon, never color alone.
- **Self-hosted Inter** (`@fontsource-variable/inter`), bundled with the app, so the content security policy stays `font-src 'self'` with no third-party dependency. The ID-number field keeps a monospaced font.
- **Custom SVG icons** (`components/atoms/Icon.tsx`), line-style and decorative (`aria-hidden`), with no icon library.
- **Horizontal navigation** (56 px); the audit log appears only for Administrators.
- **The entry and exit screen fills exactly the window on desktop** (≥ 1024 px): scanning, indicators and panels are visible without scrolling; recent activity and, if needed, people inside scroll internally. When the window is short or the guard opens a form in the flow, page scrolling returns so nothing is hidden. Tablet and mobile scroll normally.
- **Shared components** (Atomic Design): the existing ones were restyled (`Button`, `Badge`, `Input`, `StatTile`…) and only the missing ones were added (`Card`, `PageHeader`, `Icon`, the scan illustration).

## Alternatives considered

- **A component library (shadcn/ui, MUI):** it meant rewriting components that already worked and adding dependencies for something Tailwind covers.
- **Inter from Google Fonts:** it requires opening the CSP to another domain and depends on a third party.
- **A sidebar:** horizontal navigation leaves more width for the tables.

## Consequences

- Changing the palette means editing `index.css`; a new color is added as a token, never inside a component.
- No business rule, API contract, permission or data changed — presentation only.
- End-to-end tests check that the entry and exit screen has no page scroll at 1280 × 720 and 1920 × 1080 and that recent activity scrolls internally.
