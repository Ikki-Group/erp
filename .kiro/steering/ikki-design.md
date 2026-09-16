---
inclusion: fileMatch
fileMatchPattern: 'apps/web/**/*.{tsx,css}'
---

# Ikki Web — Design & UI Conventions

Applies to `apps/web`. This is an **ERP application UI** (dashboards, data tables, forms, POS
screens) — not a marketing/landing site. Optimize for clarity, density, and consistency, not
for hero animations or editorial layout. The landing-page design skills
(`design-taste-frontend`, `frontend-design`) are **out of scope here** — do not apply their
kinetic-hero / anti-3-card / scroll-hijack rules to app screens.

For deeper how-to, the installed skills apply: `shadcn-theming` (tokens/OKLCH/dark mode),
`shadcn-components` (Radix vs Base UI, composition), `shadcn-registries` (CLI/components.json).

## Stack (authoritative — match it, don't reinvent)

- **shadcn/ui**, style `base-mira`, built on **Base UI** (`@base-ui/react/*`), NOT Radix. New
  components compose with Base UI's `render={<... />}` prop, not Radix's `asChild`.
- **Tailwind v4** (`@tailwindcss/vite`), CSS-first config in `src/styles.css`. No
  `tailwind.config.*`.
- Owned primitives in `src/components/ui/` (~50). shadcn-adjacent extras in
  `src/components/reui/` (from the `@reui` registry / ReUI MCP).
- Data tables: **TanStack Table** (`@tanstack/react-table`) + `reui/data-grid`. Forms:
  **TanStack Form** (`@tanstack/react-form`). Icons: **lucide-react** (`iconLibrary: lucide`).
- Class merging: `cn()` from `@/lib/utils`. Variants: `class-variance-authority` (`cva`).

## Tokens & color (hard rules)

- Colors live as **OKLCH** CSS variables in `src/styles.css` under `:root` and `.dark`, surfaced
  to Tailwind via `@theme inline`. Dark mode is the `.dark` class (`@custom-variant dark`).
- **Never hard-code a hex/rgb/oklch literal in a component.** Use the semantic token utility
  (`bg-background`, `text-muted-foreground`, `border-input`, `bg-primary`, `ring-ring`, etc.).
- Every new token defined in `:root` **must** have a `.dark` counterpart. Base color is `zinc`;
  the brand primary is the teal `--primary: oklch(0.42 0.11 195)`. Keep the accent consistent —
  do not introduce a second accent hue.
- Charts use `--chart-1..5`; sidebar uses the `--sidebar-*` tokens. Reuse them, don't invent.

## Component conventions

- Before adding a new primitive, check `src/components/ui/` first — reuse or extend the existing
  one. Only pull from a registry (`bunx shadcn@latest add ...` or the ReUI MCP) when it's genuinely
  missing. Match the existing file's structure (`cva` variants object, `VariantProps`, `cn`).
- One radius system: components use `rounded-md`/`rounded-lg` off the `--radius` token. Don't mix
  ad-hoc radii.
- Keep the primitive boundary clean: `components/ui` = base primitives; `components/reui` =
  richer composites (data-grid, filters, stepper, timeline). Don't fork a `ui` primitive into a
  route file — extend it in place.

## App-UI patterns (what "modern" means here)

- **Tables**: server-driven via the existing `useServerTable` + URL state. Provide skeleton
  loading rows (`ui/skeleton`), a composed `ui/empty` state, and inline error, not a bare spinner.
- **Forms**: label above input; helper/error text below (`ui/field`). Never placeholder-as-label.
  Action buttons state the verb ("Save changes", "Create supplier"), and the success toast echoes
  it ("Supplier created").
- **Density**: ERP screens are information-dense. Group with `border`/`divide-y`/spacing before
  reaching for nested cards. Reserve elevation/shadow for real hierarchy (dialogs, popovers).
- **Motion**: only in response to user action (open/expand/confirm) and via the primitive's
  built-in transitions or `tw-animate-css`. No decorative scroll animations, no GSAP.

## Quality floor (not optional)

- Dark + light parity: verify both. Hierarchy that reads in light must read in dark.
- WCAG AA contrast on text, buttons, inputs, focus rings. Visible keyboard focus
  (`focus-visible:ring-*`). Respect `prefers-reduced-motion`.
- Run `bun run lint` / `bun run typecheck` (from `apps/web`) before finishing UI work.
