import { useCallback, useRef, useState } from 'react'

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

function NewOrderPage() {
	const { activeLocation } = useLocationContext()
	const locationId = activeLocation?.id ?? 0
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	// ─── Shift check ───
	// The active-shift key is location-scoped inside the endpoint (folds the
	// active locationId), so no manual queryKey override is needed here.
	const activeShiftQuery = useQuery({
		...shiftResource.active.queryOptions(),
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
	// Authoritative total for the open payment dialog, from the server order
	// after lines are synced. Null until the cart has been synced for payment.
	const [paymentTotal, setPaymentTotal] = useState<number | null>(null)

	// ─── Mutations ───
	const createMut = useMutation(orderResource.create.mutationOptions())
	const linesSyncMut = useMutation(orderResource.linesSync.mutationOptions())
	const voucherApplyMut = useMutation(orderResource.voucherApply.mutationOptions())
	const voucherRemoveMut = useMutation(orderResource.voucherRemove.mutationOptions())
	const paymentMut = useMutation(orderResource.payment.mutationOptions())
	const completeMut = useMutation(orderResource.complete.mutationOptions())

	// ─── Order money is server-authoritative (ADR-0017) ───
	// The client computes NO order money — not subtotal, tax, or total. The
	// server calculates and persists them on `lines/sync` and returns them on the
	// order detail. The cart shows the whole money summary as pending until the
	// order is synced at payment time, when the authoritative total drives the
	// payment dialog. Per-line catalog prices (rendered inside each cart row) are
	// server-provided prices, which the ADR permits displaying.
	// ponytail: sync-at-payment keeps the cart money summary pending until "Bayar".
	// Upgrade path is a debounced live lines/sync so the cart shows the server
	// totals as the cart is edited — deferred to avoid a per-keystroke sync.

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
	// Synchronous re-entrancy guard: React state (isBusy/currentOrderId) only
	// updates on the next render, so two fast clicks on "Bayar" would both pass a
	// state-based check and create two orders. A ref flips synchronously.
	const paymentInFlight = useRef(false)

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
	// Opening payment syncs the cart to the server first, then reads the
	// authoritative total back (server computes tax/total via company tax rate —
	// ADR-0017). The payment dialog collects against that server total, never a
	// client-computed one.
	const handleOpenPayment = useCallback(async () => {
		if (paymentInFlight.current) return
		paymentInFlight.current = true
		try {
			const orderId = await createOrderIfNeeded()
			if (!orderId) return

			await linesSyncMut.mutateAsync({
				orderId,
				lines: lines.map((l) => ({
					menuItemId: l.menuItemId,
					qty: l.qty,
					modifierOptionIds: l.modifierOptionIds.length > 0 ? l.modifierOptionIds : undefined,
					notes: l.notes,
				})),
			})

			const detail = await queryClient.fetchQuery(
				orderResource.detail.queryOptions({ id: orderId }),
			)
			setPaymentTotal(Number(detail.data.total))
			setShowPaymentDialog(true)
		} catch {
			toast.add({ title: 'Gagal menyiapkan pembayaran', type: 'error' })
		} finally {
			paymentInFlight.current = false
		}
	}, [createOrderIfNeeded, linesSyncMut, lines, queryClient])

	const handlePaymentConfirm = useCallback(
		async (payments: PaymentEntry[]) => {
			if (!currentOrderId) return
			const orderId = currentOrderId
			try {
				// Lines were already synced when the payment dialog opened; just
				// record payments and complete against the server-authoritative order.
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
				setPaymentTotal(null)

				toast.add({ title: 'Pembayaran berhasil!', type: 'success' })
			} catch {
				toast.add({ title: 'Gagal memproses pembayaran', type: 'error' })
			}
		},
		[currentOrderId, paymentMut, completeMut, queryClient],
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
					subtotal={null}
					discountAmount={discountAmount}
					taxAmount={null}
					total={null}
					voucherCode={voucherCode}
					onRemoveVoucher={handleRemoveVoucher}
					onOpenPayment={handleOpenPayment}
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
				onOpenChange={(open) => {
					setShowPaymentDialog(open)
					if (!open) setPaymentTotal(null)
				}}
				orderTotal={paymentTotal ?? 0}
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
