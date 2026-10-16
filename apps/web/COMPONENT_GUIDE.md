# Ikki Web Component Guide

Use this guide to choose components. Visual authority is `DESIGN.md`; token values live in `src/styles.css`. The live `/design-system` catalog is the reference for rendered behavior in both themes. Product constraints live in `PRODUCT.md`.

## Foundations

**Warm Precision:** Geist Variable, warm paper/charcoal surfaces, forest-green actions, semantic status colors. Inline surfaces use borders; shadows identify floating overlays. Titles stop at semibold. Use monospace and tabular figures for quantities, money, and exact identifiers.

- Desktop controls stay compact: default buttons and inputs are 28px.
- Coarse-pointer controls expand to at least 44px without overlapping invisible hit areas. This is input-device based, not only a viewport breakpoint.
- Right-align numbers in inputs, table headers/cells, and summaries. Text stays left-aligned.
- Tailwind's spacing unit is 4px: `gap-2` = 8px, `space-y-4` = 16px, `p-6` = 24px. Do not interpret `p-24` as 24px.
- Use semantic utilities, never component-local palette values. Solid `bg-X` pairs with `text-X-foreground`; soft `bg-X/10` pairs with `text-X`.
- Use Base UI's `render` composition, not Radix's `asChild`.

## Choose by task

| Task                                  | Component                                                                          | Catalog                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Search, compare, paginate records     | `useResourceList` + `EntityListPage` + `TableToolbar`                              | `/design-system/tables`                                                                |
| Small static or editable row set      | `Table` primitives + cell renderers                                                | `/design-system/tables#simple-table`                                                   |
| Create/edit an entity                 | Feature hook using `useEntityEditor` + `EntityEditorPage`                          | Materials / Suppliers / UOM / Locations / IAM / Recipes / Menu Items / Payment Methods |
| Quantity with a fixed/selectable unit | `NumberInputGroupAddonField` / `NumberInputGroupField`                             | `/design-system/forms`                                                                 |
| Monetary entry                        | `field.CurrencyField`; standalone `CurrencyInput` outside forms                    | `/design-system/forms`                                                                 |
| Workflow state                        | `StatusBadge`                                                                      | `/design-system/data-display`                                                          |
| Category/type/count label             | `Badge`                                                                            | `/design-system/buttons`                                                               |
| Titled data section / metric          | `DataCard` / `StatCard`                                                            | `/design-system/data-display`                                                          |
| Empty, loading, failure               | `EmptyState`, `PageSkeleton`, `PageError`                                          | `/design-system/feedback`                                                              |
| Consequential action                  | `useWorkflowAction` over `confirm`; `confirmInput` for typed confirmation          | `/design-system/overlays#confirm`                                                      |
| One focused quick-edit task           | `formDialog`                                                                       | `/design-system/overlays`                                                              |
| Trends and comparisons                | `AreaChart`, `LineChart`, `BarChart` + exact-value table                           | `/design-system/charts`                                                                |
| Select related records                | Feature-owned Material/Supplier/UOM/Location/Category/Role/Menu Item lookup fields | Entity and operational forms                                                           |
| Edit document rows                    | `LineItemEditor` with feature-owned fields                                         | Receiving / transfer wizards / Recipes                                                 |
| Supplier price relations              | `PricingTable` + feature `PricingForm`                                             | Suppliers → Pricing                                                                    |
| Material location relations           | `LocationAssignment` + feature workflow hook                                       | Materials → Locations                                                                  |

Catalog search accepts task keywords such as quantity, error, or inventory. Overview includes ERP composition recipes for lists, receiving, transfers, and stock counts. Catalog values are illustrative, never operational records.

## Tables and numbers

Import cell renderers from `@/components/data-table`:

```tsx
{
  accessorKey: 'quantity',
  header: rightAlignedHeader('Quantity'),
  cell: ({ getValue }) => <NumericCell value={getValue()} unit="kg" />,
}
```

- `NumericCell`: right-aligned, monospace, `id-ID` digit grouping; null/undefined becomes an em dash, not zero.
- `CurrencyCell`: same alignment; uses `CurrencyDisplay` for Rupiah. Integer prices have no decimals; fractional costs retain up to two decimals.
- `TextCell`: use `mono` for identifiers. Use `truncate` only with a bounded width; overflowing strings reveal a tooltip on hover or keyboard focus, and remeasure on resize.
- `DateCell`: localized dates; `withTime` adds time.
- Keep wide tables in named, keyboard-focusable horizontal scroll regions. Never hide inaccessible columns with overflow clipping.
- Every query-backed list needs loading, error/retry, record-empty, and filtered-empty states. Check error before empty. Keep the header and toolbar available.
- A filter chip must describe the filter actually applied to the query/table. Reset pagination when the filter changes.

Prefer `createEntityColumns<T>()` for standard code/text/quantity/money/date/status columns. It packages cell conventions while retaining TanStack overrides. `useResourceList` derives initial/refresh/error/empty states and preserves typed URL filters; `EntityListPage` consumes `list` and reuses one `createAction` in its header and record-empty state. See `docs/web/06-ui-patterns.md` for the complete interface.

