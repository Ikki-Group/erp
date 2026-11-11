import { ResourceLookupField } from '@/lib/form/resource-lookup-field'
import type { LookupFieldProps } from '@/lib/form/resource-lookup-field'
import type { ResourceLookupAdapter } from '@/lib/form/use-resource-lookup'

import { locationResource } from '../api'
import type { LocationDto } from '../dto'

const locationLookup: ResourceLookupAdapter<LocationDto> = {
	listOptions: (query) => locationResource.list.queryOptions(query),
	detailOptions: (id) => locationResource.detail.queryOptions({ id }),
	label: (location) => `${location.code} — ${location.name}`,
}

export function LocationLookupField(props: LookupFieldProps) {
	return (
		<ResourceLookupField adapter={locationLookup} placeholder="Search locations..." {...props} />
	)
}
