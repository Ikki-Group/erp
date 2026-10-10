import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { EditIcon, EyeIcon, PlusIcon, TrashIcon } from 'lucide-react'

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

import { roleResource } from '@/features/iam/api.ts'
import { roleColumns } from '@/features/iam/components/role-table.tsx'
import type { RoleDto } from '@/features/iam/dto/index.ts'

export interface RolesListProps {
	searchParams: {
		page?: number
		pageSize?: number
		q?: string
		isSystem?: number
	}
}

interface RolesSearch extends ListSearch {
	isSystem?: number
}

export function RolesList({ searchParams }: RolesListProps) {
	const navigate = useNavigate()
	const search: RolesSearch = {
		page: searchParams.page ?? 1,
		pageSize: searchParams.pageSize ?? 10,
		q: searchParams.q,
		isSystem: searchParams.isSystem,
	}
	const canEdit = usePermissionCheck({ permission: 'iam.update' })
	const canDelete = usePermissionCheck({ permission: 'iam.delete' })

	const listQuery = useQuery(
		roleResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			isSystem: search.isSystem,
		}),
	)
	const removeMut = useMutation(roleResource.remove.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const handleDelete = useCallback(
		async (role: RoleDto) => {
			await confirm({
				title: 'Delete role?',
				description: `This will permanently delete "${role.name}". A role cannot be deleted while it is assigned to users.`,
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

	const handleView = useCallback(
		(roleId: number) => {
			navigate({
				to: '/settings/roles/$roleId',
				params: { roleId: String(roleId) },
			})
		},
		[navigate],
	)

	const handleEdit = useCallback(
		(roleId: number) => {
			navigate({
				to: '/settings/roles/$roleId',
				params: { roleId: String(roleId) },
			})
		},
		[navigate],
	)

	const handleAdd = useCallback(() => {
		navigate({ to: '/settings/roles/new' })
	}, [navigate])

	const handleSearchChange = useCallback(
		(next: ListSearch) => {
			const rolesNext: RolesSearch = {
				...next,
				isSystem: search.isSystem,
			}
			navigate({
				to: '/settings/access-control',
				search: { ...rolesNext, tab: 'roles' as const },
			})
		},
		[navigate, search.isSystem],
	)

	const actionsColumn = useMemo(
		() =>
			createActionColumn<RoleDto>({
				// oxlint-disable-next-line react/no-unstable-nested-components
				getItems: (role) => [
					role.isSystem && {
						label: 'View',
						icon: <EyeIcon className="size-4" />,
						onClick: () => handleView(role.id),
					},
					!role.isSystem &&
						canEdit && {
							label: 'Edit',
							icon: <EditIcon className="size-4" />,
							onClick: () => handleEdit(role.id),
						},
					!role.isSystem &&
						canDelete && {
							label: 'Delete',
							icon: <TrashIcon className="size-4" />,
							onClick: () => handleDelete(role),
							variant: 'destructive' as const,
						},
				],
			}),
		[canEdit, canDelete, handleDelete, handleView, handleEdit],
	)

	const columns = useMemo(
		() => [...roleColumns, actionsColumn] as ColumnDef<DataGridFeatures, RoleDto>[],
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

	const addRoleAction = (
		<PermissionGate permission="iam.create">
			<Button size="sm" onClick={handleAdd}>
				<PlusIcon className="size-4" />
				Add Role
			</Button>
		</PermissionGate>
	)

	return (
		<EntityListPage
			title="Roles"
			description="Manage roles and their permission sets."
			actions={addRoleAction}
			table={table}
			recordCount={totalCount}
			isLoading={listQuery.isFetching}
			isEmpty={isEmpty}
			emptyState={{
				title: 'No roles yet',
				description: 'Get started by creating your first role.',
				action: addRoleAction,
			}}
			emptyMessage="No roles match your search."
			toolbar={
				<TableToolbar
					searchValue={globalFilter}
					onSearchChange={(value) => table.setGlobalFilter(value)}
					searchPlaceholder="Search by code or name..."
					filters={[
						{
							key: 'isSystem',
							label: 'Type',
							value: search.isSystem?.toString(),
							options: [
								{ label: 'System roles', value: '1' },
								{ label: 'Custom roles', value: '0' },
							],
							onChange: (value) => {
								const nextIsSystem = value === undefined ? undefined : Number(value)
								navigate({
									to: '/settings/access-control',
									search: {
										...search,
										page: 1,
										isSystem: nextIsSystem,
										tab: 'roles' as const,
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
