import { useEffect, useEffectEvent, useState } from 'react'
import type { ComponentProps } from 'react'

import { LoaderCircleIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
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

interface AsyncComboboxProps extends Pick<
	ComponentProps<'input'>,
	'id' | 'name' | 'onBlur' | 'aria-label' | 'aria-invalid' | 'aria-describedby'
> {
	value?: AsyncComboboxOption | null
	onValueChange: (value: AsyncComboboxOption | null) => void
	/** Called with the trimmed query, debounced 250ms \u2014 wire this to a TanStack Query search. */
	onSearchChange: (query: string) => void
	/** Results for the latest debounced query, never placeholder data from another query. */
	options: readonly AsyncComboboxOption[]
	/** Shows a spinner + `loadingMessage` in place of the list. */
	isLoading?: boolean
	errorMessage?: string
	onRetry?: () => void
	hasMore?: boolean
	isLoadingMore?: boolean
	onLoadMore?: () => void
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
 * `docs/web/07-design-system.md`).
 */
export function AsyncCombobox({
	value,
	onValueChange,
	onSearchChange,
	options,
	isLoading = false,
	errorMessage,
	onRetry,
	hasMore = false,
	isLoadingMore = false,
	onLoadMore,
	placeholder = 'Search...',
	loadingMessage = 'Searching...',
	emptyMessage = 'No results found.',
	disabled = false,
	className,
	id,
	name,
	onBlur,
	'aria-label': ariaLabel,
	'aria-invalid': ariaInvalid,
	'aria-describedby': ariaDescribedBy,
}: AsyncComboboxProps) {
	const [query, setQuery] = useState('')
	const [submittedQuery, setSubmittedQuery] = useState('')
	const search = useEffectEvent(onSearchChange)
	const trimmedQuery = query.trim()

	useEffect(() => {
		const timer = window.setTimeout(() => {
			search(trimmedQuery)
			setSubmittedQuery(trimmedQuery)
		}, 250)
		return () => window.clearTimeout(timer)
	}, [trimmedQuery])

	// Suppress the previous query immediately, including the debounce interval.
	const isDebouncing = trimmedQuery !== submittedQuery
	const showLoading = isLoading || isDebouncing
	const displayOptions = showLoading ? [] : options

	return (
		<Combobox
			name={name}
			items={displayOptions}
			filteredItems={displayOptions}
			value={value ?? null}
			onValueChange={(opt: AsyncComboboxOption | null) => {
				if (opt && !displayOptions.some((item) => item.value === opt.value)) return
				onValueChange(opt)
				setQuery('')
			}}
			onInputValueChange={(input, details) => {
				if (details.reason === 'input-change' || details.reason === 'input-clear') setQuery(input)
				if (details.reason === 'clear-press') setQuery('')
			}}
			onOpenChange={(open) => {
				if (!open) setQuery('')
			}}
			isItemEqualToValue={(a: AsyncComboboxOption, b: AsyncComboboxOption) => a.value === b.value}
			disabled={disabled}
		>
			<ComboboxInput
				id={id}
				onBlur={onBlur}
				aria-label={ariaLabel}
				aria-invalid={ariaInvalid}
				aria-describedby={ariaDescribedBy}
				aria-busy={showLoading || isLoadingMore}
				onKeyDown={(event) => {
					if (event.key === 'Enter' && showLoading) {
						event.preventDefault()
						event.preventBaseUIHandler()
					}
				}}
				placeholder={placeholder}
				showTrigger={false}
				showClear
				disabled={disabled}
				className={cn('w-full', className)}
			/>
			<ComboboxContent>
				{showLoading ? (
					<div
						role="status"
						className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground"
					>
						<LoaderCircleIcon aria-hidden="true" className="size-3.5 animate-spin" />
						{loadingMessage}
					</div>
				) : errorMessage ? (
					<div className="space-y-2 p-3 text-xs">
						<p role="alert" className="text-destructive">
							{errorMessage}
						</p>
						{onRetry && (
							<Button type="button" variant="outline" size="sm" onClick={onRetry}>
								Retry search
							</Button>
						)}
					</div>
				) : (
					<ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
				)}
				<ComboboxList aria-label={ariaLabel}>
					{(opt: AsyncComboboxOption) => (
						<ComboboxItem key={opt.value} value={opt}>
							{opt.label}
						</ComboboxItem>
					)}
				</ComboboxList>
				{!showLoading && !errorMessage && hasMore && onLoadMore && (
					<div className="border-t p-1">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="w-full"
							disabled={isLoadingMore}
							onClick={onLoadMore}
						>
							{isLoadingMore ? 'Loading more...' : 'Load more'}
						</Button>
					</div>
				)}
			</ComboboxContent>
		</Combobox>
	)
}
