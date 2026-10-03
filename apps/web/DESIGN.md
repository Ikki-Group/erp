---
name: Ikki ERP
description: A warm, precise, understated operations console for a two-store F&B business.
colors:
  warm-paper: "oklch(0.975 0.006 85)"
  warm-charcoal: "oklch(0.24 0.016 85)"
  forest-green: "oklch(0.4 0.075 148)"
  forest-green-foreground: "oklch(0.98 0.01 148)"
  charcoal-green: "oklch(0.22 0.025 155)"
  charcoal-green-foreground: "oklch(0.95 0.012 90)"
  amber-warning: "oklch(0.5 0.14 70)"
  blue-violet-info: "oklch(0.48 0.12 258)"
  warm-red-destructive: "oklch(0.5 0.19 25)"
  clay-terracotta: "oklch(0.68 0.14 50)"
  card-surface: "oklch(1 0 0)"
  hairline-border: "oklch(0.885 0.009 85)"
typography:
  display:
    fontFamily: "Geist Variable, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.3"
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist Variable, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.625"
    letterSpacing: "normal"
rounded:
  sm: "0.3rem"
  md: "0.4rem"
  lg: "0.5rem"
  xl: "0.7rem"
spacing:
  sm: "0.75rem"
  md: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.forest-green}"
    textColor: "{colors.forest-green-foreground}"
    rounded: "{rounded.md}"
    height: "1.75rem"
    padding: "0 0.5rem"
  button-primary-hover:
    backgroundColor: "{colors.forest-green}"
  button-secondary:
    backgroundColor: "card-surface"
    textColor: "{colors.warm-charcoal}"
    rounded: "{rounded.md}"
  input:
    backgroundColor: "card-surface"
    textColor: "{colors.warm-charcoal}"
    rounded: "{rounded.md}"
    height: "1.75rem"
  card:
    backgroundColor: "{colors.card-surface}"
    rounded: "{rounded.lg}"
    padding: "1rem"
---

# Design System: Ikki ERP

## Overview

**Creative North Star: "Warm Precision"**

Ikki ERP reads as a quiet, confident operations tool, not a dashboard trying to impress. Its personality comes from a warm-neutral paper tone standing in for the usual cold grays, a single restrained forest-green accent that marks what matters (primary actions, active state, focus), and a deliberate refusal of consumer-app signals: no glassmorphism, no oversized stat tiles, no soft rounded-pill everything. Density and legibility are the point — this is for staff running shifts and counting stock, often for hours at a stretch, not for a marketing screenshot.

Depth is nearly flat by construction: working surfaces (cards, panels) carry a single hairline border and no shadow. Shadow is spent only where something genuinely floats above the page — dialogs, menus, toasts — so its appearance always means "this is temporarily on top," never "this is a nicer card." The one deliberate softness is a very low-opacity ambient glow fixed to the app shell's corners, present once, globally, never re-earned per page.

**Structural influence (color untouched):** the system's precision vocabulary — hairline-border elevation over shadow stacks, a tight derived radius scale, weight capped at semibold, monospace for exact identifiers — is deliberately aligned with the "midnight precision instrument" school (Linear/Vercel/Raycast-style systems). The brief is explicit: adopt and improve on that structural discipline, never its dark/acid-lime color world. Every token in this file's frontmatter stays Warm Precision's own.

**Confirmed anti-references:** glassmorphism, oversized/padded dashboard cards, a softened/rounded-consumer radius scale, decorative shadows on inline content.

**Key Characteristics:**
- Warm-neutral paper background instead of gray; pure-white working surfaces on top of it.
- One brand accent (forest green), used sparingly — it marks action and active state, not decoration.
- Flat by default; shadow is reserved for floating overlays only.
- Small type (13px/12px body) paired with relaxed line-height, so dense tabular data stays legible instead of feeling cramped.
- Document/reference identifiers (material codes, transfer/receiving/opname numbers) render in monospace — the precision-instrument cue for "this is an exact identifier."

## Colors

Built in OKLCH for perceptually-even lightness control across both themes. The palette reads as warm paper and ink, with status colors kept deliberately legible as text, not just as saturated fills.

### Primary
- **Forest Green** (`oklch(0.4 0.075 148)`): the one brand accent — primary buttons, links, the active nav item, the focus ring. Used sparingly; its rarity is what makes it read as "this is the action."

