# Design System — "Warm Precision"

Visual design tokens and conventions for `apps/web`. This complements `06-ui-patterns.md` (which documents component *contracts* — forms, tables, status display); this doc covers the *visual* layer underneath them: color, radius, and the status-color semantic rule.

Live preview: **`/design-system`** — a multi-page catalog shell (its own left nav, independent of the app shell) with every token and component rendered live. Toggle the theme button (top left of the catalog nav) to check both light and dark. Treat this route as the source of truth for "does this look right" — screenshots in this doc will drift, the route won't.

### Catalog structure — adding a new page

`routes/design-system.tsx` is the shell layout (the left nav + `<Outlet />`); each category is its own child route under `routes/design-system/`:

| Route | Covers |
| --- | --- |
| `/design-system` (index) | Theme tokens, typography scale |
| `/design-system/buttons` | Button variants/sizes, raw Badge, Loading Button, Action Menu, Dropdown Menu, Permission Gate |
| `/design-system/forms` | Form-engine fields, raw Checkbox/Radio/Switch, Date Range Filter, Async Combobox, Currency Input, File Upload, Crud Form |
| `/design-system/data-display` | Stat Cards, Icon Tiles, Card, Data Card, Detail List, Status Badges, Segmented Bar, Currency Display, Relative Time, Audit Trail, Avatar |
| `/design-system/tables` | Data Table (incl. column visibility), Table Toolbar, Advanced Filters, Simple Table, Entity List Page (pattern) |
| `/design-system/feedback` | Inline Alerts, Inline Tip, Toast, Empty State, Page Error, Page Skeleton |
| `/design-system/overlays` | Confirm Dialog, Confirm/Confirm Input (react-call), Form Dialog, Unsaved Changes Dialog, Tooltip, Popover, Command Palette |
| `/design-system/navigation` | Page Tabs, Breadcrumb |
| `/design-system/charts` | Area/Line/Bar/stacked charts, Chart Switch |

To add a page: create `routes/design-system/<name>.tsx` (own `PageHeader` + one or more `PageSection`s) and add one entry to the `NAV_GROUPS` array in `routes/design-system.tsx` — the shell itself never needs another change. Keep each page's mock data colocated in that file; don't thread shared mock data through the shell.

## Direction

Warm, precise, understated ERP interface for Ikki Coffee & Resto. Warm neutral app background, white working surfaces, a deep charcoal-green sidebar, and a restrained forest-green primary accent. Minimal shadows, subtle borders, modest radius, no glassmorphism, no oversized dashboard cards. The one deliberate exception: a very low-opacity ambient glow (see "Shell backdrop" below) — everything else stays flat.

## Where tokens live

`apps/web/src/styles.css` is the single source of truth. It defines CSS variables in `:root` (light) and `.dark`, then maps them to Tailwind v4 utilities via `@theme inline`. **Never hardcode a hex/oklch color in a component** — reference the semantic token (`bg-primary`, `text-muted-foreground`, `border-sidebar-border`, ...) so both themes and future palette tweaks stay centralized.

shadcn/ui components, `class-variance-authority` variants, and `tailwind-merge` (`cn()`) are unchanged — this is a token/value update, not a new styling system.

## Color system

Built in OKLCH for perceptually-even lightness/contrast control. Hue map:

| Hue    | Family             | Used for                                                |
| ------ | ------------------ | -------------------------------------------------------- |
| ~85°   | Warm neutral       | `background`, `border`, body text (paper/charcoal, not gray) |
| ~148°  | Forest green       | `primary`, `sidebar-primary`, focus `ring`                |
| ~155°  | Charcoal-green     | `sidebar`, `invert` — same family as primary, pushed dark & desaturated |
| ~70°   | Amber              | `warning`                                                 |
| ~258°  | Blue-violet        | `info` — deliberately cool, so it reads as neutral/informational against the warm palette instead of competing with `success` |
| ~25°   | Warm red           | `destructive`                                             |
| ~50°   | Clay/terracotta    | `accent-warm` — decorative highlight only, not a status color |

