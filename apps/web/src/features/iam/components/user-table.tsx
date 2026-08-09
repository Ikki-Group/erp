import { createColumnHelper } from '@tanstack/react-table'

import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { StatusBadge } from '@/components/shared/status-badge'

import type { UserListItemDto } from '../dto/index.ts'

const col = createColumnHelper<DataGridFeatures, UserListItemDto>()

export const userColumns = [
	col.accessor('username', {
		header: 'Username',
		size: 140,
	}),
	col.accessor('name', {
		header: 'Name',
		size: 180,
	}),
	col.accessor('email', {
		header: 'Email',
		size: 200,
	}),
	col.accessor('roleNames', {
		header: 'Roles',
		size: 180,
		cell: ({ getValue }) => {
			const roles = getValue()
			if (!roles.length) return <span className="text-muted-foreground">—</span>
			return <span>{roles.join(', ')}</span>
		},
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
