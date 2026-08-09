import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { PlusIcon, TrashIcon } from 'lucide-react'

import { FormInput } from '@/components/form/form-input'
import { FormSelect } from '@/components/form/form-select'
import { FormSwitch } from '@/components/form/form-switch'

import { Button } from '@/components/ui/button'

import { modifierGroupExtras } from '../api.ts'
import { ModifierGroupCreateDto, SELECTION_TYPE_OPTIONS } from '../dto/index.ts'
import type { ModifierGroupDto, ModifierOptionInputDto, SelectionTypeEnum } from '../dto/index.ts'

interface OptionRow {
	name: string
	priceAdjustment: string
	isDefault: number
	sortOrder: number
	isActive: number
}

function emptyOption(sortOrder: number): OptionRow {
	return { name: '', priceAdjustment: '0', isDefault: 0, sortOrder, isActive: 1 }
}

export interface ModifierGroupFormValues {
	name: string
	selectionType: SelectionTypeEnum
	isRequired: number
	minSelect: number
	maxSelect: number | null
	options: ModifierOptionInputDto[]
}

export interface ModifierGroupFormRef {
	getValues: () => ModifierGroupFormValues
	validate: () => Record<string, string> | null
}

interface ModifierGroupFormProps {
	defaultValues?: ModifierGroupDto
	locationId?: number
}

