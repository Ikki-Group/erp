import type { ReactNode } from 'react'

import type { UseQueryResult } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'

import { InlineAlert } from './inline-alert'
import { PageError } from './page-error'
import { PageSkeleton } from './page-skeleton'

const DEFAULT_LOADING = <PageSkeleton />
const DEFAULT_NOT_FOUND = (
	<PageError title="Tidak ditemukan" message="Data yang diminta tidak ditemukan." />
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
	if (query.data !== undefined) {
		return (
			<>
				{query.isError && (
					<InlineAlert variant="warning" title="Gagal memperbarui data ini">
						<p>Pekerjaan Anda masih tersimpan. Coba muat ulang data ini.</p>
						<Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>
							Coba lagi
						</Button>
					</InlineAlert>
				)}
				{children(query.data)}
			</>
		)
	}
	if (query.isLoading) return loading

	if (query.isError) {
		if (typeof error === 'function') {
			return error(normalizeError(query.error), () => void query.refetch())
		}
		return error ?? <PageError onRetry={() => void query.refetch()} />
	}

	return notFound
}

function normalizeError(error: unknown): Error {
	return error instanceof Error ? error : new Error('Terjadi kesalahan tak terduga.')
}
