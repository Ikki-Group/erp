import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { EditIcon, PlusIcon, TrashIcon } from 'lucide-react'

import { listSearchSchema, useServerTable } from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { ActionMenu } from '@/components/shared/action-menu'
import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { StatusBadge } from '@/components/shared/status-badge'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { tableResource } from '@/features/pos/api.ts'
import type { TableDto } from '@/features/pos/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/pos/tables/')({
	validateSearch: listSearchSchema,
	component: TablesPage,
})

// ─── Table Columns ───

const col = createColumnHelper<DataGridFeatures, TableDto>()

const baseColumns = [
	col.accessor('number', {
		header: 'Number',
		size: 120,
	}),
	col.accessor('capacity', {
		header: 'Capacity',
		size: 100,
		cell: ({ getValue }) => `${getValue()} seats`,
	}),
	col.accessor('status', {
		header: 'Status',
		size: 120,
		cell: ({ getValue }) => {
			const status = getValue()
			const variant =
				status === 'available' ? 'success' : status === 'occupied' ? 'warning' : 'default'
			return <StatusBadge variant={variant}>{status}</StatusBadge>
		},
	}),
	col.accessor('isActive', {
		header: 'Active',
		size: 80,
		cell: ({ getValue }) => (
			<StatusBadge variant={getValue() ? 'success' : 'default'}>
				{getValue() ? 'Active' : 'Inactive'}
			</StatusBadge>
		),
	}),
]

// ─── Page Component ───

function TablesPage() {
	const { activeLocation } = useLocationContext()
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const locationId = activeLocation?.id
	const canManage = usePermissionCheck({ permission: 'table.manage' })

	const listQuery = useQuery({
		...tableResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			locationId: locationId!,
		}),
		enabled: !!locationId,
	})

	const removeMut = useMutation(tableResource.remove.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const handleDelete = useCallback(
		async (table: TableDto) => {
			await confirm({
				title: 'Delete table?',
				description: `This will permanently delete table "${table.number}". This action cannot be undone.`,
				confirmLabel: 'Delete',
				variant: 'destructive',
				onConfirm: async () => {
					await removeMut.mutateAsync({ id: table.id })
					toast.add({ title: 'Table deleted successfully.', type: 'success' })
				},
			})
		},
		[removeMut],
	)

	// ─── Columns with actions ───

	const actionsColumn = useMemo(() => {
		return col.display({
			id: 'actions',
			size: 60,
			// oxlint-disable-next-line react/no-unstable-nested-components
			cell: ({ row }) => {
				if (!canManage) return null
				return (
					<ActionMenu
						items={[
							{
								label: 'Edit',
								icon: <EditIcon className="size-4" />,
								onClick: () =>
									navigate({
										to: '/pos/tables/$tableId',
										params: { tableId: String(row.original.id) },
									}),
							},
							{
								label: 'Delete',
								icon: <TrashIcon className="size-4" />,
								onClick: () => handleDelete(row.original),
								variant: 'destructive' as const,
							},
						]}
					/>
				)
			},
		})
	}, [canManage, handleDelete, navigate])

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, TableDto>[],
		[actionsColumn],
	)

	const { table, globalFilter } = useServerTable({
		data,
		columns,
		totalCount,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})

	const isEmpty = !listQuery.isLoading && data.length === 0 && !globalFilter

	if (!locationId) {
		return (
			<div className="space-y-6">
				<PageHeader title="Tables" description="Manage dine-in tables for this location." />
				<EmptyState
					title="No location selected"
					description="Please select a location to manage tables."
				/>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Tables"
				description="Manage dine-in tables for this location."
				actions={
					canManage ? (
						<Button size="sm" onClick={() => navigate({ to: '/pos/tables/new' })}>
							<PlusIcon className="size-4" />
							Add Table
						</Button>
					) : undefined
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No tables yet"
					description="Get started by creating your first table."
					action={
						canManage ? (
							<Button size="sm" onClick={() => navigate({ to: '/pos/tables/new' })}>
								<PlusIcon className="size-4" />
								Add Table
							</Button>
						) : undefined
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No tables match your search."
					toolbar={
						<TableToolbar
							searchValue={globalFilter}
							onSearchChange={(value) => table.setGlobalFilter(value)}
							searchPlaceholder="Search tables..."
						/>
					}
				/>
			)}
		</div>
	)
}
