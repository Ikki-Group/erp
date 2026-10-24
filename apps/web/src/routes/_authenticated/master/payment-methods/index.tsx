import { useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { EditIcon, PlusIcon, TrashIcon } from 'lucide-react'

import { createEntityColumns, listSearchSchema, useResourceList } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { PermissionGate, usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'
import { useWorkflowAction } from '@/components/shared/workflow-action'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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
// The server filters by q/type only and does not sort, so column sorting is off.

const col = createEntityColumns<PaymentMethodDto>()

const baseColumns = [
	col.code('code', { header: 'Code', size: 120, enableSorting: false }),
	col.text('name', { header: 'Name', size: 200, enableSorting: false }),
	col.text('type', {
		header: 'Type',
		size: 120,
		enableSorting: false,
		// oxlint-disable-next-line react/no-unstable-nested-components
		cell: ({ row }) => (
			<Badge variant="secondary" className="capitalize">
				{row.original.type}
			</Badge>
		),
	}),
	col.booleanStatus('isActive', { header: 'Status', size: 100, enableSorting: false }),
]

// ─── Page Component ───

function PaymentMethodsPage() {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const canEdit = usePermissionCheck({ permission: 'payment-method.update' })
	const canDelete = usePermissionCheck({ permission: 'payment-method.delete' })

	const listQuery = useQuery({
		...paymentMethodResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			type: search.type,
		}),
		throwOnError: false,
	})
	const removeMut = useMutation(paymentMethodMutations.remove.mutationOptions())

	const { run: handleDelete, isPending: deleting } = useWorkflowAction<PaymentMethodDto>({
		availability: () => canDelete,
		confirmation: (item) => ({
			title: 'Delete payment method?',
			description: `This will permanently delete "${item.name}" (${item.code}). This action cannot be undone.`,
			confirmLabel: 'Delete',
			variant: 'destructive',
		}),
		execute: (item) => removeMut.mutateAsync({ id: item.id }),
		successMessage: 'Payment method deleted.',
	})

	// ─── Columns with actions ───

	const actionsColumn = useMemo(
		() =>
			col.actions({
				// oxlint-disable-next-line react/no-unstable-nested-components
				getItems: (item) => [
					canEdit && {
						label: 'Edit',
						icon: <EditIcon className="size-4" />,
						onClick: () =>
							navigate({
								to: '/master/payment-methods/$paymentMethodId',
								params: { paymentMethodId: String(item.id) },
							}),
					},
					canDelete && {
						label: 'Delete',
						icon: <TrashIcon className="size-4" />,
						onClick: () => handleDelete(item),
						variant: 'destructive' as const,
						disabled: deleting,
					},
				],
			}),
		[canEdit, canDelete, deleting, handleDelete, navigate],
	)

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, PaymentMethodDto>[],
		[actionsColumn],
	)

	const list = useResourceList({
		query: listQuery,
		columns,
		search,
		onSearchChange: (next) => navigate({ search: next }),
		hasFilters: (value) => value.type !== undefined,
	})

	return (
		<EntityListPage
			title="Payment Methods"
			description="Manage payment methods available for POS checkout."
			createAction={
				<PermissionGate permission="payment-method.create">
					<Button size="sm" onClick={() => navigate({ to: '/master/payment-methods/new' })}>
						<PlusIcon className="size-4" />
						Add Payment Method
					</Button>
				</PermissionGate>
			}
			list={list}
			emptyState={{
				title: 'No payment methods yet',
				description: 'Get started by creating your first payment method.',
			}}
			emptyMessage="No payment methods match your search."
			toolbar={
				<TableToolbar
					searchValue={list.globalFilter}
					onSearchChange={(q) => list.setFilters({ q: q.trim() || undefined })}
					searchPlaceholder="Search payment methods..."
					filters={[
						{
							key: 'type',
							label: 'Type',
							value: search.type,
							onChange: (value) =>
								list.setFilters({ type: value as PaymentMethodTypeEnum | undefined }),
							options: PAYMENT_METHOD_TYPE_OPTIONS,
							allLabel: 'All Types',
						},
					]}
				/>
			}
		/>
	)
}
