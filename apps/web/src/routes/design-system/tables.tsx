import { useMemo, useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { cn } from '@/lib/utils'

import {
	CurrencyCell,
	DataTable,
	DateCell,
	NumericCell,
	rightAlignedHeader,
	TextCell,
	useClientTable,
	useResourceList,
	type ListSearch,
} from '@/components/data-table'
import { createFilter, Filters } from '@/components/reui/filters'
import type { Filter } from '@/components/reui/filters'
import { PageHeader, PageSection, TableToolbar } from '@/components/shared'
import type { DateRange } from '@/components/shared'
import { EntityListPage } from '@/components/shared/entity-list-page'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/design-system/tables')({
	component: TablesPage,
})

const SUPPLIER_OPTIONS = [
	{ label: 'PT Sumber Jaya', value: '1' },
	{ label: 'CV Makmur Sentosa', value: '2' },
	{ label: 'UD Berkah Abadi', value: '3' },
	{ label: 'PT Nusantara Pangan', value: '4' },
	{ label: 'CV Tani Organik', value: '5' },
	{ label: 'UD Sari Alam', value: '6' },
]

// -- Mock data --
interface MockMaterial {
	id: number
	code: string
	name: string
	category: string
	price: number
	stock: number
	status: string
}

const mockMaterials: MockMaterial[] = [
	{
		id: 1,
		code: 'MAT-001',
		name: 'Coffee Beans (Arabica)',
		category: 'Raw Material',
		price: 85000,
		stock: 24,
		status: 'active',
	},
	{
		id: 2,
		code: 'MAT-002',
		name: 'Whole Milk 1L',
		category: 'Dairy',
		price: 18000,
		stock: 48,
		status: 'active',
	},
	{
		id: 3,
		code: 'MAT-003',
		name: 'Sugar 1kg',
		category: 'Raw Material',
		price: 14000,
		stock: 32,
		status: 'active',
	},
	{
		id: 4,
		code: 'MAT-004',
		name: 'Paper Cup 12oz',
		category: 'Packaging',
		price: 1200,
		stock: 500,
		status: 'active',
	},
	{
		id: 5,
		code: 'MAT-005',
		name: 'Chocolate Syrup',
		category: 'Condiment',
		price: 45000,
		stock: 8,
		status: 'low',
	},
	{
		id: 6,
		code: 'MAT-006',
		name: 'Vanilla Extract',
		category: 'Condiment',
		price: 62000,
		stock: 3,
		status: 'low',
	},
	{
		id: 7,
		code: 'MAT-007',
		name: 'Oat Milk 1L',
		category: 'Dairy',
		price: 35000,
		stock: 15,
		status: 'active',
	},
	{
		id: 8,
		code: 'MAT-008',
		name: 'Matcha Powder',
		category: 'Raw Material',
		price: 120000,
		stock: 5,
		status: 'low',
	},
	{
		id: 9,
		code: 'MAT-009',
		name: 'Plastic Straw',
		category: 'Packaging',
		price: 200,
		stock: 1000,
		status: 'active',
	},
	{
		id: 10,
		code: 'MAT-010',
		name: 'Whipped Cream',
		category: 'Dairy',
		price: 28000,
		stock: 12,
		status: 'active',
	},
	{
		id: 11,
		code: 'MAT-011',
		name: 'Caramel Sauce',
		category: 'Condiment',
		price: 38000,
		stock: 9,
		status: 'active',
	},
	{
		id: 12,
		code: 'MAT-012',
		name: 'Paper Bag M',
		category: 'Packaging',
		price: 800,
		stock: 200,
		status: 'active',
	},
	{
		id: 13,
		code: 'MAT-013',
		name: 'Organic Single-Origin Ethiopian Yirgacheffe Coffee Beans (Dark Roast, 1kg)',
		category: 'Raw Material',
		price: 245000,
		stock: 0,
		status: 'out',
	},
	{
		id: 14,
		code: 'MAT-014',
		name: 'Mineral Water 600ml',
		category: 'Packaging',
		price: 3500,
		stock: 12480,
		status: 'active',
	},
]

