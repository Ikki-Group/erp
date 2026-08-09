import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { PlusIcon, Trash2Icon } from 'lucide-react'

import { FormCombobox } from '@/components/form/form-combobox'
import { FormInput } from '@/components/form/form-input'
import { FormSelect } from '@/components/form/form-select'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

import { materialResource } from '@/features/material/api.ts'
import { pricingResource, supplierResource } from '@/features/supplier/api.ts'
import { uomResource } from '@/features/uom/api.ts'

import { ReceivingCreateDto } from '../dto/index.ts'

// ─── Types ───

export interface ReceivingLineValues {
	materialId: string
	qty: string
	unitCost: string
	uomId: string
}

export interface ReceivingFormValues {
	supplierId: string
	notes: string
	lines: ReceivingLineValues[]
}

export interface ReceivingFormRef {
	getValues: () => ReceivingFormValues
	validate: () => Record<string, string> | null
}

interface ReceivingFormProps {
	locationId: number
}

// ─── Component ───

export const ReceivingForm = forwardRef<ReceivingFormRef, ReceivingFormProps>(
	({ locationId }, ref) => {
		const [values, setValues] = useState<ReceivingFormValues>({
			supplierId: '',
			notes: '',
			lines: [{ materialId: '', qty: '', unitCost: '', uomId: '' }],
		})
		const [errors, setErrors] = useState<Record<string, string>>({})

		const suppliersQuery = useQuery(supplierResource.list.queryOptions({ page: 1, limit: 100 }))
		const materialsQuery = useQuery(materialResource.list.queryOptions({ page: 1, limit: 200 }))
		const uomsQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 100 }))

		const pricingQuery = useQuery({
			...pricingResource.list.queryOptions({
				supplierId: values.supplierId ? Number(values.supplierId) : undefined,
				page: 1,
				limit: 200,
			}),
			enabled: !!values.supplierId,
		})

		const suppliers = suppliersQuery.data?.data ?? []
		const materials = materialsQuery.data?.data ?? []
		const uoms = uomsQuery.data?.data ?? []
		const supplierMaterials = pricingQuery.data?.data ?? []

		const supplierOptions = suppliers
			.filter((s) => s.isActive)
			.map((s) => ({
				label: `${s.name} (${s.code})`,
				value: String(s.id),
			}))

		const materialOptions = materials.map((m) => ({
			label: `${m.name} (${m.code})`,
			value: String(m.id),
		}))

		const uomOptions = uoms.map((u) => ({
			label: `${u.name} (${u.code})`,
			value: String(u.id),
		}))

		// Pre-populate lines when supplier materials are loaded
		const handleSupplierChange = useCallback((supplierId: string) => {
			setValues((prev) => ({ ...prev, supplierId, lines: [] }))
			setErrors({})
		}, [])

		useEffect(() => {
			if (supplierMaterials.length > 0 && values.lines.length === 0) {
				const lines: ReceivingLineValues[] = supplierMaterials.map((sm) => ({
					materialId: String(sm.materialId),
					qty: '',
					unitCost: sm.unitPrice,
					uomId: String(sm.uomId),
				}))
				setValues((prev) => ({ ...prev, lines }))
			}
		}, [supplierMaterials, values.lines.length])

		const updateField = (field: 'notes', value: string) => {
			setValues((prev) => ({ ...prev, [field]: value }))
			setErrors((prev) => {
				const next = { ...prev }
				delete next[field]
				return next
			})
		}

		const updateLine = (index: number, field: keyof ReceivingLineValues, value: string) => {
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
				lines: [...prev.lines, { materialId: '', qty: '', unitCost: '', uomId: '' }],
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
					locationId,
					supplierId: values.supplierId ? Number(values.supplierId) : 0,
					notes: values.notes || null,
					lines: values.lines
						.filter((l) => l.materialId && l.qty)
						.map((l) => ({
							materialId: l.materialId ? Number(l.materialId) : 0,
							qty: l.qty || '0',
							unitCost: l.unitCost || '0',
							uomId: l.uomId ? Number(l.uomId) : 0,
						})),
				}

				const result = ReceivingCreateDto.safeParse(payload)
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

				const mapped: Record<string, string> = {}
				for (const [key, msg] of Object.entries(fieldErrors)) {
					if (key === 'supplierId') mapped['supplierId'] = 'Supplier wajib dipilih'
					else if (key === 'lines') mapped['lines'] = 'Minimal satu item harus ditambahkan'
					else if (key.startsWith('lines.')) {
						const parts = key.split('.')
						const idx = parts[1]
						const field = parts[2]
						if (field === 'materialId') mapped[`lines.${idx}.materialId`] = 'Material wajib dipilih'
						else if (field === 'qty') mapped[`lines.${idx}.qty`] = 'Jumlah harus positif'
						else if (field === 'unitCost')
							mapped[`lines.${idx}.unitCost`] = 'Harga satuan wajib diisi'
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
				<FormCombobox
					label="Supplier"
					options={supplierOptions}
					value={values.supplierId}
					onValueChange={(v) => handleSupplierChange(v ?? '')}
					placeholder="Pilih supplier"
					error={errors['supplierId']}
				/>

				<FormInput
					label="Catatan"
					value={values.notes}
					onChange={(e) => updateField('notes', e.target.value)}
					placeholder="Opsional"
				/>

				<div className="space-y-3">
					<Label>Item Penerimaan</Label>
					{errors['lines'] && <p className="text-xs text-destructive">{errors['lines']}</p>}

					{values.lines.length === 0 && values.supplierId && (
						<p className="text-sm text-muted-foreground">
							{pricingQuery.isLoading
								? 'Memuat material supplier...'
								: 'Tidak ada material terdaftar untuk supplier ini. Tambahkan secara manual.'}
						</p>
					)}

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
							<div className="w-24">
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
								<FormInput
									label={i === 0 ? 'Harga Satuan' : '\u00A0'}
									type="text"
									value={line.unitCost}
									onChange={(e) => updateLine(i, 'unitCost', e.target.value)}
									placeholder="0"
									error={errors[`lines.${i}.unitCost`]}
								/>
							</div>
							<div className="w-28">
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
								<Button type="button" variant="ghost" size="icon" onClick={() => removeLine(i)}>
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

ReceivingForm.displayName = 'ReceivingForm'
