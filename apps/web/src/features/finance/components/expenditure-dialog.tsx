import * as React from 'react'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryOptions } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputCurrency } from '@/components/ui/input-currency'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { DataCombobox } from '@/components/ui/data-combobox'

import { expenditureApi } from '../api/finance-expenditure.api'
import { accountApi } from '../api/finance.api'
import { supplierApi } from '@/features/supplier/api/supplier.api'
import { locationApi } from '@/features/location/api/location.api'

import {
	ExpenditureCreateDto,
	ExpenditureTypeEnum,
} from '../dto/expenditure.dto'

interface ExpenditureDialogProps {
	children?: React.ReactNode
}

export function ExpenditureDialog({ children }: ExpenditureDialogProps) {
	const [open, setOpen] = React.useState(false)
	const [activeType, setActiveType] = React.useState<ExpenditureTypeEnum>('BILLS')
	const queryClient = useQueryClient()

	const form = useForm<ExpenditureCreateDto>({
		resolver: zodResolver(ExpenditureCreateDto),
		defaultValues: {
			type: 'BILLS',
			status: 'PAID',
			date: new Date(),
			amount: 0,
			isInstallment: false,
		},
	})

	const { mutate, isPending } = useMutation({
		mutationFn: expenditureApi.create,
		onSuccess: () => {
			toast.success('Pengeluaran berhasil dicatat')
			queryClient.invalidateQueries({ queryKey: ['finance', 'expenditure'] })
			setOpen(false)
			form.reset()
		},
		onError: (err) => {
			toast.error('Gagal mencatat pengeluaran: ' + err.message)
		},
	})

	const onSubmit = (data: ExpenditureCreateDto) => {
		mutate(data)
	}

	// Query Factories for Comboboxes
	const accountOptions = (search: string) =>
		queryOptions({
			queryKey: ['finance', 'accounts', 'list', search],
			queryFn: () => accountApi.list({ search }),
			select: (res) => res.data,
		})

	const supplierOptions = (search: string) =>
		queryOptions({
			queryKey: ['suppliers', 'list', search],
			queryFn: () => supplierApi.list({ search }),
			select: (res) => res.data,
		})
        
    const locationOptions = (search: string) =>
		queryOptions({
			queryKey: ['locations', 'list', search],
			queryFn: () => locationApi.list({ search }),
			select: (res) => res.data,
		})

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children ?? (
					<Button size="sm" className="h-10 shadow-md font-medium">
						<PlusIcon className="size-4 mr-2" /> Catat Pengeluaran
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Catat Pengeluaran Baru</DialogTitle>
					<DialogDescription>
						Pilih tipe pengeluaran dan isi detail transaksi di bawah ini.
					</DialogDescription>
				</DialogHeader>

				<Tabs
					value={activeType}
					onValueChange={(val) => {
						const type = val as ExpenditureTypeEnum
						setActiveType(type)
						form.setValue('type', type)
					}}
					className="w-full"
				>
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="BILLS">Tagihan Bulanan</TabsTrigger>
						<TabsTrigger value="ASSET">Pembelian Aset</TabsTrigger>
						<TabsTrigger value="PURCHASES">Belanja Supplier</TabsTrigger>
					</TabsList>

					<div className="mt-6 space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<Field label="Judul Transaksi" error={form.formState.errors.title?.message}>
								<Input {...form.register('title')} placeholder="Contoh: Wifi Kantor Maret" />
							</Field>
							<Field label="Lokasi" error={form.formState.errors.locationId?.message}>
								<DataCombobox
									value={form.watch('locationId')?.toString()}
									onValueChange={(val) => form.setValue('locationId', Number(val))}
									queryOptionsFactory={locationOptions}
									getLabel={(item) => item.name}
									getValue={(item) => item.id.toString()}
									placeholder="Pilih Lokasi..."
								/>
							</Field>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<Field label="Nominal" error={form.formState.errors.amount?.message}>
								<InputCurrency
									value={form.watch('amount')}
									onValueChange={(val) => form.setValue('amount', val ?? 0)}
								/>
							</Field>
							<Field label="Kategori Akun (Debit)" error={form.formState.errors.targetAccountId?.message}>
								<DataCombobox
									value={form.watch('targetAccountId')?.toString()}
									onValueChange={(val) => form.setValue('targetAccountId', Number(val))}
									queryOptionsFactory={accountOptions}
									getLabel={(item) => `[${item.code}] ${item.name}`}
									getValue={(item) => item.id.toString()}
									placeholder="Pilih Akun Biaya/Aset..."
								/>
							</Field>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<Field label="Sumber Dana (Kredit)" error={form.formState.errors.sourceAccountId?.message}>
								<DataCombobox
									value={form.watch('sourceAccountId')?.toString()}
									onValueChange={(val) => form.setValue('sourceAccountId', Number(val))}
									queryOptionsFactory={accountOptions}
									getLabel={(item) => `[${item.code}] ${item.name}`}
									getValue={(item) => item.id.toString()}
									placeholder="Pilih Kas/Bank..."
								/>
							</Field>
							{activeType === 'PURCHASES' && (
								<Field label="Supplier" error={form.formState.errors.supplierId?.message}>
									<DataCombobox
										value={form.watch('supplierId')?.toString()}
										onValueChange={(val) => form.setValue('supplierId', Number(val))}
										queryOptionsFactory={supplierOptions}
										getLabel={(item) => item.name}
										getValue={(item) => item.id.toString()}
										placeholder="Pilih Supplier..."
									/>
								</Field>
							)}
						</div>

						{activeType === 'ASSET' && (
							<Card className="p-4 bg-secondary/20">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<label className="text-sm font-medium">Gunakan Cicilan?</label>
										<p className="text-xs text-muted-foreground">
											Aktifkan jika pembayaran dilakukan bertahap (Hutang).
										</p>
									</div>
									<Switch
										checked={form.watch('isInstallment')}
										onCheckedChange={(val) => form.setValue('isInstallment', val)}
									/>
								</div>
								{form.watch('isInstallment') && (
									<div className="mt-4">
										<Field label="Akun Hutang" error={form.formState.errors.liabilityAccountId?.message}>
											<DataCombobox
												value={form.watch('liabilityAccountId')?.toString()}
												onValueChange={(val) => form.setValue('liabilityAccountId', Number(val))}
												queryOptionsFactory={accountOptions}
												getLabel={(item) => `[${item.code}] ${item.name}`}
												getValue={(item) => item.id.toString()}
												placeholder="Pilih Akun Hutang Cicilan..."
											/>
										</Field>
									</div>
								)}
							</Card>
						)}
					</div>
				</Tabs>

				<DialogFooter className="mt-6">
					<Button variant="outline" onClick={() => setOpen(false)}>
						Batal
					</Button>
					<Button onClick={form.handleSubmit(onSubmit)} isLoading={isPending}>
						Simpan Transaksi
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