### Core surface tokens

| Token                  | Role                                                        |
| ----------------------- | ------------------------------------------------------------ |
| `background`            | App background — warm neutral, not pure white               |
| `card` / `popover`      | Working surfaces — pure white (light mode)                   |
| `foreground`            | Body text — warm charcoal, not pure black                    |
| `secondary` / `muted`   | Quiet fills (table stripes, disabled, subtle panels)         |
| `accent`                | Hover/selected wash — tinted toward primary                  |
| `border` / `input`      | Hairline borders, input outlines                              |
| `ring`                  | Focus ring — forest green, visible on both light and dark surfaces |

### Sidebar tokens

The sidebar is deep charcoal-green **in light mode only** (`sidebar` hue ~155) — a deliberate dark-surface-on-light-content pattern, since the large lightness gap against the warm-neutral background carries the contrast on its own.

In **dark mode**, `sidebar` switches to the same ~85 warm-neutral hue as `background` (just a touch darker), not green. Once the page background is itself dark, a differently-hued dark sidebar reads as a mismatched surface rather than a deliberate one — matching the hue keeps the sidebar and page container reading as the same material. `sidebar-primary` and `sidebar-ring` still carry the ~148 green brand accent for the active nav item and focus ring in both themes, so the brand color isn't lost — only the large background fill adapts.

- `sidebar` / `sidebar-foreground` — base fill + text
- `sidebar-accent` / `sidebar-accent-foreground` — hover state
- `sidebar-primary` / `sidebar-primary-foreground` — active nav item (always green)
- `sidebar-border`, `sidebar-ring` — hairline + focus ring tuned for the dark surface

`invert` / `invert-foreground` follow the same rule (charcoal-green in light mode, warm-neutral in dark) — used for the login hero panel, ties the brand surface together across the two unauthenticated/authenticated entry points. When you change the sidebar hue, change `invert` to match.

### Shell backdrop

`AppShell` (`components/app-shell/app-shell.tsx`) renders a `ShellBackdrop` on `SidebarInset`, and `SidebarNav` (`components/app-shell/sidebar-nav.tsx`) renders its own glow directly inside `<Sidebar>`. Both are blurred, low-opacity circles pinned to opposite corners via `position: absolute inset-0` — 10% primary/accent-warm against the content area's lighter surface, 25%/15% against the much darker sidebar (it can carry more opacity before looking heavy). Same technique as the login hero's orbs (`routes/login.tsx`), turned down from a feature splash to a background texture.

**Deliberately no `z-index` on either layer.** Both live inside ancestors that already carry their own `z-index` (`sidebar-container`, the fixed desktop sidebar panel, is `z-10`). Giving the glow a negative `z-index` makes it resolve against *that* ancestor's stacking context instead of the panel directly wrapping it — which pushes it behind the panel's own `bg-sidebar`/`bg-background` fill, i.e. it silently disappears, even though it's correctly sized and colored in the DOM. Omitting `z-index` entirely keeps it in normal paint order instead: as the *first* child, it paints right after its parent's own background and before any content that comes after it in the markup — exactly "behind the nav items, in front of the panel fill." If you add another glow somewhere else in the shell, don't reach for `-z-10` "to be safe" — swap the gradient for an opaque `bg-red-500` first and confirm it's actually visible before dialing the opacity back down.

