import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import type { PaymentMethod, PaymentItem } from '@/features/pos/types/payment'

interface PaymentDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	total: number
	onComplete: (payments: PaymentItem[]) => void
}

export function PaymentDialog({ open, onOpenChange, total, onComplete }: PaymentDialogProps) {
	const [payments, setPayments] = useState<PaymentItem[]>([])
	const [currentMethod, setCurrentMethod] = useState<PaymentMethod>('cash')
	const [currentAmount, setCurrentAmount] = useState('')

	const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
	const remaining = total - totalPaid
	const change = totalPaid - total

	const handleAddPayment = () => {
		const amount = Number.parseFloat(currentAmount)
		if (amount > 0) {
			setPayments([...payments, { method: currentMethod, amount }])
			setCurrentAmount('')
		}
	}

	const handleRemovePayment = (index: number) => {
		setPayments(payments.filter((_, i) => i !== index))
	}

	const handleComplete = () => {
		if (totalPaid >= total) {
			onComplete(payments)
			setPayments([])
			setCurrentAmount('')
			onOpenChange(false)
		}
	}

	const quickAmounts = [total, total * 2, 50000, 100000, 500000]

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Pembayaran</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="flex items-center justify-between text-lg font-semibold">
						<span>Total Tagihan</span>
						<span>Rp {total.toLocaleString('id-ID')}</span>
					</div>
					<div className="flex items-center justify-between">
						<span>Sudah Bayar</span>
						<span className="font-semibold">Rp {totalPaid.toLocaleString('id-ID')}</span>
					</div>
					<div className="flex items-center justify-between">
						<span>Sisa</span>
						<span className={remaining > 0 ? 'text-destructive' : 'text-emerald-600'}>
							Rp {remaining.toLocaleString('id-ID')}
						</span>
					</div>
					{change > 0 && (
						<div className="flex items-center justify-between text-emerald-600">
							<span>Kembalian</span>
							<span className="font-semibold">Rp {change.toLocaleString('id-ID')}</span>
						</div>
					)}
					<hr />
					<div className="space-y-2">
						<div className="flex gap-2">
							<select
								className="flex-1 rounded-md border px-3 py-2"
								value={currentMethod}
								onChange={(e) => setCurrentMethod(e.target.value as PaymentMethod)}
							>
								<option value="cash">Cash</option>
								<option value="card">Kartu</option>
								<option value="transfer">Transfer</option>
								<option value="e-wallet">E-Wallet</option>
							</select>
							<Input
								type="number"
								placeholder="Nominal"
								value={currentAmount}
								onChange={(e) => setCurrentAmount(e.target.value)}
								className="flex-1"
							/>
							<Button onClick={handleAddPayment}>Tambah</Button>
						</div>
						<div className="flex flex-wrap gap-2">
							{quickAmounts.map((amount) => (
								<Button
									key={amount}
									variant="outline"
									size="sm"
									onClick={() => setCurrentAmount(amount.toString())}
								>
									{amount.toLocaleString('id-ID')}
								</Button>
							))}
						</div>
					</div>
					{payments.length > 0 && (
						<div className="space-y-2">
							<p className="text-sm font-semibold">Pembayaran:</p>
							{payments.map((payment, index) => (
								<div key={index} className="flex items-center justify-between rounded border p-2">
									<span>
										{payment.method}: Rp {payment.amount.toLocaleString('id-ID')}
									</span>
									<Button variant="ghost" size="sm" onClick={() => handleRemovePayment(index)}>
										×
									</Button>
								</div>
							))}
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Batal
					</Button>
					<Button onClick={handleComplete} disabled={totalPaid < total}>
						Selesai
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
