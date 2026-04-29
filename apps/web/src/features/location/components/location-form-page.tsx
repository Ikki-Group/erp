import { formOptions } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { LinkOptions } from '@tanstack/react-router'

import { SparklesIcon } from 'lucide-react'
import { toast } from 'sonner'
import z from 'zod'

import { toCodeCase } from '@/lib/formatter'
import { toastLabelMessage } from '@/lib/toast-message'

import { CardSection } from '@/components/blocks/card/card-section'
import { FormConfig, useAppForm } from '@/components/form'
import { Page } from '@/components/layout/page'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { locationApi } from '../api'
import type { LocationDto } from '../dto'

const FormDto = z.object({
	name: z.string().min(1),
	code: z.string().min(3),
	type: z.enum(['store', 'warehouse']),
	address: z.string().optional().nullable(),
	phone: z.string().optional().nullable(),
	description: z.string().optional().nullable(),
	isActive: z.boolean(),
})

type FormDto = z.infer<typeof FormDto>

function getDefaultValues(v?: LocationDto): FormDto {
	return {
		name: v?.name ?? '',
		code: v?.code ?? '',
		type: v?.type ?? 'store',
		address: v?.address ?? '',
		phone: v?.phone ?? '',
		description: v?.description ?? '',
		isActive: v?.isActive ?? true,
	}
}

const fopts = formOptions({ validators: { onSubmit: FormDto }, defaultValues: {} as FormDto })

interface LocationFormPageProps {
	mode: 'create' | 'update'
	id?: number
	backTo?: LinkOptions
}

export function LocationFormPage({ mode, id, backTo }: LocationFormPageProps) {
	const isCreate = id === undefined
	const navigate = useNavigate()

	const selectedLocation = useQuery({ ...locationApi.detail.query({ id: id! }), enabled: !!id })

	const create = useMutation({ mutationFn: locationApi.create.mutationFn })
	const update = useMutation({ mutationFn: locationApi.update.mutationFn })

	const form = useAppForm({
		...fopts,
		defaultValues: getDefaultValues(selectedLocation.data?.data),
		onSubmit: async ({ value }) => {
			const payload = {
				name: value.name,
				code: value.code,
				type: value.type,
				isActive: value.isActive,
				address: value.address ?? null,
				phone: value.phone ?? null,
				description: value.description ?? null,
			}
			const promise = isCreate
				? create.mutateAsync({ body: payload })
				: update.mutateAsync({ body: { id: Number(id), ...payload } })

			await toast.promise(promise, toastLabelMessage(mode, 'location')).unwrap()

			if (backTo) {
				navigate({ ...backTo, replace: true })
			}
		},
	})

	return (
		<form.AppForm>
			<FormConfig mode={mode} id={id} backTo={backTo}>
				<Page size="sm">
					<Page.BlockHeader title={isCreate ? 'Tambah Lokasi' : 'Edit Lokasi'} back={backTo} />
					<form.Form>
						<Page.Content className="space-y-6">
							<CardSection
								title="Informasi Lokasi"
								description="Detail identitas dan alamat lokasi."
							>
								<form.AppField name="name">
									{(field) => (
										<field.Input label="Nama Lokasi" required placeholder="Nama Lokasi" />
									)}
								</form.AppField>
								<form.AppField name="code">
									{(field) => (
										<field.Base label="Kode Lokasi" required>
											<div className="flex gap-2">
												<field.Control>
													<Input
														placeholder="Kode Lokasi"
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
														onBlur={field.handleBlur}
														className="uppercase"
													/>
												</field.Control>
												<form.Subscribe selector={(s) => s.values.name}>
													{(name) => {
														const canGenerate = (name?.length ?? 0) > 3
														return (
															<Button
																type="button"
																variant="outline"
																size="icon-sm"
																className="shrink-0"
																onClick={() => {
																	field.handleChange(toCodeCase(name || ''))
																}}
																disabled={!canGenerate}
																title="Generate kode dari nama"
															>
																<SparklesIcon />
															</Button>
														)
													}}
												</form.Subscribe>
											</div>
										</field.Base>
									)}
								</form.AppField>
								<form.AppField name="type">
									{(field) => (
										<field.Select
											label="Tipe Lokasi"
											required
											placeholder="Pilih tipe lokasi..."
											options={[
												{ label: 'Toko', value: 'store' },
												{ label: 'Warehouse', value: 'warehouse' },
											]}
										/>
									)}
								</form.AppField>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<form.AppField name="address">
										{(field) => <field.Input label="Alamat" placeholder="Alamat lengkap..." />}
									</form.AppField>
									<form.AppField name="phone">
										{(field) => (
											<field.Input label="Nomor Telepon" placeholder="Contoh: 08123456789" />
										)}
									</form.AppField>
								</div>
								<form.AppField name="description">
									{(field) => (
										<field.Textarea label="Deskripsi" placeholder="Deskripsi Lokasi..." />
									)}
								</form.AppField>
							</CardSection>
							<CardSection title="Status">
								<form.AppField name="isActive">
									{(field) => (
										<field.Switch
											label="Status Aktif"
											description="Lokasi dapat diakses oleh pengguna"
										/>
									)}
								</form.AppField>
							</CardSection>
							<form.SimpleActions />
						</Page.Content>
					</form.Form>
				</Page>
			</FormConfig>
		</form.AppForm>
	)
}
