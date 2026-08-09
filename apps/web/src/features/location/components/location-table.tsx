import { createColumnHelper } from '@tanstack/react-table'

import { type DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { StatusBadge } from '@/components/shared/status-badge'

import type { LocationDto } from '../dto/index.ts'

const col = createColumnHelper<DataGridFeatures, LocationDto>()

export const locationColumns = [
	col.accessor('code', {
		header: 'Code',
		size: 120,
	}),
	col.accessor('name', {
		header: 'Name',
		size: 200,
	}),
	col.accessor('type', {
		header: 'Type',
		size: 120,
		cell: ({ getValue }) => {
			const type = getValue()
			return <span className="capitalize">{type}</span>
		},
	}),
	col.accessor('address', {
		header: 'Address',
		size: 200,
		cell: ({ getValue }) => getValue() ?? <span className="text-muted-foreground">—</span>,
	}),
	col.accessor('phone', {
		header: 'Phone',
		size: 140,
		cell: ({ getValue }) => getValue() ?? <span className="text-muted-foreground">—</span>,
	}),
	col.accessor('isActive', {
		header: 'Status',
		size: 100,
		cell: ({ getValue }) => (
			<StatusBadge variant={getValue() ? 'success' : 'default'}>
				{getValue() ? 'Active' : 'Inactive'}
			</StatusBadge>
		),
	}),
]
