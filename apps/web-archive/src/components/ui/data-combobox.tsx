import * as React from 'react'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { UnusedSkipTokenOptions } from '@tanstack/react-query'

import { useDebounce } from '@uidotdev/usehooks'
import { DatabaseIcon, Loader2Icon } from 'lucide-react'

import { Combobox } from '@/components/ui/combobox'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A factory that receives the current search string and returns a fully-typed
 * `queryOptions(...)` object.
 *
 * `TData`  — raw shape returned by the API (e.g. `PaginatedResponse<LocationDto>`)
 * `TItem`  — shape of each list item after selection (e.g. `LocationDto`)
 *
 * The component uses React Query's built-in `select` to extract `TItem[]` from
 * `TData`, so the factory (and call site) is the only place that knows about
 * the API envelope shape.
 *
 * @example flat array API — no `select` needed
 * ```ts
 * const userOptions = (search: string) =>
 *   queryOptions({
 *     queryKey: ['users', search],
 *     queryFn:  () => api.users.search(search), // Promise<User[]>
 *   })
 * ```
 *
 * @example paginated API — unwrap with `select`
 * ```ts
 * const locationOptions = (search: string) =>
 *   queryOptions({
 *     queryKey: ['locations', search],
 *     queryFn:  () => api.location.list({ search }), // Promise<PaginatedResponse<LocationDto>>
 *     select:   (res) => res.data,                   // ← unwrap the envelope
 *   })
 * ```
 */

export type QueryOptionsFactory<TData, TItem> = (
	search: string,
) => // | UndefinedInitialDataOptions<TData, any, TItem[], any>
UnusedSkipTokenOptions<TData, any, TItem[], any>

export interface DataComboboxProps<TData, TItem> {
	value?: string | null
	onValueChange?: (value: string | null) => void
	onItemSelect?: (item: TItem | null) => void

	placeholder?: string
	emptyText?: string
	loadingText?: string

	queryOptionsFactory: QueryOptionsFactory<TData, TItem>

	getLabel: (item: NoInfer<TItem>) => string
	getValue: (item: NoInfer<TItem>) => string

	debounceMs?: number
	disabled?: boolean
	className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataCombobox<TData, TItem>({
	value,
	onValueChange,
	onItemSelect,
	placeholder = 'Pilih data...',
	emptyText = 'Data tidak ditemukan.',
	loadingText = 'Mencari data...',
	queryOptionsFactory,
	getLabel,
	getValue,
	debounceMs = 500,
	disabled = false,
	className,
}: DataComboboxProps<TData, TItem>) {
	const [open, setOpen] = React.useState(false)
	const [inputValue, setInputValue] = React.useState('')

	const debouncedSearch = useDebounce(inputValue, debounceMs)

	const {
		data = [],
		isPending,
		isFetching,
	} = useQuery({
		...queryOptionsFactory(debouncedSearch),
		enabled: open,
		placeholderData: keepPreviousData,
		staleTime: 30_000,
	})

	const showSpinner = isPending && isFetching

	const handleOpenChange = React.useCallback((next: boolean) => {
		setOpen(next)
		if (!next) setInputValue('')
	}, [])

	const handleValueChange = React.useCallback(
		(val: string | null) => {
			onValueChange?.(val)

			if (!onItemSelect) return

			if (!val) {
				onItemSelect(null)
				return
			}

			const selectedItem = data.find((item) => getValue(item) === val) ?? null
			onItemSelect(selectedItem)
		},
		[data, getValue, onItemSelect, onValueChange],
	)

	return (
		<Combobox
			value={value ?? null}
			onValueChange={handleValueChange}
			open={open}
			onOpenChange={handleOpenChange}
			inputValue={inputValue}
			onInputValueChange={setInputValue}
			disabled={disabled}
			items={data}
		>
			<div className="relative group/combobox-wrapper">
				<Combobox.Input
					placeholder={placeholder}
					className={className}
					showClear={!!value}
					disabled={disabled}
				/>
			</div>

			<Combobox.Content align="start" className="w-[--anchor-width] p-0 shadow-lg">
				<div className="flex flex-col">
					{showSpinner ? (
						<LoadingState text={loadingText} />
					) : data.length === 0 ? (
						<EmptyState text={emptyText} />
					) : (
						<Combobox.List className="p-1">
							{data.map((item) => (
								<Combobox.Item key={getValue(item)} value={getValue(item)}>
									{getLabel(item)}
								</Combobox.Item>
							))}
						</Combobox.List>
					)}
				</div>
			</Combobox.Content>
		</Combobox>
	)
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingState({ text }: { text: string }) {
	return (
		<div
			role="status"
			aria-live="polite"
			className="flex flex-col items-center justify-center p-6 text-muted-foreground gap-3"
		>
			<Loader2Icon className="size-5 animate-spin text-primary/60" aria-hidden="true" />
			<span className="text-sm font-medium">{text}</span>
		</div>
	)
}

function EmptyState({ text }: { text: string }) {
	return (
		<div
			role="status"
			aria-live="polite"
			className="flex flex-col items-center justify-center p-6 text-muted-foreground gap-3 text-center"
		>
			<DatabaseIcon className="size-8 opacity-20" aria-hidden="true" />
			<div className="flex flex-col gap-1">
				<span className="text-sm font-medium text-foreground">{text}</span>
				<span className="text-xs">Ubah kata kunci pencarian Anda</span>
			</div>
		</div>
	)
}
