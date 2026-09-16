import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { EditIcon, PlusIcon, TrashIcon } from 'lucide-react'

import { listSearchSchema, useServerTable } from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { ActionMenu } from '@/components/shared/action-menu'
import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { PermissionGate, usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { paymentMethodMutations, paymentMethodResource } from '@/features/payment-method/api.ts'
import {
	PAYMENT_METHOD_TYPE_OPTIONS,
	PaymentMethodTypeEnum,
} from '@/features/payment-method/dto/index.ts'
import type { PaymentMethodDto } from '@/features/payment-method/dto/index.ts'

const paymentMethodsSearchSchema = listSearchSchema.extend({
	type: PaymentMethodTypeEnum.optional(),
})

export const Route = createFileRoute('/_authenticated/master/payment-methods/')({
	validateSearch: paymentMethodsSearchSchema,
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
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const canEdit = usePermissionCheck({ permission: 'payment-method.update' })
	const canDelete = usePermissionCheck({ permission: 'payment-method.delete' })

	const listQuery = useQuery(
		paymentMethodResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			type: search.type,
		}),
	)
	const removeMut = useMutation(paymentMethodMutations.remove.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

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
		return col.display({
			id: 'actions',
			size: 60,
			cell: ({ row }) => {
				const items = []
				if (canEdit) {
					items.push({
						label: 'Edit',
						icon: <EditIcon className="size-4" />,
						onClick: () =>
							navigate({
								to: '/master/payment-methods/$paymentMethodId',
								params: { paymentMethodId: String(row.original.id) },
							}),
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
	}, [canEdit, canDelete, handleDelete, navigate])

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, PaymentMethodDto>[],
		[actionsColumn],
	)

	const { table, globalFilter } = useServerTable({
		data,
		columns,
		totalCount,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})

	const isEmpty = !listQuery.isLoading && data.length === 0 && !globalFilter && !search.type

	return (
		<div className="space-y-6">
			<PageHeader
				title="Payment Methods"
				description="Manage payment methods available for POS checkout."
				actions={
					<PermissionGate permission="payment-method.create">
						<Button size="sm" onClick={() => navigate({ to: '/master/payment-methods/new' })}>
							<PlusIcon className="size-4" />
							Add Payment Method
						</Button>
					</PermissionGate>
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No payment methods yet"
					description="Get started by creating your first payment method."
					action={
						<PermissionGate permission="payment-method.create">
							<Button size="sm" onClick={() => navigate({ to: '/master/payment-methods/new' })}>
								<PlusIcon className="size-4" />
								Add Payment Method
							</Button>
						</PermissionGate>
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No payment methods match your search."
					toolbar={
						<TableToolbar
							searchValue={globalFilter}
							onSearchChange={(value) => table.setGlobalFilter(value)}
							searchPlaceholder="Search payment methods..."
							filters={[
								{
									key: 'type',
									label: 'Type',
									value: search.type,
									onChange: (v) =>
										navigate({
											search: {
												...search,
												page: 1,
												type: v as PaymentMethodTypeEnum | undefined,
											},
										}),
									options: PAYMENT_METHOD_TYPE_OPTIONS,
									allLabel: 'All Types',
								},
							]}
						/>
					}
				/>
			)}
		</div>
	)
}
