import type { WithCursorResult, WithPaginationResult } from '@/shared/types/pagination.ts'

export const res = {
	ok<T>(data: T) {
		return { success: true as const, data }
	},

	created<T>(data: T) {
		return { success: true as const, data }
	},

	paginated<T>(result: WithPaginationResult<T>) {
		return {
			success: true as const,
			data: result.data,
			meta: result.meta,
		}
	},

	cursorPaginated<T>(result: WithCursorResult<T>) {
		return {
			success: true as const,
			data: result.data,
			meta: result.meta,
		}
	},

	noData() {
		return { success: true as const }
	},
}