## Forms

Use `useAppForm` for local state, `useEntityForm` for validation/error handling, and `useEntityEditor` for a feature-owned create/edit mutation lifecycle. `EntityEditorPage` supplies form context, inline errors, and the unsaved-changes guard; do not duplicate these around it. Materials, Suppliers, UOM, Locations, Users, and custom Roles are reference consumers. System roles remain read-only presentation. See `docs/web/06-ui-patterns.md` for mapping, partial-save handling, initialization, and adoption rules.

```tsx
<form.AppField name="name">
	{(field) => <field.TextField label="Name" description="The material's display name." />}
</form.AppField>
```

Field adapters generate unique IDs, associate labels/hints/errors, and preserve explicit ID overrides. Give raw controls a visible label or an accessible name. Placeholders supplement labels, not replace them.

Relation fields consume `number | null` directly inside AppField. Prefer `UomLookupField`, `CategoryLookupField`, `MaterialLookupField`, `SupplierLookupField`, `LocationLookupField`, and `RoleLookupField` over fetching and mapping the first page inside every form. They resolve existing selections separately, support server search/load more, and distinguish errors from empty results. Assignment fields can exclude IDs used by other rows without hiding the current selected label.

### Quantity with UOM

Use the imported adapter; compound inputs need two distinct field instances. Calling `useFieldContext` twice inside the inner field reads the same field twice.

```tsx
import { NumberInputGroupField } from '@/lib/form/fields/number-input-group-field'
;<form.AppField name="quantity">
	{(quantityField) => (
		<form.AppField name="uomId">
			{(uomField) => (
				<NumberInputGroupField
					label="Quantity"
					quantityField={quantityField}
					uomField={uomField}
					uomOptions={uomOptions}
					step="any"
				/>
			)}
		</form.AppField>
	)}
</form.AppField>
```

An empty quantity is null; zero is an entered value. Changing UOM changes its ID only, not the quantity; conversion is a separate domain operation. For a fixed unit, render imported `NumberInputGroupAddonField` inside the quantity `AppField` with `label` and `uomLabel`.

## Actions and recovery

Use one primary action per task. Outline/ghost actions are secondary; destructive actions use the destructive variant. Icon-only controls require meaningful accessible names. Loading actions must prevent duplicate submission and announce their result.

`confirm({ title, description, onConfirm })` keeps the dialog open during an async action. On failure it shows an inline alert with **Cancel** and **Try Again**. `confirmInput` adds an exact confirmation phrase. Explain consequences; don't use confirmation dialogs for routine reversible edits.

Use `useWorkflowAction` when repeating availability → confirmation → mutation → success feedback. It rechecks availability before execution and prevents duplicate dialogs/submissions. Features supply consequences and mutation; server authorization and API cache invalidation remain authoritative.

Use `toast` from `@/components/ui/toast` for transient success feedback. Mutation errors belong inline with the affected work, not only in a disappearing toast. Preserve entered values after failure. Complex forms belong on a full page, not inside a small dialog.

Recipes use full-page editors and location-scoped material/menu lookups. The editor pins its starting location: switching the header preserves the draft but blocks saving until restored. Quantities remain decimal strings. Company Settings stays on-page after save using `useEntityEditor.baselineAfterSave`; it preserves edits made during the request and guards subsequent unsaved changes. Failed/missing singleton reads never create an empty writable form.

`useEditorLocationScope(fixedLocationId?)` is shared by Recipes and Menu Items. For edits, Menu Items pin `item.locationId`, not the header. Category lookups remain scoped to that location and resolve existing selections beyond the first 100 records. Keep the return-to-location action outside disabled fields. Payment Methods use the same editor lifecycle without location pinning, with pending-safe retry and list/detail/by-location cache invalidation.

Callable dialogs do not inherit authenticated route providers. Resolve permissions before opening and pass capability props to the content. Supplier pricing and material/location assignment are the reference examples: both keep failed fetches distinct from empty data, preserve prior rows on refresh failure, and handle write errors inline. Relation toggles retry a desired state after a fresh read, never invert an uncertain last result.

## Charts

Supply `aria-label` describing the measure and scope. Keep chart/card containers shrinkable. Use an exact-value table alongside charts; catalog examples disclose it through “View exact values.” Switching chart type must preserve the dataset and units. Stacking is meaningful only when series share a unit.

## Verification

1. Exercise the changed interaction in `/design-system`; don't stop at a screenshot.
2. Check light/dark, desktop, and a real or emulated coarse pointer at phone/tablet widths.
3. Check keyboard focus, names, field associations, errors, and long/missing/zero values.
4. Spot-check a production consumer when available; the catalog doesn't replace an authenticated workflow check.
5. Run the web app's typecheck, lint, and existing tests. See `AGENTS.md` for commands.

## References

- `DESIGN.md`: identity, visual hierarchy, tokens and density policy.
- `src/styles.css`: actual theme values and coarse-pointer rules.
- `docs/web/07-design-system.md`: visual implementation conventions.
- `docs/web/06-ui-patterns.md`: form, table, and mutation composition.
- `src/routes/design-system/`: runnable examples.