The sidebar glow is the more noticeable of the two — the content-area one is mostly covered by opaque white/dark cards and only shows through the gutters between them, which is intentional (it's wallpaper, not a feature).

Don't reach for this pattern per-page — it's shell-level chrome, set once. A page that wants its own accent (e.g. a hero banner) should still prefer a flat card per the rest of this doc.

### Status colors — the `-foreground` rule

One rule, applied consistently to `success`, `warning`, `info`, `destructive` (and every other semantic color — `primary`, `secondary`, `card`, `accent`, ...):

> **`X-foreground` is the text/icon color for when the background IS a solid `X`.**

Concretely:

```tsx
// Solid fill → use the -foreground companion
<span className="bg-destructive text-destructive-foreground">...</span>

// Soft/5–10%-opacity wash → use the base color directly as text
<span className="bg-destructive/10 text-destructive">...</span>
```

`StatusBadge`, `InlineTip`, `InlineAlert`, and `CurrencyDisplay` all use the soft-wash pattern (`bg-success/10 text-success`, etc.) — never `text-success-foreground` on a `/10` background. If you add a new status-colored component, follow the same rule: solid fill pairs with `-foreground`, soft fill uses the base color as text.

This also means `success`/`warning`/`info`/`destructive` base colors are tuned to work as **readable text on white/warm-neutral surfaces** (≈45–55% OKLCH lightness in light mode), not just as saturated fill colors — check contrast against `card`/`background` before changing them.

## Radius, spacing, elevation

- `--radius: 0.5rem` is the single base; `--radius-sm/md/lg/xl/2xl/...` all derive from it via `calc()` in `@theme inline`. Change the one variable to retune the whole scale.
- Deliberately modest — avoid bumping the base radius up for a "softer" look; the brief calls for a precise, understated interface, not a rounded consumer one.
- **One edge treatment per surface, not two.** Inline surfaces (`Card`, `StatCard`, `DataCard`) use a single subtle `border` and *no* shadow — stacking a shadow on top of a border/ring reads as a muddy double edge. Shadow is reserved for things that actually float above content: dialogs, popovers, dropdowns. If a card needs more presence, reach for a slightly stronger border (`hover:border-foreground/15`) before reaching for a shadow.

## Numeric & table conventions (Inventory pilot)

Reference implementation: `src/features/inventory/components/stock-table.tsx` and `movement-history.tsx`.

- **Right-align numeric columns** (quantity, min stock, cost price) — both the header (`header: () => <div className="text-right">...</div>`) and the cell. Text columns (code, name) stay left-aligned.
- **`font-mono` + `tabular-nums`** on numeric cells so digits line up across rows.
- Quantities carry their UOM inline (`34.880 kg`), muted relative to the number itself.
- Currency uses `Rp` + `id-ID` locale grouping (see `CurrencyDisplay` for the shared formatter), no decimal places for IDR.
- Status is always the last column, rendered with `StatusBadge` — never a plain colored cell.

### Loading, empty, and error — all three, every table

Every query-backed table needs all three branches; a table that silently shows nothing on a failed fetch is a bug, not an edge case.

- **Loading** — pass `isLoading` straight to `DataTable`/`EntityListPage`; it renders skeleton rows (`loadingMode: 'skeleton'` in the underlying `DataGrid`), not a bare spinner.
- **Empty** — check `!isLoading && data.length === 0` and render `EmptyState` (standalone tables) or pass `isEmpty`/`emptyState` to `EntityListPage`.
- **Error** — check `query.isError` **before** the empty check and render `PageError` with `onRetry={() => query.refetch()}`. `EntityListPage` takes this as `isError` + `onRetry` (or a fully custom `errorState` node) and swaps in `PageError` in place of the table, keeping the page header/toolbar intact. Standalone tables (not using `EntityListPage`) do the same check inline — see `stock-table.tsx` for the pattern.

Detail pages get the equivalent for free via `DetailBoundary`/`QueryState`, which already branch on `isLoading`/`isError`/empty. `EntityListPage`'s `isError` prop brings list pages to the same standard.

## Typography

Five deliberate text tiers covering structural headings down to field labels, applied consistently everywhere — `font-heading` is a semantic marker (currently equal to `font-sans`; swap it centrally in `styles.css` if a distinct display face is ever added). Demoed live under Typography on `/design-system` (Overview):

| Tier | Class | Used for |
| --- | --- | --- |
| Page title | `font-heading text-lg font-semibold tracking-tight` | `PageHeader`/`FormPage`/`WizardPage`/`NotFound` h1 — one per page |
| Section/panel title | `font-heading text-sm font-semibold tracking-tight` | `PageSection`, `CardTitle`, `DialogTitle`, `AlertDialogTitle`, `FrameTitle`, `AlertTitle`, `DataCard`, `EmptyState`/`PageError` titles, and any ad-hoc `<h2>`/`<h3>` grouping a form/panel |
| Body | `text-sm` (default) | Paragraph text, table cells |
| Caption/meta | `text-xs text-muted-foreground` | Descriptions under a title, field hints, timestamps |
| Field label/legend | `text-xs/sm font-medium` (via `Field`/`FieldLegend`) | Form field labels — intentionally lighter than a title; don't bump these to semibold |

The rule that matters: **anything that functions as a title — regardless of HTML tag — is `font-semibold tracking-tight`,** never `font-medium`. `font-medium` is reserved for labels, legends, and emphasized body/data text (e.g. `DetailList`'s value column), which are a different tier and shouldn't be confused with a title by matching its weight. Before adding a new ad-hoc section heading in a feature file, check whether `PageSection` already fits instead of hand-rolling another `<h2 className="...">`.

## Dialog anatomy

`Dialog` (`components/ui/dialog.tsx`) uses a three-band layout: a tinted header, a plain body, and a tinted footer, each separated by a hairline divider — not a single undifferentiated padded box.

- `DialogHeader` and `DialogFooter` break out of `DialogContent`'s padding via negative margins (`-mx-4 -mt-4` / `-mx-4 -mb-4`) so their `bg-muted/40` band and `border-b`/`border-t` divider run edge-to-edge, independent of whatever the body does. `DialogContent` carries `overflow-hidden` so the bands' own `rounded-t-xl`/`rounded-b-xl` corners clip cleanly against the popup's corner radius.
- The body (whatever children sit between `DialogHeader` and `DialogFooter`) keeps `DialogContent`'s own `p-4` — no extra wrapper needed.
- This is deliberately **not** applied to `AlertDialog` — its compact, centered, icon-led confirm card (see `ConfirmDialog`) stays minimal; banding would add weight to a component that's supposed to read as a quick yes/no, not a form surface.

See the "Form Dialog (react-call)" demo in `/design-system` for the live result.

## Stat cards

`StatCard` (`components/shared/stat-card.tsx`) takes three optional props beyond `title`/`value`/`icon`/`trend`/`description`:

- `tone`: `'default' | 'success' | 'warning' | 'info' | 'destructive'` — tints the icon tile to match the metric's meaning. Pick it from what the metric *means*, not from a hardcoded `text-*` class on the icon — the icon alone does nothing without it (`IconTile`'s `soft` variant takes its color from the tile, not the glyph). The dashboard's "Stok Menipis" card is the reference: `tone={lowStockItems.length > 0 ? 'warning' : 'default'}`.
- `isLoading`: shows skeleton bars in place of value/trend/description. Prefer this over embedding a loading sentinel (`'…'`) in the `value` string.
- `onClick`: makes the whole card a keyboard-operable button (`role="button"`, `tabIndex`, Enter/Space, focus-visible ring) — the same accessibility pattern already used for clickable table rows (`reui/data-grid`). Use it to link a metric to its detail list; don't wrap `StatCard` in a second interactive element.

`DataCard` (`components/shared/data-card.tsx`) shares the same `tone` type and `TONE_CLASS` tint via its own optional `icon`/`tone` pair, so a page's stat tiles and content cards read as one family instead of two unrelated styles.

## Verifying a change

1. `/design-system` — walk the left nav, eyeball every page's tokens/components in both themes.
2. `bun run typecheck` / `bun run lint` / `bun run test` (`apps/web`) — must stay clean.
3. Spot-check one real page (not just the catalog) — e.g. `/inventory/stock`, `/master/materials/new` — since the catalog uses mock data and can hide truncation/overflow issues real data triggers.
4. Tab through a form or the sidebar — confirm the focus ring is visible on both the dark sidebar and light surfaces.
