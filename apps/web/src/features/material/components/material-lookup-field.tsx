import { useMemo } from 'react'

import { ResourceLookupField } from '@/lib/form/resource-lookup-field'
import type { LookupFieldProps } from '@/lib/form/resource-lookup-field'
import type { ResourceLookupAdapter } from '@/lib/form/use-resource-lookup'

import { materialResource } from '../api'
import type { MaterialDto } from '../dto'

/**
 * With `locationId`, the list offers only materials assigned to that location. The selected
 * material still resolves by canonical detail (any location), so an existing choice keeps its
 * label but never makes the global catalogue eligible.
 */
export function createMaterialLookup(locationId?: number): ResourceLookupAdapter<MaterialDto> {
	return {
		listOptions: (query) => materialResource.list.queryOptions({ ...query, locationId }),
		detailOptions: (id) => materialResource.detail.queryOptions({ id }),
		label: (material) => `${material.code} — ${material.name}`,
	}
}

const globalMaterialLookup = createMaterialLookup()

interface MaterialLookupFieldProps extends LookupFieldProps {
	onSelect?: (entity: MaterialDto | null) => void
	/** Restrict choices to materials assigned to this location. */
	locationId?: number
}

export function MaterialLookupField({ locationId, ...props }: MaterialLookupFieldProps) {
	const adapter = useMemo(
		() => (locationId === undefined ? globalMaterialLookup : createMaterialLookup(locationId)),
		[locationId],
	)
	return <ResourceLookupField adapter={adapter} placeholder="Search materials..." {...props} />
}
