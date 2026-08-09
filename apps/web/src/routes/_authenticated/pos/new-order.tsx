import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { AlertTriangleIcon, TicketIcon } from 'lucide-react'

import { InlineAlert } from '@/components/shared/inline-alert.tsx'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'

import type { MenuItemDto } from '@/features/menu/dto/index.ts'
import { orderResource, shiftResource } from '@/features/pos/api.ts'
import { MenuGrid } from '@/features/pos/components/menu-grid.tsx'
import { ModifierDialog } from '@/features/pos/components/modifier-dialog.tsx'
import type { ModifierSelection } from '@/features/pos/components/modifier-dialog.tsx'
import { type CartLine, getModifierKey, OrderCart } from '@/features/pos/components/order-cart.tsx'
import { OrderReceipt } from '@/features/pos/components/order-receipt.tsx'
import { PaymentDialog } from '@/features/pos/components/payment-dialog.tsx'
import type { PaymentEntry } from '@/features/pos/components/payment-dialog.tsx'
import type { OrderDetailDto } from '@/features/pos/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/pos/new-order')({
	component: NewOrderPage,
})

const TAX_RATE = 0.11

function NewOrderPage() {
	const { activeLocation } = useLocationContext()
	const locationId = activeLocation?.id ?? 0
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	// ─── Shift check ───
	const activeShiftQuery = useQuery({
		...shiftResource.active.queryOptions(undefined as never),
		queryKey: shiftResource.keys.active(locationId),
		enabled: locationId > 0,
	})
	const activeShift = activeShiftQuery.data?.data ?? null

	// ─── Cart state ───
	const [lines, setLines] = useState<CartLine[]>([])
	const [voucherCode, setVoucherCode] = useState<string | null>(null)
	const [discountAmount, setDiscountAmount] = useState(0)

	// ─── Dialog states ───
	const [modifierItem, setModifierItem] = useState<MenuItemDto | null>(null)
	const [showModifierDialog, setShowModifierDialog] = useState(false)
	const [showPaymentDialog, setShowPaymentDialog] = useState(false)
	const [showVoucherDialog, setShowVoucherDialog] = useState(false)
	const [showReceiptDialog, setShowReceiptDialog] = useState(false)
	const [completedOrder, setCompletedOrder] = useState<OrderDetailDto | null>(null)
	const [voucherInput, setVoucherInput] = useState('')

	// ─── Mutations ───
	const createMut = useMutation(orderResource.create.mutationOptions())
	const linesSyncMut = useMutation(orderResource.linesSync.mutationOptions())
	const voucherApplyMut = useMutation(orderResource.voucherApply.mutationOptions())
	const voucherRemoveMut = useMutation(orderResource.voucherRemove.mutationOptions())
	const paymentMut = useMutation(orderResource.payment.mutationOptions())
	const completeMut = useMutation(orderResource.complete.mutationOptions())

	// ─── Computed totals ───
	const subtotal = useMemo(
		() => lines.reduce((sum, line) => sum + (line.unitPrice + line.modifierTotal) * line.qty, 0),
		[lines],
	)
	const taxAmount = Math.round((subtotal - discountAmount) * TAX_RATE)
	const total = subtotal - discountAmount + taxAmount

	// ─── Menu item selected ───
	const handleSelectItem = useCallback((item: MenuItemDto) => {
		setModifierItem(item)
		setShowModifierDialog(true)
	}, [])

	// ─── Modifier confirmed (or item has no modifiers) ───
	const handleModifierConfirm = useCallback((item: MenuItemDto, selection: ModifierSelection) => {
		setLines((prev) => {
			const newLine: CartLine = {
				menuItemId: item.id,
				menuItemName: item.name,
				qty: 1,
				unitPrice: Number(item.basePrice),
				modifierOptionIds: selection.optionIds,
				modifierNames: selection.optionNames,
				modifierTotal: selection.priceTotal,
				notes: null,
			}
			const key = getModifierKey(newLine)
			const existingIdx = prev.findIndex((l) => getModifierKey(l) === key)
			if (existingIdx >= 0) {
				const updated = [...prev]
				const existing = updated[existingIdx]!
				updated[existingIdx] = {
					...existing,
					qty: existing.qty + 1,
				}
				return updated
			}
			return [...prev, newLine]
		})
	}, [])

	// ─── Cart actions ───
	const handleUpdateQty = useCallback((_menuItemId: number, key: string, qty: number) => {
		if (qty <= 0) {
			setLines((prev) => prev.filter((l) => getModifierKey(l) !== key))
		} else {
			setLines((prev) => prev.map((l) => (getModifierKey(l) === key ? { ...l, qty } : l)))
		}
	}, [])

	const handleRemoveLine = useCallback((_menuItemId: number, key: string) => {
		setLines((prev) => prev.filter((l) => getModifierKey(l) !== key))
	}, [])

	// ─── Order lifecycle ───
	const [currentOrderId, setCurrentOrderId] = useState<number | null>(null)

	const createOrderIfNeeded = useCallback(async (): Promise<number | null> => {
		if (currentOrderId) return currentOrderId
		if (!locationId || !activeShift) return null
		try {
			const result = await createMut.mutateAsync({
				locationId,
				type: 'dine_in',
			})
			const orderId = result.data.id
			setCurrentOrderId(orderId)
			return orderId
		} catch {
			toast.add({ title: 'Gagal membuat order', type: 'error' })
			return null
		}
	}, [currentOrderId, locationId, activeShift, createMut])

	// ─── Voucher ───
	const handleApplyVoucher = useCallback(async () => {
		if (!voucherInput.trim()) return
		try {
			const orderId = await createOrderIfNeeded()
			if (!orderId) return
			const result = await voucherApplyMut.mutateAsync({
				orderId,
				voucherCode: voucherInput.trim(),
			})
			if (result.data.applied) {
				setVoucherCode(voucherInput.trim())
				setDiscountAmount(result.data.discountAmount ?? 0)
				toast.add({ title: 'Voucher berhasil diterapkan', type: 'success' })
			} else {
				toast.add({ title: result.data.reason ?? 'Voucher tidak valid', type: 'error' })
			}
		} catch {
			toast.add({ title: 'Gagal menerapkan voucher', type: 'error' })
		}
		setShowVoucherDialog(false)
		setVoucherInput('')
	}, [voucherInput, voucherApplyMut, createOrderIfNeeded])

	const handleRemoveVoucher = useCallback(async () => {
		if (!currentOrderId) return
		try {
			await voucherRemoveMut.mutateAsync({ orderId: currentOrderId })
			setVoucherCode(null)
			setDiscountAmount(0)
			toast.add({ title: 'Voucher dihapus', type: 'success' })
		} catch {
			toast.add({ title: 'Gagal menghapus voucher', type: 'error' })
		}
	}, [currentOrderId, voucherRemoveMut])

	// ─── Payment flow ───
	const handlePaymentConfirm = useCallback(
		async (payments: PaymentEntry[]) => {
			try {
				const orderId = await createOrderIfNeeded()
				if (!orderId) return

				// Sync lines
				await linesSyncMut.mutateAsync({
					orderId,
					lines: lines.map((l) => ({
						menuItemId: l.menuItemId,
						qty: l.qty,
						modifierOptionIds: l.modifierOptionIds.length > 0 ? l.modifierOptionIds : undefined,
						notes: l.notes,
					})),
				})

				// Record each payment
				for (const payment of payments) {
					await paymentMut.mutateAsync({
						orderId,
						paymentMethodId: payment.paymentMethodId,
						amount: payment.amount,
						reference: payment.reference,
					})
				}

				// Complete order
				await completeMut.mutateAsync({ orderId })

				// Fetch completed order for receipt
				const detail = await queryClient.fetchQuery(
					orderResource.detail.queryOptions({ id: orderId }),
				)
				setCompletedOrder(detail.data as OrderDetailDto)
				setShowReceiptDialog(true)

				// Reset state
				setLines([])
				setVoucherCode(null)
				setDiscountAmount(0)
				setCurrentOrderId(null)

				toast.add({ title: 'Pembayaran berhasil!', type: 'success' })
			} catch {
				toast.add({ title: 'Gagal memproses pembayaran', type: 'error' })
			}
		},
		[createOrderIfNeeded, linesSyncMut, paymentMut, completeMut, lines, queryClient],
	)

	const isBusy =
		createMut.isPending || linesSyncMut.isPending || paymentMut.isPending || completeMut.isPending

	// ─── No shift guard ───
	if (!activeShift && !activeShiftQuery.isLoading) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4 p-8">
				<AlertTriangleIcon className="size-12 text-muted-foreground" />
				<div className="text-center">
					<h2 className="text-sm font-semibold">Tidak Ada Shift Aktif</h2>
					<p className="mt-1 text-xs text-muted-foreground">
						Buka shift terlebih dahulu sebelum membuat pesanan.
					</p>
				</div>
				<Button size="sm" variant="outline" onClick={() => navigate({ to: '/pos/shifts' })}>
					Buka Shift
				</Button>
			</div>
		)
	}

	return (
		<div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4 lg:flex-row">
			{/* Left: Menu Grid */}
			<div className="flex-1 overflow-hidden">
				<MenuGrid onSelectItem={handleSelectItem} />
			</div>

			{/* Right: Cart */}
			<div className="w-full flex-shrink-0 lg:w-[380px]">
				<OrderCart
					lines={lines}
					onUpdateQty={handleUpdateQty}
					onRemoveLine={handleRemoveLine}
					subtotal={subtotal}
					discountAmount={discountAmount}
					taxAmount={taxAmount}
					total={total}
					voucherCode={voucherCode}
					onRemoveVoucher={handleRemoveVoucher}
					onOpenPayment={() => setShowPaymentDialog(true)}
					onOpenVoucher={() => setShowVoucherDialog(true)}
					disabled={isBusy}
				/>
			</div>

			{/* Modifier Dialog */}
			<ModifierDialog
				open={showModifierDialog}
				onOpenChange={setShowModifierDialog}
				menuItem={modifierItem}
				onConfirm={handleModifierConfirm}
			/>

			{/* Payment Dialog */}
			<PaymentDialog
				open={showPaymentDialog}
				onOpenChange={setShowPaymentDialog}
				orderTotal={total}
				onConfirm={handlePaymentConfirm}
			/>

			{/* Voucher Dialog */}
			<Dialog open={showVoucherDialog} onOpenChange={setShowVoucherDialog}>
				<DialogContent className="sm:max-w-xs">
					<DialogHeader>
						<DialogTitle>
							<TicketIcon className="mr-1.5 inline-block size-4" />
							Kode Voucher
						</DialogTitle>
					</DialogHeader>
					<Input
						value={voucherInput}
						onChange={(e) => setVoucherInput(e.target.value)}
						placeholder="Masukkan kode voucher"
						onKeyDown={(e) => {
							if (e.key === 'Enter') handleApplyVoucher()
						}}
					/>
					{voucherApplyMut.isPending && (
						<InlineAlert variant="info">Memvalidasi voucher...</InlineAlert>
					)}
					<DialogFooter>
						<Button variant="outline" size="sm" onClick={() => setShowVoucherDialog(false)}>
							Batal
						</Button>
						<Button
							size="sm"
							onClick={handleApplyVoucher}
							disabled={!voucherInput.trim() || voucherApplyMut.isPending}
						>
							Terapkan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Receipt Dialog */}
			<OrderReceipt
				open={showReceiptDialog}
				onOpenChange={setShowReceiptDialog}
				order={completedOrder}
				locationName={activeLocation?.name ?? ''}
			/>
		</div>
	)
}
