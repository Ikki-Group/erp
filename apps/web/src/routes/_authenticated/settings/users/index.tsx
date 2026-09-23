import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { EditIcon, EyeIcon, KeyRoundIcon, PlusIcon, UserXIcon } from 'lucide-react'
import { z } from 'zod'

import { listSearchSchema, useServerTable } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { createActionColumn } from '@/components/shared/action-column'
import { confirm } from '@/components/shared/confirm'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { PermissionGate, usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { userResource } from '@/features/iam/api.ts'
import { resetUserPassword } from '@/features/iam/components/reset-password-dialog.tsx'
import { userColumns } from '@/features/iam/components/user-table.tsx'
import type { UserListItemDto } from '@/features/iam/dto/index.ts'

export const Route = createFileRoute('/_authenticated/settings/users/')({
	validateSearch: listSearchSchema.extend({
		isActive: z.coerce.number().int().min(0).max(1).optional(),
	}),
	component: UsersPage,
})

function UsersPage() {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const canEdit = usePermissionCheck({ permission: 'iam.update' })
	const canDeactivate = usePermissionCheck({ permission: 'iam.delete' })

	const listQuery = useQuery(
		userResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			isActive: search.isActive,
		}),
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

	const handleResetPassword = useCallback(async (user: UserListItemDto) => {
		const saved = await resetUserPassword(user)
		if (saved) toast.add({ title: 'Password reset successfully.', type: 'success' })
	}, [])

	const actionsColumn = useMemo(
		() =>
			createActionColumn<UserListItemDto>({
				// oxlint-disable-next-line react/no-unstable-nested-components
				getItems: (user) => [
					{
						label: 'View',
						icon: <EyeIcon className="size-4" />,
						onClick: () =>
							navigate({
								to: '/settings/users/$userId',
								params: { userId: String(user.id) },
							}),
					},
					canEdit && {
						label: 'Edit',
						icon: <EditIcon className="size-4" />,
						onClick: () =>
							navigate({
								to: '/settings/users/$userId',
								params: { userId: String(user.id) },
								search: { mode: 'edit' },
							}),
					},
					canEdit && {
						label: 'Reset Password',
						icon: <KeyRoundIcon className="size-4" />,
						onClick: () => handleResetPassword(user),
					},
					canDeactivate && {
						label: 'Deactivate',
						icon: <UserXIcon className="size-4" />,
						onClick: () => handleDeactivate(user),
						variant: 'destructive' as const,
					},
				],
			}),
		[canEdit, canDeactivate, handleDeactivate, handleResetPassword, navigate],
	)

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
		<EntityListPage
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
			table={table}
			recordCount={totalCount}
			isLoading={listQuery.isFetching}
			isEmpty={isEmpty}
			emptyState={{
				title: 'No users yet',
				description: 'Get started by creating the first user account.',
				action: (
					<PermissionGate permission="iam.create">
						<Button size="sm" onClick={() => navigate({ to: '/settings/users/new' })}>
							<PlusIcon className="size-4" />
							Add User
						</Button>
					</PermissionGate>
				),
			}}
			emptyMessage="No users match your search."
			toolbar={
				<TableToolbar
					searchValue={globalFilter}
					onSearchChange={(value) => table.setGlobalFilter(value)}
					searchPlaceholder="Search by username, name, or email..."
					filters={[
						{
							key: 'isActive',
							label: 'Status',
							value: search.isActive?.toString(),
							options: [
								{ label: 'Active', value: '1' },
								{ label: 'Inactive', value: '0' },
							],
							onChange: (value) =>
								navigate({
									search: {
										...search,
										page: 1,
										isActive: value === undefined ? undefined : Number(value),
									},
								}),
						},
					]}
				/>
			}
		/>
	)
}
