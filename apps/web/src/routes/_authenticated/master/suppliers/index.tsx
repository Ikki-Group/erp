import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { EditIcon, PackageIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { z } from 'zod'

import { createEntityColumns, listSearchSchema, useResourceList } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { formDialog } from '@/components/shared/form-dialog'
import { PermissionGate, usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'
import { useWorkflowAction } from '@/components/shared/workflow-action'

import { Button } from '@/components/ui/button'

import { supplierResource } from '@/features/supplier/api.ts'
import { PricingTable } from '@/features/supplier/components/pricing-table.tsx'
import type { SupplierDto } from '@/features/supplier/dto/index.ts'

const suppliersSearchSchema = listSearchSchema.extend({
	isActive: z.coerce.number().int().min(0).max(1).optional(),
})

export const Route = createFileRoute('/_authenticated/master/suppliers/')({
	validateSearch: suppliersSearchSchema,
	component: SuppliersPage,
})

// ─── Table Columns ───

const col = createEntityColumns<SupplierDto>()

const baseColumns = [
	col.code('code', { header: 'Code', size: 100 }),
	col.text('name', { header: 'Name', size: 200 }),
	col.text('contactPerson', { header: 'Contact', size: 150 }),
	col.text('phone', { header: 'Phone', size: 120 }),
	col.booleanStatus('isActive', { header: 'Status', size: 80 }),
]

// ─── Page Component ───

function SuppliersPage() {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const canRead = usePermissionCheck({ permission: 'supplier.read' })
	const canCreate = usePermissionCheck({ permission: 'supplier.create' })
	const canEdit = usePermissionCheck({ permission: 'supplier.update' })
	const canDelete = usePermissionCheck({ permission: 'supplier.delete' })

	const listQuery = useQuery({
		...supplierResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			isActive: search.isActive,
		}),
		throwOnError: false,
	})
	const removeMut = useMutation(supplierResource.remove.mutationOptions())

	const { run: handleDelete, isPending: deletingSupplier } = useWorkflowAction<SupplierDto>({
		availability: () => canDelete,
		confirmation: (supplier) => ({
			title: 'Delete supplier?',
			description: `Remove "${supplier.name}" (${supplier.code}) from the supplier list? Existing records are retained.`,
			confirmLabel: 'Delete',
			variant: 'destructive',
		}),
		execute: (supplier) => removeMut.mutateAsync({ id: supplier.id }),
		successMessage: 'Supplier deleted successfully.',
	})

	const handlePricing = useCallback(
		async (supplier: SupplierDto) => {
			if (!canRead) return
			await formDialog({
				title: 'Material Pricing',
				description: `Manage material pricing for ${supplier.name}.`,
				className: 'max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-4xl',
				// oxlint-disable-next-line react/no-unstable-nested-components
				content: ({ close }) => (
					<div className="min-w-0 space-y-4 pt-4">
						<PricingTable
							supplierId={supplier.id}
							permissions={{ read: canRead, create: canCreate, update: canEdit, delete: canDelete }}
						/>
						<div className="flex justify-end">
							<Button size="sm" onClick={() => close(true)}>
								Done
							</Button>
						</div>
					</div>
				),
			})
		},
		[canRead, canCreate, canEdit, canDelete],
	)

	// ─── Columns with actions ───

	const actionsColumn = useMemo(
		() =>
			col.actions({
				// oxlint-disable-next-line react/no-unstable-nested-components
				getItems: (supplier) => [
					canEdit && {
						label: 'Edit',
						icon: <EditIcon className="size-4" />,
						onClick: () =>
							navigate({
								to: '/master/suppliers/$supplierId',
								params: { supplierId: String(supplier.id) },
							}),
					},
					canRead && {
						label: 'Pricing',
						icon: <PackageIcon className="size-4" />,
						onClick: () => handlePricing(supplier),
					},
					canDelete && {
						label: 'Delete',
						icon: <TrashIcon className="size-4" />,
						onClick: () => handleDelete(supplier),
						variant: 'destructive' as const,
						disabled: deletingSupplier,
					},
				],
			}),
		[canRead, canEdit, canDelete, deletingSupplier, handleDelete, handlePricing, navigate],
	)

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, SupplierDto>[],
		[actionsColumn],
	)

	const list = useResourceList({
		query: listQuery,
		columns,
		search,
		onSearchChange: (next) => navigate({ search: next }),
		hasFilters: (value) => value.isActive !== undefined,
	})

	return (
		<EntityListPage
			title="Suppliers"
			description="Manage suppliers and their material pricing."
			createAction={
				<PermissionGate permission="supplier.create">
					<Button size="sm" onClick={() => navigate({ to: '/master/suppliers/new' })}>
						<PlusIcon className="size-4" />
						Add Supplier
					</Button>
				</PermissionGate>
			}
			list={list}
			emptyState={{
				title: 'No suppliers yet',
				description: 'Get started by creating your first supplier.',
			}}
			emptyMessage="No suppliers match your filters."
			toolbar={
				<TableToolbar
					searchValue={list.globalFilter}
					onSearchChange={(q) => list.setFilters({ q: q.trim() || undefined })}
					searchPlaceholder="Search suppliers..."
					filters={[
						{
							key: 'isActive',
							label: 'Status',
							value: search.isActive?.toString(),
							onChange: (value) =>
								list.setFilters({ isActive: value !== undefined ? Number(value) : undefined }),
							options: [
								{ label: 'Active', value: '1' },
								{ label: 'Inactive', value: '0' },
							],
							allLabel: 'All status',
						},
					]}
				/>
			}
		/>
	)
}
