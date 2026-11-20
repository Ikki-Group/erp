import { ResourceLookupField } from '@/lib/form/resource-lookup-field'
import type { LookupFieldProps } from '@/lib/form/resource-lookup-field'
import type { ResourceLookupAdapter } from '@/lib/form/use-resource-lookup'

import { locationResource } from '../api'
import type { LocationDto } from '../dto'

const locationLookup: ResourceLookupAdapter<LocationDto> = {
	// Lookups only ever offer selectable (active) locations.
	listOptions: (query) => locationResource.list.queryOptions({ ...query, isActive: 1 }),
	detailOptions: (id) => locationResource.detail.queryOptions({ id }),
	label: (location) => `${location.code} — ${location.name}`,
}

export function LocationLookupField(props: LookupFieldProps) {
	return <ResourceLookupField adapter={locationLookup} placeholder="Cari lokasi..." {...props} />
}
