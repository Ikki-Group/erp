import { createColumnHelper } from '@tanstack/react-table'

import { TextCell } from '@/components/data-table/cell'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { StatusBadge } from '@/components/shared/status-badge'

import { Badge } from '@/components/ui/badge'

import type { UserListItemDto } from '../dto/index.ts'

const col = createColumnHelper<DataGridFeatures, UserListItemDto>()

export const userColumns = [
	col.accessor('username', {
		header: 'Username',
		size: 160,
		cell: ({ getValue }) => <TextCell value={getValue()} mono muted />,
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
				// A list with visually-hidden separators so text/copy/screen readers get
				// "Cashier, Warehouse Staff" instead of the badges run together.
				<ul className="flex flex-wrap gap-1">
					{roles.slice(0, 3).map((role, i) => (
						<li key={role}>
							<Badge variant="outline" className="font-normal">
								{role}
							</Badge>
							{i < Math.min(roles.length, 3) - 1 && <span className="sr-only">, </span>}
						</li>
					))}
					{roles.length > 3 && (
						<li>
							<span className="sr-only">, </span>
							<Badge variant="secondary" className="font-normal" title={roles.slice(3).join(', ')}>
								+{roles.length - 3}
							</Badge>
						</li>
					)}
				</ul>
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
