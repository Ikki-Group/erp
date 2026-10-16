import { useQuery } from '@tanstack/react-query'

import { materialResource } from '@/features/material/api.ts'
import { uomResource } from '@/features/uom/api.ts'

/** Detail keys share the lookup cache and resolve IDs outside any list page. */
export function InventoryLineMaterial({ id }: { id: number | null }) {
	const query = useQuery({
		...materialResource.detail.queryOptions({ id: id! }),
		enabled: id !== null,
		throwOnError: false,
	})
	const material = query.data?.data
	return material ? `${material.name} (${material.code})` : id === null ? '—' : `#${id}`
}

export function InventoryLineUom({ id }: { id: number | null }) {
	const query = useQuery({
		...uomResource.detail.queryOptions({ id: id! }),
		enabled: id !== null,
		throwOnError: false,
	})
	return query.data?.data.code ?? (id === null ? '—' : `#${id}`)
}
