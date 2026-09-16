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

import { roleResource } from '@/features/iam/api.ts'
import { roleColumns } from '@/features/iam/components/role-table.tsx'
import type { RoleDto } from '@/features/iam/dto/index.ts'

export const Route = createFileRoute('/_authenticated/settings/roles/')({
	validateSearch: listSearchSchema,
	component: RolesPage,
})

function RolesPage() {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const canEdit = usePermissionCheck({ permission: 'iam.update' })
	const canDelete = usePermissionCheck({ permission: 'iam.delete' })

	const listQuery = useQuery(
		roleResource.list.queryOptions({ page: search.page, limit: search.pageSize, q: search.q }),
	)
	const removeMut = useMutation(roleResource.remove.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const handleDelete = useCallback(
		async (role: RoleDto) => {
			await confirm({
				title: 'Delete role?',
				description: `This will permanently delete "${role.name}". Users assigned to this role will lose its permissions.`,
				confirmLabel: 'Delete',
				variant: 'destructive',
				onConfirm: async () => {
					await removeMut.mutateAsync({ id: role.id })
					toast.add({ title: 'Role deleted.', type: 'success' })
				},
			})
		},
		[removeMut],
	)

	const actionsColumn = useMemo(() => {
		const col = createColumnHelper<DataGridFeatures, RoleDto>()
		return col.display({
			id: 'actions',
			size: 60,
			// oxlint-disable-next-line react/no-unstable-nested-components
			cell: ({ row }) => {
				if (row.original.isSystem) return null
				const items = []
				if (canEdit) {
					items.push({
						label: 'Edit',
						icon: <EditIcon className="size-4" />,
						onClick: () =>
							navigate({
								to: '/settings/roles/$roleId',
								params: { roleId: String(row.original.id) },
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
		() => [...roleColumns, actionsColumn] as ColumnDef<DataGridFeatures, RoleDto>[],
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
				title="Roles"
				description="Manage roles and their permission sets."
				actions={
					<PermissionGate permission="iam.create">
						<Button size="sm" onClick={() => navigate({ to: '/settings/roles/new' })}>
							<PlusIcon className="size-4" />
							Add Role
						</Button>
					</PermissionGate>
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No roles yet"
					description="Get started by creating your first role."
					action={
						<PermissionGate permission="iam.create">
							<Button size="sm" onClick={() => navigate({ to: '/settings/roles/new' })}>
								<PlusIcon className="size-4" />
								Add Role
							</Button>
						</PermissionGate>
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No roles match your search."
					toolbar={
						<TableToolbar
							searchValue={globalFilter}
							onSearchChange={(value) => table.setGlobalFilter(value)}
							searchPlaceholder="Search roles..."
						/>
					}
				/>
			)}
		</div>
	)
}
