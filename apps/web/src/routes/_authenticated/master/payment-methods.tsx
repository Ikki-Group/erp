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

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/toast'

import { paymentMethodMutations, paymentMethodResource } from '@/features/payment-method/api.ts'
import { PaymentMethodForm } from '@/features/payment-method/components/payment-method-form.tsx'
import type { PaymentMethodFormRef } from '@/features/payment-method/components/payment-method-form.tsx'
import { PAYMENT_METHOD_TYPE_OPTIONS } from '@/features/payment-method/dto/index.ts'
import type {
	PaymentMethodDto,
	PaymentMethodTypeEnum,
} from '@/features/payment-method/dto/index.ts'

import { useHasPermission } from '@/providers/auth-provider.tsx'

export const Route = createFileRoute('/_authenticated/master/payment-methods')({
	component: PaymentMethodsPage,
})

// ─── Table Columns ───

const col = createColumnHelper<DataGridFeatures, PaymentMethodDto>()

const baseColumns = [
	col.accessor('code', {
		header: 'Code',
		size: 120,
	}),
	col.accessor('name', {
		header: 'Name',
		size: 200,
	}),
	col.accessor('type', {
		header: 'Type',
		size: 120,
		cell: ({ getValue }) => (
			<Badge variant="secondary" className="capitalize">
				{getValue()}
			</Badge>
		),
	}),
	col.accessor('isActive', {
		header: 'Status',
		size: 100,
		cell: ({ getValue }) => (
			<Badge variant={getValue() ? 'default' : 'outline'}>
				{getValue() ? 'Active' : 'Inactive'}
			</Badge>
		),
	}),
]

// ─── Page Component ───

function PaymentMethodsPage() {
	const canWrite = useHasPermission('payment-method:write')

	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
		q: undefined as string | undefined,
		type: undefined as PaymentMethodTypeEnum | undefined,
	})

	const listQuery = useQuery(paymentMethodResource.list.queryOptions(listParams))

	const createMut = useMutation(paymentMethodMutations.create.mutationOptions())
	const updateMut = useMutation(paymentMethodMutations.update.mutationOptions())
	const removeMut = useMutation(paymentMethodMutations.remove.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	// ─── Handlers ───

	const handleCreate = useCallback(async () => {
		const formRef = { current: null } as React.MutableRefObject<PaymentMethodFormRef | null>

		const saved = await formDialog({
			title: 'Add Payment Method',
			description: 'Create a new payment method.',
			submitLabel: 'Create',
			content: (
				<PaymentMethodForm
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
					type: values.type as PaymentMethodDto['type'],
					isActive: values.isActive,
				})
			},
		})

		if (saved) {
			toast.add({ title: 'Payment method created.', type: 'success' })
		}
	}, [createMut])

	const handleEdit = useCallback(
		async (item: PaymentMethodDto) => {
			const formRef = { current: null } as React.MutableRefObject<PaymentMethodFormRef | null>

			const saved = await formDialog({
				title: 'Edit Payment Method',
				description: `Update details for ${item.name}.`,
				submitLabel: 'Save Changes',
				content: (
					<PaymentMethodForm
						ref={(el) => {
							formRef.current = el
						}}
						defaultValues={item}
					/>
				),
				onSubmit: async () => {
					const errors = formRef.current?.validate()
					if (errors) throw new Error('Please fix the validation errors.')
					const values = formRef.current!.getValues()
					await updateMut.mutateAsync({
						id: item.id,
						code: values.code,
						name: values.name,
						type: values.type as PaymentMethodDto['type'],
						isActive: values.isActive,
					})
				},
			})

			if (saved) {
				toast.add({ title: 'Payment method updated.', type: 'success' })
			}
		},
		[updateMut],
	)

	const handleDelete = useCallback(
		async (item: PaymentMethodDto) => {
			await confirm({
				title: 'Delete payment method?',
				description: `This will permanently delete "${item.name}" (${item.code}). This action cannot be undone.`,
				confirmLabel: 'Delete',
				variant: 'destructive',
				onConfirm: async () => {
					await removeMut.mutateAsync({ id: item.id })
					toast.add({ title: 'Payment method deleted.', type: 'success' })
				},
			})
		},
		[removeMut],
	)

	// ─── Columns with actions ───

	const actionsColumn = useMemo(() => {
		if (!canWrite) return null
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
	}, [canWrite, handleEdit, handleDelete])

	const columns = useMemo(
		() =>
			[...baseColumns, actionsColumn].filter(Boolean) as ColumnDef<
				DataGridFeatures,
				PaymentMethodDto
			>[],
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

	const handleTypeFilter = (value: string | null) => {
		setListParams((prev) => ({
			...prev,
			page: 1,
			type: !value || value === 'all' ? undefined : (value as PaymentMethodTypeEnum),
		}))
	}

	const isEmpty = !listQuery.isLoading && data.length === 0 && !globalFilter && !listParams.type

	return (
		<div className="space-y-6">
			<PageHeader
				title="Payment Methods"
				description="Manage payment methods available for POS checkout."
				actions={
					canWrite ? (
						<Button size="sm" onClick={handleCreate}>
							<PlusIcon className="size-4" />
							Add Payment Method
						</Button>
					) : undefined
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No payment methods yet"
					description="Get started by creating your first payment method."
					action={
						canWrite ? (
							<Button size="sm" onClick={handleCreate}>
								<PlusIcon className="size-4" />
								Add Payment Method
							</Button>
						) : undefined
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No payment methods match your search."
					toolbar={
						<div className="flex items-center gap-2">
							<SearchToolbar
								value={globalFilter}
								onChange={setGlobalFilter}
								placeholder="Search payment methods..."
							/>
							<Select value={listParams.type ?? 'all'} onValueChange={handleTypeFilter}>
								<SelectTrigger className="w-[130px]">
									<SelectValue placeholder="All Types" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Types</SelectItem>
									{PAYMENT_METHOD_TYPE_OPTIONS.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					}
				/>
			)}
		</div>
	)
}
