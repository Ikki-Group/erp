import { createColumnHelper } from '@tanstack/react-table'

import { createEntityColumns } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'

import { Badge } from '@/components/ui/badge'

import type { UserListItemDto } from '../dto/index.ts'

const col = createColumnHelper<DataGridFeatures, UserListItemDto>()
const fields = createEntityColumns<UserListItemDto>()

export const userColumns = [
	fields.code('username', { header: 'Username', size: 160 }),
	fields.text('name', { header: 'Name', size: 180 }),
	fields.text('email', { header: 'Email', size: 200 }),
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
	fields.booleanStatus('isActive', { header: 'Status', size: 100 }),
]