const mockColumns = [
	{
		accessorKey: 'code' as const,
		header: 'Code',
		cell: (ctx: { getValue: () => unknown }) => <TextCell value={ctx.getValue() as string} mono />,
	},
	{
		accessorKey: 'name' as const,
		header: 'Name',
		cell: (ctx: { getValue: () => unknown }) => <TextCell value={ctx.getValue() as string} />,
	},
	{
		accessorKey: 'category' as const,
		header: 'Category',
		cell: (ctx: { getValue: () => unknown }) => <TextCell value={ctx.getValue() as string} />,
	},
	{
		accessorKey: 'price' as const,
		header: rightAlignedHeader('Price'),
		cell: (ctx: { getValue: () => unknown }) => <CurrencyCell value={ctx.getValue() as number} />,
	},
	{
		accessorKey: 'stock' as const,
		header: rightAlignedHeader('Stock'),
		cell: (ctx: { getValue: () => unknown }) => <NumericCell value={ctx.getValue() as number} />,
	},
]

function TablesPage() {
	return (
		<div className="space-y-10">
			<PageHeader
				title="Tables"
				description="The standard list-page pattern: a data table, its toolbar, and the two toolbar flavors."
			/>

			<DataTableSection />

			<Separator />

			{/* ─── CELL TEMPLATES ─── */}
			<PageSection
				title="Cell Templates"
				description="Reusable column renderers from @/components/data-table — pair a numeric/currency column's header with rightAlignedHeader so header and cell line up. Used throughout the Inventory pilot (stock-table.tsx, movement-history.tsx)."
			>
				<div
					role="region"
					aria-label="Cell template examples"
					tabIndex={0}
					className="data-table-horizontal-scroll max-w-xl overflow-x-auto rounded-lg border focus-visible:outline-2 focus-visible:outline-ring"
				>
					<table className="w-full text-sm">
						<thead className="bg-muted/50">
							<tr>
								<th className="px-3 py-2 text-left font-medium">Template</th>
								<th className="px-3 py-2 text-left font-medium">Material</th>
								<th className="px-3 py-2 text-right font-medium">Stock</th>
								<th className="px-3 py-2 text-right font-medium">Cost</th>
								<th className="px-3 py-2 text-left font-medium">Received</th>
							</tr>
						</thead>
						<tbody>
							<tr className="border-t">
								<td className="px-3 py-2 text-xs text-muted-foreground">TextCell</td>
								<td className="px-3 py-2">
									<TextCell
										value="Organic Single-Origin Ethiopian Yirgacheffe Coffee Beans"
										truncate
										className="max-w-40"
									/>
								</td>
								<td className="px-3 py-2">
									<NumericCell value={34.88} unit="kg" />
								</td>
								<td className="px-3 py-2">
									<CurrencyCell value={82340.5} />
								</td>
								<td className="px-3 py-2">
									<DateCell value="2026-01-15T10:30:00" withTime />
								</td>
							</tr>
							<tr className="border-t">
								<td className="px-3 py-2 text-xs text-muted-foreground">Missing value</td>
								<td className="px-3 py-2">
									<TextCell value="Vanilla Extract" />
								</td>
								<td className="px-3 py-2">
									<NumericCell value={null} unit="kg" />
								</td>
								<td className="px-3 py-2">
									<CurrencyCell value={null} />
								</td>
								<td className="px-3 py-2">
									<DateCell value={null} />
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</PageSection>

			<Separator />

			{/* ─── TABLE TOOLBAR ─── */}
			<PageSection
				title="Table Toolbar"
				description="Search + filter dropdown(s), a searchable multi-select combobox, a date-range filter with preset templates, and active-filter chips with clear-all. The single toolbar pattern for every list page — see Data Table above for it wired to a real table."
			>
				<TableToolbarDemo />
			</PageSection>

			<Separator />

			{/* ─── ADVANCED FILTERS (chip builder) ─── */}
			<PageSection
				title="Advanced Filters"
				description="Linear/Notion-style filter chip builder for pages with several independent, non-mutually-exclusive dimensions (e.g. status + date + cashier). Prefer the simpler Table Toolbar filter dropdown above for a single dimension; reach for this only when a page genuinely needs to combine multiple filters at once — see Orders in POS."
			>
				<AdvancedFiltersDemo />
			</PageSection>

			<Separator />

			{/* ─── SIMPLE TABLE ─── */}
			<PageSection
				id="simple-table"
				title="Simple Table"
				description="Plain HTML table primitives (Table/TableHeader/TableRow/TableCell) — for small static or editable-row tables that don't need DataTable's sorting/filtering/pagination (e.g. the stock-count entry grid in Opname). Reach for DataTable above for anything query-backed."
			>
				<SimpleTableDemo />
			</PageSection>

			<Separator />

			{/* ─── ENTITY LIST PAGE (pattern) ─── */}
			<PageSection
				title="Entity List Page"
				description="A query-backed list controller keeps actions and filters available through loading and failures. These illustrative materials demonstrate initial errors, background refreshes with retained rows, and record-empty versus filtered-empty states."
			>
				<EntityListPagePattern />
			</PageSection>
		</div>
	)
}

