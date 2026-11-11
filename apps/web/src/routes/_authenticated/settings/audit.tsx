import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { createEntityColumns, useResourceList } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { PageError } from '@/components/shared/page-error'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { auditResource } from '@/features/audit/api.ts'
import { auditSearchSchema, toAuditListQuery } from '@/features/audit/audit-search'
import { AuditDetailDialog } from '@/features/audit/components/audit-detail-dialog.tsx'
import { auditColumns } from '@/features/audit/components/audit-table.tsx'
import type { AuditLogDto } from '@/features/audit/dto/index.ts'

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
	if (!canRead)
		return (
			<PageError
				title="Tidak ada akses"
				message="Anda tidak memiliki izin untuk melihat audit log."
			/>
		)
	return <AuditList />
}

const col = createEntityColumns<AuditLogDto>()

function AuditList() {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const listQuery = useQuery({
		...auditResource.list.queryOptions(toAuditListQuery(search)),
		throwOnError: false,
	})
	const columns = useMemo(
		() =>
			[
				...auditColumns,
				col.actions({
					// oxlint-disable-next-line react/no-unstable-nested-components -- action-item factory, not a component
					getItems: (entry) => [
						{
							label: 'Detail',
							onClick: () => navigate({ search: (prev) => ({ ...prev, id: entry.id }) }),
						},
					],
				}),
			] as ColumnDef<DataGridFeatures, AuditLogDto>[],
		[navigate],
	)
	const list = useResourceList({
		query: listQuery,
		columns,
		search,
		onSearchChange: (next) => navigate({ search: next }),
		hasFilters: (value) => !!(value.module || value.action || value.dateFrom || value.dateTo),
	})
	return (
		<>
			<EntityListPage
				title="Audit Log"
				description="Riwayat setiap perubahan yang tercatat di sistem."
				list={list}
				emptyState={{
					title: 'Belum ada entri audit',
					description: 'Perubahan sistem yang tercatat akan muncul di sini.',
				}}
				emptyMessage="Tidak ada entri audit yang cocok."
				onRowClick={(row) => navigate({ search: (prev) => ({ ...prev, id: row.id }) })}
				toolbar={
					<TableToolbar
						searchValue={list.globalFilter}
						onSearchChange={(q) => list.setFilters({ q: q.trim() || undefined })}
						searchPlaceholder="Cari ringkasan..."
						filters={[
							{
								key: 'module',
								label: 'Modul',
								value: search.module,
								onChange: (module) => list.setFilters({ module }),
								options: MODULE_OPTIONS,
								allLabel: 'Semua modul',
							},
							{
								key: 'action',
								label: 'Aksi',
								value: search.action,
								onChange: (action) => list.setFilters({ action }),
								options: ACTION_OPTIONS,
								allLabel: 'Semua aksi',
							},
						]}
						dateRange={{
							key: 'timestamp',
							label: 'Tanggal',
							value:
								search.dateFrom && search.dateTo
									? { from: new Date(search.dateFrom), to: new Date(search.dateTo) }
									: undefined,
							onChange: (range) =>
								list.setFilters({
									dateFrom: range?.from.toISOString(),
									dateTo: range?.to.toISOString(),
								}),
							placeholder: 'Filter tanggal',
						}}
					/>
				}
			/>
			<AuditDetailDialog
				entryId={search.id ?? null}
				onClose={() => navigate({ search: (prev) => ({ ...prev, id: undefined }) })}
			/>
		</>
	)
}
