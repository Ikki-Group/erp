import type { ReactNode } from 'react'

import type { UseQueryResult } from '@tanstack/react-query'

import { PageError } from './page-error'
import { PageSkeleton } from './page-skeleton'

const DEFAULT_LOADING = <PageSkeleton />
const DEFAULT_NOT_FOUND = (
	<PageError title="Not found" message="The requested record could not be found." />
)

export interface DetailBoundaryProps<TData> {
	query: Pick<UseQueryResult<TData>, 'data' | 'isLoading' | 'isError' | 'error' | 'refetch'>
	children: (data: TData) => ReactNode
	loading?: ReactNode
	notFound?: ReactNode
	error?: ReactNode | ((error: Error, retry: () => void) => ReactNode)
}

/** Standard loading, error, and not-found boundary for detail routes. */
export function DetailBoundary<TData>({
	query,
	children,
	loading = DEFAULT_LOADING,
	notFound = DEFAULT_NOT_FOUND,
	error,
}: DetailBoundaryProps<TData>) {
	if (query.isLoading) return loading

	if (query.isError) {
		if (typeof error === 'function') {
			return error(normalizeError(query.error), () => void query.refetch())
		}
		return error ?? <PageError onRetry={() => void query.refetch()} />
	}

	return query.data === undefined ? notFound : children(query.data)
}

function normalizeError(error: unknown): Error {
	return error instanceof Error ? error : new Error('An unexpected error occurred.')
}