type DataTableDemoState = 'loaded' | 'loading' | 'empty' | 'error'

function DataTableSection() {
	const [category, setCategory] = useState<string | undefined>(undefined)
	const [state, setState] = useState<DataTableDemoState>('loaded')
	const data = useMemo(
		() =>
			state === 'empty'
				? []
				: mockMaterials.filter((material) => !category || material.category === category),
		[category, state],
	)
	const { table, globalFilter, setGlobalFilter, recordCount } = useClientTable({
		data,
		columns: mockColumns,
		pageSize: 5,
	})

	return (
		<PageSection
			id="data-table"
			title="Data Table"
			description="Table with global search, client-side pagination, column visibility, and the standard toolbar (search + filter + chips). Use the buttons below to preview the skeleton, empty-record, and error states."
		>
			<div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Table preview state">
				{(['loaded', 'loading', 'empty', 'error'] as const).map((s) => (
					<Button
						key={s}
						size="sm"
						variant={state === s ? 'default' : 'outline'}
						aria-pressed={state === s}
						onClick={() => setState(s)}
						className="capitalize"
					>
						{s}
					</Button>
				))}
			</div>
			<DataTable
				table={table}
				recordCount={state === 'empty' || state === 'error' ? 0 : recordCount}
				isLoading={state === 'loading'}
				isError={state === 'error'}
				errorMessage="We couldn't load materials. Check your connection and try again."
				onRetry={() => setState('loaded')}
				emptyMessage="No materials match your filters."
				toolbar={
					<TableToolbar
						searchValue={globalFilter}
						onSearchChange={setGlobalFilter}
						searchPlaceholder="Search materials..."
						table={table}
						filters={[
							{
								key: 'category',
								label: 'Category',
								value: category,
								onChange: (v) => {
									setCategory(Array.isArray(v) ? v[0] : v)
									table.setPageIndex(0)
								},
								options: [
									{ label: 'Raw Material', value: 'Raw Material' },
									{ label: 'Dairy', value: 'Dairy' },
									{ label: 'Packaging', value: 'Packaging' },
									{ label: 'Condiment', value: 'Condiment' },
								],
							},
						]}
					/>
				}
			/>
		</PageSection>
	)
}

