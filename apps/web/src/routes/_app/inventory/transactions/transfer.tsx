import { formOptions } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { PlusIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import z from 'zod'

import { toastLabelMessage } from '@/lib/toast-message'

import { CardSection } from '@/components/blocks/card/card-section'
import { FormConfig, useAppForm, useTypedAppFormContext } from '@/components/form'
import { Page } from '@/components/layout/page'

import { Button } from '@/components/ui/button'

import { stockTransactionApi } from '@/features/inventory'
// import { locationApi } from '@/features/location'
// import type { LocationDto } from '@/features/location/dto'
// import { materialLocationApi } from '@/features/material/api/material-location.api'
// import type { MaterialLocationStockDto } from '@/features/material/dto'

export const Route = createFileRoute('/_app/inventory/transactions/transfer')({
	component: RouteComponent,
})

const FormDto = z.object({
	sourceLocationId: z.number().min(1, 'Lokasi asal wajib dipilih'),
	destinationLocationId: z.number().min(1, 'Lokasi tujuan wajib dipilih'),
	date: z.coerce.date(),
	referenceNo: z.string().min(1, 'No. referensi wajib diisi'),
	notes: z.string().optional().nullable(),
	items: z
		.array(
			z.object({
				materialId: z.number().min(1, 'Bahan baku wajib dipilih'),
				qty: z.number().positive('Kuantitas harus positif'),
			}),
		)
		.min(1, 'Minimal satu item harus ditambahkan'),
})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({
	validators: { onSubmit: FormDto as any },
	defaultValues: {
		sourceLocationId: undefined as any,
		destinationLocationId: undefined as any,
		date: new Date(),
		referenceNo: '',
		notes: '',
		items: [{ materialId: undefined as any, qty: 1 }],
	} as FormDto,
})

function RouteComponent() {
	const navigate = useNavigate()

	const submitMut = useMutation({ mutationFn: stockTransactionApi.transfer.mutationFn })

	const form = useAppForm({
		...fopts,
		onSubmit: async ({ value }) => {
			// Clean up extra fields before submitting
			const sanitizedBody = {
				...value,
				items: value.items.map((i) => ({ materialId: i.materialId, qty: i.qty })),
			}

			const promise = submitMut.mutateAsync({ body: sanitizedBody })

			await toast.promise(promise, toastLabelMessage('create', 'transfer stok')).unwrap()

			void navigate({ to: '/inventory/transactions' })
		},
	})

	return (
		<form.AppForm>
			<FormConfig mode="create" backTo={{ to: '/inventory/transactions' }}>
				<Page size="sm">
					<Page.BlockHeader
						title="Transfer Stok"
						description="Formulir untuk memindahkan stok bahan baku antar lokasi."
						back={{ to: '/inventory/transactions' }}
					/>
					<form.Form>
						<Page.Content className="flex flex-col gap-6 max-w-4xl">
							<TransferInfoCard />
							<TransferItemsCard />
							<form.SimpleActions />
						</Page.Content>
					</form.Form>
				</Page>
			</FormConfig>
		</form.AppForm>
	)
}

function TransferInfoCard() {
	const form = useTypedAppFormContext({ ...fopts })

	return (
		<CardSection title="Informasi Transfer">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* <form.AppField name="sourceLocationId">
					{(field) => (
						<field.Combobox
							label="Lokasi Asal"
							required
							placeholder="Pilih lokasi asal"
							emptyText="Lokasi tidak ditemukan"
							queryKey={['location-list']}
							queryFn={async (search) => {
								const res = await locationApi.list.fetch({
									params: { page: 1, limit: 20, search: search ?? undefined },
								})
								return res.data
							}}
							getLabel={(loc: LocationDto) => `${loc.name} (${loc.code})`}
							getValue={(loc: LocationDto) => loc.id.toString()}
						/>
					)}
				</form.AppField> */}
				{/* <form.AppField name="destinationLocationId">
					{(field) => (
						<field.Combobox
							label="Lokasi Tujuan"
							required
							placeholder="Pilih lokasi tujuan"
							emptyText="Lokasi tidak ditemukan"
							queryKey={['location-list']}
							queryFn={async (search) => {
								const res = await locationApi.list.fetch({
									params: { page: 1, limit: 20, search: search ?? undefined },
								})
								return res.data
							}}
							getLabel={(loc: LocationDto) => `${loc.name} (${loc.code})`}
							getValue={(loc: LocationDto) => loc.id.toString()}
						/>
					)}
				</form.AppField> */}
				<form.AppField name="date">
					{(field) => <field.DatePicker label="Tanggal Transfer" required />}
				</form.AppField>
				<form.AppField name="referenceNo">
					{(field) => (
						<field.Base label="No. Referensi" required>
							<field.Input placeholder="TRF/2026/001" />
						</field.Base>
					)}
				</form.AppField>
				<form.AppField name="notes">
					{(field) => (
						<field.Base label="Catatan" className="md:col-span-2">
							<field.Textarea placeholder="Opsional..." />
						</field.Base>
					)}
				</form.AppField>
			</div>
		</CardSection>
	)
}

