import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'

import { usePermissionCheck } from '@/components/shared/permission-gate'

import { Button } from '@/components/ui/button'

import { locationResource } from '@/features/location/api.ts'
import { materialResource } from '@/features/material/api.ts'
import { supplierResource } from '@/features/supplier/api.ts'
import { uomResource } from '@/features/uom/api.ts'

interface LabelProps {
	id: number | null
	kind: string
	label?: string
	query: Pick<UseQueryResult, 'isError' | 'isFetching' | 'refetch'>
}

function InventoryLabel({ id, kind, label, query }: LabelProps) {
	if (id === null) return <>—</>
	return (
		<span className="inline-flex flex-wrap items-center gap-1.5">
			<span>{label ?? `${kind} #${id}`}</span>
			{query.isError && (
				<Button
					type="button"
					size="xs"
					variant="outline"
					disabled={query.isFetching}
					aria-label={`Retry ${kind.toLowerCase()} #${id}`}
					onClick={() => void query.refetch()}
				>
					Coba lagi
				</Button>
			)}
		</span>
	)
}

/** Canonical detail queries resolve IDs outside any list page and preserve labels on refresh failure. */
export function InventoryLineMaterial({ id }: { id: number | null }) {
	const canRead = usePermissionCheck({ permission: 'material.read' })
	const query = useQuery({
		...materialResource.detail.queryOptions({ id: id ?? 0 }),
		enabled: canRead && id !== null,
		throwOnError: false,
	})
	const material = canRead ? query.data?.data : undefined
	return (
		<InventoryLabel
			id={id}
			kind="Material"
			label={material ? `${material.name} (${material.code})` : undefined}
			query={{ ...query, isError: canRead && query.isError }}
		/>
	)
}

export function InventoryLineUom({ id }: { id: number | null }) {
	const canRead = usePermissionCheck({ permission: 'uom.read' })
	const query = useQuery({
		...uomResource.detail.queryOptions({ id: id ?? 0 }),
		enabled: canRead && id !== null,
		throwOnError: false,
	})
	return (
		<InventoryLabel
			id={id}
			kind="UOM"
			label={canRead ? query.data?.data.code : undefined}
			query={{ ...query, isError: canRead && query.isError }}
		/>
	)
}

export function InventoryLineSupplier({ id }: { id: number | null }) {
	const canRead = usePermissionCheck({ permission: 'supplier.read' })
	const query = useQuery({
		...supplierResource.detail.queryOptions({ id: id ?? 0 }),
		enabled: canRead && id !== null,
		throwOnError: false,
	})
	return (
		<InventoryLabel
			id={id}
			kind="Supplier"
			label={canRead ? query.data?.data.name : undefined}
			query={{ ...query, isError: canRead && query.isError }}
		/>
	)
}

export function InventoryLineLocation({ id }: { id: number | null }) {
	const canRead = usePermissionCheck({ permission: 'location.read' })
	const query = useQuery({
		...locationResource.detail.queryOptions({ id: id ?? 0 }),
		enabled: canRead && id !== null,
		throwOnError: false,
	})
	return (
		<InventoryLabel
			id={id}
			kind="Location"
			label={canRead ? query.data?.data.name : undefined}
			query={{ ...query, isError: canRead && query.isError }}
		/>
	)
}
