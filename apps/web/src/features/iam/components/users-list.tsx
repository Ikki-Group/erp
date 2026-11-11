import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { EditIcon, EyeIcon, KeyRoundIcon, PlusIcon, UserXIcon } from 'lucide-react'

import type { ListSearch } from '@/components/data-table'
import { useResourceList } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { createActionColumn } from '@/components/shared/action-column'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { PermissionGate, usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'
import { useWorkflowAction } from '@/components/shared/workflow-action'

import { Button } from '@/components/ui/button'

import { userResource } from '@/features/iam/api.ts'
import { resetUserPassword } from '@/features/iam/components/reset-password-dialog.tsx'
import { userColumns } from '@/features/iam/components/user-table.tsx'
import type { UserListItemDto } from '@/features/iam/dto/index.ts'

export interface UsersListProps {
	searchParams: Partial<ListSearch> & { isActive?: number; isSystem?: number }
}

interface UsersSearch extends ListSearch {
	isActive?: number
	isSystem?: number
}

export function UsersList({ searchParams }: UsersListProps) {
	const navigate = useNavigate()
	const search: UsersSearch = {
		...searchParams,
		page: searchParams.page ?? 1,
		pageSize: searchParams.pageSize ?? 10,
		q: searchParams.q,
		isActive: searchParams.isActive,
	}
	const canEdit = usePermissionCheck({ permission: 'iam.update' })
	const canDeactivate = usePermissionCheck({ permission: 'iam.delete' })

	const listQuery = useQuery({
		...userResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			isActive: search.isActive,
		}),
		throwOnError: false,
	})
	const deactivateMut = useMutation(userResource.deactivate.mutationOptions())

	const { run: handleDeactivate, isPending: deactivating } = useWorkflowAction<UserListItemDto>({
		availability: (user) => canDeactivate && user.isActive,
		confirmation: (user) => ({
			title: 'Deactivate user?',
			description: `This will deactivate "${user.name}". They will no longer be able to log in.`,
			confirmLabel: 'Deactivate',
			variant: 'destructive',
		}),
		execute: (user) => deactivateMut.mutateAsync({ id: user.id }),
		successMessage: 'User deactivated.',
	})

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
		(next: UsersSearch) => {
			navigate({
				to: '/settings/access-control',
				search: { ...next, tab: 'users' as const },
			})
		},
		[navigate],
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
					canDeactivate &&
						user.isActive && {
							label: 'Deactivate',
							icon: <UserXIcon className="size-4" />,
							onClick: () => handleDeactivate(user),
							variant: 'destructive' as const,
							disabled: deactivating,
						},
				],
			}),
		[
			canEdit,
			canDeactivate,
			deactivating,
			handleDeactivate,
			handleResetPassword,
			handleView,
			handleEdit,
		],
	)

	const columns = useMemo(
		() => [...userColumns, actionsColumn] as ColumnDef<DataGridFeatures, UserListItemDto>[],
		[actionsColumn],
	)

	const list = useResourceList({
		query: listQuery,
		columns,
		search,
		onSearchChange: handleSearchChange,
		hasFilters: (value) => value.isActive !== undefined,
	})

	return (
		<EntityListPage
			title="Users"
			description="Manage user accounts and their role assignments."
			createAction={
				<PermissionGate permission="iam.create">
					<Button size="sm" onClick={handleAdd}>
						<PlusIcon className="size-4" />
						Add User
					</Button>
				</PermissionGate>
			}
			list={list}
			emptyState={{
				title: 'No users yet',
				description: 'Get started by creating the first user account.',
			}}
			emptyMessage="No users match your search."
			toolbar={
				<TableToolbar
					searchValue={list.globalFilter}
					onSearchChange={(value) => list.table.setGlobalFilter(value)}
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
								list.setFilters({ isActive: value === undefined ? undefined : Number(value) }),
						},
					]}
				/>
			}
		/>
	)
}
