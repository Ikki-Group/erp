import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { EditIcon, PackageIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { z } from 'zod'

import { listSearchSchema, useServerTable } from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { ActionMenu } from '@/components/shared/action-menu'
import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/empty-state'
import { formDialog } from '@/components/shared/form-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { PermissionGate, usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

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

const col = createColumnHelper<DataGridFeatures, SupplierDto>()

const baseColumns = [
	col.accessor('code', {
		header: 'Code',
		size: 100,
	}),
	col.accessor('name', {
		header: 'Name',
		size: 200,
	}),
	col.accessor('contactPerson', {
		header: 'Contact',
		size: 150,
		cell: ({ getValue }) => getValue() ?? '—',
	}),
	col.accessor('phone', {
		header: 'Phone',
		size: 120,
		cell: ({ getValue }) => getValue() ?? '—',
	}),
	col.accessor('isActive', {
		header: 'Status',
		size: 80,
		cell: ({ getValue }) => (
			<Badge variant={getValue() ? 'default' : 'outline'}>
				{getValue() ? 'Active' : 'Inactive'}
			</Badge>
		),
	}),
]

// ─── Page Component ───

function SuppliersPage() {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const canEdit = usePermissionCheck({ permission: 'supplier.update' })
	const canDelete = usePermissionCheck({ permission: 'supplier.delete' })

	const listQuery = useQuery(
		supplierResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			isActive: search.isActive,
		}),
	)
	const removeMut = useMutation(supplierResource.remove.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const handleDelete = useCallback(
		async (supplier: SupplierDto) => {
			await confirm({
				title: 'Delete supplier?',
				description: `This will permanently delete "${supplier.name}" (${supplier.code}). This action cannot be undone.`,
				confirmLabel: 'Delete',
				variant: 'destructive',
				onConfirm: async () => {
					await removeMut.mutateAsync({ id: supplier.id })
					toast.add({ title: 'Supplier deleted successfully.', type: 'success' })
				},
			})
		},
		[removeMut],
	)

	const handlePricing = useCallback(async (supplier: SupplierDto) => {
		await formDialog({
			title: 'Material Pricing',
			description: `Manage material pricing for ${supplier.name}.`,
			// oxlint-disable-next-line react/no-unstable-nested-components
			content: ({ close }) => (
				<div className="space-y-4">
					<PricingTable supplierId={supplier.id} />
					<div className="flex justify-end">
						<Button size="sm" onClick={() => close(true)}>
							Done
						</Button>
					</div>
				</div>
			),
		})
	}, [])

	// ─── Columns with actions ───

	const actionsColumn = useMemo(() => {
		return col.display({
			id: 'actions',
			size: 60,
			// oxlint-disable-next-line react/no-unstable-nested-components
			cell: ({ row }) => {
				const items = []
				if (canEdit) {
					items.push({
						label: 'Edit',
						icon: <EditIcon className="size-4" />,
						onClick: () =>
							navigate({
								to: '/master/suppliers/$supplierId',
								params: { supplierId: String(row.original.id) },
							}),
					})
				}
				items.push({
					label: 'Pricing',
					icon: <PackageIcon className="size-4" />,
					onClick: () => handlePricing(row.original),
				})
				if (canDelete) {
					items.push({
						label: 'Delete',
						icon: <TrashIcon className="size-4" />,
						onClick: () => handleDelete(row.original),
						variant: 'destructive' as const,
					})
				}
				return <ActionMenu items={items} />
			},
		})
	}, [canEdit, canDelete, handleDelete, handlePricing, navigate])

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, SupplierDto>[],
		[actionsColumn],
	)

	const { table, globalFilter } = useServerTable({
		data,
		columns,
		totalCount,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})

	const isEmpty =
		!listQuery.isLoading && data.length === 0 && !globalFilter && search.isActive === undefined

	return (
		<div className="space-y-6">
			<PageHeader
				title="Suppliers"
				description="Manage suppliers and their material pricing."
				actions={
					<PermissionGate permission="supplier.create">
						<Button size="sm" onClick={() => navigate({ to: '/master/suppliers/new' })}>
							<PlusIcon className="size-4" />
							Add Supplier
						</Button>
					</PermissionGate>
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No suppliers yet"
					description="Get started by creating your first supplier."
					action={
						<PermissionGate permission="supplier.create">
							<Button size="sm" onClick={() => navigate({ to: '/master/suppliers/new' })}>
								<PlusIcon className="size-4" />
								Add Supplier
							</Button>
						</PermissionGate>
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No suppliers match your filters."
					toolbar={
						<TableToolbar
							searchValue={globalFilter}
							onSearchChange={(value) => table.setGlobalFilter(value)}
							searchPlaceholder="Search suppliers..."
							filters={[
								{
									key: 'isActive',
									label: 'Status',
									value: search.isActive?.toString(),
									onChange: (v) =>
										navigate({
											search: {
												...search,
												page: 1,
												isActive: v !== undefined ? Number(v) : undefined,
											},
										}),
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
			)}
		</div>
	)
}
