# UI Patterns

Component sources, forms, data tables, and error/loading state conventions.

> **Status:** Blueprint. Shadcn primitives are installed. ReUI registry is configured. TanStack Form, TanStack Table, and Zod are not yet installed — see `01-architecture.md` for the dependency list.

## Component Sources

| Priority | Source         | Use for                                             |
| -------- | -------------- | --------------------------------------------------- |
| 1        | ReUI registry  | Complex components: DataGrid, Kanban, Filters, etc. |
| 2        | shadcn/base-ui | Primitives: Button, Dialog, Input, Select, etc.     |
| 3        | Custom         | App-specific composites not covered by either       |

### ReUI

Installed via the shadcn CLI with the `@reui` registry:

```bash
bunx shadcn add @reui/data-grid
```

Registry config in `components.json`:

```json
{
	"registries": {
		"@reui": "https://reui.io/r/{style}/{name}.json"
	}
}
```

ReUI components go in `src/components/ui/` (same location as shadcn primitives). Use the component's documented API — do not restyle or override internals.

### shadcn/base-ui

Already installed (~60 primitives): button, dialog, table, sidebar, combobox, calendar, chart, toast, tooltip, etc. These are the base layer. Customize via Tailwind classes and `cn()` utility.

### Custom Components

When neither ReUI nor shadcn covers a need:

- App shell components → `src/components/app-shell/`
- Shared form fields → `src/components/form/`
- Feature-specific → `src/features/{module}/components/`

## Forms (TanStack Form + Zod)

### Setup

```tsx
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { CreateLocationDto } from '@/features/location/dto'

function LocationForm({ onSubmit }: { onSubmit: (data: CreateLocationDto) => void }) {
	const form = useForm({
		defaultValues: { code: '', name: '', type: 'store' as const },
		validatorAdapter: zodValidator(),
		onSubmit: async ({ value }) => {
			onSubmit(value)
		},
	})

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				form.handleSubmit()
			}}
		>
			<form.Field name="code" validators={{ onChange: CreateLocationDto.shape.code }}>
				{(field) => (
					<FormInput
						label="Code"
						value={field.state.value}
						onChange={(e) => field.handleChange(e.target.value)}
						error={field.state.meta.errors[0]}
					/>
				)}
			</form.Field>
			{/* ... more fields */}
			<Button type="submit" disabled={form.state.isSubmitting}>
				Save
			</Button>
		</form>
	)
}
```

### Conventions

1. **Zod schemas as validators.** Reuse the same DTO schemas from `features/{module}/dto/` for field-level validation.
2. **`zodValidator()` adapter.** Connects Zod to TanStack Form's validation system.
3. **Shared form field components.** Wrap common patterns in `src/components/form/`:
   - `FormInput` — label + input + error message
   - `FormSelect` — label + select + error message
   - `FormCombobox` — searchable select (shadcn combobox)
   - `FormTextarea` — label + textarea + error message
4. **Mutation integration.** Form `onSubmit` calls the mutation. Loading state from `useMutation`:

```tsx
function CreateLocationPage() {
	const mutation = useMutation(locationApi.create.mutationOptions())

	return (
		<LocationForm
			onSubmit={(data) => mutation.mutate(data)}
			isSubmitting={mutation.isPending}
			error={mutation.error}
		/>
	)
}
```

### Edit Forms (Prefilled)

```tsx
function EditLocationPage({ locationId }: { locationId: number }) {
	const { data } = useSuspenseQuery(locationApi.detail.queryOptions({ id: locationId }))

	return (
		<LocationForm
			defaultValues={data.data}
			onSubmit={(values) => mutation.mutate({ ...values, id: locationId })}
		/>
	)
}
```

## Data Tables (TanStack Table + ReUI)

### Pattern

ERP lists use a reusable `DataTable` built on TanStack Table with ReUI's DataGrid for rendering.

```tsx
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'

function MaterialsPage() {
	const { page, limit, search } = Route.useSearch()
	const { data } = useSuspenseQuery(materialApi.list.queryOptions({ page, limit, search }))

	const table = useReactTable({
		data: data.data.items,
		columns: materialColumns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		pageCount: Math.ceil(data.data.total / limit),
	})

	return (
		<div>
			<TableToolbar search={search} onSearchChange={handleSearch} />
			<DataTable table={table} />
			<TablePagination
				page={page}
				pageCount={table.getPageCount()}
				onPageChange={handlePageChange}
			/>
		</div>
	)
}
```

### Column Definitions

```tsx
import { createColumnHelper } from '@tanstack/react-table'
import type { MaterialSelectDto } from './dto'

const columnHelper = createColumnHelper<MaterialSelectDto>()

export const materialColumns = [
	columnHelper.accessor('code', { header: 'Code' }),
	columnHelper.accessor('name', { header: 'Name' }),
	columnHelper.accessor('category', { header: 'Category' }),
	columnHelper.display({
		id: 'actions',
		cell: ({ row }) => <RowActions material={row.original} />,
	}),
]
```

