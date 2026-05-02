import { createColumnHelper } from '@tanstack/react-table'

import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { statusColumn, textColumn } from '@/components/reui/data-grid/data-grid-columns'

import type { AuditLogDto } from '../dto'

const ch = createColumnHelper<AuditLogDto>()

const actionLabels: Record<string, string> = {
	create: 'Create',
	update: 'Update',
	delete: 'Delete',
	login: 'Login',
	logout: 'Logout',
	export: 'Export',
	import: 'Import',
	other: 'Other',
}

const actionVariants: Record<string, 'success' | 'warning' | 'destructive' | 'primary' | 'secondary'> = {
	create: 'success',
	update: 'warning',
	delete: 'destructive',
	login: 'primary',
	logout: 'secondary',
	export: 'success',
	import: 'warning',
	other: 'secondary',
}

export const auditLogColumns = [
	ch.accessor('action', {
		header: 'Aksi',
		size: 100,
		cell: (info) => {
			const value = info.getValue()
			const label = actionLabels[value] || value
			const variant = actionVariants[value] || 'secondary'
			return <BadgeDot variant={variant}>{label}</BadgeDot>
		},
	}),
	ch.accessor('entityType', textColumn({ header: 'Entity Type', size: 150 })),
	ch.accessor('description', textColumn({ header: 'Deskripsi', size: 300 })),
	ch.accessor(
		'actionAt',
		textColumn({
			header: 'Waktu',
			size: 180,
			render: (value: Date) => new Date(value).toLocaleString('id-ID'),
		}),
	),
	ch.accessor('userId', textColumn({ header: 'User ID', size: 100 })),
	ch.accessor('ipAddress', textColumn({ header: 'IP Address', size: 150 })),
]
