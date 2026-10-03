import { useEffect, useState, useTransition } from 'react'
import type { ReactNode } from 'react'

import { format } from 'date-fns'
import { ColumnsSettingsIcon, LoaderCircleIcon, SearchIcon, XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { DataGridTableInstance } from '@/components/reui/data-grid/data-grid'
import { DataGridColumnVisibility } from '@/components/reui/data-grid/data-grid-column-visibility'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import type { DateRange, DateRangePreset } from '@/components/shared/date-range-filter'
import { TableFilterCombobox } from '@/components/shared/table-filter-combobox'
import { TableFilterSelect } from '@/components/shared/table-filter-select'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TableFilterDefBase {
	/** Unique key, also used as the chip/select key. */
	key: string
	/** Human label used for the "All X" placeholder and the active-filter chip. */
	label: string
	options: readonly { label: string; value: string }[]
	/** Override the default "All {label}" placeholder. */
	allLabel?: string
}

export interface SingleTableFilterDef extends TableFilterDefBase {
	value: string | undefined
	onChange: (value: string | undefined) => void
	multiple?: false
}

export interface MultiTableFilterDef extends TableFilterDefBase {
	value: string[] | undefined
	onChange: (value: string[] | undefined) => void
	multiple: true
	/**
	 * Renders a searchable combobox (type-to-filter + removable chips) instead
	 * of the checkbox-style dropdown. Reach for this once an option list is
	 * long enough that scanning a plain checklist stops being faster than
	 * typing (suppliers, materials, users — anything not a short fixed enum).
	 */
	searchable?: boolean
}

/**
 * A single filter's config for `TableToolbar`. Defaults to a single-select
 * dropdown (`value`/`onChange` deal in `string | undefined`); set
 * `multiple: true` to get a checkbox-style multi-select instead (`value`/
 * `onChange` deal in `string[] | undefined`).
 */
export type TableFilterDef = SingleTableFilterDef | MultiTableFilterDef

export interface TableDateRangeFilterDef {
	/** Unique key, also used as the active-filter chip key. */
	key: string
	/** Human label used in the active-filter chip. */
	label: string
	value: DateRange | undefined
	onChange: (value: DateRange | undefined) => void
	placeholder?: string
	/** Override the default preset templates (Today, Last 7 days, ...). */
	presets?: DateRangePreset[]
}

interface TableToolbarProps<TData extends object = object> {
	searchValue?: string
	onSearchChange?: (value: string) => void
	searchPlaceholder?: string
	filters?: TableFilterDef[]
	/** Optional date-range filter, rendered alongside the dropdown filters. */
	dateRange?: TableDateRangeFilterDef
	/** Renders a "Columns" button that toggles which columns are visible. Pass the same `table` given to `DataTable`. */
	table?: DataGridTableInstance<TData>
	actions?: ReactNode
	className?: string
}

/** Stable empty-array reference so the `filters` default prop doesn't break referential equality on every render. */
const NO_FILTERS: TableFilterDef[] = []

/**
 * Standard list-page toolbar: search input (with clear button), one or more
 * filter dropdowns, and a chips row + "Clear filters" button once any
 * non-search filter is active. This is the single toolbar pattern for all
 * `DataTable` list pages — search alone, search+filter, or search+multiple
 * filters all use this same component.
 */
export function TableToolbar<TData extends object = object>({
	searchValue,
	onSearchChange,
	searchPlaceholder = 'Search...',
	filters = NO_FILTERS,
	dateRange,
	table,
	actions,
	className,
}: TableToolbarProps<TData>) {
	const [draftSearch, setDraftSearch] = useState(searchValue ?? '')
	const [isPending, startTransition] = useTransition()

	useEffect(() => {
		setDraftSearch(searchValue ?? '')
	}, [searchValue])

	useEffect(() => {
		if (!onSearchChange || draftSearch === (searchValue ?? '')) return

		const timer = window.setTimeout(() => {
			startTransition(() => onSearchChange(draftSearch.trim()))
		}, 250)

		return () => window.clearTimeout(timer)
	}, [draftSearch, onSearchChange, searchValue])

	const activeFilters = filters.filter((f) =>
		Array.isArray(f.value) ? f.value.length > 0 : f.value !== undefined,
	)

	return (
		<div className={cn('space-y-2', className)}>
			<div className="flex flex-wrap items-center gap-2">
				{onSearchChange && (
					<div className="relative flex-1 sm:max-w-xs">
						<SearchIcon className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							inputMode="search"
							value={draftSearch}
							onChange={(e) => setDraftSearch(e.target.value)}
							placeholder={searchPlaceholder}
							aria-busy={isPending || draftSearch !== (searchValue ?? '')}
							className="pl-7 pr-7"
						/>
						{draftSearch && (
							<Button
								variant="ghost"
								size="icon-xs"
								className="absolute right-1.5 top-1/2 -translate-y-1/2"
								onClick={() => setDraftSearch('')}
								aria-label="Clear search"
							>
								{isPending ? (
									<LoaderCircleIcon className="size-3 animate-spin" />
								) : (
									<XIcon className="size-3" />
								)}
							</Button>
						)}
					</div>
				)}

				{filters.map((filter) =>
					filter.multiple ? (
						filter.searchable ? (
							<TableFilterCombobox
								key={filter.key}
								value={filter.value}
								onValueChange={filter.onChange}
								options={filter.options}
								placeholder={filter.allLabel ?? `All ${filter.label}`}
							/>
						) : (
							<TableFilterSelect
								key={filter.key}
								multiple
								value={filter.value}
								onValueChange={filter.onChange}
								options={filter.options}
								allLabel={filter.allLabel ?? `All ${filter.label}`}
							/>
						)
					) : (
						<TableFilterSelect
							key={filter.key}
							value={filter.value}
							onValueChange={filter.onChange}
							options={filter.options}
							allLabel={filter.allLabel ?? `All ${filter.label}`}
						/>
					),
				)}

				{dateRange && (
					<DateRangeFilter
						value={dateRange.value}
						onChange={dateRange.onChange}
						placeholder={dateRange.placeholder}
						presets={dateRange.presets}
					/>
				)}

				{(table || actions) && (
					<div className="ml-auto flex items-center gap-2">
						{table && (
							<DataGridColumnVisibility
								table={table}
								trigger={
									<Button variant="outline" size="sm" className="gap-1.5">
										<ColumnsSettingsIcon className="size-3.5" />
										Columns
									</Button>
								}
							/>
						)}
						{actions}
					</div>
				)}
			</div>

			{(activeFilters.length > 0 || dateRange?.value) && (
				<div className="flex flex-wrap items-center gap-1.5">
					{activeFilters.map((filter) => {
						const values = Array.isArray(filter.value) ? filter.value : [filter.value]
						const labels = values.map((v) => filter.options.find((o) => o.value === v)?.label ?? v)
						return (
							<Badge key={filter.key} variant="outline" className="gap-1 pr-1">
								{filter.label}: {labels.join(', ')}
								<button
									type="button"
									onClick={() => filter.onChange(undefined)}
									aria-label={`Remove ${filter.label} filter`}
									className="rounded-full p-0.5 hover:bg-muted"
								>
									<XIcon className="size-2.5" />
								</button>
							</Badge>
						)
					})}
					{dateRange?.value && (
						<Badge key={dateRange.key} variant="outline" className="gap-1 pr-1">
							{dateRange.label}: {format(dateRange.value.from, 'dd MMM')} –{' '}
							{format(dateRange.value.to, 'dd MMM yyyy')}
							<button
								type="button"
								onClick={() => dateRange.onChange(undefined)}
								aria-label={`Remove ${dateRange.label} filter`}
								className="rounded-full p-0.5 hover:bg-muted"
							>
								<XIcon className="size-2.5" />
							</button>
						</Badge>
					)}
					<Button
						variant="ghost"
						size="xs"
						className="text-muted-foreground"
						onClick={() => {
							filters.forEach((f) => f.onChange(undefined))
							dateRange?.onChange(undefined)
						}}
					>
						Clear filters
					</Button>
				</div>
			)}
		</div>
	)
}
