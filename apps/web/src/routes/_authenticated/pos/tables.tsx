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
import { StatusBadge } from '@/components/shared/status-badge'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { tableResource } from '@/features/pos/api.ts'
import { TableForm } from '@/features/pos/components/table-form.tsx'
import type { TableFormRef } from '@/features/pos/components/table-form.tsx'
import type { TableDto } from '@/features/pos/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/pos/tables')({
	component: TablesPage,
})

// ─── Table Columns ───

const col = createColumnHelper<DataGridFeatures, TableDto>()

const baseColumns = [
	col.accessor('number', {
		header: 'Number',
		size: 120,
	}),
	col.accessor('capacity', {
		header: 'Capacity',
		size: 100,
		cell: ({ getValue }) => `${getValue()} seats`,
	}),
	col.accessor('status', {
		header: 'Status',
		size: 120,
		cell: ({ getValue }) => {
			const status = getValue()
			const variant = status === 'available' ? 'success' : status === 'occupied' ? 'warning' : 'default'
			return <StatusBadge variant={variant}>{status}</StatusBadge>
		},
	}),
	col.accessor('isActive', {
		header: 'Active',
		size: 80,
		cell: ({ getValue }) => (
			<StatusBadge variant={getValue() ? 'success' : 'default'}>
				{getValue() ? 'Active' : 'Inactive'}
			</StatusBadge>
		),
	}),
]

// ─── Page Component ───

function TablesPage() {
	const { activeLocation } = useLocationContext()
	const locationId = activeLocation?.id

	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
		q: undefined as string | undefined,
	})

	const listQuery = useQuery(
		tableResource.list.queryOptions({
			...listParams,
			locationId: locationId!,
		}),
	)

	const createMut = useMutation(tableResource.create.mutationOptions())
	const updateMut = useMutation(tableResource.update.mutationOptions())
	const removeMut = useMutation(tableResource.remove.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const handleCreate = useCallback(async () => {
		if (!locationId) return
		const formRef = { current: null } as React.MutableRefObject<TableFormRef | null>

		const saved = await formDialog({
			title: 'Add Table',
			description: 'Create a new table for this location.',
			submitLabel: 'Create',
			content: (
				<TableForm
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
					locationId,
					number: values.number,
					capacity: Number(values.capacity),
					isActive: values.isActive,
				})
			},
		})

		if (saved) {
			toast.add({ title: 'Table created successfully.', type: 'success' })
		}
	}, [createMut, locationId])

	const handleEdit = useCallback(
		async (table: TableDto) => {
			if (!locationId) return
			const formRef = { current: null } as React.MutableRefObject<TableFormRef | null>

			const saved = await formDialog({
				title: 'Edit Table',
				description: `Update details for table ${table.number}.`,
				submitLabel: 'Save Changes',
				content: (
					<TableForm
						ref={(el) => {
							formRef.current = el
						}}
						defaultValues={table}
					/>
				),
				onSubmit: async () => {
					const errors = formRef.current?.validate()
					if (errors) throw new Error('Please fix the validation errors.')
					const values = formRef.current!.getValues()
					await updateMut.mutateAsync({
						id: table.id,
						locationId,
						number: values.number,
						capacity: Number(values.capacity),
						isActive: values.isActive,
					})
				},
			})

			if (saved) {
				toast.add({ title: 'Table updated successfully.', type: 'success' })
			}
		},
		[updateMut, locationId],
	)

	const handleDelete = useCallback(
		async (table: TableDto) => {
			await confirm({
				title: 'Delete table?',
				description: `This will permanently delete table "${table.number}". This action cannot be undone.`,
				confirmLabel: 'Delete',
				variant: 'destructive',
				onConfirm: async () => {
					await removeMut.mutateAsync({ id: table.id })
					toast.add({ title: 'Table deleted successfully.', type: 'success' })
				},
			})
		},
		[removeMut],
	)

	// ─── Columns with actions ───

	const actionsColumn = useMemo(() => {
		return col.display({
			id: 'actions',
			size: 60,
			cell: ({ row }) => (
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
			),
		})
	}, [handleEdit, handleDelete])

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, TableDto>[],
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

	const isEmpty = !listQuery.isLoading && data.length === 0 && !globalFilter

	if (!locationId) {
		return (
			<div className="space-y-6">
				<PageHeader title="Tables" description="Manage dine-in tables for this location." />
				<EmptyState
					title="No location selected"
					description="Please select a location to manage tables."
				/>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Tables"
				description="Manage dine-in tables for this location."
				actions={
					<Button size="sm" onClick={handleCreate}>
						<PlusIcon className="size-4" />
						Add Table
					</Button>
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No tables yet"
					description="Get started by creating your first table."
					action={
						<Button size="sm" onClick={handleCreate}>
							<PlusIcon className="size-4" />
							Add Table
						</Button>
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No tables match your search."
					toolbar={
						<SearchToolbar
							value={globalFilter}
							onChange={setGlobalFilter}
							placeholder="Search tables..."
						/>
					}
				/>
			)}
		</div>
	)
}
