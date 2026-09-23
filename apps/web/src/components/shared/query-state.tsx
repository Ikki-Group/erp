import type { ReactNode } from 'react'

import type { UseQueryResult } from '@tanstack/react-query'

import { EmptyState } from './empty-state'
import { PageError } from './page-error'
import { PageSkeleton } from './page-skeleton'

const DEFAULT_LOADING = <PageSkeleton />
const DEFAULT_EMPTY = <EmptyState title="No data yet" />

export interface QueryStateProps<TData> {
	query: Pick<UseQueryResult<TData>, 'data' | 'isLoading' | 'isError' | 'error' | 'refetch'>
	children: (data: TData) => ReactNode
	loading?: ReactNode
	empty?: ReactNode | (() => ReactNode)
	error?: ReactNode | ((error: Error, retry: () => void) => ReactNode)
	isEmpty?: (data: TData) => boolean
}

/** Renders the standard loading/error/empty/data states for a query-backed view. */
export function QueryState<TData>({
	query,
	children,
	loading = DEFAULT_LOADING,
	empty,
	error,
	isEmpty,
}: QueryStateProps<TData>) {
	if (query.isLoading) return loading

	if (query.isError) {
		if (typeof error === 'function') {
			return error(normalizeError(query.error), () => void query.refetch())
		}
		return error ?? <PageError onRetry={() => void query.refetch()} />
	}

	if (query.data === undefined) {
		return typeof empty === 'function' ? empty() : (empty ?? DEFAULT_EMPTY)
	}

	if (isEmpty?.(query.data) ?? false) {
		return typeof empty === 'function' ? empty() : (empty ?? DEFAULT_EMPTY)
	}

	return children(query.data)
}

function normalizeError(error: unknown): Error {
	return error instanceof Error ? error : new Error('An unexpected error occurred.')
}
