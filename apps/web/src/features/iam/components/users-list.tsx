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
			title: 'Nonaktifkan pengguna?',
			description: `Ini akan menonaktifkan "${user.name}". Pengguna tidak akan bisa masuk lagi.`,
			confirmLabel: 'Nonaktifkan',
			variant: 'destructive',
		}),
		execute: (user) => deactivateMut.mutateAsync({ id: user.id }),
		successMessage: 'Pengguna berhasil dinonaktifkan.',
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
						label: 'Lihat',
						icon: <EyeIcon className="size-4" />,
						onClick: () => handleView(user.id),
					},
					canEdit && {
						label: 'Ubah',
						icon: <EditIcon className="size-4" />,
						onClick: () => handleEdit(user.id),
					},
					canEdit && {
						label: 'Reset Kata Sandi',
						icon: <KeyRoundIcon className="size-4" />,
						onClick: () => handleResetPassword(user),
					},
					canDeactivate &&
						user.isActive && {
							label: 'Nonaktifkan',
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
			title="Pengguna"
			description="Kelola akun pengguna dan penugasan perannya."
			createAction={
				<PermissionGate permission="iam.create">
					<Button size="sm" onClick={handleAdd}>
						<PlusIcon className="size-4" />
						Tambah Pengguna
					</Button>
				</PermissionGate>
			}
			list={list}
			emptyState={{
				title: 'Belum ada pengguna',
				description: 'Mulai dengan membuat akun pengguna pertama.',
			}}
			emptyMessage="Tidak ada pengguna yang cocok dengan pencarian Anda."
			toolbar={
				<TableToolbar
					searchValue={list.globalFilter}
					onSearchChange={(value) => list.table.setGlobalFilter(value)}
					searchPlaceholder="Cari berdasarkan nama pengguna, nama, atau email..."
					filters={[
						{
							key: 'isActive',
							label: 'Status',
							value: search.isActive?.toString(),
							options: [
								{ label: 'Aktif', value: '1' },
								{ label: 'Nonaktif', value: '0' },
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
