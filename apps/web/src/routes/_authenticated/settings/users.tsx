import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { EditIcon, PlusIcon, UserXIcon } from 'lucide-react'

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

import { assignmentResource, roleResource, userResource } from '@/features/iam/api.ts'
import { UserForm } from '@/features/iam/components/user-form.tsx'
import type { UserFormRef } from '@/features/iam/components/user-form.tsx'
import { userColumns } from '@/features/iam/components/user-table.tsx'
import type { UserListItemDto } from '@/features/iam/dto/index.ts'
import { locationResource } from '@/features/location/api.ts'

import { useHasPermission } from '@/providers/auth-provider.tsx'

export const Route = createFileRoute('/_authenticated/settings/users')({
	component: UsersPage,
})

function UsersPage() {
	const canWrite = useHasPermission('iam:write')

	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
		q: undefined as string | undefined,
	})

	const listQuery = useQuery(userResource.list.queryOptions(listParams))
	const rolesQuery = useQuery(roleResource.list.queryOptions({ page: 1, limit: 100 }))
	const locationsQuery = useQuery(locationResource.list.queryOptions({ page: 1, limit: 100 }))

	const createMut = useMutation(userResource.create.mutationOptions())
	const updateMut = useMutation(userResource.update.mutationOptions())
	const deactivateMut = useMutation(userResource.deactivate.mutationOptions())
	const assignMut = useMutation(assignmentResource.assign.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const roleOptions = useMemo(
		() => (rolesQuery.data?.data ?? []).map((r) => ({ label: r.name, value: String(r.id) })),
		[rolesQuery.data],
	)

	const locationOptions = useMemo(
		() => (locationsQuery.data?.data ?? []).map((l) => ({ label: l.name, value: String(l.id) })),
		[locationsQuery.data],
	)

	const actionsColumn = useMemo(() => {
		const col = createColumnHelper<DataGridFeatures, UserListItemDto>()
		return col.display({
			id: 'actions',
			size: 60,
			cell: ({ row }) => {
				if (!canWrite) return null
				return (
					<ActionMenu
						items={[
							{
								label: 'Edit',
								icon: <EditIcon className="size-4" />,
								onClick: () => handleEdit(row.original),
							},
							{
								label: 'Deactivate',
								icon: <UserXIcon className="size-4" />,
								onClick: () => handleDeactivate(row.original),
								variant: 'destructive' as const,
							},
						]}
					/>
				)
			},
		})
	}, [canWrite])

	const columns = useMemo(
		() => [...userColumns, actionsColumn] as ColumnDef<DataGridFeatures, UserListItemDto>[],
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
		const formRef = { current: null } as React.MutableRefObject<UserFormRef | null>

		const saved = await formDialog({
			title: 'Add User',
			description: 'Create a new user account.',
			submitLabel: 'Create',
			content: (
				<UserForm
					ref={(el) => {
						formRef.current = el
					}}
					mode="create"
					roleOptions={roleOptions}
					locationOptions={locationOptions}
				/>
			),
			onSubmit: async () => {
				const errors = formRef.current?.validate()
				if (errors) throw new Error('Please fix the validation errors.')
				const values = formRef.current!.getValues()

				const result = await createMut.mutateAsync({
					username: values.username,
					email: values.email,
					name: values.name,
					password: values.password,
					isActive: values.isActive,
				})

				if (values.roleId) {
					await assignMut.mutateAsync({
						userId: result.data.id,
						roleId: Number(values.roleId),
						locationId: values.locationId ? Number(values.locationId) : null,
					})
				}
			},
		})

		if (saved) {
			toast.add({ title: 'User created successfully.', type: 'success' })
		}
	}, [createMut, assignMut, roleOptions, locationOptions])

	const handleEdit = useCallback(
		async (user: UserListItemDto) => {
			const detailResult = await userResource.detail.fetch({ id: user.id })
			const detail = detailResult.data

			const formRef = { current: null } as React.MutableRefObject<UserFormRef | null>

			const saved = await formDialog({
				title: 'Edit User',
				description: `Update details for ${detail.name}.`,
				submitLabel: 'Save Changes',
				content: (
					<UserForm
						ref={(el) => {
							formRef.current = el
						}}
						mode="edit"
						defaultValues={detail}
						roleOptions={roleOptions}
						locationOptions={locationOptions}
					/>
				),
				onSubmit: async () => {
					const errors = formRef.current?.validate()
					if (errors) throw new Error('Please fix the validation errors.')
					const values = formRef.current!.getValues()

					await updateMut.mutateAsync({
						id: detail.id,
						username: values.username,
						email: values.email,
						name: values.name,
						isActive: values.isActive,
						...(values.password ? { password: values.password } : {}),
					})
				},
			})

			if (saved) {
				toast.add({ title: 'User updated successfully.', type: 'success' })
			}
		},
		[updateMut, roleOptions, locationOptions],
	)

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

	const isEmpty = !listQuery.isLoading && data.length === 0 && !globalFilter

	return (
		<div className="space-y-6">
			<PageHeader
				title="Users"
				description="Manage user accounts and their role assignments."
				actions={
					canWrite ? (
						<Button size="sm" onClick={handleCreate}>
							<PlusIcon className="size-4" />
							Add User
						</Button>
					) : undefined
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No users yet"
					description="Get started by creating the first user account."
					action={
						canWrite ? (
							<Button size="sm" onClick={handleCreate}>
								<PlusIcon className="size-4" />
								Add User
							</Button>
						) : undefined
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No users match your search."
					toolbar={
						<SearchToolbar
							value={globalFilter}
							onChange={setGlobalFilter}
							placeholder="Search users..."
						/>
					}
				/>
			)}
		</div>
	)
}
