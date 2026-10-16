import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { EditIcon, EyeIcon, PlusIcon, TrashIcon } from 'lucide-react'

import type { ListSearch } from '@/components/data-table'
import { useResourceList } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { createActionColumn } from '@/components/shared/action-column'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { PermissionGate, usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'
import { useWorkflowAction } from '@/components/shared/workflow-action'

import { Button } from '@/components/ui/button'

import { roleResource } from '@/features/iam/api.ts'
import { roleColumns } from '@/features/iam/components/role-table.tsx'
import type { RoleDto } from '@/features/iam/dto/index.ts'

export interface RolesListProps {
	searchParams: Partial<ListSearch> & { isSystem?: number; isActive?: number }
}

interface RolesSearch extends ListSearch {
	isSystem?: number
	isActive?: number
}

export function RolesList({ searchParams }: RolesListProps) {
	const navigate = useNavigate()
	const search: RolesSearch = {
		...searchParams,
		page: searchParams.page ?? 1,
		pageSize: searchParams.pageSize ?? 10,
		q: searchParams.q,
		isSystem: searchParams.isSystem,
	}
	const canEdit = usePermissionCheck({ permission: 'iam.update' })
	const canDelete = usePermissionCheck({ permission: 'iam.delete' })

	const listQuery = useQuery({
		...roleResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			isSystem: search.isSystem,
		}),
		throwOnError: false,
	})
	const removeMut = useMutation(roleResource.remove.mutationOptions())

	const { run: handleDelete, isPending: deletingRole } = useWorkflowAction<RoleDto>({
		availability: (role) => canDelete && !role.isSystem,
		confirmation: (role) => ({
			title: 'Delete role?',
			description: `This will permanently delete "${role.name}". A role cannot be deleted while it is assigned to users.`,
			confirmLabel: 'Delete',
			variant: 'destructive',
		}),
		execute: (role) => removeMut.mutateAsync({ id: role.id }),
		successMessage: 'Role deleted.',
	})

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
		(next: RolesSearch) => {
			navigate({
				to: '/settings/access-control',
				search: { ...next, tab: 'roles' as const },
			})
		},
		[navigate],
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
							disabled: deletingRole,
						},
				],
			}),
		[canEdit, canDelete, deletingRole, handleDelete, handleView, handleEdit],
	)

	const columns = useMemo(
		() => [...roleColumns, actionsColumn] as ColumnDef<DataGridFeatures, RoleDto>[],
		[actionsColumn],
	)

	const list = useResourceList({
		query: listQuery,
		columns,
		search,
		onSearchChange: handleSearchChange,
		hasFilters: (value) => value.isSystem !== undefined,
	})

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
			createAction={addRoleAction}
			list={list}
			emptyState={{
				title: 'No roles yet',
				description: 'Get started by creating your first role.',
			}}
			emptyMessage="No roles match your search."
			toolbar={
				<TableToolbar
					searchValue={list.globalFilter}
					onSearchChange={(value) => list.table.setGlobalFilter(value)}
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
							onChange: (value) =>
								list.setFilters({ isSystem: value === undefined ? undefined : Number(value) }),
						},
					]}
				/>
			}
		/>
	)
}
