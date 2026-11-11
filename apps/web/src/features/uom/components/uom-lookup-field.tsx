import { ResourceLookupField } from '@/lib/form/resource-lookup-field'
import type { LookupFieldProps } from '@/lib/form/resource-lookup-field'
import type { ResourceLookupAdapter } from '@/lib/form/use-resource-lookup'

import { uomResource } from '../api'
import type { UomDto } from '../dto'

const uomLookup: ResourceLookupAdapter<UomDto> = {
	listOptions: (query) => uomResource.list.queryOptions(query),
	detailOptions: (id) => uomResource.detail.queryOptions({ id }),
	label: (uom) => `${uom.code} — ${uom.name}`,
}

export function UomLookupField(props: LookupFieldProps) {
	return <ResourceLookupField adapter={uomLookup} placeholder="Search units..." {...props} />
}
