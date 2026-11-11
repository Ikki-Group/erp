import { Building2Icon, WarehouseIcon } from 'lucide-react'

import { createEntityColumns } from '@/components/data-table'

import type { LocationDto } from '../dto/index.ts'

const col = createEntityColumns<LocationDto>()

export const locationColumns = [
	col.code('code', { header: 'Code', size: 120 }),
	col.text('name', { header: 'Name', size: 200 }),
	col.text('type', {
		header: 'Type',
		size: 120,
		cell: ({ getValue }) => {
			const type = getValue()
			const Icon = type === 'store' ? Building2Icon : WarehouseIcon
			return (
				<div className="flex items-center gap-1.5">
					<Icon className="size-3.5 text-muted-foreground" />
					<span className="text-sm">{type === 'store' ? 'Store' : 'Warehouse'}</span>
				</div>
			)
		},
	}),
	col.text('address', { header: 'Address', size: 250, cellProps: { muted: true } }),
	col.text('phone', {
		header: 'Phone',
		size: 150,
		cellProps: { truncate: false, muted: true },
	}),
	col.booleanStatus('isActive', { header: 'Status', size: 100 }),
]
