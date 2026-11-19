import { Building2Icon, WarehouseIcon } from 'lucide-react'

import { createEntityColumns } from '@/components/data-table'

import type { LocationDto } from '../dto/index.ts'

const col = createEntityColumns<LocationDto>()

export const locationColumns = [
	col.code('code', { header: 'Kode', size: 120 }),
	col.text('name', { header: 'Nama', size: 200 }),
	col.text('type', {
		header: 'Tipe',
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
	col.text('address', { header: 'Alamat', size: 250, cellProps: { muted: true } }),
	col.text('phone', {
		header: 'Telepon',
		size: 150,
		cellProps: { truncate: false, muted: true },
	}),
	col.booleanStatus('isActive', { header: 'Status', size: 100 }),
]
