import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { BanIcon, EyeIcon } from 'lucide-react'

import { DataTable } from '@/components/data-table/data-table'
import { useServerTable } from '@/components/data-table/use-server-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'

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
import type { OrderDetailDto, OrderDto } from '@/features/pos/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/pos/orders')({
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
	onView,
	onVoid,
}: {
	order: OrderDto
	onView: (order: OrderDto) => void
	onVoid: (order: OrderDto) => void
}) {
	return (
		<div className="flex items-center gap-1">
			<Button variant="ghost" size="icon-sm" onClick={() => onView(order)}>
				<EyeIcon className="size-3.5" />
			</Button>
			{order.status === 'completed' && (
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
	const locationId = activeLocation?.id

	const [listParams, setListParams] = useState({ page: 1, limit: 20 })
	const [selectedOrder, setSelectedOrder] = useState<OrderDetailDto | null>(null)
	const [showReceipt, setShowReceipt] = useState(false)
	const [showVoidDialog, setShowVoidDialog] = useState(false)
	const [voidOrderId, setVoidOrderId] = useState<number | null>(null)
	const [voidReason, setVoidReason] = useState('')

	const queryClient = useQueryClient()

	const listQuery = useQuery({
		...orderResource.list.queryOptions({
			...listParams,
			locationId: locationId!,
			q: '',
		}),
		enabled: !!locationId,
	})

	const voidMut = useMutation(orderResource.void.mutationOptions())

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
			cell: ({ row }) => (
				<OrderActions order={row.original} onView={handleViewOrder} onVoid={handleVoidOrder} />
			),
		})
	}, [handleViewOrder, handleVoidOrder])

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, OrderDto>[],
		[actionsColumn],
	)

	const { table } = useServerTable({
		data,
		columns,
		totalCount,
		pageSize: listParams.limit,
		onStateChange: (params) => {
			setListParams({ page: params.page + 1, limit: params.pageSize })
		},
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

			{data.length === 0 && !listQuery.isLoading ? (
				<EmptyState title="Belum ada order" description="Order yang dibuat akan muncul di sini." />
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="Tidak ada order ditemukan."
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
