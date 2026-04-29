import * as React from 'react'

import { formOptions } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import z from 'zod'

import { useAppForm } from '@/components/form'

import { ButtonLoading } from '@/components/ui/button-loading'
import { Card } from '@/components/ui/card'
import { DataCombobox } from '@/components/ui/data-combobox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { InputCurrency } from '@/components/ui/input-currency'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { locationApi } from '@/features/location/api/location.api'
import { supplierApi } from '@/features/supplier/api/supplier.api'

import { expenditureApi } from '../api/finance-expenditure.api'
import { accountApi } from '../api/finance.api'
import { ExpenditureTypeEnum } from '../dto/expenditure.dto'

const FormDto = z.object({
	type: ExpenditureTypeEnum,
	status: z.enum(['PENDING', 'PAID', 'VOID', 'REFUNDED']),
	title: z.string().min(1, 'Judul wajib diisi'),
	description: z.string().optional().nullable(),
	date: z.date(),
	amount: z.number().min(1, 'Nominal wajib diisi'),
	sourceAccountId: z.number().min(1, 'Pilih asal dana'),
	targetAccountId: z.number().min(1, 'Pilih kategori biaya/aset'),
	liabilityAccountId: z.number().optional().nullable(),
	supplierId: z.number().optional().nullable(),
	locationId: z.number().min(1, 'Lokasi wajib diisi'),
	isInstallment: z.boolean(),
})

interface ExpenditureDialogProps {
	children?: React.ReactNode
}

const fopts = formOptions({
	validators: { onSubmit: FormDto },
	defaultValues: {
		type: 'BILLS' as const,
		status: 'PAID' as const,
		title: '',
		description: null,
		date: new Date(),
		amount: 0,
		sourceAccountId: 0,
		targetAccountId: 0,
		liabilityAccountId: null,
		supplierId: null,
		locationId: 0,
		isInstallment: false,
	} as z.infer<typeof FormDto>,
})