### Secondary
- **Charcoal-Green** (`oklch(0.22 0.025 155)`): same hue family as primary, pushed dark and desaturated. Base fill for the sidebar and the login page's hero panel (`invert`/`invert-foreground`) — ties the two unauthenticated/authenticated brand surfaces together.

### Tertiary
- **Clay/Terracotta** (`oklch(0.68 0.14 50)`): a decorative warm highlight (`accent-warm`) — used only for ambient glows and incidental warmth (e.g. the login hero's second orb). Never used as a status color.

### Neutral
- **Warm Paper** (`oklch(0.975 0.006 85)`): app background — a warm off-white, not a cold gray.
- **Warm Charcoal** (`oklch(0.24 0.016 85)`): body text — warm near-black, not pure black.
- **Card White** (`oklch(1 0 0)`): working surfaces (`card`, `popover`) sit on pure white, one step lighter than the paper background behind them.
- **Hairline Border** (`oklch(0.885 0.009 85)`): the only edge treatment on inline surfaces — see Elevation.

### Status colors
- **Amber** (`~70°`, `warning`), **Blue-Violet** (`~258°`, `info`), **Warm Red** (`~25°`, `destructive`), and a `success` green from the same family as primary (`~150°`). `info`'s hue is deliberately cool so it reads as neutral/informational rather than competing visually with `success`.

### Named Rules
**The `-foreground` Rule.** `X-foreground` is the text/icon color for when the background IS a solid `X`. A soft 5–10%-opacity wash (badges, inline tips, alerts) uses the base color directly as text instead (`bg-destructive/10 text-destructive`), never `text-destructive-foreground` on a soft background. This applies to every semantic color, not just status colors.

**The One-Accent Rule.** Forest green is the only color that means "action" or "selected." Clay/terracotta is warmth, not meaning — it never appears on an interactive element a user is meant to act on.

**The Light/Dark Hue Swap.** The sidebar and `invert` surfaces are charcoal-green in light mode but switch to the same warm-neutral hue as the page background (just darker) in dark mode — once the page itself is dark, a differently-hued dark sidebar reads as a clashing surface rather than a deliberate one. `sidebar-primary`/`sidebar-ring` keep carrying green in both themes so the brand accent isn't lost.

## Typography

**Display/Body/Label Font:** Geist Variable (variable weight sans-serif), with a system-sans fallback. One family for the whole product — `font-heading` is currently just an alias for `font-sans`, kept distinct in code so a future display face can be swapped centrally without touching components.

**Character:** Plain and quiet — the typographic voice carries almost no personality of its own, so the color and spacing system can do the work. The one firm rule is weight, not face: anything that *functions* as a title is `font-semibold tracking-tight`, regardless of its HTML tag.

### Hierarchy
- **Page title** (`font-semibold`, `text-lg`/18px, `tracking-tight`): one per page — `PageHeader`, `FormPage`, `WizardPage`, `NotFound`.
- **Section/panel title** (`font-semibold`, `text-sm`/14px, `tracking-tight`): `PageSection`, card/dialog/alert titles, and any ad-hoc grouping heading.
- **Body** (`text-sm`/14px default, `text-xs`/12px in dense surfaces like buttons/inputs/cards, both with relaxed line-height): paragraph text, table cells, form controls.
- **Caption/meta** (`text-xs`, `text-muted-foreground`): descriptions under a title, field hints, timestamps.
- **Field label** (`text-xs`–`text-sm`, `font-medium`): intentionally lighter than a title — never bumped to semibold.

### Named Rules
**The Title-Weight Rule.** `font-semibold tracking-tight` is reserved for things functioning as titles. `font-medium` is reserved for labels, legends, and emphasized data (e.g. a detail list's value column) — a different tier that must not be confused with a title by matching its weight.

**The Small-but-Breathing Rule.** Interactive and tabular surfaces default to small type (12–13px), always paired with a relaxed line-height (`/relaxed`) rather than the tight default — so dense, numbers-heavy screens stay legible instead of feeling cramped.

## Layout

Density-first: controls default to a compact height (buttons/inputs at 28px, `h-7`), and cards use a `--card-spacing` custom property (16px default, 12px in the `sm` card variant) that every card-adjacent part (header/content/footer) shares, so tightening a card's density is one variable change. Numeric table columns are right-aligned with `font-mono tabular-nums`; text columns stay left-aligned. The sidebar is a fixed 16rem (18rem on mobile, as an overlay sheet), collapsible to a 3rem icon rail. Dialogs cap at `sm` max-width (desktop) and go full-width minus a 2rem gutter below that — there is no wide/full-screen dialog variant in the current system.

## Elevation & Depth

Flat by default. Inline, in-flow surfaces (`Card`, `StatCard`, `DataCard`) carry exactly one edge treatment — a hairline `border`, no shadow — because stacking a shadow on a bordered surface reads as a muddy double edge. Shadow is spent only on things that actually float above page content: dialogs, sheets, popovers, dropdowns, menus, comboboxes, hover cards, and toasts. Every one of those pairs its shadow with a 1px `ring-foreground/10` — the shadow carries the lift, the ring carries the crisp edge the shadow alone would blur.

### Shadow Vocabulary
- **Floating-md** (`shadow-md` + `ring-1 ring-foreground/10`): popovers, dropdown/context/navigation menus, select, combobox, hover card.
- **Floating-lg** (`shadow-lg` + `ring-1 ring-foreground/10`): dialogs, sheets, toasts — the surfaces with the most visual weight/urgency.
- **Tooltip-xl** (`shadow-xl`): chart tooltips only — the one place a slightly heavier shadow is used, since it floats over dense chart content.
- **Floating chrome** (`shadow-sm`): the optional "floating" sidebar variant and the inset `SidebarInset` container — a much lighter lift for large, mostly-static chrome rather than a transient overlay.

### Named Rules
**The Flat-By-Default Rule.** A card gets more visual presence from a stronger border (`hover:border-foreground/15`), never from adding a shadow. Shadow always means "temporarily on top," never "more important."

## Shapes

One base radius (`--radius: 0.5rem` / 8px) drives the whole scale via `calc()` — `sm` (≈4.8px), `md` (≈6.4px), `lg` (8px), `xl` (≈11.2px) are all derived, so retuning the whole product's corner language is a one-variable change. Pruned to exactly four steps deliberately — a wider derived tail (`2xl`/`3xl`/`4xl`) existed but sat unused; a radius vocabulary should be as small as the product actually needs, not as large as `calc()` can generate. The scale is deliberately modest: buttons/inputs/chips sit at `rounded-md`/`rounded-sm`, cards/dialogs/popovers at `rounded-lg`/`rounded-xl`, and only pill-shaped status badges and the sidebar's active-item/sub-item corners reach toward fully rounded. Borders are 1px hairlines throughout; there is no decorative or thick-border treatment anywhere in the system.

## Components

### Buttons
- **Shape:** `rounded-md` (≈6.4px), `h-7` (28px) default height; `xs`/`sm`/`lg`/icon-only size variants scale from `h-5` to `h-8`.
- **Primary:** solid `bg-primary`/`text-primary-foreground`, `hover:bg-primary/80` (a translucency fade, not a different hue).
- **Secondary:** `bg-secondary` fill, hover blends 5% of the foreground into it via `color-mix` rather than jumping to a fixed darker swatch.
- **Outline / Ghost:** border-only or borderless, filling to `bg-muted`/`bg-input` on hover and `aria-expanded`.
- **Destructive:** soft-wash by default (`bg-destructive/10 text-destructive`), not a solid red button — follows the `-foreground` rule's soft-wash branch.
- **States:** a 2px `ring-ring/30` focus ring; a 1px downward nudge (`translate-y-px`) on `:active` for solid tactile feedback, suppressed on menu-trigger buttons.

### Chips / Badges
- **Status Badge:** fully rounded pill, soft-wash background (`bg-success/10 text-success`, etc.) with a small solid dot in the same hue — never a solid-fill badge.
- **Combobox Chip:** a muted rounded-rectangle tag (`bg-muted-foreground/10`) with an inline remove button that fades in on hover — distinct from a status badge; chips represent selected values, not state.

### Cards / Containers
- **Corner Style:** `rounded-lg` (8px).
- **Background:** `bg-card` (pure white in light mode) on the warm-paper page background.
- **Shadow Strategy:** none — see Elevation. A single `border` is the only edge treatment.
- **Internal Padding:** one shared `--card-spacing` token (16px default, 12px for the `sm` size variant) driving header/content/footer alike.

### Inputs / Fields
- **Style:** `rounded-md`, 1px `border-input`, a faint 20% tint of the input color as background (`bg-input/20`), `h-7` to match button height.
- **Focus:** border shifts to `ring` color plus a 2px `ring-ring/30` halo — the same focus treatment as buttons, for a consistent "this is focused" signal across all controls.
- **Error:** `aria-invalid` swaps the border to `destructive` and adds a `ring-destructive/20` halo — no separate error-only component.

### Navigation (Sidebar)
- **Style:** charcoal-green fill in light mode, warm-neutral (matching the page background, just darker) in dark mode — see Named Rules under Colors.
- **Default / Hover:** `sidebar-foreground` text; hover fills `sidebar-accent`.
- **Active:** `bg-sidebar-primary` + `font-medium` + `text-sidebar-primary-foreground` — the one-accent rule's "selected" case, visually distinct from hover's `sidebar-accent`. (Fixed in `components/ui/sidebar.tsx`'s `sidebarMenuButtonVariants` — it previously fell back to `sidebar-accent`, the same token as hover; `sidebar-primary` was defined but unused outside a decorative blur and a catalog swatch.)
- **Active sub-item:** stays on the lighter `sidebar-accent` treatment, one tier below the top-level active state — a deliberate hierarchy, not an oversight.
- **Mobile:** collapses into an off-canvas `Sheet` rather than an icon rail.

### Dialog (signature anatomy)
Three horizontal bands rather than one undifferentiated padded box: a `bg-muted/40` header and footer, each separated from the plain body by a hairline divider, with the dialog's own `rounded-xl` corners clipped onto the header/footer bands via `overflow-hidden`. Deliberately **not** applied to `AlertDialog`, whose compact icon-led confirm card stays bandless so it still reads as a quick yes/no rather than a form surface.

## Do's and Don'ts

### Do:
- **Do** theme browser-native surfaces (text selection, scrollbars) from the same semantic tokens as everything else (`::selection`, `::-webkit-scrollbar-thumb` in `styles.css`) — an unthemed OS-blue selection or gray scrollbar is the cheapest tell that a page was assembled, not built.
- **Do** give horizontally-scrollable regions an edge-fade "scroll shadow" (`.data-table-horizontal-scroll` in `styles.css`) rather than a dead-end cutoff — it appears only on the side that still has unscrolled content.
- **Do** reference semantic tokens (`bg-primary`, `text-muted-foreground`, `border-sidebar-border`) — never hardcode a hex/oklch value in a component; `apps/web/src/styles.css` is the single source of truth.
- **Do** use the soft-wash pattern (`bg-X/10 text-X`) for inline status content (badges, tips, alerts); reserve solid `bg-X text-X-foreground` for when the fill itself IS the solid status color.
- **Do** right-align numeric table columns with `font-mono tabular-nums`; keep text columns left-aligned.
- **Do** give every query-backed table all three states — loading (skeleton), empty (`EmptyState`), error (`PageError` + retry, checked *before* the empty check).
- **Do** use `font-semibold tracking-tight` for anything functioning as a title, at the size matching its tier (page vs. section) — regardless of HTML tag.
- **Do** render document/reference identifiers (`MAT-001`, `TRF-STORE-01-...`, supplier/UoM codes) in `font-mono`, muted when they're a secondary reference — the precision-instrument cue that marks something as an exact identifier, not prose. `TextCell`'s `mono` prop is the sanctioned way; apply it to every list column holding a code, not just some.
- **Do** keep the radius vocabulary at exactly four derived steps (`sm`/`md`/`lg`/`xl`) plus `full` for pills — a system earns a new radius step only when a real surface needs it, not because `calc()` can generate one.

### Don't:
- **Don't** raise the base radius for a "softer" feel — the brief is a precise, understated operations tool, not a rounded consumer app.
- **Don't** stack a shadow on top of a border for inline surfaces (`Card`, `StatCard`, `DataCard`) — one edge treatment per surface; reach for a stronger border before a shadow.
- **Don't** use `font-medium` on anything meant to read as a title — that weight is reserved for labels, legends, and emphasized data, a different tier.
- **Don't** reach for `font-bold` (700+) anywhere — the system caps at `font-semibold` (600). Precision reads through tracking and size steps, not heavier weight; this product has never used a bolder weight and should stay that way.
- **Don't** reach for the ambient shell-backdrop glow per-page — it's shell-level chrome, set once; a page wanting its own accent should still prefer a flat card.
- **Don't** treat the POS module's existing screens as a styling reference — per `PRODUCT.md`, POS is currently out of scope for product direction, not just incomplete.
