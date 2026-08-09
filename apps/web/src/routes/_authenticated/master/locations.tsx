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

import { locationResource } from '@/features/location/api.ts'
import { LocationForm } from '@/features/location/components/location-form.tsx'
import type { LocationFormRef } from '@/features/location/components/location-form.tsx'
import { locationColumns } from '@/features/location/components/location-table.tsx'
import type { LocationDto } from '@/features/location/dto/index.ts'

import { useHasPermission } from '@/providers/auth-provider.tsx'

export const Route = createFileRoute('/_authenticated/master/locations')({
	component: LocationsPage,
})

function LocationsPage() {
	const canCreate = useHasPermission('location.create')
	const canEdit = useHasPermission('location.update')
	const canDelete = useHasPermission('location.delete')

	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
		q: undefined as string | undefined,
	})

	const listQuery = useQuery(locationResource.list.queryOptions(listParams))

	const createMut = useMutation(locationResource.create.mutationOptions())
	const updateMut = useMutation(locationResource.update.mutationOptions())
	const removeMut = useMutation(locationResource.remove.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const actionsColumn = useMemo(() => {
		const col = createColumnHelper<DataGridFeatures, LocationDto>()
		return col.display({
			id: 'actions',
			size: 60,
			cell: ({ row }) => {
				const items = []
				if (canEdit) {
					items.push({
						label: 'Edit',
						icon: <EditIcon className="size-4" />,
						onClick: () => handleEdit(row.original),
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
	}, [canEdit, canDelete])

	const columns = useMemo(
		() => [...locationColumns, actionsColumn] as ColumnDef<DataGridFeatures, LocationDto>[],
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
		const formRef = { current: null } as React.MutableRefObject<LocationFormRef | null>

		const saved = await formDialog({
			title: 'Add Location',
			description: 'Create a new location for your organization.',
			submitLabel: 'Create',
			content: (
				<LocationForm
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
					type: values.type as 'store' | 'warehouse',
					address: values.address || null,
					phone: values.phone || null,
					isActive: values.isActive,
				})
			},
		})

		if (saved) {
			toast.add({ title: 'Location created successfully.', type: 'success' })
		}
	}, [createMut])

	const handleEdit = useCallback(
		async (location: LocationDto) => {
			const formRef = { current: null } as React.MutableRefObject<LocationFormRef | null>

			const saved = await formDialog({
				title: 'Edit Location',
				description: `Update details for ${location.name}.`,
				submitLabel: 'Save Changes',
				content: (
					<LocationForm
						ref={(el) => {
							formRef.current = el
						}}
						defaultValues={location}
					/>
				),
				onSubmit: async () => {
					const errors = formRef.current?.validate()
					if (errors) throw new Error('Please fix the validation errors.')
					const values = formRef.current!.getValues()
					await updateMut.mutateAsync({
						id: location.id,
						code: values.code,
						name: values.name,
						type: values.type as 'store' | 'warehouse',
						address: values.address || null,
						phone: values.phone || null,
						isActive: values.isActive,
					})
				},
			})

			if (saved) {
				toast.add({ title: 'Location updated successfully.', type: 'success' })
			}
		},
		[updateMut],
	)

	const handleDelete = useCallback(
		async (location: LocationDto) => {
			await confirm({
				title: 'Delete location?',
				description: `This will permanently delete "${location.name}". This action cannot be undone.`,
				confirmLabel: 'Delete',
				variant: 'destructive',
				onConfirm: async () => {
					await removeMut.mutateAsync({ id: location.id })
					toast.add({ title: 'Location deleted successfully.', type: 'success' })
				},
			})
		},
		[removeMut],
	)

	const isEmpty = !listQuery.isLoading && data.length === 0 && !globalFilter

	return (
		<div className="space-y-6">
			<PageHeader
				title="Locations"
				description="Manage stores and warehouses in your organization."
				actions={
					canCreate ? (
						<Button size="sm" onClick={handleCreate}>
							<PlusIcon className="size-4" />
							Add Location
						</Button>
					) : undefined
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No locations yet"
					description="Get started by creating your first location."
					action={
						canCreate ? (
							<Button size="sm" onClick={handleCreate}>
								<PlusIcon className="size-4" />
								Add Location
							</Button>
						) : undefined
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No locations match your search."
					toolbar={
						<SearchToolbar
							value={globalFilter}
							onChange={setGlobalFilter}
							placeholder="Search locations..."
						/>
					}
				/>
			)}
		</div>
	)
}