function TransferItemsCard() {
	const form = useTypedAppFormContext({ ...fopts })

	return (
		<CardSection
			title="Bahan Baku"
			description="Daftar bahan baku yang akan ditransfer ke lokasi tujuan."
		>
			<div className="flex flex-col gap-4">
				<form.Subscribe
					selector={(s) => ({ items: s.values.items, sourceLocationId: s.values.sourceLocationId })}
				>
					{/* oxlint-disable-next-line no-unused-vars */}
					{({ items, sourceLocationId }) => (
						<>
							{items.map((item, i) => (
								<div key={item.materialId || i} className="flex items-end gap-3">
									<div className="flex-1">
										{/* <form.AppField name={`items[${i}].materialId`}>
											{(field) => (
												<field.Combobox
													label={i === 0 ? 'Pilih Bahan Baku' : undefined}
													required
													placeholder="Ketik nama barang..."
													emptyText="Tidak ditemukan"
													queryKey={['material-list', String(sourceLocationId)]}
													queryFn={async (search) => {
														if (!sourceLocationId) return []
														const res = await materialLocationApi.stock.fetch({
															params: {
																locationId: sourceLocationId,
																page: 1,
																limit: 20,
																q: search ?? undefined,
															},
														})
														return res.data
													}}
													getLabel={(mat: MaterialLocationStockDto) =>
														`${mat.materialName} (${mat.materialSku})`
													}
													getValue={(mat: MaterialLocationStockDto) => mat.materialId.toString()}
													onItemSelect={(mat: MaterialLocationStockDto) => {
														const curr = [...items]
														;(curr[i] as any).maxQty = mat?.currentQty
														form.setFieldValue('items', curr as any)
													}}
												/>
											)}
										</form.AppField> */}
									</div>

									<div className="w-48">
										<form.AppField name={`items[${i}].qty`}>
											{(field) => (
												<field.Number
													label={i === 0 ? 'Jumlah' : undefined}
													required
													min={0}
													max={(item as any).maxQty}
													description={
														(item as any).maxQty !== undefined
															? `Maksimum: ${(item as any).maxQty}`
															: undefined
													}
												/>
											)}
										</form.AppField>
									</div>

									<Button
										type="button"
										variant="destructive"
										size="icon"
										onClick={() => {
											const curr = [...items]
											curr.splice(i, 1)
											form.setFieldValue('items', curr)
										}}
										disabled={items.length === 1}
									>
										<Trash2Icon className="size-4" />
									</Button>
								</div>
							))}

							<Button
								type="button"
								variant="outline"
								onClick={() => {
									const curr = [...items]
									curr.push({ materialId: undefined as any, qty: 1 })
									form.setFieldValue('items', curr)
								}}
							>
								<PlusIcon className="size-4 mr-2" />
								Tambah Baris
							</Button>
						</>
					)}
				</form.Subscribe>
			</div>
		</CardSection>
	)
}
