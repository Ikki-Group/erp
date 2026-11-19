import { Building2Icon, CircleCheckIcon, MapPinIcon, PhoneIcon } from 'lucide-react'
import { z } from 'zod'

import { useEntityEditor } from '@/lib/form/use-entity-editor'

import { locationResource } from '../api.ts'
import { LOCATION_TYPE_OPTIONS, LocationCreateDto, LocationTypeEnum } from '../dto/index.ts'
import type { LocationDto } from '../dto/index.ts'

export interface LocationFormValues {
	code: string
	name: string
	type: LocationTypeEnum
	address: string
	phone: string
	isActive: boolean
}

/**
 * Validates the form's own shape — see `docs/web/06-ui-patterns.md` for why
 * this is never the wire-contract `LocationCreateDto` directly. `address`/
 * `phone` are plain `string` here (empty text inputs) vs. the DTO's
 * `string | null | undefined`.
 */
const LocationFormSchema = z.object({
	code: z.string().trim().min(1, 'Kode wajib diisi').max(50),
	name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(100),
	type: LocationTypeEnum,
	address: z.string().trim().max(500).default(''),
	phone: z.string().trim().max(50).default(''),
	isActive: z.boolean(),
})

export const EMPTY_LOCATION_FORM_VALUES: LocationFormValues = {
	code: '',
	name: '',
	type: 'store',
	address: '',
	phone: '',
	isActive: true,
}

export function toLocationFormValues(location: LocationDto): LocationFormValues {
	return {
		code: location.code,
		name: location.name,
		type: location.type,
		address: location.address ?? '',
		phone: location.phone ?? '',
		isActive: location.isActive,
	}
}

export function toLocationInput(values: LocationFormValues): LocationCreateDto {
	return LocationCreateDto.parse(values)
}

export function useLocationForm({
	location,
	onSaved,
}: {
	location?: LocationDto
	onSaved: () => void | Promise<void>
}) {
	return useEntityEditor({
		defaultValues: location ? toLocationFormValues(location) : EMPTY_LOCATION_FORM_VALUES,
		schema: LocationFormSchema,
		mutation: {
			mutationFn: (input: LocationCreateDto) =>
				location
					? locationResource.update.fetch({ ...input, id: location.id })
					: locationResource.create.fetch(input),
		},
		toPayload: toLocationInput,
		successMessage: location ? 'Lokasi berhasil diperbarui.' : 'Lokasi berhasil dibuat.',
		onSaved,
	})
}

export type LocationForm = ReturnType<typeof useLocationForm>

/** The location form's field layout. Shared by the full-page create/edit routes. */
export function LocationFormFields({ form }: { form: LocationForm }) {
	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
			<div className="grid gap-6">
				<section className="rounded-xl border bg-card p-5 shadow-sm shadow-slate-950/3 sm:p-6">
					<div className="mb-5 flex items-start gap-3 border-b pb-4">
						<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<MapPinIcon className="size-4" />
						</div>
						<div>
							<h2 className="font-heading text-sm font-semibold tracking-tight">
								Identitas lokasi
							</h2>
							<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
								Gunakan nama yang jelas dan kode singkat yang mudah dikenali tim Anda.
							</p>
						</div>
					</div>

					<div className="grid gap-5">
						<form.AppField name="name">
							{(field) => (
								<field.TextField
									label="Nama"
									placeholder="mis. Toko Kemang"
									description="Nama yang ditampilkan di seluruh ruang kerja Anda."
								/>
							)}
						</form.AppField>

						<div className="grid gap-5 sm:grid-cols-2">
							<form.AppField name="code">
								{(field) => (
									<field.TextField
										label="Kode"
										placeholder="mis. LOC-001"
										description="Referensi internal yang unik."
									/>
								)}
							</form.AppField>
							<form.AppField name="type">
								{(field) => (
									<field.SelectField
										label="Tipe"
										options={[...LOCATION_TYPE_OPTIONS]}
										description="Membantu tim mengenali penggunaan lokasi ini."
									/>
								)}
							</form.AppField>
						</div>
					</div>
				</section>

				<section className="rounded-xl border bg-card p-5 shadow-sm shadow-slate-950/3 sm:p-6">
					<div className="mb-5 flex items-start gap-3 border-b pb-4">
						<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<PhoneIcon className="size-4" />
						</div>
						<div>
							<h2 className="font-heading text-sm font-semibold tracking-tight">Detail kontak</h2>
							<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
								Detail opsional membantu tim menghubungi orang yang tepat dengan cepat.
							</p>
						</div>
					</div>

					<div className="grid gap-5 sm:grid-cols-2">
						<form.AppField name="address">
							{(field) => <field.TextField label="Alamat" placeholder="Opsional" />}
						</form.AppField>
						<form.AppField name="phone">
							{(field) => <field.TextField label="Telepon" placeholder="Opsional" />}
						</form.AppField>
					</div>
				</section>

				<section className="rounded-xl border bg-muted/35 p-5 sm:p-6">
					<form.AppField name="isActive">
						{(field) => (
							<field.SwitchField
								label="Tersedia untuk digunakan"
								description="Lokasi nonaktif tetap tersimpan, tetapi tidak muncul di pilihan."
							/>
						)}
					</form.AppField>
				</section>
			</div>

			<aside className="hidden space-y-5 lg:block">
				<div className="rounded-xl border bg-primary/4.5 p-5">
					<Building2Icon className="mb-4 size-5 text-primary" />
					<h2 className="font-heading text-sm font-semibold tracking-tight">
						Lokasi adalah tempat kerja
					</h2>
					<p className="mt-2 text-xs leading-relaxed text-muted-foreground">
						Toko dan gudang menjaga stok, bahan, dan operasional harian tetap terorganisir per
						lokasi.
					</p>
				</div>
				<div className="space-y-3 px-1">
					<div className="flex gap-2.5">
						<CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
						<p className="text-xs leading-relaxed text-muted-foreground">
							Jaga kode tetap singkat dan konsisten.
						</p>
					</div>
					<div className="flex gap-2.5">
						<CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
						<p className="text-xs leading-relaxed text-muted-foreground">
							Nonaktifkan lokasi alih-alih menghapus riwayatnya.
						</p>
					</div>
				</div>
			</aside>
		</div>
	)
}
