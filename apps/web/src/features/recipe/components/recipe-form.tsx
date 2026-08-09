import { forwardRef, useImperativeHandle, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { PlusIcon, TrashIcon } from 'lucide-react'

import { FormInput } from '@/components/form/form-input'
import { FormSelect } from '@/components/form/form-select'
import type { FormSelectOption } from '@/components/form/form-select'

import { Button } from '@/components/ui/button'

import { materialResource } from '@/features/material/api.ts'
import { menuItemResource } from '@/features/menu/api.ts'
import { uomResource } from '@/features/uom/api.ts'

import { RecipeCreateDto } from '../dto/index.ts'
import type { RecipeDetailDto } from '../dto/index.ts'

// ─── Types ───

interface RecipeLineValues {
	key: string
	materialId: string
	quantity: string
	uomId: string
}

export interface RecipeFormValues {
	menuItemId: string
	name: string
	yieldQty: string
	lines: RecipeLineValues[]
}

export interface RecipeFormRef {
	getValues: () => RecipeFormValues
	validate: () => Record<string, string> | null
}

interface RecipeFormProps {
	locationId: number
	defaultValues?: RecipeDetailDto
}

function emptyLine(): RecipeLineValues {
	return { key: crypto.randomUUID(), materialId: '', quantity: '', uomId: '' }
}

// ─── Component ───

export const RecipeForm = forwardRef<RecipeFormRef, RecipeFormProps>(
	({ locationId, defaultValues }, ref) => {
		const [values, setValues] = useState<RecipeFormValues>({
			menuItemId: defaultValues?.menuItemId?.toString() ?? '',
			name: defaultValues?.name ?? '',
			yieldQty: defaultValues?.yieldQty ?? '1',
			lines: defaultValues?.lines?.map((l) => ({
				key: crypto.randomUUID(),
				materialId: l.materialId.toString(),
				quantity: l.quantity,
				uomId: l.uomId.toString(),
			})) ?? [emptyLine()],
		})
		const [errors, setErrors] = useState<Record<string, string>>({})

		// ─── Queries ───

		const menuItemsQuery = useQuery({
			...menuItemResource.list.queryOptions({
				page: 1,
				limit: 200,
				locationId,
			}),
			enabled: !!locationId,
		})

		const materialsQuery = useQuery({
			...materialResource.list.queryOptions({
				page: 1,
				limit: 200,
				locationId,
			}),
			enabled: !!locationId,
		})

		const uomsQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 200 }))

		// ─── Options ───

		const menuItemOptions: FormSelectOption[] = (menuItemsQuery.data?.data ?? []).map((m) => ({
			label: `${m.name} (${m.sku})`,
			value: m.id.toString(),
		}))

		const materialOptions: FormSelectOption[] = (materialsQuery.data?.data ?? []).map((m) => ({
			label: `${m.name} (${m.code})`,
			value: m.id.toString(),
		}))

		const uomOptions: FormSelectOption[] = (uomsQuery.data?.data ?? []).map((u) => ({
			label: `${u.name} (${u.code})`,
			value: u.id.toString(),
		}))

		// ─── Handlers ───

		const updateField = (field: keyof Omit<RecipeFormValues, 'lines'>, value: string) => {
			setValues((prev) => ({ ...prev, [field]: value }))
			setErrors((prev) => {
				const next = { ...prev }
				delete next[field]
				return next
			})
		}

		const updateLine = (index: number, field: keyof RecipeLineValues, value: string) => {
			setValues((prev) => {
				const lines = prev.lines.map((line, i) =>
					i === index ? { ...line, [field]: value } : line,
				)
				return { ...prev, lines }
			})
			setErrors((prev) => {
				const next = { ...prev }
				delete next[`lines.${index}.${field}`]
				delete next.lines
				return next
			})
		}

		const addLine = () => {
			setValues((prev) => ({ ...prev, lines: [...prev.lines, emptyLine()] }))
		}

		const removeLine = (index: number) => {
			setValues((prev) => ({
				...prev,
				lines: prev.lines.filter((_, i) => i !== index),
			}))
		}

		// ─── Imperative Handle ───

		useImperativeHandle(ref, () => ({
			getValues: () => values,
			validate: () => {
				const payload = {
					menuItemId: values.menuItemId ? Number(values.menuItemId) : undefined,
					name: values.name,
					yieldQty: values.yieldQty,
					lines: values.lines.map((l) => ({
						materialId: l.materialId ? Number(l.materialId) : undefined,
						quantity: l.quantity,
						uomId: l.uomId ? Number(l.uomId) : undefined,
					})),
				}
				const result = RecipeCreateDto.safeParse(payload)
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

		return (
			<div className="grid gap-4">
				<FormSelect
					label="Menu Item"
					options={menuItemOptions}
					value={values.menuItemId}
					onValueChange={(v) => updateField('menuItemId', v ?? '')}
					error={errors.menuItemId}
					placeholder="Pilih menu item..."
					disabled={!!defaultValues}
				/>
				<div className="grid grid-cols-2 gap-4">
					<FormInput
						label="Nama Resep"
						value={values.name}
						onChange={(e) => updateField('name', e.target.value)}
						error={errors.name}
						placeholder="e.g. Es Kopi Susu Standard"
					/>
					<FormInput
						label="Yield Qty"
						value={values.yieldQty}
						onChange={(e) => updateField('yieldQty', e.target.value)}
						error={errors.yieldQty}
						placeholder="e.g. 1"
					/>
				</div>

				{/* Ingredient Lines */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">Bahan (Ingredients)</span>
						<Button type="button" size="sm" variant="outline" onClick={addLine}>
							<PlusIcon className="size-4" />
							Tambah Bahan
						</Button>
					</div>

					{errors.lines && <p className="text-sm text-destructive">{errors.lines}</p>}

					{values.lines.map((line, idx) => (
						<div key={line.key} className="flex items-end gap-2">
							<div className="flex-1">
								<FormSelect
									label={idx === 0 ? 'Material' : ''}
									options={materialOptions}
									value={line.materialId}
									onValueChange={(v) => updateLine(idx, 'materialId', v ?? '')}
									error={errors[`lines.${idx}.materialId`]}
									placeholder="Pilih material..."
								/>
							</div>
							<div className="w-24">
								<FormInput
									label={idx === 0 ? 'Qty' : ''}
									value={line.quantity}
									onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
									error={errors[`lines.${idx}.quantity`]}
									placeholder="0.5"
								/>
							</div>
							<div className="w-32">
								<FormSelect
									label={idx === 0 ? 'UoM' : ''}
									options={uomOptions}
									value={line.uomId}
									onValueChange={(v) => updateLine(idx, 'uomId', v ?? '')}
									error={errors[`lines.${idx}.uomId`]}
									placeholder="Satuan..."
								/>
							</div>
							<Button
								type="button"
								size="icon"
								variant="ghost"
								className="size-9 shrink-0"
								onClick={() => removeLine(idx)}
								disabled={values.lines.length <= 1}
							>
								<TrashIcon className="size-4" />
							</Button>
						</div>
					))}
				</div>
			</div>
		)
	},
)

RecipeForm.displayName = 'RecipeForm'
