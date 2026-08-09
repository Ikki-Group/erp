import { forwardRef, useImperativeHandle, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { PlusIcon, Trash2Icon } from 'lucide-react'

import { FormCombobox } from '@/components/form/form-combobox'
import { FormInput } from '@/components/form/form-input'
import { FormSelect } from '@/components/form/form-select'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

import { locationResource } from '@/features/location/api.ts'
import { materialResource } from '@/features/material/api.ts'
import { uomResource } from '@/features/uom/api.ts'

import { TransferCreateDto } from '../dto/index.ts'

// ─── Types ───

export interface TransferLineValues {
	materialId: string
	qty: string
	uomId: string
}

export interface TransferFormValues {
	fromLocationId: string
	toLocationId: string
	notes: string
	lines: TransferLineValues[]
}

export interface TransferFormRef {
	getValues: () => TransferFormValues
	validate: () => Record<string, string> | null
}

interface TransferFormProps {
	fromLocationId?: number
}

// ─── Component ───

export const TransferForm = forwardRef<TransferFormRef, TransferFormProps>(
	({ fromLocationId }, ref) => {
		const [values, setValues] = useState<TransferFormValues>({
			fromLocationId: fromLocationId?.toString() ?? '',
			toLocationId: '',
			notes: '',
			lines: [{ materialId: '', qty: '', uomId: '' }],
		})
		const [errors, setErrors] = useState<Record<string, string>>({})

		const locationsQuery = useQuery(locationResource.list.queryOptions({ page: 1, limit: 100 }))
		const materialsQuery = useQuery(materialResource.list.queryOptions({ page: 1, limit: 200 }))
		const uomsQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 100 }))

		const locations = locationsQuery.data?.data ?? []
		const materials = materialsQuery.data?.data ?? []
		const uoms = uomsQuery.data?.data ?? []

		const locationOptions = locations.map((l) => ({
			label: `${l.name} (${l.code})`,
			value: String(l.id),
		}))

		const materialOptions = materials.map((m) => ({
			label: `${m.name} (${m.code})`,
			value: String(m.id),
		}))

		const uomOptions = uoms.map((u) => ({
			label: `${u.name} (${u.code})`,
			value: String(u.id),
		}))

		const updateField = (field: keyof Omit<TransferFormValues, 'lines'>, value: string) => {
			setValues((prev) => ({ ...prev, [field]: value }))
			setErrors((prev) => {
				const next = { ...prev }
				delete next[field]
				return next
			})
		}

		const updateLine = (index: number, field: keyof TransferLineValues, value: string) => {
			setValues((prev) => {
				const lines = [...prev.lines]
				lines[index] = { ...lines[index]!, [field]: value }
				return { ...prev, lines }
			})
			setErrors((prev) => {
				const next = { ...prev }
				delete next[`lines.${index}.${field}`]
				delete next['lines']
				return next
			})
		}

		const addLine = () => {
			setValues((prev) => ({
				...prev,
				lines: [...prev.lines, { materialId: '', qty: '', uomId: '' }],
			}))
		}

		const removeLine = (index: number) => {
			setValues((prev) => ({
				...prev,
				lines: prev.lines.filter((_, i) => i !== index),
			}))
		}

		useImperativeHandle(ref, () => ({
			getValues: () => values,
			validate: () => {
				const payload = {
					fromLocationId: values.fromLocationId ? Number(values.fromLocationId) : 0,
					toLocationId: values.toLocationId ? Number(values.toLocationId) : 0,
					notes: values.notes || null,
					lines: values.lines.map((l) => ({
						materialId: l.materialId ? Number(l.materialId) : 0,
						qty: l.qty || '0',
						uomId: l.uomId ? Number(l.uomId) : 0,
					})),
				}

				if (payload.fromLocationId === payload.toLocationId && payload.fromLocationId > 0) {
					const fieldErrors: Record<string, string> = {
						toLocationId: 'Lokasi tujuan harus berbeda dari lokasi asal',
					}
					setErrors(fieldErrors)
					return fieldErrors
				}

				const result = TransferCreateDto.safeParse(payload)
				if (result.success) {
					setErrors({})
					return null
				}

				const fieldErrors: Record<string, string> = {}
				for (const issue of result.error.issues) {
					const path = issue.path.join('.')
					if (!fieldErrors[path]) {
						fieldErrors[path] = issue.message
					}
				}

				// Map Zod paths to user-friendly keys
				const mapped: Record<string, string> = {}
				for (const [key, msg] of Object.entries(fieldErrors)) {
					if (key === 'fromLocationId') mapped['fromLocationId'] = 'Lokasi asal wajib dipilih'
					else if (key === 'toLocationId') mapped['toLocationId'] = 'Lokasi tujuan wajib dipilih'
					else if (key === 'lines') mapped['lines'] = 'Minimal satu item harus ditambahkan'
					else if (key.startsWith('lines.')) {
						const parts = key.split('.')
						const idx = parts[1]
						const field = parts[2]
						if (field === 'materialId') mapped[`lines.${idx}.materialId`] = 'Material wajib dipilih'
						else if (field === 'qty') mapped[`lines.${idx}.qty`] = 'Jumlah harus positif'
						else if (field === 'uomId') mapped[`lines.${idx}.uomId`] = 'Satuan wajib dipilih'
						else mapped[key] = msg
					} else {
						mapped[key] = msg
					}
				}

				setErrors(mapped)
				return mapped
			},
		}))

		return (
			<div className="grid gap-5">
				<div className="grid grid-cols-2 gap-4">
					<FormSelect
						label="Lokasi Asal"
						options={locationOptions}
						value={values.fromLocationId}
						onValueChange={(v) => updateField('fromLocationId', v ?? '')}
						placeholder="Pilih lokasi asal"
						error={errors['fromLocationId']}
						disabled={!!fromLocationId}
					/>
					<FormSelect
						label="Lokasi Tujuan"
						options={locationOptions.filter((o) => o.value !== values.fromLocationId)}
						value={values.toLocationId}
						onValueChange={(v) => updateField('toLocationId', v ?? '')}
						placeholder="Pilih lokasi tujuan"
						error={errors['toLocationId']}
					/>
				</div>

				<FormInput
					label="Catatan"
					value={values.notes}
					onChange={(e) => updateField('notes', e.target.value)}
					placeholder="Opsional"
				/>

				<div className="space-y-3">
					<Label>Item Transfer</Label>
					{errors['lines'] && <p className="text-xs text-destructive">{errors['lines']}</p>}

					{values.lines.map((line, i) => (
						<div key={i} className="flex items-start gap-2">
							<div className="flex-1">
								<FormCombobox
									label={i === 0 ? 'Material' : ''}
									options={materialOptions}
									value={line.materialId}
									onValueChange={(v) => updateLine(i, 'materialId', v ?? '')}
									placeholder="Pilih material"
									error={errors[`lines.${i}.materialId`]}
								/>
							</div>
							<div className="w-28">
								<FormInput
									label={i === 0 ? 'Jumlah' : '\u00A0'}
									type="text"
									value={line.qty}
									onChange={(e) => updateLine(i, 'qty', e.target.value)}
									placeholder="0"
									error={errors[`lines.${i}.qty`]}
								/>
							</div>
							<div className="w-32">
								<FormSelect
									label={i === 0 ? 'Satuan' : '\u00A0'}
									options={uomOptions}
									value={line.uomId}
									onValueChange={(v) => updateLine(i, 'uomId', v ?? '')}
									placeholder="UoM"
									error={errors[`lines.${i}.uomId`]}
								/>
							</div>
							<div className={i === 0 ? 'pt-6' : ''}>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => removeLine(i)}
									disabled={values.lines.length === 1}
								>
									<Trash2Icon className="size-4" />
								</Button>
							</div>
						</div>
					))}

					<Button type="button" variant="outline" size="sm" onClick={addLine}>
						<PlusIcon className="size-4" />
						Tambah Baris
					</Button>
				</div>
			</div>
		)
	},
)

TransferForm.displayName = 'TransferForm'
