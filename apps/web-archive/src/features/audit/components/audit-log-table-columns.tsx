import type { ColumnDef } from '@tanstack/react-table'

import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { CellDate, CellText } from '@/components/reui/data-grid/data-grid-cell'

import type { AuditLogDto } from '../dto'

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

const actionVariants: Record<
	string,
	'success' | 'warning' | 'destructive' | 'default' | 'secondary'
> = {
	create: 'success',
	update: 'warning',
	delete: 'destructive',
	login: 'default',
	logout: 'secondary',
	export: 'success',
	import: 'warning',
	other: 'secondary',
}

export const auditLogColumns: ColumnDef<AuditLogDto>[] = [
	{
		accessorKey: 'action',
		header: 'Aksi',
		size: 100,
		cell: ({ row }) => {
			const value = row.original.action
			const label = actionLabels[value] || value
			const variant = actionVariants[value] || 'secondary'
			return <BadgeDot variant={variant}>{label}</BadgeDot>
		},
	},
	{
		accessorKey: 'entityType',
		header: 'Entity Type',
		size: 150,
		cell: ({ row }) => <CellText value={row.original.entityType} />,
	},
	{
		accessorKey: 'description',
		header: 'Deskripsi',
		size: 300,
		cell: ({ row }) => <CellText value={row.original.description} />,
	},
	{
		accessorKey: 'actionAt',
		header: 'Waktu',
		size: 180,
		cell: ({ row }) => <CellDate value={row.original.actionAt} />,
	},
	{
		accessorKey: 'userId',
		header: 'User ID',
		size: 100,
		cell: ({ row }) => <CellText value={row.original.userId} />,
	},
	{
		accessorKey: 'ipAddress',
		header: 'IP Address',
		size: 150,
		cell: ({ row }) => <CellText value={row.original.ipAddress} />,
	},
]