### Server-Side Pagination and Filtering

Pagination and filter state lives in URL search params (not component state). This makes pages bookmarkable and shareable.

```tsx
const navigate = useNavigate()

function handlePageChange(newPage: number) {
	navigate({ search: (prev) => ({ ...prev, page: newPage }) })
}

function handleSearch(value: string) {
	navigate({ search: (prev) => ({ ...prev, search: value, page: 1 }) })
}
```

### Consolidated View Table

When `activeLocation = null` (all locations), tables include a "Location" column:

```tsx
// Conditionally add location column
const columns = useMemo(() => {
	const base = [...materialColumns]
	if (isConsolidated) {
		base.splice(1, 0, columnHelper.accessor('locationName', { header: 'Location' }))
	}
	return base
}, [isConsolidated])
```

## Error States

### Route-Level Errors

Handled by `errorComponent` on the route definition. Shown when the route loader throws:

```tsx
function PageError({ error }: { error: Error }) {
	if (error instanceof ApiError && error.status === 403) {
		return <ForbiddenPage />
	}
	return (
		<div className="flex flex-col items-center justify-center p-8">
			<h2 className="text-lg font-semibold">Something went wrong</h2>
			<p className="text-muted-foreground">{error.message}</p>
			<Button onClick={() => window.location.reload()}>Retry</Button>
		</div>
	)
}
```

### Component-Level Errors (Mutations)

Displayed inline near the action that failed:

```tsx
function CreateForm() {
	const mutation = useMutation(locationApi.create.mutationOptions())

	return (
		<form>
			{/* fields */}
			{mutation.error && (
				<Alert variant="destructive">
					{mutation.error instanceof ApiError
						? mutation.error.message
						: 'An unexpected error occurred'}
				</Alert>
			)}
			<Button disabled={mutation.isPending}>Save</Button>
		</form>
	)
}
```

### Toast Notifications

Success feedback uses toast (shadcn toast already installed):

```tsx
import { toast } from '@/components/ui/toast'

const mutation = useMutation({
	...locationApi.create.mutationOptions(),
	onSuccess: () => {
		toast.success('Location created')
		navigate({ to: '/master/locations' })
	},
	onError: (error) => {
		toast.error(error.message)
	},
})
```

## Loading States

### Route-Level (Page Skeleton)

```tsx
export const Route = createFileRoute('/_authenticated/master/materials')({
	pendingComponent: MaterialsPageSkeleton,
	// ...
})

function MaterialsPageSkeleton() {
	return (
		<div className="space-y-4 p-6">
			<Skeleton className="h-8 w-48" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-64 w-full" />
		</div>
	)
}
```

### Component-Level (Inline)

For secondary queries or lazy-loaded sections:

```tsx
function StockAlerts() {
	const { data, isLoading } = useQuery(stockAlertApi.count.queryOptions({ locationId }))

	if (isLoading) return <Skeleton className="h-6 w-16" />
	return <Badge variant="destructive">{data.data.count} alerts</Badge>
}
```

### Mutation Pending State

Buttons show loading state during mutations:

```tsx
<Button disabled={mutation.isPending}>
	{mutation.isPending ? <Spinner className="mr-2" /> : null}
	Save
</Button>
```

## Empty States

When a list query returns zero items:

```tsx
function EmptyState({ title, description, action }: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center py-12">
			<p className="text-lg font-medium">{title}</p>
			<p className="text-muted-foreground">{description}</p>
			{action}
		</div>
	)
}

// Usage
{
	data.data.items.length === 0 ? (
		<EmptyState
			title="No materials yet"
			description="Add your first material to get started."
			action={<Button onClick={openCreate}>Add Material</Button>}
		/>
	) : (
		<DataTable table={table} />
	)
}
```

## Confirmation Dialogs

For destructive actions (delete, void, etc.):

```tsx
import { AlertDialog } from '@/components/ui/alert-dialog'

function DeleteAction({ materialId }: { materialId: number }) {
	const mutation = useMutation(materialApi.remove.mutationOptions())

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="destructive" size="sm">
					Delete
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete material?</AlertDialogTitle>
					<AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => mutation.mutate({ id: materialId })}
						disabled={mutation.isPending}
					>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
```

## Summary of Patterns

| Pattern          | Tool / Approach                         |
| ---------------- | --------------------------------------- |
| Complex widgets  | ReUI components                         |
| Primitives       | shadcn/base-ui                          |
| Forms            | TanStack Form + Zod adapter             |
| Tables           | TanStack Table + ReUI DataGrid          |
| Page loading     | Route `pendingComponent` (skeleton)     |
| Page errors      | Route `errorComponent`                  |
| Mutation loading | Button disabled + spinner               |
| Mutation errors  | Inline Alert or toast                   |
| Success feedback | Toast notification                      |
| Empty states     | Shared `EmptyState` component           |
| Destructive acts | AlertDialog confirmation                |
| Pagination/sort  | URL search params (not component state) |

---

**Next:** [readme.md](./readme.md) — Back to web docs index.
