import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { EditIcon, PlusIcon, TrashIcon } from 'lucide-react'

import { DataTable } from '@/components/data-table/data-table'
import { useServerTable } from '@/components/data-table/use-server-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { ActionMenu } from '@/components/shared/action-menu'
import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/empty-state'
import { formDialog } from '@/components/shared/form-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { SearchToolbar } from '@/components/shared/search-toolbar'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { roleResource } from '@/features/iam/api.ts'
import { RoleForm } from '@/features/iam/components/role-form.tsx'
import type { RoleFormRef } from '@/features/iam/components/role-form.tsx'
import { roleColumns } from '@/features/iam/components/role-table.tsx'
import type { RoleDto } from '@/features/iam/dto/index.ts'

import { useHasPermission } from '@/providers/auth-provider.tsx'

export const Route = createFileRoute('/_authenticated/settings/roles')({
	component: RolesPage,
})

function RolesPage() {
	const canWrite = useHasPermission('iam:write')

	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
		q: undefined as string | undefined,
	})

	const listQuery = useQuery(roleResource.list.queryOptions(listParams))

	const createMut = useMutation(roleResource.create.mutationOptions())
	const updateMut = useMutation(roleResource.update.mutationOptions())
	const removeMut = useMutation(roleResource.remove.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const actionsColumn = useMemo(() => {
		const col = createColumnHelper<DataGridFeatures, RoleDto>()
		return col.display({
			id: 'actions',
			size: 60,
			cell: ({ row }) => {
				if (!canWrite || row.original.isSystem) return null
				return (
					<ActionMenu
						items={[
							{
								label: 'Edit',
								icon: <EditIcon className="size-4" />,
								onClick: () => handleEdit(row.original),
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
	}, [canWrite])

	const columns = useMemo(
		() => [...roleColumns, actionsColumn] as ColumnDef<DataGridFeatures, RoleDto>[],
		[actionsColumn],
	)

	const { table, globalFilter, setGlobalFilter } = useServerTable({
		data,
		columns,
		totalCount,
		pageSize: listParams.limit,
		onStateChange: (params) => {
			setListParams({
				page: params.page + 1,
				limit: params.pageSize,
				q: params.search || undefined,
			})
		},
	})

	const handleCreate = useCallback(async () => {
		const formRef = { current: null } as React.MutableRefObject<RoleFormRef | null>

		const saved = await formDialog({
			title: 'Add Role',
			description: 'Create a new role with specific permissions.',
			submitLabel: 'Create',
			content: (
				<RoleForm
					ref={(el) => {
						formRef.current = el
					}}
				/>
			),
			onSubmit: async () => {
				const errors = formRef.current?.validate()
				if (errors) throw new Error('Please fix the validation errors.')
				const values = formRef.current!.getValues()
				await createMut.mutateAsync({
					code: values.code,
					name: values.name,
					permissions: values.permissions,
				})
			},
		})

		if (saved) {
			toast.add({ title: 'Role created successfully.', type: 'success' })
		}
	}, [createMut])

	const handleEdit = useCallback(
		async (role: RoleDto) => {
			const formRef = { current: null } as React.MutableRefObject<RoleFormRef | null>

			const saved = await formDialog({
				title: 'Edit Role',
				description: `Update permissions for ${role.name}.`,
				submitLabel: 'Save Changes',
				content: (
					<RoleForm
						ref={(el) => {
							formRef.current = el
						}}
						defaultValues={role}
					/>
				),
				onSubmit: async () => {
					const errors = formRef.current?.validate()
					if (errors) throw new Error('Please fix the validation errors.')
					const values = formRef.current!.getValues()
					await updateMut.mutateAsync({
						id: role.id,
						code: values.code,
						name: values.name,
						permissions: values.permissions,
					})
				},
			})

			if (saved) {
				toast.add({ title: 'Role updated successfully.', type: 'success' })
			}
		},
		[updateMut],
	)

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

	const isEmpty = !listQuery.isLoading && data.length === 0 && !globalFilter

	return (
		<div className="space-y-6">
			<PageHeader
				title="Roles"
				description="Manage roles and their permission sets."
				actions={
					canWrite ? (
						<Button size="sm" onClick={handleCreate}>
							<PlusIcon className="size-4" />
							Add Role
						</Button>
					) : undefined
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No roles yet"
					description="Get started by creating your first role."
					action={
						canWrite ? (
							<Button size="sm" onClick={handleCreate}>
								<PlusIcon className="size-4" />
								Add Role
							</Button>
						) : undefined
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No roles match your search."
					toolbar={
						<SearchToolbar
							value={globalFilter}
							onChange={setGlobalFilter}
							placeholder="Search roles..."
						/>
					}
				/>
			)}
		</div>
	)
}
