import { createColumnHelper } from '@tanstack/react-table'

import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { StatusBadge } from '@/components/shared/status-badge'

import { Badge } from '@/components/ui/badge'

import type { RoleDto } from '../dto/index.ts'

const col = createColumnHelper<DataGridFeatures, RoleDto>()

export const roleColumns = [
	col.accessor('code', {
		header: 'Code',
		size: 160,
		cell: ({ getValue }) => <code className="text-xs text-muted-foreground">{getValue()}</code>,
	}),
	col.accessor('name', {
		header: 'Name',
		size: 200,
	}),
	col.accessor('permissions', {
		header: 'Permissions',
		size: 120,
		cell: ({ getValue }) => {
			const perms = getValue()
			return (
				<Badge variant="outline" className="font-normal">
					{perms.length} permissions
				</Badge>
			)
		},
	}),
	col.accessor('isSystem', {
		header: 'Type',
		size: 100,
		cell: ({ getValue }) => (
			<StatusBadge variant={getValue() ? 'info' : 'default'}>
				{getValue() ? 'System' : 'Custom'}
			</StatusBadge>
		),
	}),
]
