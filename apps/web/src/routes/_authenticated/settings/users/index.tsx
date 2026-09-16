import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { EditIcon, PlusIcon, UserXIcon } from 'lucide-react'

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

import { userResource } from '@/features/iam/api.ts'
import { userColumns } from '@/features/iam/components/user-table.tsx'
import type { UserListItemDto } from '@/features/iam/dto/index.ts'

export const Route = createFileRoute('/_authenticated/settings/users/')({
	validateSearch: listSearchSchema,
	component: UsersPage,
})

function UsersPage() {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const canEdit = usePermissionCheck({ permission: 'iam.update' })
	const canDeactivate = usePermissionCheck({ permission: 'iam.delete' })

	const listQuery = useQuery(
		userResource.list.queryOptions({ page: search.page, limit: search.pageSize, q: search.q }),
	)
	const deactivateMut = useMutation(userResource.deactivate.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const handleDeactivate = useCallback(
		async (user: UserListItemDto) => {
			await confirm({
				title: 'Deactivate user?',
				description: `This will deactivate "${user.name}". They will no longer be able to log in.`,
				confirmLabel: 'Deactivate',
				variant: 'destructive',
				onConfirm: async () => {
					await deactivateMut.mutateAsync({ id: user.id })
					toast.add({ title: 'User deactivated.', type: 'success' })
				},
			})
		},
		[deactivateMut],
	)

	const actionsColumn = useMemo(() => {
		const col = createColumnHelper<DataGridFeatures, UserListItemDto>()
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
								to: '/settings/users/$userId',
								params: { userId: String(row.original.id) },
							}),
					})
				}
				if (canDeactivate) {
					items.push({
						label: 'Deactivate',
						icon: <UserXIcon className="size-4" />,
						onClick: () => handleDeactivate(row.original),
						variant: 'destructive' as const,
					})
				}
				if (items.length === 0) return null
				return <ActionMenu items={items} />
			},
		})
	}, [canEdit, canDeactivate, handleDeactivate, navigate])

	const columns = useMemo(
		() => [...userColumns, actionsColumn] as ColumnDef<DataGridFeatures, UserListItemDto>[],
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
				title="Users"
				description="Manage user accounts and their role assignments."
				actions={
					<PermissionGate permission="iam.create">
						<Button size="sm" onClick={() => navigate({ to: '/settings/users/new' })}>
							<PlusIcon className="size-4" />
							Add User
						</Button>
					</PermissionGate>
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No users yet"
					description="Get started by creating the first user account."
					action={
						<PermissionGate permission="iam.create">
							<Button size="sm" onClick={() => navigate({ to: '/settings/users/new' })}>
								<PlusIcon className="size-4" />
								Add User
							</Button>
						</PermissionGate>
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No users match your search."
					toolbar={
						<TableToolbar
							searchValue={globalFilter}
							onSearchChange={(value) => table.setGlobalFilter(value)}
							searchPlaceholder="Search users..."
						/>
					}
				/>
			)}
		</div>
	)
}
