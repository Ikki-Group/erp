import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { z } from 'zod'

import { listSearchSchema, useServerTable } from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import type { DateRange } from '@/components/shared/date-range-filter'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { auditResource } from '@/features/audit/api.ts'
import { AuditDetailDialog } from '@/features/audit/components/audit-detail-dialog.tsx'
import { auditColumns } from '@/features/audit/components/audit-table.tsx'
import type { AuditLogDto } from '@/features/audit/dto/index.ts'

const auditSearchSchema = listSearchSchema.extend({
	module: z.string().optional(),
	action: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/settings/audit')({
	validateSearch: auditSearchSchema,
	component: AuditPage,
})

// Modules/actions that record audit entries. Hand-maintained to mirror the
// server vocabulary (apps/server/src/modules/* and the audit `action` verbs) —
// keep in sync when a module or domain verb is added server-side. Unknown values
// still render fine (the badge/label degrade gracefully); they just aren't
// filterable here until added.
// Values MUST match the `module` strings the server writes in audit records
// (the `module:` field in each *.service.ts audit.record call). POS is split
// per sub-entity (pos-order/shift/table/voucher); there is no bare 'pos'.
const MODULE_OPTIONS = [
	{ label: 'Location', value: 'location', description: 'Store and warehouse locations' },
	{ label: 'Material', value: 'material', description: 'Raw materials and ingredients' },
	{ label: 'Supplier', value: 'supplier', description: 'Vendor management' },
	{ label: 'UoM', value: 'uom', description: 'Units of measurement' },
	{ label: 'Menu', value: 'menu', description: 'Menu items and categories' },
	{ label: 'Recipe', value: 'recipe', description: 'Recipe configurations' },
	{ label: 'Inventory', value: 'inventory', description: 'Stock levels and adjustments' },
	{ label: 'POS · Order', value: 'pos-order', description: 'Sales transactions' },
	{ label: 'POS · Shift', value: 'pos-shift', description: 'Staff work sessions' },
	{ label: 'POS · Table', value: 'pos-table', description: 'Table management' },
	{ label: 'POS · Voucher', value: 'pos-voucher', description: 'Discount vouchers' },
	{ label: 'Production', value: 'production', description: 'Manufacturing processes' },
	{ label: 'IAM', value: 'iam', description: 'Users, roles, permissions' },
	{ label: 'Company', value: 'company', description: 'Company settings' },
]

const ACTION_OPTIONS = [
	{ label: 'Create', value: 'create' },
	{ label: 'Update', value: 'update' },
	{ label: 'Delete', value: 'delete' },
	{ label: 'Void', value: 'void' },
	{ label: 'Complete', value: 'complete' },
	{ label: 'Confirm', value: 'confirm' },
]

function AuditPage() {
	const canRead = usePermissionCheck({ permission: 'audit.read' })
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()

	const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
	const [detailId, setDetailId] = useState<number | null>(null)

	const listQuery = useQuery({
		...auditResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			module: search.module,
			action: search.action,
			dateFrom: dateRange?.from.toISOString(),
			dateTo: dateRange?.to.toISOString(),
		}),
		enabled: canRead,
	})

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const { table, globalFilter } = useServerTable({
		data,
		columns: auditColumns as ColumnDef<DataGridFeatures, AuditLogDto>[],
		totalCount,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})

	if (!canRead) {
		return (
			<div className="space-y-6">
				<PageHeader title="Audit Log" description="Riwayat perubahan sistem." />
				<EmptyState
					title="Tidak ada akses"
					description="Anda tidak memiliki izin untuk melihat audit log."
				/>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Audit Log"
				description="Riwayat setiap perubahan yang tercatat di sistem."
			/>

			<DataTable
				table={table}
				recordCount={totalCount}
				isLoading={listQuery.isFetching}
				emptyMessage="Tidak ada entri audit yang cocok."
				onRowClick={(row) => setDetailId(row.id)}
				toolbar={
					<TableToolbar
						searchValue={globalFilter}
						onSearchChange={(value) => table.setGlobalFilter(value)}
						searchPlaceholder="Cari ringkasan..."
						filters={[
							{
								key: 'module',
								label: 'Modul',
								value: search.module,
								onChange: (v) => navigate({ search: { ...search, page: 1, module: v } }),
								options: MODULE_OPTIONS,
								allLabel: 'Semua modul',
							},
							{
								key: 'action',
								label: 'Aksi',
								value: search.action,
								onChange: (v) => navigate({ search: { ...search, page: 1, action: v } }),
								options: ACTION_OPTIONS,
								allLabel: 'Semua aksi',
							},
						]}
						dateRange={{
							key: 'timestamp',
							label: 'Tanggal',
							value: dateRange,
							onChange: (v) => {
								setDateRange(v)
								if (search.page !== 1) navigate({ search: { ...search, page: 1 } })
							},
							placeholder: 'Filter tanggal',
						}}
					/>
				}
			/>

			<AuditDetailDialog entryId={detailId} onClose={() => setDetailId(null)} />
		</div>
	)
}
