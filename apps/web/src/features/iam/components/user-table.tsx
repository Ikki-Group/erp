import { createColumnHelper } from '@tanstack/react-table'

import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { StatusBadge } from '@/components/shared/status-badge'

import { Badge } from '@/components/ui/badge'

import type { UserListItemDto } from '../dto/index.ts'

const col = createColumnHelper<DataGridFeatures, UserListItemDto>()

export const userColumns = [
	col.accessor('username', {
		header: 'Username',
		size: 160,
		cell: ({ getValue }) => <code className="text-xs text-muted-foreground">{getValue()}</code>,
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
			if (!roles.length) return <span className="text-muted-foreground">No roles</span>
			return (
				<div className="flex flex-wrap gap-1">
					{roles.slice(0, 3).map((role) => (
						<Badge key={role} variant="outline" className="font-normal">
							{role}
						</Badge>
					))}
					{roles.length > 3 && (
						<Badge variant="secondary" className="font-normal">
							+{roles.length - 3}
						</Badge>
					)}
				</div>
			)
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
