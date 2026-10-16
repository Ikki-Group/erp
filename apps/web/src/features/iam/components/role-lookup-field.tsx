import { ResourceLookupField } from '@/lib/form/resource-lookup-field'
import type { LookupFieldProps } from '@/lib/form/resource-lookup-field'
import type { ResourceLookupAdapter } from '@/lib/form/use-resource-lookup'

import { roleResource } from '../api'
import type { RoleDto } from '../dto'

const roleLookup: ResourceLookupAdapter<RoleDto> = {
	listOptions: (query) => roleResource.list.queryOptions(query),
	detailOptions: (id) => roleResource.detail.queryOptions({ id }),
	label: (role) => `${role.code} — ${role.name}`,
}

export function RoleLookupField(props: LookupFieldProps) {
	return <ResourceLookupField adapter={roleLookup} placeholder="Search roles..." {...props} />
}
