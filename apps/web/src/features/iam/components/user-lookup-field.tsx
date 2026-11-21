import { ResourceLookupField } from '@/lib/form/resource-lookup-field'
import type { LookupFieldProps } from '@/lib/form/resource-lookup-field'
import type { ResourceLookupAdapter } from '@/lib/form/use-resource-lookup'

import { userResource } from '../api'
import type { UserDto } from '../dto'

// List rows add `roleNames`, detail adds `assignments`; the lookup only needs the base
// fields, so both are typed as `UserDto` and the query functions are rebuilt to avoid the
// options' list-vs-detail generic mismatch.
const userLookup: ResourceLookupAdapter<UserDto> = {
	listOptions: (query) => ({
		queryKey: userResource.list.queryOptions(query).queryKey,
		queryFn: () => userResource.list.fetch(query),
	}),
	detailOptions: (id) => ({
		queryKey: userResource.detail.queryOptions({ id }).queryKey,
		queryFn: () => userResource.detail.fetch({ id }),
	}),
	label: (user) => `${user.name} — ${user.username}`,
}

export function UserLookupField(props: LookupFieldProps) {
	return <ResourceLookupField adapter={userLookup} placeholder="Cari pengguna..." {...props} />
}
