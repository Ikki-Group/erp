import { useQuery } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { uomResource } from '../api.ts'

/** Conversion references share the lookup/editor detail cache, including refresh recovery. */
export function UomLabel({ id }: { id: number }) {
	const query = useQuery({
		...uomResource.detail.queryOptions({ id }),
		throwOnError: false,
	})
	const unit = query.data?.data

	return (
		<span className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
			{unit ? (
				<Badge variant="secondary" className="max-w-full whitespace-normal break-words">
					{unit.name} ({unit.code})
				</Badge>
			) : (
				<span className="text-muted-foreground" role="status">
					{query.isPending ? 'Memuat satuan…' : 'Label satuan tidak tersedia'}
				</span>
			)}
			{query.isError && (
				<span className="inline-flex flex-wrap items-center gap-1.5" role="alert">
					{unit && <span className="text-muted-foreground">Gagal memuat ulang label.</span>}
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={query.isFetching}
						aria-label={`Coba lagi label untuk satuan ${id}`}
						onClick={() => void query.refetch()}
					>
						Muat ulang label
					</Button>
				</span>
			)}
		</span>
	)
}
