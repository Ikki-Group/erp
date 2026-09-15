# UI Patterns

Component sources, the form engine, dialogs, tables, and error/loading state conventions — the patterns every page should follow.

> **Status:** Current implementation. This replaces an earlier blueprint that documented `@tanstack/react-form` + `@tanstack/zod-form-adapter` usage that was never actually built — the codebase had instead accumulated ~17 hand-rolled `forwardRef`/`useImperativeHandle`/`useState` form components. That pattern is being migrated away from (breaking changes allowed, per the redesign decision). `Materials` + `Category` (`src/routes/_authenticated/master/materials/`, `src/features/material/components/`) is the reference implementation — copy its shape for new/converted forms rather than the older per-page forms still pending migration (Locations, UoM, Suppliers, Menu, Recipes, Payment Methods, POS forms, Settings Users/Roles).

## Component Sources

| Priority | Source         | Use for                                             |
| -------- | -------------- | --------------------------------------------------- |
| 1        | ReUI registry  | Complex components: DataGrid, Kanban, Filters, etc. |
| 2        | shadcn/base-ui | Primitives: Button, Dialog, Input, Select, etc.     |
| 3        | Custom         | App-specific composites not covered by either       |

Shared UI lives in `src/components/ui/` (primitives), `src/components/shared/` (composites — `PageHeader`, `StatusBadge`, `EmptyState`, `FormPage`, `FormDialog`, ...), `src/components/form/` (legacy standalone field wrappers — being superseded by `src/lib/form/fields/`, see below), and `src/components/data-table/`.

## The Form Engine (`src/lib/form/`)

