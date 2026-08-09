import { useCallback, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { PlusIcon, Trash2Icon } from 'lucide-react'

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
import { Separator } from '@/components/ui/separator'

import { paymentMethodByLocation } from '@/features/payment-method/api.ts'
import type { PaymentMethodDto } from '@/features/payment-method/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

export interface PaymentEntry {
	paymentMethodId: number
	paymentMethodName: string
	amount: number
	reference: string | null
}

interface PaymentDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	orderTotal: number
	onConfirm: (payments: PaymentEntry[]) => void
}

export function PaymentDialog({ open, onOpenChange, orderTotal, onConfirm }: PaymentDialogProps) {
	const { activeLocation } = useLocationContext()
	const locationId = activeLocation?.id ?? 0

	const [entries, setEntries] = useState<PaymentEntry[]>([])

	const methodsQuery = useQuery({
		...paymentMethodByLocation.query.queryOptions({ locationId }),
		enabled: open && locationId > 0,
	})

	const methods: PaymentMethodDto[] = methodsQuery.data?.data ?? []

	const totalPaid = entries.reduce((sum, e) => sum + e.amount, 0)
	const remaining = orderTotal - totalPaid
	const change = totalPaid > orderTotal ? totalPaid - orderTotal : 0
	const canComplete = totalPaid >= orderTotal && entries.length > 0

	const addEntry = useCallback(
		(method: PaymentMethodDto) => {
			setEntries((prev) => [
				...prev,
				{
					paymentMethodId: method.id,
					paymentMethodName: method.name,
					amount: remaining > 0 ? remaining : 0,
					reference: null,
				},
			])
		},
		[remaining],
	)

	const updateAmount = useCallback((index: number, amount: number) => {
		setEntries((prev) =>
			prev.map((e, i) => (i === index ? { ...e, amount: Math.max(0, amount) } : e)),
		)
	}, [])

	const updateReference = useCallback((index: number, reference: string) => {
		setEntries((prev) =>
			prev.map((e, i) => (i === index ? { ...e, reference: reference || null } : e)),
		)
	}, [])

	const removeEntry = useCallback((index: number) => {
		setEntries((prev) => prev.filter((_, i) => i !== index))
	}, [])

	const handleConfirm = useCallback(() => {
		const validEntries = entries.filter((e) => e.amount > 0)
		onConfirm(validEntries)
		setEntries([])
		onOpenChange(false)
	}, [entries, onConfirm, onOpenChange])

	const handleClose = useCallback(() => {
		setEntries([])
		onOpenChange(false)
	}, [onOpenChange])

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Pembayaran</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
						<span className="text-xs text-muted-foreground">Total Tagihan</span>
						<span className="text-sm font-semibold">
							Rp {orderTotal.toLocaleString('id-ID')}
						</span>
					</div>

					{entries.length > 0 && (
						<div className="space-y-2">
							{entries.map((entry, index) => (
								<div
									key={index}
									className="flex items-center gap-2 rounded-md border p-2"
								>
									<div className="flex-1 space-y-1">
										<p className="text-xs font-medium">
											{entry.paymentMethodName}
										</p>
										<Input
											type="number"
											value={entry.amount || ''}
											onChange={(e) =>
												updateAmount(index, Number(e.target.value))
											}
											placeholder="Jumlah"
											className="h-7 text-xs"
										/>
										{methods.find((m) => m.id === entry.paymentMethodId)
											?.type === 'digital' && (
											<Input
												value={entry.reference ?? ''}
												onChange={(e) =>
													updateReference(index, e.target.value)
												}
												placeholder="Referensi (opsional)"
												className="h-7 text-xs"
											/>
										)}
									</div>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={() => removeEntry(index)}
									>
										<Trash2Icon className="size-3.5 text-destructive" />
									</Button>
								</div>
							))}
						</div>
					)}

					<div>
						<Label className="text-xs text-muted-foreground">
							Tambah Metode Pembayaran
						</Label>
						<div className="mt-1.5 flex flex-wrap gap-1.5">
							{methods
								.filter((m) => m.isActive)
								.map((method) => (
									<Button
										key={method.id}
										variant="outline"
										size="sm"
										onClick={() => addEntry(method)}
									>
										<PlusIcon className="mr-1 size-3" />
										{method.name}
									</Button>
								))}
						</div>
					</div>

					<Separator />

					<div className="space-y-1 text-xs">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Dibayar</span>
							<span>Rp {totalPaid.toLocaleString('id-ID')}</span>
						</div>
						{remaining > 0 && (
							<div className="flex justify-between text-destructive">
								<span>Kurang</span>
								<span>Rp {remaining.toLocaleString('id-ID')}</span>
							</div>
						)}
						{change > 0 && (
							<div className="flex justify-between font-medium text-green-600">
								<span>Kembalian</span>
								<span>Rp {change.toLocaleString('id-ID')}</span>
							</div>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" size="sm" onClick={handleClose}>
						Batal
					</Button>
					<Button size="sm" onClick={handleConfirm} disabled={!canComplete}>
						Selesaikan Pembayaran
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
