import { forwardRef, useImperativeHandle, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { FormInput } from '@/components/form/form-input'
import { FormSelect } from '@/components/form/form-select'
import type { FormSelectOption } from '@/components/form/form-select'

import { menuCategoryResource } from '../api.ts'
import { MenuItemCreateDto } from '../dto/index.ts'
import type { MenuItemDto, MenuItemStatusEnum } from '../dto/index.ts'

export interface MenuItemFormValues {
	sku: string
	name: string
	categoryId: string
	basePrice: string
	status: MenuItemStatusEnum
}

export interface MenuItemFormRef {
	getValues: () => MenuItemFormValues
	validate: () => Record<string, string> | null
}

interface MenuItemFormProps {
	locationId: number
	defaultValues?: MenuItemDto
}

const STATUS_OPTIONS: FormSelectOption[] = [
	{ label: 'Active', value: 'active' },
	{ label: 'Inactive', value: 'inactive' },
]

export const MenuItemForm = forwardRef<MenuItemFormRef, MenuItemFormProps>(
	({ locationId, defaultValues }, ref) => {
		const [values, setValues] = useState<MenuItemFormValues>({
			sku: defaultValues?.sku ?? '',
			name: defaultValues?.name ?? '',
			categoryId: defaultValues?.categoryId?.toString() ?? '',
			basePrice: defaultValues?.basePrice ?? '',
			status: defaultValues?.status ?? 'active',
		})
		const [errors, setErrors] = useState<Record<string, string>>({})

		const categoriesQuery = useQuery(
			menuCategoryResource.list.queryOptions({ page: 1, limit: 100, locationId }),
		)

		const categoryOptions: FormSelectOption[] = (categoriesQuery.data?.data ?? []).map((c) => ({
			label: c.name,
			value: c.id.toString(),
		}))

		const update = (field: keyof MenuItemFormValues, value: string) => {
			setValues((prev) => ({ ...prev, [field]: value }))
			setErrors((prev) => {
				const next = { ...prev }
				delete next[field]
				return next
			})
		}

		useImperativeHandle(ref, () => ({
			getValues: () => values,
			validate: () => {
				const payload = {
					locationId,
					sku: values.sku,
					name: values.name,
					categoryId: values.categoryId ? Number(values.categoryId) : null,
					basePrice: values.basePrice,
					status: values.status,
				}
				const result = MenuItemCreateDto.safeParse(payload)
				if (result.success) {
					setErrors({})
					return null
				}
				const fieldErrors: Record<string, string> = {}
				for (const issue of result.error.issues) {
					const path = issue.path[0]
					if (path && !fieldErrors[String(path)]) {
						fieldErrors[String(path)] = issue.message
					}
				}
				setErrors(fieldErrors)
				return fieldErrors
			},
		}))

		return (
			<div className="grid gap-4">
				<div className="grid grid-cols-2 gap-4">
					<FormInput
						label="SKU"
						value={values.sku}
						onChange={(e) => update('sku', e.target.value)}
						error={errors.sku}
						placeholder="e.g. MNU-001"
					/>
					<FormSelect
						label="Status"
						options={STATUS_OPTIONS}
						value={values.status}
						onValueChange={(v) => v && update('status', v)}
						error={errors.status}
					/>
				</div>
				<FormInput
					label="Nama"
					value={values.name}
					onChange={(e) => update('name', e.target.value)}
					error={errors.name}
					placeholder="e.g. Es Kopi Susu"
				/>
				<div className="grid grid-cols-2 gap-4">
					<FormInput
						label="Harga Dasar"
						value={values.basePrice}
						onChange={(e) => update('basePrice', e.target.value)}
						error={errors.basePrice}
						placeholder="e.g. 25000"
					/>
					<FormSelect
						label="Kategori"
						options={[{ label: '— Tanpa Kategori —', value: '' }, ...categoryOptions]}
						value={values.categoryId}
						onValueChange={(v) => update('categoryId', v ?? '')}
						error={errors.categoryId}
						placeholder="Pilih kategori..."
					/>
				</div>
			</div>
		)
	},
)

MenuItemForm.displayName = 'MenuItemForm'