export function ExpenditureDialog({ children }: ExpenditureDialogProps) {
	const [open, setOpen] = React.useState(false)
	const [activeType, setActiveType] = React.useState<ExpenditureTypeEnum>('BILLS')
	const queryClient = useQueryClient()

	const form = useAppForm({
		...fopts,
		defaultValues: {
			type: 'BILLS' as const,
			status: 'PAID' as const,
			title: '',
			description: null,
			date: new Date(),
			amount: 0,
			sourceAccountId: 0,
			targetAccountId: 0,
			liabilityAccountId: null,
			supplierId: null,
			locationId: 0,
			isInstallment: false,
		} as z.infer<typeof FormDto>,
	})

	const { isPending } = useMutation({
		mutationFn: (data: z.infer<typeof FormDto>) => expenditureApi.create.fetch({ body: data }),
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

	// Query Factories for Comboboxes
	const accountOptions = (search: string) => ({
		queryKey: ['finance', 'accounts', 'list', search],
		queryFn: () => accountApi.list.query({ q: search }),
	})

	const supplierOptions = (search: string) => ({
		queryKey: ['suppliers', 'list', search],
		queryFn: () => supplierApi.list.query({ q: search }),
	})

	const locationOptions = (search: string) => ({
		queryKey: ['locations', 'list', search],
		queryFn: () => locationApi.list.query({ q: search }),
	})

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>
				{children ?? (
					<ButtonLoading size="sm" className="h-10 shadow-md font-medium">
						<PlusIcon className="size-4 mr-2" /> Catat Pengeluaran
					</ButtonLoading>
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
						form.setFieldValue('type', type)
					}}
					className="w-full"
				>
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="BILLS">Tagihan Bulanan</TabsTrigger>
						<TabsTrigger value="ASSET">Pembelian Aset</TabsTrigger>
						<TabsTrigger value="PURCHASES">Belanja Supplier</TabsTrigger>
					</TabsList>

					<form>
						<form.Field name="title">
							{(field) => (
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium">Judul Transaksi</label>
										<Input
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Contoh: Wifi Kantor Maret"
										/>
										{field.state.meta.errors && (
											<p className="text-sm text-destructive">
												{typeof field.state.meta.errors[0] === 'string'
													? field.state.meta.errors[0]
													: 'Invalid'}
											</p>
										)}
									</div>
									<form.Field name="locationId">
										{(field) => (
											<div>
												<label className="text-sm font-medium">Lokasi</label>
												<DataCombobox
													value={field.state.value?.toString()}
													onValueChange={(val) => field.handleChange(Number(val))}
													queryOptionsFactory={locationOptions}
													getLabel={(item: any) => item.name}
													getValue={(item: any) => item.id.toString()}
													placeholder="Pilih Lokasi..."
												/>
												{field.state.meta.errors && (
													<p className="text-sm text-destructive">
														{typeof field.state.meta.errors[0] === 'string'
															? field.state.meta.errors[0]
															: 'Invalid'}
													</p>
												)}
											</div>
										)}
									</form.Field>
								</div>
							)}
						</form.Field>

						<div className="grid grid-cols-2 gap-4">
							<form.Field name="amount">
								{(field) => (
									<div>
										<label className="text-sm font-medium">Nominal</label>
										<InputCurrency
											value={field.state.value}
											onChange={(val) => field.handleChange(val ?? 0)}
										/>
										{field.state.meta.errors && (
											<p className="text-sm text-destructive">
												{typeof field.state.meta.errors[0] === 'string'
													? field.state.meta.errors[0]
													: 'Invalid'}
											</p>
										)}
									</div>
								)}
							</form.Field>
							<form.Field name="targetAccountId">
								{(field) => (
									<div>
										<label className="text-sm font-medium">Kategori Akun (Debit)</label>
										<DataCombobox
											value={field.state.value?.toString()}
											onValueChange={(val) => field.handleChange(Number(val))}
											queryOptionsFactory={accountOptions}
											getLabel={(item: any) => `[${item.code}] ${item.name}`}
											getValue={(item: any) => item.id.toString()}
											placeholder="Pilih Akun Biaya/Aset..."
										/>
										{field.state.meta.errors && (
											<p className="text-sm text-destructive">
												{typeof field.state.meta.errors[0] === 'string'
													? field.state.meta.errors[0]
													: 'Invalid'}
											</p>
										)}
									</div>
								)}
							</form.Field>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<form.Field name="sourceAccountId">
								{(field) => (
									<div>
										<label className="text-sm font-medium">Sumber Dana (Kredit)</label>
										<DataCombobox
											value={field.state.value?.toString()}
											onValueChange={(val) => field.handleChange(Number(val))}
											queryOptionsFactory={accountOptions}
											getLabel={(item: any) => `[${item.code}] ${item.name}`}
											getValue={(item: any) => item.id.toString()}
											placeholder="Pilih Kas/Bank..."
										/>
										{field.state.meta.errors && (
											<p className="text-sm text-destructive">
												{typeof field.state.meta.errors[0] === 'string'
													? field.state.meta.errors[0]
													: 'Invalid'}
											</p>
										)}
									</div>
								)}
							</form.Field>
							{activeType === 'PURCHASES' && (
								<form.Field name="supplierId">
									{(field) => (
										<div>
											<label className="text-sm font-medium">Supplier</label>
											<DataCombobox
												value={field.state.value?.toString()}
												onValueChange={(val) => field.handleChange(Number(val))}
												queryOptionsFactory={supplierOptions}
												getLabel={(item: any) => item.name}
												getValue={(item: any) => item.id.toString()}
												placeholder="Pilih Supplier..."
											/>
											{field.state.meta.errors && (
												<p className="text-sm text-destructive">
													{typeof field.state.meta.errors[0] === 'string'
														? field.state.meta.errors[0]
														: 'Invalid'}
												</p>
											)}
										</div>
									)}
								</form.Field>
							)}
						</div>

						{activeType === 'ASSET' && (
							<Card className="p-4 bg-secondary/20">
								<form.Field name="isInstallment">
									{(field) => (
										<>
											<div className="flex items-center justify-between">
												<div className="space-y-0.5">
													<label className="text-sm font-medium">Gunakan Cicilan?</label>
													<p className="text-xs text-muted-foreground">
														Aktifkan jika pembayaran dilakukan bertahap (Hutang).
													</p>
												</div>
												<Switch
													checked={field.state.value}
													onCheckedChange={(val) => field.handleChange(val)}
												/>
											</div>
											{field.state.value && (
												<div className="mt-4">
													<form.Field name="liabilityAccountId">
														{(field) => (
															<div>
																<label className="text-sm font-medium">Akun Hutang</label>
																<DataCombobox
																	value={field.state.value?.toString()}
																	onValueChange={(val) => field.handleChange(Number(val))}
																	queryOptionsFactory={accountOptions}
																	getLabel={(item: any) => `[${item.code}] ${item.name}`}
																	getValue={(item: any) => item.id.toString()}
																	placeholder="Pilih Akun Hutang Cicilan..."
																/>
																{field.state.meta.errors && (
																	<p className="text-sm text-destructive">
																		{typeof field.state.meta.errors[0] === 'string'
																			? field.state.meta.errors[0]
																			: 'Invalid'}
																	</p>
																)}
															</div>
														)}
													</form.Field>
												</div>
											)}
										</>
									)}
								</form.Field>
							</Card>
						)}
					</form>
				</Tabs>

				<DialogFooter className="mt-6">
					<ButtonLoading variant="outline" onClick={() => setOpen(false)}>
						Batal
					</ButtonLoading>
					<ButtonLoading
						loading={isPending}
						onClick={() => {
							form.handleSubmit()
						}}
					>
						Simpan Transaksi
					</ButtonLoading>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
