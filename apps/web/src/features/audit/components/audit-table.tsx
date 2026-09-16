import { createColumnHelper } from '@tanstack/react-table'

import { format } from 'date-fns'

import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { StatusBadge } from '@/components/shared/status-badge'

import type { AuditLogDto } from '../dto/index.ts'

const col = createColumnHelper<DataGridFeatures, AuditLogDto>()

/** Map a domain/CRUD action to a badge tone. Unknown verbs fall back to neutral. */
function actionVariant(action: string): 'success' | 'warning' | 'destructive' | 'info' | 'default' {
	if (action === 'create') return 'success'
	if (action === 'update') return 'info'
	if (action === 'delete' || action === 'void') return 'destructive'
	return 'default'
}

export const auditColumns = [
	col.accessor('timestamp', {
		header: 'Waktu',
		size: 160,
		cell: ({ getValue }) => (
			<span className="whitespace-nowrap text-xs text-muted-foreground">
				{format(new Date(getValue()), 'dd MMM yyyy HH:mm')}
			</span>
		),
	}),
	col.accessor('userName', {
		header: 'Aktor',
		size: 140,
	}),
	col.accessor('module', {
		header: 'Modul',
		size: 130,
		cell: ({ row }) => (
			<span className="text-xs">
				{row.original.module}
				<span className="text-muted-foreground"> / {row.original.entity}</span>
			</span>
		),
	}),
	col.accessor('action', {
		header: 'Aksi',
		size: 110,
		cell: ({ getValue }) => (
			<StatusBadge variant={actionVariant(getValue())}>{getValue()}</StatusBadge>
		),
	}),
	col.accessor('summary', {
		header: 'Ringkasan',
		size: 320,
		cell: ({ getValue }) => <span className="text-xs">{getValue()}</span>,
	}),
]
