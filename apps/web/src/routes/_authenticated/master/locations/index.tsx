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
import { PermissionGate, usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { locationResource } from '@/features/location/api.ts'
import { locationColumns } from '@/features/location/components/location-table.tsx'
import type { LocationDto } from '@/features/location/dto/index.ts'

export const Route = createFileRoute('/_authenticated/master/locations/')({
	validateSearch: listSearchSchema,
	component: LocationsPage,
})

function LocationsPage() {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const canEdit = usePermissionCheck({ permission: 'location.update' })
	const canDelete = usePermissionCheck({ permission: 'location.delete' })

	const listQuery = useQuery(
		locationResource.list.queryOptions({ page: search.page, limit: search.pageSize, q: search.q }),
	)
	const removeMut = useMutation(locationResource.remove.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const handleDelete = useCallback(
		async (location: LocationDto) => {
			await confirm({
				title: 'Delete location?',
				description: `This will permanently delete "${location.name}". This action cannot be undone.`,
				confirmLabel: 'Delete',
				variant: 'destructive',
				onConfirm: async () => {
					await removeMut.mutateAsync({ id: location.id })
					toast.add({ title: 'Location deleted successfully.', type: 'success' })
				},
			})
		},
		[removeMut],
	)

	const actionsColumn = useMemo(() => {
		const col = createColumnHelper<DataGridFeatures, LocationDto>()
		return col.display({
			id: 'actions',
			size: 60,
			cell: ({ row }) => {
				const items = []
				if (canEdit) {
					items.push({
						label: 'Edit',
						icon: <EditIcon className="size-4" />,
						onClick: () =>
							navigate({
								to: '/master/locations/$locationId',
								params: { locationId: String(row.original.id) },
							}),
					})
				}
				if (canDelete) {
					items.push({
						label: 'Delete',
						icon: <TrashIcon className="size-4" />,
						onClick: () => handleDelete(row.original),
						variant: 'destructive' as const,
					})
				}
				if (items.length === 0) return null
				return <ActionMenu items={items} />
			},
		})
	}, [canEdit, canDelete, handleDelete, navigate])

	const columns = useMemo(
		() => [...locationColumns, actionsColumn] as ColumnDef<DataGridFeatures, LocationDto>[],
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

	return (
		<div className="space-y-6">
			<PageHeader
				title="Locations"
				description="Manage stores and warehouses in your organization."
				actions={
					<PermissionGate permission="location.create">
						<Button size="sm" onClick={() => navigate({ to: '/master/locations/new' })}>
							<PlusIcon className="size-4" />
							Add Location
						</Button>
					</PermissionGate>
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No locations yet"
					description="Get started by creating your first location."
					action={
						<PermissionGate permission="location.create">
							<Button size="sm" onClick={() => navigate({ to: '/master/locations/new' })}>
								<PlusIcon className="size-4" />
								Add Location
							</Button>
						</PermissionGate>
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No locations match your search."
					onRowClick={
						canEdit
							? (row) =>
									navigate({
										to: '/master/locations/$locationId',
										params: { locationId: String(row.id) },
									})
							: undefined
					}
					toolbar={
						<TableToolbar
							searchValue={globalFilter}
							onSearchChange={(value) => table.setGlobalFilter(value)}
							searchPlaceholder="Search locations..."
						/>
					}
				/>
			)}
		</div>
	)
}
