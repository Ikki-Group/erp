import { createColumnHelper } from '@tanstack/react-table'

import { createEntityColumns } from '@/components/data-table'
import { TextCell, rightAlignedHeader } from '@/components/data-table/cell'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'

import { Badge } from '@/components/ui/badge'

import type { RoleDto } from '../dto/index.ts'

const col = createEntityColumns<RoleDto>()
const customCol = createColumnHelper<DataGridFeatures, RoleDto>()

export const roleColumns = [
	col.code('code', { header: 'Code', size: 160 }),
	col.text('name', {
		header: 'Name',
		size: 220,
		cell: ({ row, getValue }) => (
			<div className="min-w-0">
				<TextCell value={getValue()} truncate />
				{row.original.description && (
					<TextCell value={row.original.description} truncate muted className="max-w-56 text-xs" />
				)}
			</div>
		),
	}),
	customCol.accessor('permissions', {
		header: rightAlignedHeader('Permissions'),
		size: 120,
		cell: ({ getValue }) => {
			const perms = getValue()
			return (
				<div className="flex justify-end">
					<Badge variant="outline" className="font-normal">
						<span className="font-mono tabular-nums">{perms.length}</span> permissions
					</Badge>
				</div>
			)
		},
	}),
	col.booleanStatus('isSystem', {
		header: 'Type',
		size: 100,
		labels: {
			true: { label: 'System', variant: 'info' },
			false: { label: 'Custom', variant: 'default' },
		},
	}),
]
