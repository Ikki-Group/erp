import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { BanIcon, EyeIcon } from 'lucide-react'
import { z } from 'zod'

import { listSearchSchema, useServerTable } from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import type { DateRange } from '@/components/shared/date-range-filter'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { StatusBadge } from '@/components/shared/status-badge'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'

import { orderResource } from '@/features/pos/api.ts'
import { OrderReceipt } from '@/features/pos/components/order-receipt.tsx'
import { OrderStatusEnum } from '@/features/pos/dto/index.ts'
import type { OrderDetailDto, OrderDto } from '@/features/pos/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

const ordersSearchSchema = listSearchSchema
	.extend({ status: OrderStatusEnum.optional() })
	.extend({ pageSize: z.coerce.number().int().min(1).max(100).catch(20).default(20) })

export const Route = createFileRoute('/_authenticated/pos/orders')({
	validateSearch: ordersSearchSchema,
	component: OrdersPage,
})

// ─── Table Columns ───

const col = createColumnHelper<DataGridFeatures, OrderDto>()

const baseColumns = [
	col.accessor('orderNo', {
		header: 'No. Order',
		size: 120,
	}),
	col.accessor('status', {
		header: 'Status',
		size: 100,
		cell: ({ getValue }) => {
			const status = getValue()
			const variant =
				status === 'completed' ? 'success' : status === 'voided' ? 'destructive' : 'warning'
			const label = status === 'completed' ? 'Selesai' : status === 'voided' ? 'Void' : 'Open'
			return <StatusBadge variant={variant}>{label}</StatusBadge>
		},
	}),
	col.accessor('type', {
		header: 'Tipe',
		size: 90,
		cell: ({ getValue }) => (getValue() === 'dine_in' ? 'Dine In' : 'Takeaway'),
	}),
	col.accessor('total', {
		header: 'Total',
		size: 130,
		cell: ({ getValue }) => `Rp ${Number(getValue()).toLocaleString('id-ID')}`,
	}),
	col.accessor('orderedAt', {
		header: 'Waktu',
		size: 160,
		cell: ({ getValue }) => new Date(getValue()).toLocaleString('id-ID'),
	}),
]

// ─── Order Row Actions ───

function OrderActions({
	order,
	canVoid,
	onView,
	onVoid,
}: {
	order: OrderDto
	canVoid: boolean
	onView: (order: OrderDto) => void
	onVoid: (order: OrderDto) => void
}) {
	return (
		<div className="flex items-center gap-1">
			<Button variant="ghost" size="icon-sm" onClick={() => onView(order)}>
				<EyeIcon className="size-3.5" />
			</Button>
			{order.status === 'completed' && canVoid && (
				<Button variant="ghost" size="icon-sm" onClick={() => onVoid(order)}>
					<BanIcon className="size-3.5 text-destructive" />
				</Button>
			)}
		</div>
	)
}

// ─── Page Component ───

