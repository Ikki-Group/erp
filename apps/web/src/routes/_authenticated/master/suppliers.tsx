import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { EditIcon, PackageIcon, PlusIcon, TrashIcon } from 'lucide-react'

import { DataTable } from '@/components/data-table/data-table'
import { useServerTable } from '@/components/data-table/use-server-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { ActionMenu } from '@/components/shared/action-menu'
import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/empty-state'
import { formDialog } from '@/components/shared/form-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { SearchToolbar } from '@/components/shared/search-toolbar'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { PricingTable } from '@/features/supplier/components/pricing-table.tsx'
import { SupplierForm } from '@/features/supplier/components/supplier-form.tsx'
import type { SupplierFormRef, SupplierFormValues } from '@/features/supplier/components/supplier-form.tsx'
import { supplierResource } from '@/features/supplier/api.ts'
import type { SupplierDto } from '@/features/supplier/dto/index.ts'

export const Route = createFileRoute('/_authenticated/master/suppliers')({
	component: SuppliersPage,
})

// ─── Helpers ───

function formToPayload(v: SupplierFormValues) {
	return {
		code: v.code,
		name: v.name,
		contactPerson: v.contactPerson || null,
		phone: v.phone || null,
		email: v.email || null,
		address: v.address || null,
		paymentTerms: v.paymentTerms ? Number(v.paymentTerms) : null,
	}
}

// ─── Table Columns ───

const col = createColumnHelper<DataGridFeatures, SupplierDto>()

const baseColumns = [
	col.accessor('code', {
		header: 'Code',
		size: 100,
	}),
	col.accessor('name', {
		header: 'Name',
		size: 200,
	}),
	col.accessor('contactPerson', {
		header: 'Contact',
		size: 150,
		cell: ({ getValue }) => getValue() ?? '—',
	}),
	col.accessor('phone', {
		header: 'Phone',
		size: 120,
		cell: ({ getValue }) => getValue() ?? '—',
	}),
	col.accessor('isActive', {
		header: 'Status',
		size: 80,
		cell: ({ getValue }) => (
			<Badge variant={getValue() ? 'default' : 'outline'}>
				{getValue() ? 'Active' : 'Inactive'}
			</Badge>
		),
	}),
]

// ─── Page Component ───

function SuppliersPage() {
	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
		q: undefined as string | undefined,
	})

	const listQuery = useQuery(supplierResource.list.queryOptions(listParams))
	const createMut = useMutation(supplierResource.create.mutationOptions())
	const updateMut = useMutation(supplierResource.update.mutationOptions())
	const removeMut = useMutation(supplierResource.remove.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const handleCreate = useCallback(async () => {
		const formRef = { current: null } as React.MutableRefObject<SupplierFormRef | null>

		const saved = await formDialog({
			title: 'Add Supplier',
			description: 'Create a new supplier.',
			submitLabel: 'Create',
			content: (
				<SupplierForm
					ref={(el) => {
						formRef.current = el
					}}
				/>
			),
			onSubmit: async () => {
				const errors = formRef.current?.validate()
				if (errors) throw new Error('Please fix the validation errors.')
				const v = formRef.current!.getValues()
				await createMut.mutateAsync(formToPayload(v))
			},
		})

		if (saved) {
			toast.add({ title: 'Supplier created successfully.', type: 'success' })
		}
	}, [createMut])

	const handleEdit = useCallback(
		async (supplier: SupplierDto) => {
			const formRef = { current: null } as React.MutableRefObject<SupplierFormRef | null>

			const saved = await formDialog({
				title: 'Edit Supplier',
				description: `Update details for ${supplier.name}.`,
				submitLabel: 'Save Changes',
				content: (
					<SupplierForm
						ref={(el) => {
							formRef.current = el
						}}
						defaultValues={supplier}
					/>
				),
				onSubmit: async () => {
					const errors = formRef.current?.validate()
					if (errors) throw new Error('Please fix the validation errors.')
					const v = formRef.current!.getValues()
					await updateMut.mutateAsync({ id: supplier.id, ...formToPayload(v) })
				},
			})

			if (saved) {
				toast.add({ title: 'Supplier updated successfully.', type: 'success' })
			}
		},
		[updateMut],
	)

	const handleDelete = useCallback(
		async (supplier: SupplierDto) => {
			await confirm({
				title: 'Delete supplier?',
				description: `This will permanently delete "${supplier.name}" (${supplier.code}). This action cannot be undone.`,
				confirmLabel: 'Delete',
				variant: 'destructive',
				onConfirm: async () => {
					await removeMut.mutateAsync({ id: supplier.id })
					toast.add({ title: 'Supplier deleted successfully.', type: 'success' })
				},
			})
		},
		[removeMut],
	)

	const handlePricing = useCallback(async (supplier: SupplierDto) => {
		await formDialog({
			title: 'Material Pricing',
			description: `Manage material pricing for ${supplier.name}.`,
			submitLabel: 'Done',
			content: <PricingTable supplierId={supplier.id} />,
			onSubmit: async () => {},
		})
	}, [])

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
							label: 'Pricing',
							icon: <PackageIcon className="size-4" />,
							onClick: () => handlePricing(row.original),
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
	}, [handleEdit, handleDelete, handlePricing])

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, SupplierDto>[],
		[actionsColumn],
	)

	const { table, globalFilter, setGlobalFilter } = useServerTable({
		data,
		columns,
		totalCount,
		pageSize: listParams.limit,
		onStateChange: (params) => {
			setListParams((prev) => ({
				...prev,
				page: params.page + 1,
				limit: params.pageSize,
				q: params.search || undefined,
			}))
		},
	})

	const isEmpty = !listQuery.isLoading && data.length === 0 && !globalFilter

	return (
		<div className="space-y-6">
			<PageHeader
				title="Suppliers"
				description="Manage suppliers and their material pricing."
				actions={
					<Button size="sm" onClick={handleCreate}>
						<PlusIcon className="size-4" />
						Add Supplier
					</Button>
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No suppliers yet"
					description="Get started by creating your first supplier."
					action={
						<Button size="sm" onClick={handleCreate}>
							<PlusIcon className="size-4" />
							Add Supplier
						</Button>
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No suppliers match your filters."
					toolbar={
						<SearchToolbar
							value={globalFilter}
							onChange={setGlobalFilter}
							placeholder="Search suppliers..."
						/>
					}
				/>
			)}
		</div>
	)
}
