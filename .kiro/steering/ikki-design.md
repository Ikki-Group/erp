---
inclusion: fileMatch
fileMatchPattern: 'apps/web/**/*.{tsx,css}'
---

# Ikki Web — Design & UI Conventions

Applies to `apps/web`, an operate-mode ERP UI (dashboards, tables, forms) for staff running
shifts — not a marketing site. POS screens are out of product scope; don't use them as a reference.

**Visual authority: `apps/web/DESIGN.md` ("Warm Precision").** It wins over this file and every
other doc. Live catalog: `/design-system`. Usage recipes: `apps/web/COMPONENT_GUIDE.md`.

## Stack (match it, don't reinvent)

- shadcn/ui style `base-mira` on **Base UI** (`@base-ui/react/*`), not Radix. Compose with
  `render={<... />}`, not `asChild`.
- Tailwind v4, CSS-first config in `src/styles.css`. No `tailwind.config.*`.
- Primitives in `src/components/ui/`; composites in `src/components/shared/`; registry extras in
  `src/components/reui/` (data-grid, stepper, timeline, number-field).
- TanStack Table + `reui/data-grid`, TanStack Form, lucide-react icons, `cn()` + `cva`.

## Tokens (summary — details in DESIGN.md)

- OKLCH CSS variables in `src/styles.css` (`:root` + `.dark`), exposed via `@theme inline`.
  Every token has a light and a dark value. Never hard-code a color literal in a component.
- Warm-neutral paper base (~85 hue), not zinc/gray. **Forest green** (`--primary`, ~148 hue) is the
  one accent: primary action, active state, focus. No second accent; `accent-warm` is never
  interactive or a status.
- Status: `success` / `warning` / `info` / `destructive`, as soft washes (`bg-X/10 text-X`).
- Placeholders use `text-placeholder` (≥4.5:1), never a faded `muted-foreground`.
- Radius `sm`/`md`/`lg`/`xl`/`full` only. Weight caps at `font-semibold`.
- Inline surfaces: one hairline border, no shadow. Shadow only on floating surfaces. No ambient
  glows, no glass, no card-in-card.

## Components

- Reuse `components/ui` and `components/shared` before adding anything; check `/design-system`.
- Dashboard cards: `MetricCard` (metric or panel mode). `StatCard`/`DataCard`/`CrudForm` are
  deprecated aliases.
- Tables: `useServerTable` + URL state (`listSearchSchema`, default page size 25); cell
  components (`TextCell mono` for codes, `NumericCell`/`CurrencyCell` right-aligned
  `font-mono tabular-nums`).
- Every query-backed view: skeleton loading, `PageError` + retry (checked first), `EmptyState`.
- Forms: label above input, hint/error below, verb-named actions, success toast echoes the verb.
- Money is formatted from server values (`CurrencyDisplay` / `toDisplayCurrency`); no client
  money math.

## Quality floor

- Light + dark parity; 390px and 1440px both work.
- WCAG AA contrast; visible `focus-visible` rings; respect `prefers-reduced-motion`.
- Touch: primitives grow to ≥40px on `pointer-coarse:`; don't override per route.
- From `apps/web`: `bunx tsc --noEmit`, `bunx oxlint src`, `bunx vitest run`.
