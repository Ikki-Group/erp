import { useMemo } from 'react'

import { useResourceLookup } from '@/lib/form/use-resource-lookup'

import { AsyncCombobox } from '@/components/shared/async-combobox'

import { Button } from '@/components/ui/button'

import { createMenuCategoryLookup } from './menu-category-lookup-field'

interface MenuCategoryFilterProps {
	locationId: number
	value: number | undefined
	onChange: (categoryId: number | undefined) => void
}

/** Searchable, paged category filter: every category of the location stays reachable. */
export function MenuCategoryFilter({ locationId, value, onChange }: MenuCategoryFilterProps) {
	const adapter = useMemo(() => createMenuCategoryLookup(locationId), [locationId])
	const lookup = useResourceLookup(adapter, value ?? null)

	return (
		<div className="flex min-w-48 flex-col gap-1 sm:w-64">
			<AsyncCombobox
				aria-label="Kategori"
				value={lookup.selectedOption}
				onValueChange={(option) => {
					const category = lookup.select(option)
					if (category === undefined) return
					onChange(category?.id)
				}}
				onSearchChange={lookup.setSearch}
				options={lookup.options}
				isLoading={lookup.isLoading}
				errorMessage={lookup.searchError ? 'Could not load results. Try again.' : undefined}
				onRetry={lookup.retrySearch}
				hasMore={lookup.hasMore}
				isLoadingMore={lookup.isLoadingMore}
				onLoadMore={lookup.loadMore}
				placeholder="Semua kategori"
			/>
			{lookup.selectionError && (
				<div role="alert" className="flex items-center gap-2 text-xs text-destructive">
					<span>Kategori terpilih tidak dapat dimuat.</span>
					<Button
						type="button"
						variant="outline"
						size="xs"
						disabled={lookup.isRetryingSelection}
						onClick={lookup.retrySelection}
					>
						Coba lagi
					</Button>
				</div>
			)}
		</div>
	)
}
