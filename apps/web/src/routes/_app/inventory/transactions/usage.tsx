import { formOptions } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { toastLabelMessage } from '@/lib/toast-message'

import { CardSection } from '@/components/blocks/card/card-section'
import { FormConfig, useAppForm, useTypedAppFormContext } from '@/components/form'
import { Page } from '@/components/layout/page'

import { Button } from '@/components/ui/button'

import { stockTransactionApi } from '@/features/inventory'
import { locationApi } from '@/features/location'
import type { LocationDto } from '@/features/location/dto'
import { materialLocationApi } from '@/features/material/api/material-location.api'
import type { MaterialLocationStockDto } from '@/features/material/dto'

import { PlusIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import z from 'zod'

export const Route = createFileRoute('/_app/inventory/transactions/usage')({
	component: RouteComponent,
})

const FormDto = z.object({
	locationId: z.number().min(1, 'Lokasi wajib dipilih'),
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
	defaultValues: getDefaultValues(),
})

function getDefaultValues(): FormDto {
	return {
		locationId: null!,
		date: new Date(),
		referenceNo: '',
		notes: '',
		items: [{ materialId: null!, qty: 0 }],
	} as FormDto
}

function RouteComponent() {
	const navigate = useNavigate()

	const submitMut = useMutation({ mutationFn: stockTransactionApi.usage.mutationFn })

	const form = useAppForm({
		...fopts,
		onSubmit: async ({ value }) => {
			const promise = submitMut.mutateAsync({ body: value })

			await toast.promise(promise, toastLabelMessage('create', 'pemakaian bahan')).unwrap()

			void navigate({ to: '/inventory/transactions' })
		},
	})

	return (
		<form.AppForm>
			<FormConfig mode="create" backTo={{ to: '/inventory/transactions' }}>
				<Page size="sm">
					<Page.BlockHeader
						title="Pemakaian Bahan"
						description="Formulir pencatatan pemakaian bahan baku yang akan mengurangi stok."
						back={{ to: '/inventory/transactions' }}
					/>
					<form.Form>
						<Page.Content className="flex flex-col gap-6 max-w-4xl">
							<UsageInfoCard />
							<UsageItemsCard />
							<form.SimpleActions />
						</Page.Content>
					</form.Form>
				</Page>
			</FormConfig>
		</form.AppForm>
	)
}

function UsageInfoCard() {
	const form = useTypedAppFormContext({ ...fopts })

	return (
		<CardSection title="Informasi Pemakaian">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<form.AppField name="locationId">
					{(field) => (
						<field.Combobox
							label="Lokasi Gudang"
							required
							placeholder="Pilih lokasi"
							emptyText="Lokasi tidak ditemukan"
							queryKey={['location-list']}
							queryFn={async (search) => {
								const res = await locationApi.list.fetch({
									params: { page: 1, limit: 20, q: search || undefined },
								})
								return res.data
							}}
							getLabel={(loc: LocationDto) => `${loc.name} (${loc.code})`}
							getValue={(loc: LocationDto) => loc.id.toString()}
						/>
					)}
				</form.AppField>
				<form.AppField name="date">
					{(field) => <field.DatePicker label="Tanggal Penyesuaian" required />}
				</form.AppField>
				<form.AppField name="referenceNo">
					{(field) => (
						<field.Base label="No. Referensi" required>
							<field.Input placeholder="ADJ/2026/001" />
						</field.Base>
					)}
				</form.AppField>
				<form.AppField name="notes">
					{(field) => (
						<field.Base label="Catatan" className="md:col-span-2">
							<field.Textarea placeholder="Alasan penyesuaian (misal: stok fisik berbeda)" />
						</field.Base>
					)}
				</form.AppField>
			</div>
		</CardSection>
	)
}

function UsageItemsCard() {
	const form = useTypedAppFormContext({ ...fopts })

	return (
		<CardSection title="Daftar Bahan Baku" description="Masukkan angka kuantitas yang dipakai.">
			<div className="flex flex-col gap-4">
				<form.Subscribe
					selector={(s) => ({ items: s.values.items, locationId: s.values.locationId })}
				>
					{({ items, locationId }) => (
						<>
							{items.map((item, i) => (
								<div key={item.materialId || i} className="flex gap-3">
									<div className="flex-1">
										<form.AppField name={`items[${i}].materialId`}>
											{(field) => (
												<field.Combobox
													label={i === 0 ? 'Pilih Bahan Baku' : undefined}
													required
													placeholder="Ketik nama barang..."
													emptyText="Tidak ditemukan"
													queryKey={['material-list', String(locationId)]}
													queryFn={async (search) => {
														if (!locationId) return []
														const res = await materialLocationApi.stock.fetch({
															params: {
																locationId: locationId,
																page: 1,
																limit: 20,
																q: search || undefined,
															},
														})
														return res.data
													}}
													getLabel={(mat: MaterialLocationStockDto) =>
														`${mat.materialName} (${mat.materialSku})`
													}
													getValue={(mat: MaterialLocationStockDto) => mat.materialId.toString()}
												/>
											)}
										</form.AppField>
									</div>

									<div className="w-48">
										<form.AppField name={`items[${i}].qty`}>
											{(field) => (
												<field.Number label={i === 0 ? 'Kuantitas' : undefined} required min={1} />
											)}
										</form.AppField>
									</div>

									<Button
										type="button"
										variant="destructive"
										size="icon"
										className={i === 0 ? 'mt-8' : ''}
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
									curr.push({ materialId: null!, qty: 0 })
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
