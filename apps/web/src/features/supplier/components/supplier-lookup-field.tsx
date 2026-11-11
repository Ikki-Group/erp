import { ResourceLookupField } from '@/lib/form/resource-lookup-field'
import type { LookupFieldProps } from '@/lib/form/resource-lookup-field'
import type { ResourceLookupAdapter } from '@/lib/form/use-resource-lookup'

import { supplierResource } from '../api'
import type { SupplierDto } from '../dto'

const supplierLookup: ResourceLookupAdapter<SupplierDto> = {
	listOptions: (query) => supplierResource.list.queryOptions(query),
	detailOptions: (id) => supplierResource.detail.queryOptions({ id }),
	label: (supplier) => `${supplier.code} — ${supplier.name}`,
}

const activeSupplierLookup: ResourceLookupAdapter<SupplierDto> = {
	...supplierLookup,
	listOptions: (query) => supplierResource.list.queryOptions({ ...query, isActive: 1 }),
}

interface SupplierLookupFieldProps extends LookupFieldProps {
	/** Purchasing only offers active suppliers; existing inactive selections still resolve by ID. */
	activeOnly?: boolean
}

export function SupplierLookupField({ activeOnly = true, ...props }: SupplierLookupFieldProps) {
	return (
		<ResourceLookupField
			adapter={activeOnly ? activeSupplierLookup : supplierLookup}
			placeholder="Search suppliers..."
			{...props}
		/>
	)
}
