import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { format, isPast } from 'date-fns'
import { EditIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { z } from 'zod'

import { listSearchSchema, useServerTable } from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { ActionMenu } from '@/components/shared/action-menu'
import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { voucherResource } from '@/features/pos/api.ts'
import type { VoucherDto } from '@/features/pos/dto/index.ts'

// Active/inactive filter as an explicit "true"/"false" enum in the URL — NOT
// `z.coerce.boolean` (which makes any non-empty string, including "false", true).
// Kept as the string enum so the URL, navigate(), and the dropdown all agree on
// one type; converted to a real boolean only at the query call. Absent = "All".
const vouchersSearchSchema = listSearchSchema.extend({
	isActive: z.enum(['true', 'false']).optional(),
})

export const Route = createFileRoute('/_authenticated/pos/vouchers/')({
	validateSearch: vouchersSearchSchema,
	component: VouchersPage,
})

// ─── Helpers ───

function getVoucherStatus(voucher: VoucherDto) {
	if (!voucher.isActive) return { label: 'Inactive', variant: 'outline' as const }
	if (isPast(new Date(voucher.validUntil)))
		return { label: 'Expired', variant: 'destructive' as const }
	if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit)
		return { label: 'Exhausted', variant: 'secondary' as const }
	return { label: 'Active', variant: 'default' as const }
}

function formatUsage(voucher: VoucherDto) {
	if (voucher.usageLimit === null) return `${voucher.usageCount} / Unlimited`
	return `${voucher.usageCount} / ${voucher.usageLimit}`
}

const STATUS_FILTER_OPTIONS = [
	{ label: 'Active', value: 'true' },
	{ label: 'Inactive', value: 'false' },
] as const

// ─── Table Columns ───

const col = createColumnHelper<DataGridFeatures, VoucherDto>()

const baseColumns = [
	col.accessor('code', {
		header: 'Code',
		size: 140,
		cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span>,
	}),
	col.accessor('name', {
		header: 'Name',
		size: 200,
	}),
	col.accessor('type', {
		header: 'Type',
		size: 110,
		cell: ({ getValue }) => (
			<Badge variant="secondary" className="capitalize">
				{getValue()}
			</Badge>
		),
	}),
	col.accessor('value', {
		header: 'Value',
		size: 100,
		cell: ({ row }) => {
			const v = row.original
			return v.type === 'percentage'
				? `${v.value}%`
				: `Rp ${Number(v.value).toLocaleString('id-ID')}`
		},
	}),
	col.display({
		id: 'validity',
		header: 'Validity',
		size: 180,
		cell: ({ row }) => {
			const v = row.original
			return (
				<span className="text-xs text-muted-foreground">
					{format(new Date(v.validFrom), 'dd MMM yy')} —{' '}
					{format(new Date(v.validUntil), 'dd MMM yy')}
				</span>
			)
		},
	}),
	col.display({
		id: 'usage',
		header: 'Usage',
		size: 120,
		cell: ({ row }) => <span className="text-xs">{formatUsage(row.original)}</span>,
	}),
	col.display({
		id: 'status',
		header: 'Status',
		size: 100,
		cell: ({ row }) => {
			const status = getVoucherStatus(row.original)
			return <Badge variant={status.variant}>{status.label}</Badge>
		},
	}),
]

// ─── Page Component ───

function VouchersPage() {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const canManage = usePermissionCheck({ permission: 'voucher.manage' })

	const listQuery = useQuery(
		voucherResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			isActive: search.isActive === undefined ? undefined : search.isActive === 'true',
		}),
	)
	const removeMut = useMutation(voucherResource.remove.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const handleDelete = useCallback(
		async (item: VoucherDto) => {
			await confirm({
				title: 'Delete voucher?',
				description: `This will permanently delete "${item.code}" (${item.name}). This action cannot be undone.`,
				confirmLabel: 'Delete',
				variant: 'destructive',
				onConfirm: async () => {
					await removeMut.mutateAsync({ id: item.id })
					toast.add({ title: 'Voucher deleted.', type: 'success' })
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
			// oxlint-disable-next-line react/no-unstable-nested-components
			cell: ({ row }) => {
				if (!canManage) return null
				return (
					<ActionMenu
						items={[
							{
								label: 'Edit',
								icon: <EditIcon className="size-4" />,
								onClick: () =>
									navigate({
										to: '/pos/vouchers/$voucherId',
										params: { voucherId: String(row.original.id) },
									}),
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
	}, [canManage, handleDelete, navigate])

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, VoucherDto>[],
		[actionsColumn],
	)

	const { table, globalFilter } = useServerTable({
		data,
		columns,
		totalCount,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})

	const isEmpty = !listQuery.isLoading && data.length === 0 && !globalFilter

	return (
		<div className="space-y-6">
			<PageHeader
				title="Vouchers"
				description="Manage discount vouchers for POS checkout."
				actions={
					canManage ? (
						<Button size="sm" onClick={() => navigate({ to: '/pos/vouchers/new' })}>
							<PlusIcon className="size-4" />
							Add Voucher
						</Button>
					) : undefined
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No vouchers yet"
					description="Get started by creating your first discount voucher."
					action={
						canManage ? (
							<Button size="sm" onClick={() => navigate({ to: '/pos/vouchers/new' })}>
								<PlusIcon className="size-4" />
								Add Voucher
							</Button>
						) : undefined
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No vouchers match your search."
					toolbar={
						<TableToolbar
							searchValue={globalFilter}
							onSearchChange={(value) => table.setGlobalFilter(value)}
							searchPlaceholder="Search vouchers..."
							filters={[
								{
									key: 'isActive',
									label: 'Status',
									value: search.isActive,
									onChange: (v) =>
										navigate({
											search: { ...search, page: 1, isActive: v as 'true' | 'false' | undefined },
										}),
									options: STATUS_FILTER_OPTIONS,
									allLabel: 'All',
								},
							]}
						/>
					}
				/>
			)}
		</div>
	)
}
