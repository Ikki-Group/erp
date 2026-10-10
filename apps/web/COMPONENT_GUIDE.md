# Ikki Web — Component Usage Recipes

How to compose the components that exist. For colors, type, radius, elevation, and every visual rule, read [`DESIGN.md`](./DESIGN.md) — it is the only visual authority. This file does not restate tokens.

- Live catalog: `/design-system` (tokens, buttons, forms, cards, tables, feedback, overlays, navigation, page scaffolds; Light / Dark / System toggle). Run `bun run dev` in `apps/web` and open it.
- Shared composites: `src/components/shared/` (import from `@/components/shared`). Primitives: `src/components/ui/`. Tables: `src/components/data-table/`.
- Before adding a component, check the catalog. If it is not there, the app does not use it.

## Tables

```tsx
import {
	CurrencyCell,
	DateCell,
	NumericCell,
	TextCell,
	rightAlignedHeader,
} from '@/components/data-table'

col.accessor('code', {
	header: 'Kode',
	cell: ({ getValue }) => <TextCell value={getValue()} mono />,
})
col.accessor('qty', {
	header: rightAlignedHeader('Stok'),
	cell: ({ getValue }) => <NumericCell value={getValue()} unit="kg" />,
})
col.accessor('price', {
	header: rightAlignedHeader('Harga'),
	cell: ({ getValue }) => <CurrencyCell value={getValue()} />,
})
col.accessor('createdAt', {
	header: 'Dibuat',
	cell: ({ getValue }) => <DateCell value={getValue()} withTime />,
})
```

- Always use cell components; never render raw values in a cell.
- Numbers and money right-aligned (`NumericCell`, `CurrencyCell`, `rightAlignedHeader`). Codes/doc numbers use `TextCell mono`.
- Server lists: `useServerTable` + `listSearchSchema` in the route's `validateSearch` (URL state, default page size 25). Client lists: `useClientTable` (default page size 25).
- `TableToolbar` is the one toolbar (search, filter selects/comboboxes, date range, chips).

### Entity list page

```tsx
<EntityListPage
	title="Materials"
	actions={<Button>New material</Button>}
	table={table}
	recordCount={recordCount}
	isLoading={query.isLoading}
	isError={query.isError}
	onRetry={() => query.refetch()}
	isEmpty={recordCount === 0}
	emptyState={{ title: 'No materials yet' }}
	toolbar={<TableToolbar ... />}
/>
```

Error is checked before empty. Every query-backed view needs skeleton, `PageError` + retry, and `EmptyState`.

## Forms

```tsx
const form = useEntityForm({ defaultValues, schema, onSubmit })

<form.AppForm>
	<FormPage title="Edit Material" form={form} submitLabel="Save changes" onCancel={onDone}>
		<form.AppField name="name">{(field) => <field.TextField label="Name" />}</form.AppField>
	</FormPage>
</form.AppForm>
```

- `FormPage` is the create/edit page; `WizardPage` for multi-step; `formDialog()` for a quick modal form. (`CrudForm` is a deprecated alias of `FormPage`.)
- Fields on `field.*`: `TextField`, `NumberField`, `TextareaField`, `SelectField`, `ComboboxField`, `DatePickerField`, `SwitchField`, `CheckboxField`, plus `NumberInputGroupField` / `NumberInputGroupAddonField` for quantity + UoM.
- Every field has a visible label; placeholder is a hint, never the label. Number inputs are right-aligned; empty is `null`, not `0`.
- Buttons name the verb ("Save changes", "Create supplier"); the success toast echoes it.

## Page scaffolds

- `PageShell` / `PageHeader`: one page title, description, right-aligned actions.
- `PageSection`: a titled group inside a page.
- `DetailPage` + `DetailSection` + `DetailList`: read views.
- `PageTabs`: tabs inside a detail page.
- `NotFound`, `PageError`, `PageSkeleton`, `EmptyState`.

## Cards

- `MetricCard` is the one dashboard card. Metric mode: `<MetricCard title="Stok Menipis" value={7} tone="warning" description="Di bawah minimum" />` (`isLoading`, `trend`, `onClick` optional). Panel mode: omit `value`, pass `children` (and `noPadding` for a flush `divide-y` list).
- `StatCard` and `DataCard` are deprecated aliases of `MetricCard`; migrate call sites.
- `Card` primitive (`CardHeader`/`CardTitle`/`CardDescription`/`CardAction`/`CardContent`/`CardFooter`) for anything else.
- Never put a card inside a card. Group with `divide-y`, borders, or spacing.

## Status and badges

```tsx
<StatusBadge variant="success">Completed</StatusBadge> // default | info | warning | success | destructive | outline
```

`StatusBadge` for workflow state (pill + dot). `Badge` (ui) for neutral labels.

## Feedback

- Toast (success after a mutation only): `toast.add({ title: 'Material created.', type: 'success' })` from `@/components/ui/toast`. Mutation errors render inline (`FormError` / `PageError`), not as a toast.
- `InlineAlert` for contextual messages in a page or form.
- `LoadingButton` / `Spinner` for in-flight actions; `Skeleton` for loading content.

## Overlays

```tsx
const ok = await confirm({
	title: 'Delete material?',
	description: 'This cannot be undone.',
	confirmLabel: 'Delete',
	variant: 'destructive',
	onConfirm: async () => {
		await remove()
	},
})
```

- `confirm()` for yes/no, `confirmInput()` when the user must type a word, `formDialog()` for a short form.
- `Dialog`, `Sheet`, `Popover`, `Tooltip`, `DropdownMenu` from `@/components/ui/*`. Base UI: compose with `render={<Button ... />}`, not `asChild`.

## Touch

Buttons, inputs, selects, comboboxes, and sidebar items grow to at least 40px on coarse pointers via `pointer-coarse:` in the primitives. Don't add per-route height overrides for touch.

## Before you finish

From `apps/web`: `bunx tsc --noEmit`, `bunx oxlint src`, `bunx vitest run`. Check 390px and 1440px, light and dark.
