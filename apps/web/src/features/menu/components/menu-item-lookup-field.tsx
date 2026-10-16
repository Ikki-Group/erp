import { useMemo } from 'react'

import { ResourceLookupField } from '@/lib/form/resource-lookup-field'
import type { LookupFieldProps } from '@/lib/form/resource-lookup-field'
import type { ResourceLookupAdapter } from '@/lib/form/use-resource-lookup'

import { menuItemResource } from '../api'
import type { MenuItemDto } from '../dto'

/** The menu list requires a location; the selected item resolves by canonical detail. */
export function createMenuItemLookup(locationId: number): ResourceLookupAdapter<MenuItemDto> {
	return {
		listOptions: (query) => menuItemResource.list.queryOptions({ ...query, locationId }),
		detailOptions: (id) => menuItemResource.detail.queryOptions({ id }),
		label: (item) => `${item.sku} — ${item.name}`,
	}
}

interface MenuItemLookupFieldProps extends LookupFieldProps {
	locationId: number
}

export function MenuItemLookupField({ locationId, ...props }: MenuItemLookupFieldProps) {
	const adapter = useMemo(() => createMenuItemLookup(locationId), [locationId])
	return <ResourceLookupField adapter={adapter} placeholder="Search menu items..." {...props} />
}
