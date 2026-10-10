import { PrinterIcon } from 'lucide-react'

import { CurrencyDisplay } from '@/components/shared/currency-display.tsx'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

import type { OrderDetailDto } from '@/features/pos/dto/index.ts'

interface OrderReceiptProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	order: OrderDetailDto | null
	locationName: string
}

export function OrderReceipt({ open, onOpenChange, order, locationName }: OrderReceiptProps) {
	if (!order) return null

	const handlePrint = () => {
		window.print()
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Struk Pesanan</DialogTitle>
				</DialogHeader>

				{/* The whole receipt renders in monospace — authentic to how a real thermal
				    receipt printer outputs text, and gives every amount tabular alignment
				    for free. The print-only override below shrinks further for thermal
				    paper, a different physical medium than the screen type ramp governs. */}
				<div
					id="receipt-content"
					className="space-y-3 font-mono text-xs tabular-nums print:text-[10px]"
				>
					<div className="text-center">
						<p className="font-semibold">{locationName}</p>
						<p className="text-muted-foreground">
							{new Date(order.orderedAt).toLocaleString('id-ID')}
						</p>
						<p className="text-muted-foreground">No: {order.orderNo}</p>
					</div>

					<Separator />

					<div className="space-y-1.5">
						{order.lines.map((line) => (
							<div key={line.id} className="flex justify-between gap-2">
								<div className="flex-1 min-w-0">
									<p className="truncate">{line.menuItemName}</p>
									<p className="text-muted-foreground">
										{Number(line.quantity)} x <CurrencyDisplay value={line.unitPrice} />
									</p>
								</div>
								<span className="flex-shrink-0">
									<CurrencyDisplay value={line.lineTotal} />
								</span>
							</div>
						))}
					</div>

					<Separator />

					<div className="space-y-1">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Subtotal</span>
							<span>
								<CurrencyDisplay value={order.subtotal} />
							</span>
						</div>
						{/[1-9]/u.test(order.discountAmount) && (
							<div className="flex justify-between text-success">
								<span>
									Diskon
									{order.voucherCode && ` (${order.voucherCode})`}
								</span>
								<span>
									-<CurrencyDisplay value={order.discountAmount} />
								</span>
							</div>
						)}
						{/[1-9]/u.test(order.taxAmount) && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Pajak</span>
								<span>
									<CurrencyDisplay value={order.taxAmount} />
								</span>
							</div>
						)}
						<Separator />
						<div className="flex justify-between font-semibold">
							<span>Total</span>
							<span>
								<CurrencyDisplay value={order.total} />
							</span>
						</div>
					</div>

					{order.payments.length > 0 && (
						<>
							<Separator />
							<div className="space-y-1">
								<p className="font-medium">Pembayaran:</p>
								{order.payments.map((payment) => (
									<div key={payment.id} className="flex justify-between">
										<span className="text-muted-foreground">#{payment.paymentMethodId}</span>
										<span>
											<CurrencyDisplay value={payment.amount} />
										</span>
									</div>
								))}
							</div>
						</>
					)}

					<Separator />

					<div className="text-center text-muted-foreground">
						<p>Terima kasih atas kunjungan Anda</p>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
						Tutup
					</Button>
					<Button size="sm" onClick={handlePrint}>
						<PrinterIcon className="mr-1.5 size-3.5" />
						Cetak
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
