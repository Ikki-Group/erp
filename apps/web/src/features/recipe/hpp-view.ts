import { isApiError } from '@/lib/api/index.ts'

export type HppView =
	| { kind: 'inactive' }
	| { kind: 'loading' }
	| { kind: 'value'; hpp: string }
	| { kind: 'no-active-recipe' }
	| { kind: 'error' }

interface HppQueryState {
	data?: { data: { hpp: string } }
	isError: boolean
	error: unknown
}

/**
 * HPP is computed from the menu item's ACTIVE recipe, so an inactive recipe has no cost of its own.
 * A cached value stays visible through a refresh failure; zero is a real value.
 */
export function resolveHppView(recipe: { isActive: boolean }, query: HppQueryState): HppView {
	if (!recipe.isActive) return { kind: 'inactive' }
	if (query.data) return { kind: 'value', hpp: query.data.data.hpp }
	if (query.isError) {
		return isApiError(query.error) && query.error.isNotFound
			? { kind: 'no-active-recipe' }
			: { kind: 'error' }
	}
	return { kind: 'loading' }
}
