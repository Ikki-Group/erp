import { useEffect, useState } from 'react'

import { LoaderCircleIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@/components/ui/combobox'

export interface AsyncComboboxOption {
	label: string
	value: string
}

interface AsyncComboboxProps {
	value?: AsyncComboboxOption | null
	onValueChange: (value: AsyncComboboxOption | null) => void
	/** Called with the trimmed query, debounced 250ms \u2014 wire this to a TanStack Query search. */
	onSearchChange: (query: string) => void
	/** Current result set for the active query. Supply `[]` while `isLoading` to avoid a stale flash. */
	options: readonly AsyncComboboxOption[]
	/** Shows a spinner + `loadingMessage` in place of the list. */
	isLoading?: boolean
	placeholder?: string
	loadingMessage?: string
	emptyMessage?: string
	disabled?: boolean
	className?: string
}

/**
 * Single-select combobox backed by a remote search \u2014 the query is debounced
 * internally and handed to `onSearchChange`, so the caller only owns the
 * actual fetch (e.g. `useQuery` keyed on the debounced term). Reach for the
 * plain `Combobox` (`components/ui/combobox.tsx`) when the full option list
 * already fits in memory; this is for option sets too large to preload
 * (customers, materials, anything searched server-side).
 *
 * `filteredItems` is passed through unchanged from `options` \u2014 the server
 * already filtered, so Base UI's own client-side filtering is disabled (see
 * `apps/web/DESIGN.md`).
 */
export function AsyncCombobox({
	value,
	onValueChange,
	onSearchChange,
	options,
	isLoading = false,
	placeholder = 'Search...',
	loadingMessage = 'Searching...',
	emptyMessage = 'No results found.',
	disabled = false,
	className,
}: AsyncComboboxProps) {
	const [query, setQuery] = useState('')

	useEffect(() => {
		const timer = window.setTimeout(() => onSearchChange(query.trim()), 250)
		return () => window.clearTimeout(timer)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query])

	const displayOptions = isLoading ? [] : options

	return (
		<Combobox
			items={displayOptions}
			filteredItems={displayOptions}
			value={value ?? null}
			onValueChange={(opt: AsyncComboboxOption | null) => onValueChange(opt)}
			onInputValueChange={setQuery}
			isItemEqualToValue={(a: AsyncComboboxOption, b: AsyncComboboxOption) => a.value === b.value}
			disabled={disabled}
		>
			<ComboboxInput
				placeholder={placeholder}
				showTrigger={false}
				showClear
				disabled={disabled}
				className={cn('w-full', className)}
			/>
			<ComboboxContent>
				{isLoading ? (
					<div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
						<LoaderCircleIcon className="size-3.5 animate-spin" />
						{loadingMessage}
					</div>
				) : (
					<ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
				)}
				<ComboboxList>
					{(opt: AsyncComboboxOption) => (
						<ComboboxItem key={opt.value} value={opt}>
							{opt.label}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	)
}