function OrdersPage() {
	const { activeLocation } = useLocationContext()
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const locationId = activeLocation?.id
	const canVoid = usePermissionCheck({ permission: 'order.void' })

	const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
	const [selectedOrder, setSelectedOrder] = useState<OrderDetailDto | null>(null)
	const [showReceipt, setShowReceipt] = useState(false)
	const [showVoidDialog, setShowVoidDialog] = useState(false)
	const [voidOrderId, setVoidOrderId] = useState<number | null>(null)
	const [voidReason, setVoidReason] = useState('')

	const queryClient = useQueryClient()

	const listQuery = useQuery({
		...orderResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			status: search.status,
			locationId: locationId!,
			dateFrom: dateRange?.from.toISOString(),
			dateTo: dateRange?.to.toISOString(),
		}),
		enabled: !!locationId,
	})

	const voidMut = useMutation(orderResource.void.mutationOptions())

	// Server filters by date range (OrderFilterDto.dateFrom/dateTo), so the page
	// and total count both honor the active range — no client-side slicing.
	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const handleViewOrder = useCallback(
		async (order: OrderDto) => {
			try {
				const result = await queryClient.fetchQuery(
					orderResource.detail.queryOptions({ id: order.id }),
				)
				setSelectedOrder(result.data as OrderDetailDto)
				setShowReceipt(true)
			} catch {
				toast.add({ title: 'Gagal memuat detail order', type: 'error' })
			}
		},
		[queryClient],
	)

	const handleVoidOrder = useCallback((order: OrderDto) => {
		setVoidOrderId(order.id)
		setVoidReason('')
		setShowVoidDialog(true)
	}, [])

	const handleConfirmVoid = useCallback(async () => {
		if (!voidOrderId || voidReason.trim().length < 3) return
		try {
			await voidMut.mutateAsync({ orderId: voidOrderId, reason: voidReason.trim() })
			toast.add({ title: 'Order berhasil di-void', type: 'success' })
			setShowVoidDialog(false)
		} catch {
			toast.add({ title: 'Gagal void order', type: 'error' })
		}
	}, [voidOrderId, voidReason, voidMut])

	// ─── Action column ───
	const actionsColumn = useMemo(() => {
		return col.display({
			id: 'actions',
			size: 100,
			// oxlint-disable-next-line react/no-unstable-nested-components
			cell: ({ row }) => (
				<OrderActions
					order={row.original}
					canVoid={canVoid}
					onView={handleViewOrder}
					onVoid={handleVoidOrder}
				/>
			),
		})
	}, [canVoid, handleViewOrder, handleVoidOrder])

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, OrderDto>[],
		[actionsColumn],
	)

	const { table, globalFilter } = useServerTable({
		data,
		columns,
		totalCount,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})

	if (!locationId) {
		return (
			<div className="space-y-6">
				<PageHeader title="Riwayat Order" description="Daftar order POS." />
				<EmptyState
					title="Tidak ada lokasi dipilih"
					description="Pilih lokasi untuk melihat riwayat order."
				/>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<PageHeader title="Riwayat Order" description="Daftar order POS untuk lokasi ini." />

			{data.length === 0 && !listQuery.isLoading && !globalFilter && !search.status ? (
				<EmptyState title="Belum ada order" description="Order yang dibuat akan muncul di sini." />
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="Tidak ada order ditemukan."
					toolbar={
						<TableToolbar
							searchValue={globalFilter}
							onSearchChange={(value) => table.setGlobalFilter(value)}
							searchPlaceholder="Cari no. order..."
							filters={[
								{
									key: 'status',
									label: 'Status',
									value: search.status,
									onChange: (v) =>
										navigate({
											search: {
												...search,
												page: 1,
												status: v as OrderDto['status'] | undefined,
											},
										}),
									options: [
										{ label: 'Open', value: 'open' },
										{ label: 'Selesai', value: 'completed' },
										{ label: 'Void', value: 'voided' },
									],
									allLabel: 'All status',
								},
							]}
							dateRange={{
								key: 'orderedAt',
								label: 'Tanggal',
								value: dateRange,
								onChange: (v) => {
									setDateRange(v)
									if (search.page !== 1) navigate({ search: { ...search, page: 1 } })
								},
								placeholder: 'Filter tanggal order',
							}}
						/>
					}
				/>
			)}

			{/* Receipt viewer */}
			<OrderReceipt
				open={showReceipt}
				onOpenChange={setShowReceipt}
				order={selectedOrder}
				locationName={activeLocation?.name ?? ''}
			/>

			{/* Void confirmation */}
			<Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
				<DialogContent className="sm:max-w-xs">
					<DialogHeader>
						<DialogTitle>Void Order</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						<Label className="text-xs">Alasan void (min. 3 karakter)</Label>
						<Input
							value={voidReason}
							onChange={(e) => setVoidReason(e.target.value)}
							placeholder="Masukkan alasan..."
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" size="sm" onClick={() => setShowVoidDialog(false)}>
							Batal
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={handleConfirmVoid}
							disabled={voidReason.trim().length < 3 || voidMut.isPending}
						>
							Void
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
