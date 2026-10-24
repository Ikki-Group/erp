import { ResourceLookupField } from '@/lib/form/resource-lookup-field'
import type { LookupFieldProps } from '@/lib/form/resource-lookup-field'
import type { ResourceLookupAdapter } from '@/lib/form/use-resource-lookup'

import { categoryResource } from '../api'
import type { MaterialCategoryDto } from '../dto'

const categoryLookup: ResourceLookupAdapter<MaterialCategoryDto> = {
	listOptions: (query) => categoryResource.list.queryOptions(query),
	detailOptions: (id) => categoryResource.detail.queryOptions({ id }),
	label: (category) => category.name,
}

export function CategoryLookupField(props: LookupFieldProps) {
	return (
		<ResourceLookupField adapter={categoryLookup} placeholder="Search categories..." {...props} />
	)
}
