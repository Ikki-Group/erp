import { useQuery } from '@tanstack/react-query'

import { CurrencyDisplay } from '@/components/shared/currency-display.tsx'

import { Button } from '@/components/ui/button'

import { menuItemResource } from '@/features/menu/api.ts'

import { recipeResource } from '../api.ts'
import type { RecipeDto } from '../dto/index.ts'
import { resolveHppView } from '../hpp-view.ts'

/** Resolves the canonical menu-item detail, so rows are labelled beyond any list page. */
export function RecipeMenuItemLabel({ id }: { id: number }) {
	const query = useQuery({
		...menuItemResource.detail.queryOptions({ id }),
		throwOnError: false,
	})
	const item = query.data?.data
	return <span className="text-sm">{item ? `${item.name} (${item.sku})` : `#${id}`}</span>
}

/** Cost of the menu item's active recipe at the given location. */
export function RecipeHppCell({ recipe, locationId }: { recipe: RecipeDto; locationId: number }) {
	const query = useQuery({
		...recipeResource.hpp.queryOptions({ menuItemId: recipe.menuItemId, locationId }),
		enabled: recipe.isActive,
		throwOnError: false,
	})
	const view = resolveHppView(recipe, query)

	switch (view.kind) {
		case 'inactive':
			return (
				<span className="block text-right text-xs text-muted-foreground">
					Tidak berlaku (resep nonaktif)
				</span>
			)
		case 'loading':
			return (
				<span className="block text-right text-muted-foreground" role="status">
					Memuat…
				</span>
			)
		case 'no-active-recipe':
			return (
				<span className="block text-right text-xs text-muted-foreground">
					Belum ada resep aktif
				</span>
			)
		case 'error':
			return (
				<div className="flex items-center justify-end gap-2 text-xs text-destructive">
					<span>HPP gagal dimuat</span>
					<Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>
						Coba lagi
					</Button>
				</div>
			)
		case 'value':
			return (
				<div className="text-right" title={`Rp ${view.hpp}`}>
					<CurrencyDisplay value={view.hpp} className="font-mono text-sm" />
					{query.isError && (
						<div className="flex items-center justify-end gap-2 text-xs text-warning" role="status">
							<span>HPP terakhir; pembaruan gagal</span>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={query.isFetching}
								onClick={() => void query.refetch()}
							>
								Coba lagi
							</Button>
						</div>
					)}
				</div>
			)
	}
}
