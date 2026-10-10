import { MinusIcon, PlusIcon, Trash2Icon } from 'lucide-react'

import { CurrencyDisplay } from '@/components/shared/currency-display.tsx'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export interface CartLine {
	menuItemId: number
	menuItemName: string
	qty: number
	/** Catalog base price from the menu item DTO — display only, never summed (ADR-0017). */
	unitPrice: string
	modifierOptionIds: number[]
	modifierNames: string[]
	notes: string | null
}

interface OrderCartProps {
	lines: CartLine[]
	onUpdateQty: (menuItemId: number, modifierKey: string, qty: number) => void
	onRemoveLine: (menuItemId: number, modifierKey: string) => void
	/** Server-returned voucher discount; `null` when no voucher is applied. */
	discountAmount: string | null
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
	discountAmount,
	voucherCode,
	onRemoveVoucher,
	onOpenPayment,
	onOpenVoucher,
	disabled,
}: OrderCartProps) {
	return (
		<div className="flex h-full flex-col rounded-lg border bg-card">
			<div className="border-b px-4 py-3">
				<h3 className="font-heading text-sm font-semibold tracking-tight">Pesanan</h3>
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
							return (
								<div key={key} className="flex items-start gap-2 py-2.5">
									<div className="flex-1 min-w-0">
										<p className="text-xs font-medium truncate">{line.menuItemName}</p>
										{line.modifierNames.length > 0 && (
											<p className="text-xs text-muted-foreground truncate">
												{line.modifierNames.join(', ')}
											</p>
										)}
										{line.notes && (
											<p className="text-xs italic text-muted-foreground truncate">{line.notes}</p>
										)}
										<CurrencyDisplay
											value={line.unitPrice}
											className="mt-0.5 block font-mono text-xs text-muted-foreground"
										/>
									</div>
									<div className="flex items-center gap-1">
										<Button
											variant="outline"
											size="icon-sm"
											onClick={() => onUpdateQty(line.menuItemId, key, line.qty - 1)}
											disabled={disabled}
										>
											<MinusIcon className="size-3" />
										</Button>
										<span className="w-6 text-center font-mono text-xs font-medium tabular-nums">
											{line.qty}
										</span>
										<Button
											variant="outline"
											size="icon-sm"
											onClick={() => onUpdateQty(line.menuItemId, key, line.qty + 1)}
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
								</div>
							)
						})}
					</div>
				)}
			</ScrollArea>

			<div className="border-t px-4 py-3">
				{/* Order money is server-authoritative (ADR-0017): totals are computed
				    by the server when the cart is synced at payment, never here. */}
				<div className="space-y-1 font-mono text-xs tabular-nums">
					<div className="flex justify-between">
						<span className="font-sans text-muted-foreground">Subtotal</span>
						<span className="text-muted-foreground">Dihitung saat bayar</span>
					</div>
					{discountAmount !== null && (
						<div className="flex justify-between text-success">
							<span className="flex items-center gap-1 font-sans">
								Diskon
								{voucherCode && <span className="text-xs">({voucherCode})</span>}
							</span>
							<span>
								-<CurrencyDisplay value={discountAmount} />
							</span>
						</div>
					)}
					<div className="flex justify-between">
						<span className="font-sans text-muted-foreground">Pajak</span>
						<span className="text-muted-foreground">Dihitung saat bayar</span>
					</div>
					<Separator />
					<div className="flex justify-between text-sm font-semibold">
						<span className="font-sans">Total</span>
						<span className="text-muted-foreground">Dihitung saat bayar</span>
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
						<Button variant="ghost" size="sm" onClick={onRemoveVoucher} disabled={disabled}>
							Hapus
						</Button>
					)}
				</div>

				<Button
					className="mt-2 w-full"
					size="sm"
					onClick={onOpenPayment}
					disabled={disabled || lines.length === 0}
				>
					Bayar
				</Button>
			</div>
		</div>
	)
}