export const ModifierGroupForm = forwardRef<ModifierGroupFormRef, ModifierGroupFormProps>(
	({ defaultValues, locationId }, ref) => {
		const [name, setName] = useState(defaultValues?.name ?? '')
		const [selectionType, setSelectionType] = useState<SelectionTypeEnum>(
			defaultValues?.selectionType ?? 'single',
		)
		const [isRequired, setIsRequired] = useState(defaultValues?.isRequired === 1)
		const [minSelect, setMinSelect] = useState(defaultValues?.minSelect?.toString() ?? '0')
		const [maxSelect, setMaxSelect] = useState(defaultValues?.maxSelect?.toString() ?? '')
		const [options, setOptions] = useState<OptionRow[]>([emptyOption(0)])
		const [errors, setErrors] = useState<Record<string, string>>({})

		const detailQuery = useQuery({
			...modifierGroupExtras.detail.queryOptions({ id: defaultValues?.id ?? 0 }),
			enabled: !!defaultValues?.id && !!locationId,
		})

		useEffect(() => {
			if (detailQuery.data?.data?.options && detailQuery.data.data.options.length > 0) {
				setOptions(
					detailQuery.data.data.options.map((opt) => ({
						name: opt.name,
						priceAdjustment: opt.priceAdjustment,
						isDefault: opt.isDefault,
						sortOrder: opt.sortOrder,
						isActive: opt.isActive,
					})),
				)
			}
		}, [detailQuery.data])

		const updateOption = (index: number, field: keyof OptionRow, value: string | number) => {
			setOptions((prev) => {
				const next = [...prev]
				next[index] = { ...next[index]!, [field]: value } as OptionRow
				return next
			})
			setErrors((prev) => {
				const next = { ...prev }
				delete next[`options.${index}.${field}`]
				delete next.options
				return next
			})
		}

		const addOption = () => {
			setOptions((prev) => [...prev, emptyOption(prev.length)])
		}

		const removeOption = (index: number) => {
			if (options.length <= 1) return
			setOptions((prev) =>
				prev.filter((_, i) => i !== index).map((o, i) => ({ ...o, sortOrder: i })),
			)
		}

		useImperativeHandle(ref, () => ({
			getValues: () => ({
				name,
				selectionType,
				isRequired: isRequired ? 1 : 0,
				minSelect: Number(minSelect) || 0,
				maxSelect: maxSelect ? Number(maxSelect) : null,
				options: options.map((o) => ({
					name: o.name,
					priceAdjustment: o.priceAdjustment,
					isDefault: o.isDefault,
					sortOrder: o.sortOrder,
					isActive: o.isActive,
				})),
			}),
			validate: () => {
				const payload = {
					locationId: locationId ?? 1,
					name,
					selectionType,
					isRequired: isRequired ? 1 : 0,
					minSelect: Number(minSelect) || 0,
					maxSelect: maxSelect ? Number(maxSelect) : null,
					options: options.map((o) => ({
						name: o.name,
						priceAdjustment: o.priceAdjustment,
						isDefault: o.isDefault,
						sortOrder: o.sortOrder,
						isActive: o.isActive,
					})),
				}
				const result = ModifierGroupCreateDto.safeParse(payload)
				if (result.success) {
					setErrors({})
					return null
				}
				const fieldErrors: Record<string, string> = {}
				for (const issue of result.error.issues) {
					const path = issue.path.join('.')
					if (path && !fieldErrors[path]) {
						fieldErrors[path] = issue.message
					}
				}
				setErrors(fieldErrors)
				return fieldErrors
			},
		}))

		const clearFieldError = (field: string) => {
			setErrors((prev) => {
				const next = { ...prev }
				delete next[field]
				return next
			})
		}

		return (
			<div className="grid gap-4">
				<FormInput
					label="Nama Group"
					value={name}
					onChange={(e) => {
						setName(e.target.value)
						clearFieldError('name')
					}}
					error={errors.name}
					placeholder="e.g. Level Gula, Ukuran"
				/>

				<div className="grid grid-cols-2 gap-4">
					<FormSelect
						label="Tipe Seleksi"
						options={[...SELECTION_TYPE_OPTIONS]}
						value={selectionType}
						onValueChange={(v) => v && setSelectionType(v as SelectionTypeEnum)}
						error={errors.selectionType}
					/>
					<div className="flex items-end pb-1">
						<FormSwitch
							label="Wajib dipilih"
							checked={isRequired}
							onCheckedChange={setIsRequired}
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<FormInput
						label="Min Pilih"
						value={minSelect}
						onChange={(e) => {
							setMinSelect(e.target.value)
							clearFieldError('minSelect')
						}}
						error={errors.minSelect}
						placeholder="0"
					/>
					<FormInput
						label="Max Pilih"
						value={maxSelect}
						onChange={(e) => {
							setMaxSelect(e.target.value)
							clearFieldError('maxSelect')
						}}
						error={errors.maxSelect}
						placeholder="Kosongkan = unlimited"
					/>
				</div>

				{/* Options */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">Opsi</span>
						<Button type="button" size="sm" variant="outline" onClick={addOption}>
							<PlusIcon className="size-3.5" />
							Tambah Opsi
						</Button>
					</div>

					{errors.options && <p className="text-xs text-destructive">{errors.options}</p>}

					<div className="space-y-2">
						{options.map((opt, idx) => (
							<div key={idx} className="flex items-start gap-2 rounded-md border p-3">
								<div className="grid flex-1 grid-cols-2 gap-2">
									<FormInput
										label="Nama"
										value={opt.name}
										onChange={(e) => updateOption(idx, 'name', e.target.value)}
										error={errors[`options.${idx}.name`]}
										placeholder="e.g. Reguler"
									/>
									<FormInput
										label="Harga (+/-)"
										value={opt.priceAdjustment}
										onChange={(e) => updateOption(idx, 'priceAdjustment', e.target.value)}
										error={errors[`options.${idx}.priceAdjustment`]}
										placeholder="0"
									/>
								</div>
								<Button
									type="button"
									size="icon"
									variant="ghost"
									className="mt-6 size-8 shrink-0"
									onClick={() => removeOption(idx)}
									disabled={options.length <= 1}
								>
									<TrashIcon className="size-3.5" />
								</Button>
							</div>
						))}
					</div>
				</div>
			</div>
		)
	},
)

ModifierGroupForm.displayName = 'ModifierGroupForm'