function TableToolbarDemo() {
	const [search, setSearch] = useState('')
	const [category, setCategory] = useState<string[] | undefined>(undefined)
	const [status, setStatus] = useState<string | undefined>('active')
	const [suppliers, setSuppliers] = useState<string[] | undefined>(['1'])
	const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

	return (
		<TableToolbar
			searchValue={search}
			onSearchChange={setSearch}
			searchPlaceholder="Search materials..."
			filters={[
				{
					key: 'category',
					label: 'Category',
					value: category,
					onChange: (v) => setCategory(Array.isArray(v) ? v : undefined),
					multiple: true,
					options: [
						{ label: 'Raw Material', value: 'raw' },
						{ label: 'Dairy', value: 'dairy' },
						{ label: 'Packaging', value: 'packaging' },
					],
				},
				{
					key: 'status',
					label: 'Status',
					value: status,
					onChange: (v) => setStatus(Array.isArray(v) ? v[0] : v),
					options: [
						{ label: 'Active', value: 'active' },
						{ label: 'Inactive', value: 'inactive' },
					],
				},
				{
					key: 'supplier',
					label: 'Supplier',
					value: suppliers,
					onChange: setSuppliers,
					multiple: true,
					searchable: true,
					options: SUPPLIER_OPTIONS,
					allLabel: 'Any supplier',
				},
			]}
			dateRange={{
				key: 'createdAt',
				label: 'Created',
				value: dateRange,
				onChange: setDateRange,
				placeholder: 'Filter by date',
			}}
			actions={<Button size="sm">Add Material</Button>}
		/>
	)
}

function AdvancedFiltersDemo() {
	const [filters, setFilters] = useState<Filter[]>([createFilter('status', 'is', ['completed'])])

	return (
		<Filters
			filters={filters}
			onChange={setFilters}
			fields={[
				{
					key: 'status',
					label: 'Status',
					type: 'select',
					options: [
						{ label: 'Open', value: 'open' },
						{ label: 'Completed', value: 'completed' },
						{ label: 'Voided', value: 'voided' },
					],
				},
				{
					key: 'cashier',
					label: 'Cashier',
					type: 'select',
					options: [
						{ label: 'Andi', value: '1' },
						{ label: 'Budi', value: '2' },
						{ label: 'Citra', value: '3' },
					],
				},
				{
					key: 'type',
					label: 'Type',
					type: 'select',
					options: [
						{ label: 'Dine In', value: 'dine_in' },
						{ label: 'Takeaway', value: 'takeaway' },
					],
				},
			]}
		/>
	)
}

// -- Simple Table demo (raw ui/table.tsx primitives, e.g. a stock-count grid) --
const OPNAME_ROWS = [
	{ material: 'Coffee Beans (Arabica)', system: 24, counted: 22 },
	{ material: 'Whole Milk 1L', system: 48, counted: 48 },
	{ material: 'Sugar 1kg', system: 32, counted: 35 },
]

function SimpleTableDemo() {
	return (
		<div className="max-w-lg overflow-hidden rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Material</TableHead>
						<TableHead className="text-right">System Qty</TableHead>
						<TableHead className="text-right">Counted Qty</TableHead>
						<TableHead className="text-right">Variance</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{OPNAME_ROWS.map((row) => {
						const variance = row.counted - row.system
						return (
							<TableRow key={row.material}>
								<TableCell className="font-medium">{row.material}</TableCell>
								<TableCell className="text-right font-mono tabular-nums">{row.system}</TableCell>
								<TableCell className="text-right font-mono tabular-nums">{row.counted}</TableCell>
								<TableCell
									className={cn(
										'text-right font-mono tabular-nums',
										variance === 0 && 'text-muted-foreground',
										variance > 0 && 'text-success',
										variance < 0 && 'text-destructive',
									)}
								>
									{variance > 0 ? `+${variance}` : variance}
								</TableCell>
							</TableRow>
						)
					})}
				</TableBody>
			</Table>
		</div>
	)
}

type ResourcePreview =
	| 'ready'
	| 'initial-loading'
	| 'initial-error'
	| 'refreshing'
	| 'refresh-error'
	| 'record-empty'

