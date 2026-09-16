import { useEffect } from 'react'

import { useQuery } from '@tanstack/react-query'

import { PlusIcon, Trash2Icon } from 'lucide-react'
import { z } from 'zod'

import { FormDialogFooter, useEntityForm } from '@/lib/form/index.ts'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

import { modifierGroupExtras } from '../api.ts'
import { SELECTION_TYPE_OPTIONS } from '../dto/index.ts'
import type { ModifierGroupDto, ModifierOptionInputDto, SelectionTypeEnum } from '../dto/index.ts'

export interface ModifierGroupFormValues {
	name: string
	selectionType: string
	isRequired: boolean
	minSelect: number | null
	maxSelect: number | null
	options: ModifierOptionInputDto[]
}

function emptyOption(sortOrder: number): ModifierOptionInputDto {
	return { name: '', priceAdjustment: '0', isDefault: 0, sortOrder, isActive: 1 }
}

const ModifierGroupFormSchema = z.object({
	name: z.string().trim().min(2, 'Minimal 2 karakter').max(100),
	selectionType: z.enum(['single', 'multiple']),
	isRequired: z.boolean(),
	minSelect: z.number().int().min(0).nullable(),
	maxSelect: z.number().int().positive().nullable(),
	options: z
		.array(
			z.object({
				name: z.string().trim().min(1, 'Nama opsi wajib diisi').max(100),
				priceAdjustment: z.string().regex(/^-?\d+(\.\d+)?$/u, 'Harus berupa angka'),
				isDefault: z.number().int().min(0).max(1),
				sortOrder: z.number().int().min(0),
				isActive: z.number().int().min(0).max(1),
			}),
		)
		.min(1, 'Tambahkan minimal satu opsi'),
})

export interface ModifierGroupFormBodyProps {
	defaultValues?: ModifierGroupDto
	locationId?: number
	onSaved: () => void
	onCancel: () => void
	onSubmitValues: (values: {
		name: string
		selectionType: SelectionTypeEnum
		isRequired: number
		minSelect: number
		maxSelect: number | null
		options: ModifierOptionInputDto[]
	}) => Promise<unknown>
}

/** Quick-add form for a modifier group (with dynamic option rows) — kept as a dialog. */
export function ModifierGroupFormBody({
	defaultValues,
	locationId,
	onSaved,
	onCancel,
	onSubmitValues,
}: ModifierGroupFormBodyProps) {
	const detailQuery = useQuery({
		...modifierGroupExtras.detail.queryOptions({ id: defaultValues?.id ?? 0 }),
		enabled: !!defaultValues?.id && !!locationId,
	})

	const form = useEntityForm<ModifierGroupFormValues>({
		defaultValues: {
			name: defaultValues?.name ?? '',
			selectionType: defaultValues?.selectionType ?? 'single',
			isRequired: defaultValues?.isRequired === 1,
			minSelect: defaultValues?.minSelect ?? 0,
			maxSelect: defaultValues?.maxSelect ?? null,
			options: [emptyOption(0)],
		},
		schema: ModifierGroupFormSchema,
		onSubmit: async (values) => {
			await onSubmitValues({
				name: values.name,
				selectionType: values.selectionType as SelectionTypeEnum,
				isRequired: values.isRequired ? 1 : 0,
				minSelect: values.minSelect ?? 0,
				maxSelect: values.maxSelect,
				options: values.options,
			})
			onSaved()
		},
	})

	useEffect(() => {
		const options = detailQuery.data?.data?.options
		if (options && options.length > 0) {
			form.setFieldValue(
				'options',
				options.map((opt) => ({
					name: opt.name,
					priceAdjustment: opt.priceAdjustment,
					isDefault: opt.isDefault,
					sortOrder: opt.sortOrder,
					isActive: opt.isActive,
				})),
			)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [detailQuery.data])

	return (
		<form.AppForm>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					void form.handleSubmit()
				}}
				className="grid gap-4"
			>
				<form.AppField name="name">
					{(field) => <field.TextField label="Nama Group" placeholder="e.g. Level Gula, Ukuran" />}
				</form.AppField>

				<div className="grid grid-cols-2 gap-4">
					<form.AppField name="selectionType">
						{(field) => (
							<field.SelectField label="Tipe Seleksi" options={[...SELECTION_TYPE_OPTIONS]} />
						)}
					</form.AppField>
					<div className="flex items-end pb-1">
						<form.AppField name="isRequired">
							{(field) => <field.SwitchField label="Wajib dipilih" />}
						</form.AppField>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<form.AppField name="minSelect">
						{(field) => <field.NumberField label="Min Pilih" min={0} />}
					</form.AppField>
					<form.AppField name="maxSelect">
						{(field) => (
							<field.NumberField label="Max Pilih" min={1} description="Kosongkan = unlimited" />
						)}
					</form.AppField>
				</div>

				<form.AppField name="options" mode="array">
					{(optionsField) => (
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label>Opsi</Label>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() =>
										optionsField.pushValue(emptyOption(optionsField.state.value.length))
									}
								>
									<PlusIcon className="size-3.5" />
									Tambah Opsi
								</Button>
							</div>

							<div className="space-y-2">
								{optionsField.state.value.map((_, idx) => (
									<div key={idx} className="flex items-start gap-2 rounded-md border p-3">
										<div className="grid flex-1 grid-cols-2 gap-2">
											<form.AppField name={`options[${idx}].name`}>
												{(field) => <field.TextField label="Nama" placeholder="e.g. Reguler" />}
											</form.AppField>
											<form.AppField name={`options[${idx}].priceAdjustment`}>
												{(field) => <field.TextField label="Harga (+/-)" placeholder="0" />}
											</form.AppField>
										</div>
										<Button
											type="button"
											size="icon"
											variant="ghost"
											className="mt-6 size-8 shrink-0"
											onClick={() => optionsField.removeValue(idx)}
											disabled={optionsField.state.value.length <= 1}
										>
											<Trash2Icon className="size-3.5" />
										</Button>
									</div>
								))}
							</div>
						</div>
					)}
				</form.AppField>

				<form.FormError />
				<FormDialogFooter onCancel={onCancel} submitLabel="Simpan" />
			</form>
		</form.AppForm>
	)
}
