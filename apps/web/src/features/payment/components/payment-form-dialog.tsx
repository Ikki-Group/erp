import React from 'react'

import { useMutation } from '@tanstack/react-query'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import { paymentApi } from '../api'
import type { PaymentCreateDto, PaymentMethodDto, PaymentTypeDto } from '../dto'

interface PaymentFormDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess?: () => void
}

export function PaymentFormDialog({ open, onOpenChange, onSuccess }: PaymentFormDialogProps) {
	const [formData, setFormData] = React.useState<PaymentCreateDto>({
		type: 'receivable',
		date: new Date(),
		referenceNo: '',
		accountId: 1, // TODO: Get from context
		method: 'cash',
		amount: 0,
		notes: '',
	})

	const createMutation = useMutation({
		mutationFn: paymentApi.create.mutationFn,
		onSuccess: () => {
			toast.success('Pembayaran berhasil dibuat')
			onOpenChange(false)
			setFormData({
				type: 'receivable',
				date: new Date(),
				referenceNo: '',
				accountId: 1,
				method: 'cash',
				amount: 0,
				notes: '',
			})
			onSuccess?.()
		},
		onError: (error) => {
			toast.error('Gagal membuat pembayaran')
			console.error(String(error))
		},
	})

	const handleSubmit = (e: { preventDefault: () => void }) => {
		e.preventDefault()
		createMutation.mutate({ body: formData })
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Buat Pembayaran</DialogTitle>
					<DialogDescription>
						Isi formulir di bawah untuk membuat pembayaran baru.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="type">Tipe Pembayaran</Label>
						<Select
							value={formData.type}
							onValueChange={(value) => {
								if (value) setFormData({ ...formData, type: value as PaymentTypeDto })
							}}
						>
							<SelectTrigger id="type">
								<SelectValue placeholder="Pilih tipe pembayaran" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="receivable">Pemasukan</SelectItem>
								<SelectItem value="payable">Pengeluaran</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="date">Tanggal</Label>
						<Input
							id="date"
							type="date"
							value={formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : ''}
							onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="referenceNo">No. Referensi</Label>
						<Input
							id="referenceNo"
							placeholder="Masukkan nomor referensi"
							value={formData.referenceNo ?? ''}
							onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="method">Metode Pembayaran</Label>
						<Select
							value={formData.method}
							onValueChange={(value) => {
								if (value) setFormData({ ...formData, method: value as PaymentMethodDto })
							}}
						>
							<SelectTrigger id="method">
								<SelectValue placeholder="Pilih metode pembayaran" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="cash">Tunai</SelectItem>
								<SelectItem value="bank_transfer">Transfer Bank</SelectItem>
								<SelectItem value="credit_card">Kartu Kredit</SelectItem>
								<SelectItem value="debit_card">Kartu Debit</SelectItem>
								<SelectItem value="e_wallet">E-Wallet</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="amount">Jumlah</Label>
						<Input
							id="amount"
							type="number"
							placeholder="Masukkan jumlah"
							value={formData.amount || ''}
							onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="notes">Catatan</Label>
						<Textarea
							id="notes"
							placeholder="Masukkan catatan"
							value={formData.notes ?? ''}
							onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
							rows={3}
						/>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Batal
						</Button>
						<Button type="submit" disabled={createMutation.isPending}>
							{createMutation.isPending ? 'Memproses...' : 'Simpan'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