function EntityListPagePattern() {
	const [preview, setPreview] = useState<ResourcePreview>('ready')
	const [search, setSearch] = useState<ListSearch & { category?: string }>({ page: 1, pageSize: 5 })
	const envelope = useMemo(() => {
		const rows =
			preview === 'record-empty'
				? []
				: mockMaterials.filter(
						(material) =>
							(!search.category || material.category === search.category) &&
							(!search.q ||
								`${material.code} ${material.name}`.toLowerCase().includes(search.q.toLowerCase())),
					)
		if (search.sort) {
			const [key, direction] = search.sort.split(':')
			rows.sort((a, b) => {
				const left = a[key as keyof MockMaterial]
				const right = b[key as keyof MockMaterial]
				const compared =
					typeof left === 'number' && typeof right === 'number'
						? left - right
						: String(left).localeCompare(String(right))
				return direction === 'desc' ? -compared : compared
			})
		}
		return {
			data: rows.slice((search.page - 1) * search.pageSize, search.page * search.pageSize),
			meta: { total: rows.length },
		}
	}, [preview, search])
	const list = useResourceList({
		query: {
			data: preview === 'initial-loading' || preview === 'initial-error' ? undefined : envelope,
			isPending: preview === 'initial-loading',
			isFetching: preview === 'initial-loading' || preview === 'refreshing',
			isError: preview === 'initial-error' || preview === 'refresh-error',
			refetch: () => setPreview('ready'),
		},
		columns: mockColumns,
		search,
		onSearchChange: setSearch,
		hasFilters: (value) => value.category !== undefined,
	})
	return (
		<div className="space-y-4">
			<div className="flex flex-wrap gap-2" role="group" aria-label="Resource list preview state">
				{(
					[
						'ready',
						'initial-loading',
						'initial-error',
						'refreshing',
						'refresh-error',
						'record-empty',
					] as const
				).map((state) => (
					<Button
						key={state}
						size="sm"
						variant={preview === state ? 'default' : 'outline'}
						aria-pressed={preview === state}
						onClick={() => setPreview(state)}
					>
						{state.replaceAll('-', ' ')}
					</Button>
				))}
			</div>
			<EntityListPage
				title="Illustrative materials"
				list={list}
				createAction={
					<Button
						size="sm"
						onClick={() => {
							setSearch({ page: 1, pageSize: 5 })
							setPreview('ready')
						}}
					>
						Restore sample records
					</Button>
				}
				emptyState={{
					title: 'No sample records',
					description: 'Restore the illustrative records to continue exploring the table.',
				}}
				emptyMessage="No sample materials match your filters."
				toolbar={
					<TableToolbar
						searchValue={list.globalFilter}
						onSearchChange={(value) => list.table.setGlobalFilter(value)}
						searchPlaceholder="Search illustrative materials..."
						filters={[
							{
								key: 'category',
								label: 'Category',
								value: search.category,
								onChange: (category) => list.setFilters({ category }),
								options: [
									{ label: 'Raw Material', value: 'Raw Material' },
									{ label: 'Dairy', value: 'Dairy' },
									{ label: 'Packaging', value: 'Packaging' },
								],
							},
						]}
					/>
				}
			/>
			<pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-xs leading-relaxed">
				<code>{`const query = useQuery({
  ...materialResource.list.queryOptions({
    page: search.page, limit: search.pageSize, q: search.q, categoryId: search.categoryId,
  }),
  throwOnError: false,
})
const list = useResourceList({
  query, columns, search,
  onSearchChange: (next) => navigate({ search: next }),
  hasFilters: (value) => value.categoryId !== undefined,
})
<EntityListPage
  title="Materials" list={list}
  createAction={<PermissionGate permission="material.create"><Button>Add Material</Button></PermissionGate>}
  emptyState={{ title: 'No materials yet' }}
  toolbar={<TableToolbar searchValue={list.globalFilter} onSearchChange={(q) => list.table.setGlobalFilter(q)} />}
/>`}</code>
			</pre>
		</div>
	)
}
