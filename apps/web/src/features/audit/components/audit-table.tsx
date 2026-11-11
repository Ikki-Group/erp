import { createEntityColumns, TextCell } from '@/components/data-table'
import { StatusBadge } from '@/components/shared/status-badge'

import type { AuditLogDto } from '../dto/index.ts'

const col = createEntityColumns<AuditLogDto>()

/** Map a domain/CRUD action to a badge tone. Unknown verbs fall back to neutral. */
function actionVariant(action: string): 'success' | 'warning' | 'destructive' | 'info' | 'default' {
	if (action === 'create') return 'success'
	if (action === 'update') return 'info'
	if (action === 'delete' || action === 'void') return 'destructive'
	return 'default'
}

export const auditColumns = [
	col.date('timestamp', {
		header: 'Waktu',
		size: 170,
		enableSorting: false,
		cellProps: { withTime: true },
	}),
	col.text('userName', { header: 'Aktor', size: 140, enableSorting: false }),
	col.text('module', {
		header: 'Modul',
		size: 130,
		enableSorting: false,
		cell: ({ row }) => (
			<TextCell
				value={
					<>
						{row.original.module}
						<span className="text-muted-foreground"> / {row.original.entity}</span>
					</>
				}
				truncate
			/>
		),
	}),
	col.text('action', {
		header: 'Aksi',
		size: 110,
		enableSorting: false,
		cell: ({ getValue }) => (
			<StatusBadge variant={actionVariant(getValue())}>{getValue()}</StatusBadge>
		),
	}),
	col.text('summary', {
		header: 'Ringkasan',
		size: 320,
		enableSorting: false,
	}),
]
