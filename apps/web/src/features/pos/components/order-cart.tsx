import { MinusIcon, PlusIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export interface CartLine {
	menuItemId: number
	menuItemName: string
	qty: number
	unitPrice: number
	modifierOptionIds: number[]
	modifierNames: string[]
	modifierTotal: number
	notes: string | null
}

interface OrderCartProps {
	lines: CartLine[]
	onUpdateQty: (menuItemId: number, modifierKey: string, qty: number) => void
	onRemoveLine: (menuItemId: number, modifierKey: string) => void
	subtotal: number
	discountAmount: number
	taxAmount: number
	total: number
	voucherCode: string | null
	onRemoveVoucher: () => void
	onOpenPayment: () => void
	onOpenVoucher: () => void
	disabled?: boolean
}

export function getModifierKey(line: CartLine): string {
	return `${line.menuItemId}:${line.modifierOptionIds.sort().join(',')}`
}

export function OrderCart({
	lines,
	onUpdateQty,
	onRemoveLine,
	subtotal,
	discountAmount,
	taxAmount,
	total,
	voucherCode,
	onRemoveVoucher,
	onOpenPayment,
	onOpenVoucher,
	disabled,
}: OrderCartProps) {
	return (
		<div className="flex h-full flex-col rounded-lg border bg-card">
			<div className="border-b px-4 py-3">
				<h3 className="text-sm font-semibold">Pesanan</h3>
			</div>

			<ScrollArea className="flex-1 px-4">
				{lines.length === 0 ? (
					<div className="flex h-32 items-center justify-center text-muted-foreground">
						Belum ada item
					</div>
				) : (
					<div className="divide-y">
						{lines.map((line) => {
							const key = getModifierKey(line)
							const lineTotal =
								(line.unitPrice + line.modifierTotal) * line.qty
							return (
								<div key={key} className="flex items-start gap-2 py-2.5">
									<div className="flex-1 min-w-0">
										<p className="text-xs font-medium truncate">
											{line.menuItemName}
										</p>
										{line.modifierNames.length > 0 && (
											<p className="text-[11px] text-muted-foreground truncate">
												{line.modifierNames.join(', ')}
											</p>
										)}
										{line.notes && (
											<p className="text-[11px] italic text-muted-foreground truncate">
												{line.notes}
											</p>
										)}
										<p className="mt-0.5 text-xs text-muted-foreground">
											Rp {line.unitPrice.toLocaleString('id-ID')}
											{line.modifierTotal > 0 &&
												` + ${line.modifierTotal.toLocaleString('id-ID')}`}
										</p>
									</div>
									<div className="flex items-center gap-1">
										<Button
											variant="outline"
											size="icon-sm"
											onClick={() =>
												onUpdateQty(line.menuItemId, key, line.qty - 1)
											}
											disabled={disabled}
										>
											<MinusIcon className="size-3" />
										</Button>
										<span className="w-6 text-center text-xs font-medium">
											{line.qty}
										</span>
										<Button
											variant="outline"
											size="icon-sm"
											onClick={() =>
												onUpdateQty(line.menuItemId, key, line.qty + 1)
											}
											disabled={disabled}
										>
											<PlusIcon className="size-3" />
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => onRemoveLine(line.menuItemId, key)}
											disabled={disabled}
										>
											<Trash2Icon className="size-3 text-destructive" />
										</Button>
									</div>
									<span className="w-20 text-right text-xs font-medium">
										Rp {lineTotal.toLocaleString('id-ID')}
									</span>
								</div>
							)
						})}
					</div>
				)}
			</ScrollArea>

			<div className="border-t px-4 py-3">
				<div className="space-y-1 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Subtotal</span>
						<span>Rp {subtotal.toLocaleString('id-ID')}</span>
					</div>
					{discountAmount > 0 && (
						<div className="flex justify-between text-green-600">
							<span className="flex items-center gap-1">
								Diskon
								{voucherCode && (
									<span className="text-[10px]">({voucherCode})</span>
								)}
							</span>
							<span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
						</div>
					)}
					<div className="flex justify-between">
						<span className="text-muted-foreground">Pajak</span>
						<span>Rp {taxAmount.toLocaleString('id-ID')}</span>
					</div>
					<Separator />
					<div className="flex justify-between text-sm font-semibold">
						<span>Total</span>
						<span>Rp {total.toLocaleString('id-ID')}</span>
					</div>
				</div>

				<div className="mt-3 flex gap-2">
					<Button
						variant="outline"
						size="sm"
						className="flex-1"
						onClick={onOpenVoucher}
						disabled={disabled || lines.length === 0}
					>
						{voucherCode ? 'Ganti Voucher' : 'Voucher'}
					</Button>
					{voucherCode && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onRemoveVoucher}
							disabled={disabled}
						>
							Hapus
						</Button>
					)}
				</div>

				<Button
					className="mt-2 w-full"
					size="sm"
					onClick={onOpenPayment}
					disabled={disabled || lines.length === 0 || total <= 0}
				>
					Bayar — Rp {total.toLocaleString('id-ID')}
				</Button>
			</div>
		</div>
	)
}
