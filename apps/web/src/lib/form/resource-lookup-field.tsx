import { useId } from 'react'

import { AsyncCombobox } from '@/components/shared/async-combobox'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

import { useFieldContext } from './contexts.ts'
import { formatFieldError } from './field-error.tsx'
import { useResourceLookup } from './use-resource-lookup.ts'
import type { ResourceLookupAdapter } from './use-resource-lookup.ts'

export interface LookupFieldProps {
	label: string
	placeholder?: string
	description?: string
	disabled?: boolean
	/** Hide IDs used by other rows, without hiding or preventing resolution of this selection. */
	excludeIds?: readonly number[]
}

interface ResourceLookupFieldProps<TEntity extends { id: number }> extends LookupFieldProps {
	adapter: ResourceLookupAdapter<TEntity>
	onSelect?: (entity: TEntity | null) => void
}

/** Render inside AppField; entity rules and filter policy belong in the feature adapter. */
export function ResourceLookupField<TEntity extends { id: number }>({
	adapter,
	label,
	placeholder = 'Search...',
	description,
	disabled = false,
	excludeIds,
	onSelect,
}: ResourceLookupFieldProps<TEntity>) {
	const field = useFieldContext<number | null>()
	const id = useId()
	const lookup = useResourceLookup(adapter, field.state.value, disabled)
	const error = field.state.meta.isTouched ? formatFieldError(field.state.meta.errors) : undefined
	const describedBy =
		[
			description && `${id}-description`,
			error && `${id}-error`,
			lookup.selectionError && `${id}-selection-error`,
			lookup.isResolvingSelection && `${id}-selection-loading`,
		]
			.filter(Boolean)
			.join(' ') || undefined

	return (
		<div className="min-w-0 space-y-1.5">
			<Label htmlFor={id}>{label}</Label>
			<AsyncCombobox
				id={id}
				name={field.name}
				aria-label={label}
				value={lookup.selectedOption}
				onValueChange={(option) => {
					const entity = lookup.select(option)
					if (entity === undefined) return
					field.handleChange(entity?.id ?? null)
					onSelect?.(entity)
				}}
				onSearchChange={lookup.setSearch}
				options={
					excludeIds?.length
						? lookup.options.filter(
								(option) =>
									Number(option.value) === field.state.value ||
									!excludeIds.includes(Number(option.value)),
							)
						: lookup.options
				}
				isLoading={lookup.isLoading}
				errorMessage={lookup.searchError ? 'Could not load results. Try again.' : undefined}
				onRetry={lookup.retrySearch}
				hasMore={lookup.hasMore}
				isLoadingMore={lookup.isLoadingMore}
				onLoadMore={lookup.loadMore}
				placeholder={placeholder}
				disabled={disabled}
				onBlur={field.handleBlur}
				aria-invalid={!!error}
				aria-describedby={describedBy}
			/>
			{description && (
				<p id={`${id}-description`} className="text-xs text-muted-foreground">
					{description}
				</p>
			)}
			{lookup.isResolvingSelection && (
				<p id={`${id}-selection-loading`} role="status" className="text-xs text-muted-foreground">
					Loading selected record...
				</p>
			)}
			{lookup.selectionError && (
				<div className="space-y-1.5">
					<p id={`${id}-selection-error`} role="alert" className="text-xs text-destructive">
						Could not load the selected record. Your selection has not changed.
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={lookup.isRetryingSelection}
						onClick={lookup.retrySelection}
					>
						{lookup.isRetryingSelection ? 'Retrying...' : 'Retry selected record'}
					</Button>
				</div>
			)}
			{error && (
				<p id={`${id}-error`} className="text-xs text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}