Every entity create/update form is built the same way, on top of `@tanstack/react-form` (already a dependency; `@tanstack/zod-form-adapter` was removed — Zod schemas pass to TanStack Form's validators directly as Standard Schema validators, no adapter needed).

### Layer map

```
src/lib/form/
├── contexts.ts            fieldContext/formContext (createFormHookContexts, once)
├── app-form.ts             useAppForm (createFormHook) — pre-bound field/form components
├── use-entity-form.ts      useEntityForm — the hook every entity form's own hook wraps
├── use-unsaved-changes-guard.ts   useUnsavedChangesGuard(form)
├── form-root.tsx           <FormRoot form> — <form onSubmit> wiring for dialog bodies
├── form-dialog-footer.tsx  <FormDialogFooter onCancel> — Cancel/Save footer for dialogs
├── form-error.tsx          <FormError /> — form-level error banner (registered as form.FormError)
├── field-error.tsx         formatFieldError — flattens+dedupes field.state.meta.errors
├── transform.ts            toId / idToString — number|null <-> string at the field boundary
└── fields/                 TextField, TextareaField, SelectField, IdSelectField,
                             ComboboxField, NumberField, SwitchField, DatePickerField
```

Import everything from the barrel: `import { useEntityForm, useUnsavedChangesGuard, FormDialogFooter } from '@/lib/form/index.ts'`.

### `useEntityForm` — the base hook

```ts
const form = useEntityForm({
	defaultValues, // form-shape values, not the wire DTO — see below
	schema, // a Zod schema validating the FORM shape
	onSubmit: async (values) => {
		await mutation.mutateAsync(toWirePayload(values))
	},
})
```

- Runs `schema` on both `onChange` (live feedback) and `onSubmit` (catches untouched fields). `field-error.tsx` dedupes the resulting duplicate issues, so don't try to "fix" this by dropping one of the two triggers.
- Wraps `onSubmit`: a thrown error or rejected mutation promise is caught, converted to a message (`ApiError.friendlyMessage` when available), and set as a form-level error via `form.setErrorMap({ onSubmit: { form: message, fields: {} } })` — render it with `<form.FormError />`.

**Never pass a wire-contract DTO (`XxxCreateDto`/`XxxUpdateDto` from `features/*/dto/`) as `schema` directly.** The form's in-progress shape and the wire payload differ in ways that matter for UX:

- An empty optional text field is `''`, not `null` — the DTO's `string | null` rejects `''` outright.
- An unselected relation is `number | null` — the DTO's plain `number` produces a Zod message like `"expected number, received null"`, accurate but not user-facing.

Instead, define a form-specific schema next to the form (see `material-form.tsx`'s `MaterialFormSchema`) with friendly messages, and build the real DTO payload separately in each route's `onSubmit`. This is the single most important rule in this doc — skipping it is precisely the bug class the Materials migration caught (duplicate/raw Zod messages, a "required" field with no actual required validation).

### Per-entity form module shape

One file per entity, e.g. `features/material/components/material-form.tsx`:

1. `XxxFormValues` interface — the form's own value shape.
2. `XxxFormSchema` (Zod) — validates that shape, with friendly `error` messages.
3. `EMPTY_XXX_FORM_VALUES` — the create-mode default.
4. `useXxxForm({ defaultValues, onSubmit })` — thin wrapper over `useEntityForm`.
5. `XxxFormFields({ form })` — the field layout, shared by every entry point (full page, dialog). Ends with `<form.FormError />`.

Routes/dialogs own the mutation and the form-shape → wire-payload mapping; the form module owns validation and layout only.

### Field components

Each is pre-bound to the field context via `createFormHook` (`app-form.ts`) and rendered through `form.AppField`:

```tsx
<form.AppField name="name">
	{(field) => <field.TextField label="Name" placeholder="e.g. Tepung Terigu" />}
</form.AppField>
```

No `value`/`onChange`/`error` props anywhere — the field component reads/writes `field.state` itself. Available: `TextField`, `TextareaField`, `SelectField` (string-valued, for enums), `IdSelectField` (the `number | null` foreign-key select — the most common field in this app: `categoryId`, `baseUomId`, every `*LocationId`), `ComboboxField`, `NumberField`, `SwitchField`, `DatePickerField`. Add new ones under `src/lib/form/fields/` and register in `app-form.ts`'s `createFormHook` call.

`IdSelectField`/`toId`/`idToString` (`transform.ts`) are the one place that stringifies a numeric id for Base UI's `<Select>` and parses it back — never do that conversion ad hoc in a form module.

## Full-Page Forms (default) vs. Dialogs (exception)

**Default to a full-page form for every entity create/edit.** Reach for a dialog only for genuinely lightweight cases: a single-field quick-add (category), a toggle-list picker (location assignment) — anything that isn't worth leaving the list page for.

### Full-page form (`FormPage`)

```tsx
// routes/_authenticated/master/materials/new.tsx
function NewMaterialPage() {
	const navigate = useNavigate()
	const createMut = useMutation(materialResource.create.mutationOptions())

	const form = useMaterialForm({
		onSubmit: async (values) => {
			await createMut.mutateAsync({
				/* map form values -> wire DTO */
			})
			toast.add({ title: 'Material created successfully.', type: 'success' })
			navigate({ to: '/master/materials' })
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Add Material"
				form={form}
				onCancel={() => navigate({ to: '/master/materials' })}
			>
				<MaterialFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
```

- Route file per verb: `materials/index.tsx` (list), `materials/new.tsx` (create), `materials/$materialId.tsx` (edit — reads `Route.useParams()`, fetches the detail query, and only mounts the form once data resolves — see the `EditMaterialForm` split-component pattern in `$materialId.tsx` so `useMaterialForm`'s `defaultValues` aren't captured as stale/empty on an early render).
- `FormPage` reads `isSubmitting`/`canSubmit` off the passed `form` itself — never pass those as separate props.
- `useUnsavedChangesGuard(form)` blocks in-app navigation and tab close while the form is dirty. Call it once, right after the `useXxxForm(...)` call, in every full-page form.
- List page action menus and row clicks `navigate()` to `new`/`$id` routes — no ref plumbing, no dialog.

### Dialog (`FormDialog` render-prop form)

```tsx
const saved = await formDialog({
	title: 'Add Category',
	content: ({ close }) => <CategoryDialogBody close={close} />,
})
if (saved) toast.add({ title: 'Category created successfully.', type: 'success' })
```

Where the body owns its own form + footer:

```tsx
function CategoryDialogBody({
	close,
	defaultValues,
}: {
	close: (r?: boolean) => void
	defaultValues?: MaterialCategoryDto
}) {
	const createMut = useMutation(categoryResource.create.mutationOptions())
	const form = useCategoryForm({
		defaultValues,
		onSubmit: async (values) => {
			await createMut.mutateAsync(values)
			close(true)
		},
	})
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				e.stopPropagation()
				void form.handleSubmit()
			}}
		>
			<CategoryFormFields form={form} />
			<FormDialogFooter onCancel={() => close(false)} submitLabel="Create" />
		</form>
	)
}
```

`formDialog`'s `content` is a render prop `({ close }) => ReactNode`, not static content with a separate `onSubmit` — the content decides when it's done (mutation succeeded, "Done" clicked), because not every dialog is a save form. `FormDialogFooter` reads submitting/canSubmit off the form context automatically.

`FormDialog` also still accepts the old shape (`content: ReactNode` + a top-level `onSubmit: () => Promise<void>`) — marked `@deprecated` in its type (`FormDialogLegacyProps`) — purely so the ~17 pages not yet migrated keep compiling. **Never write new dialogs against the legacy shape.**

### Confirmation dialogs

Destructive/consequential one-off actions use the imperative `confirm`/`confirmInput` helpers (`src/components/shared/confirm.tsx` / `confirm-input.tsx`) — unrelated to the form engine, unchanged by this migration:

```tsx
await confirm({
	title: 'Delete material?',
	description: `This will permanently delete "${material.name}". This action cannot be undone.`,
	confirmLabel: 'Delete',
	variant: 'destructive',
	onConfirm: async () => {
		await removeMut.mutateAsync({ id: material.id })
		toast.add({ title: 'Material deleted successfully.', type: 'success' })
	},
})
```

## Data Tables (TanStack Table + ReUI)

`useServerTable`/`useClientTable` (`src/components/data-table/`) manage pagination/sorting/search state and render through `<DataTable table={table} toolbar={...} />`. Pagination/sort/filter state is local `useState` in the page (not URL search params, despite what an older draft of this doc said) — see `materials/index.tsx`'s `listParams`.

```tsx
const { table, globalFilter, setGlobalFilter } = useServerTable({
	data,
	columns,
	totalCount,
	pageSize: listParams.limit,
	onStateChange: (params) =>
		setListParams((prev) => ({
			...prev,
			page: params.page + 1,
			limit: params.pageSize,
			q: params.search || undefined,
		})),
})
```

### Toolbar: `TableToolbar` (default) vs. `Filters` (advanced)

**`TableToolbar`** (`src/components/shared/table-toolbar.tsx`) is the single toolbar pattern for every list page — every `DataTable`'s `toolbar` prop renders one of these, whether the page needs search only, search + one filter, or search + several filters. It replaced the old `SearchToolbar` + ad-hoc `<Select>`-per-page pattern (each page previously wrote its own filter dropdown with an inconsistent "All X" label) and the unused `DataTableToolbar`/`DataTableLoading`/`DataTableError`/`DataTableEmpty` dead code — all deleted, no legacy path was kept.

```tsx
<DataTable
	table={table}
	recordCount={totalCount}
	isLoading={listQuery.isLoading}
	toolbar={
		<TableToolbar
			searchValue={globalFilter}
			onSearchChange={setGlobalFilter}
			searchPlaceholder="Search materials..."
			filters={[
				{
					key: 'categoryId',
					label: 'Category',
					value: listParams.categoryId?.toString(),
					onChange: (v) =>
						setListParams((prev) => ({
							...prev,
							page: 1,
							categoryId: v === undefined ? undefined : Number(v),
						})),
					options: categories.map((cat) => ({ label: cat.name, value: cat.id.toString() })),
				},
			]}
		/>
	}
/>
```

- `filters` is a `TableFilterDef[]`: each entry renders a `TableFilterSelect` (a `Select` with a standardized "All {label}" option) plus, once its `value` is set, a removable chip in a row below the toolbar. A "Clear filters" button appears whenever at least one filter is active and clears them all.
- A filter's `value`/`onChange` always deal in `string | undefined` — `undefined` means "All". Cast to the real enum/number type at the `onChange` boundary (see `categoryId: v === undefined ? undefined : Number(v)` above), don't change the filter def's type.
- Omit `searchValue`/`onSearchChange` entirely for filter-only toolbars (e.g. Shifts, Orders status filter) — the search box only renders when `onSearchChange` is passed.
- Reset to page 1 inside every filter's `onChange`, same as search.
- `TableFilterSelect` (`src/components/shared/table-filter-select.tsx`) is exported separately if a page ever needs a standalone filter dropdown outside a `TableToolbar` (rare — prefer the `filters` prop).

**`Filters`** (`src/components/reui/filters.tsx`) is a Linear/Notion-style filter chip builder: an "Add filter" trigger that lets the user attach any number of independent, non-mutually-exclusive dimensions (each with its own operator — is/is not/contains/between/etc.) at once. Reach for it only when a page genuinely needs to combine several filters simultaneously in a way a handful of fixed dropdowns can't express well — POS Orders (status + date + cashier + type) is the intended candidate. Every other list page uses `TableToolbar`. See the "Advanced Filters" section in `/design-system` for a wired demo (`createFilter`, `Filters`, `onChange`).

## Status Display

**`StatusBadge`** (`src/components/shared/status-badge.tsx`) is the only component for status/workflow-state display (active/inactive, draft/confirmed, in-transit, etc.) — it renders a colored dot + label per semantic variant (`success`/`warning`/`destructive`/`info`/`default`/`outline`).

**`Badge`** (`src/components/ui/badge.tsx`) is for non-status labels only — a type/category tag, a count, anything that isn't a workflow state.

```tsx
// Status column
<StatusBadge variant={isActive ? 'success' : 'outline'}>{isActive ? 'Active' : 'Inactive'}</StatusBadge>
// Non-status label
<Badge variant="secondary">{typeLabel}</Badge>
```

## Loading, Error, and Empty States

Unchanged by the form migration:

- **Route/query loading:** `PageSkeleton` (`src/components/shared/page-skeleton.tsx`) while a detail/list query is loading.
- **Route/query errors:** `PageError` (`src/components/shared/page-error.tsx`) with an optional `onRetry`.
- **Empty lists:** `EmptyState` (`src/components/shared/empty-state.tsx`) with a title/description/action.
- **Success feedback:** `toast.add({ title, type })` (`src/components/ui/toast`) after a mutation succeeds — never a form-level success message inline.
- **Mutation errors:** surfaced through `<form.FormError />` (form-level) or the field's own inline error (field-level) — not toast. Toast is for success only in this codebase's convention.

## Summary of Patterns

| Pattern               | Tool / Approach                                                   |
| --------------------- | ----------------------------------------------------------------- |
| Entity form           | `useEntityForm` (via a per-entity `useXxxForm` wrapper)           |
| Form validation       | A form-shape Zod schema (never the wire DTO directly)             |
| Create/edit surface   | Full-page (`FormPage`) — default; `FormDialog` — lightweight only |
| Unsaved-changes guard | `useUnsavedChangesGuard(form)` in every full-page form            |
| Dialog forms          | `formDialog({ content: ({ close }) => ... })` render-prop         |
| Confirmations         | `confirm()` / `confirmInput()`                                    |
| Status display        | `StatusBadge` (never plain `Badge`)                               |
| Tables                | `useServerTable`/`useClientTable` + `DataTable`                   |
| Table toolbar         | `TableToolbar` (search + filters + chips) — default for all lists |
| Advanced multi-filter | `Filters` (reui chip builder) — only for multi-dimension pages    |
| Page loading          | `PageSkeleton`                                                    |
| Page errors           | `PageError`                                                       |
| Empty states          | `EmptyState`                                                      |
| Success feedback      | `toast.add(...)`                                                  |
| Mutation errors       | `<form.FormError />` or the field's inline error                  |

---

**Next:** [readme.md](./readme.md) — Back to web docs index.
