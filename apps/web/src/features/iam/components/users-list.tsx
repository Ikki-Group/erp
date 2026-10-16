import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { EditIcon, EyeIcon, KeyRoundIcon, PlusIcon, UserXIcon } from 'lucide-react'

import type { ListSearch } from '@/components/data-table'
import { useServerTable } from '@/components/data-table'
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

export interface UsersListProps {
	searchParams: {
		page?: number
		pageSize?: number
		q?: string
		isActive?: number
	}
}

interface UsersSearch extends ListSearch {
	isActive?: number
}

export function UsersList({ searchParams }: UsersListProps) {
	const navigate = useNavigate()
	const search: UsersSearch = {
		page: searchParams.page ?? 1,
		pageSize: searchParams.pageSize ?? 10,
		q: searchParams.q,
		isActive: searchParams.isActive,
	}
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
		await resetUserPassword(user)
	}, [])

	const handleView = useCallback(
		(userId: number) => {
			navigate({
				to: '/settings/users/$userId',
				params: { userId: String(userId) },
			})
		},
		[navigate],
	)

	const handleEdit = useCallback(
		(userId: number) => {
			navigate({
				to: '/settings/users/$userId',
				params: { userId: String(userId) },
				search: { mode: 'edit' },
			})
		},
		[navigate],
	)

	const handleAdd = useCallback(() => {
		navigate({ to: '/settings/users/new' })
	}, [navigate])

	const handleSearchChange = useCallback(
		(next: ListSearch) => {
			const usersNext: UsersSearch = {
				...next,
				isActive: search.isActive,
			}
			navigate({
				to: '/settings/access-control',
				search: { ...usersNext, tab: 'users' as const },
			})
		},
		[navigate, search.isActive],
	)

	const actionsColumn = useMemo(
		() =>
			createActionColumn<UserListItemDto>({
				// oxlint-disable-next-line react/no-unstable-nested-components
				getItems: (user) => [
					{
						label: 'View',
						icon: <EyeIcon className="size-4" />,
						onClick: () => handleView(user.id),
					},
					canEdit && {
						label: 'Edit',
						icon: <EditIcon className="size-4" />,
						onClick: () => handleEdit(user.id),
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
		[canEdit, canDeactivate, handleDeactivate, handleResetPassword, handleView, handleEdit],
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
		onSearchChange: handleSearchChange,
	})

	const isEmpty = !listQuery.isLoading && data.length === 0 && !globalFilter

	return (
		<EntityListPage
			title="Users"
			description="Manage user accounts and their role assignments."
			actions={
				<PermissionGate permission="iam.create">
					<Button size="sm" onClick={handleAdd}>
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
						<Button size="sm" onClick={handleAdd}>
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
							onChange: (value) => {
								const nextIsActive = value === undefined ? undefined : Number(value)
								navigate({
									to: '/settings/access-control',
									search: {
										...search,
										page: 1,
										isActive: nextIsActive,
										tab: 'users' as const,
									},
								})
								},
						},
					]}
				/>
			}
		/>
	)
}
