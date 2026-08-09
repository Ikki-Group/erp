import { forwardRef, useCallback, useImperativeHandle, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'

import { EditIcon, PlusIcon, TrashIcon } from 'lucide-react'

import { FormInput } from '@/components/form/form-input'
import { FormSelect } from '@/components/form/form-select'
import type { FormSelectOption } from '@/components/form/form-select'
import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/empty-state'
import { formDialog } from '@/components/shared/form-dialog'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { materialResource } from '@/features/material/api.ts'
import { uomResource } from '@/features/uom/api.ts'

import { pricingResource } from '../api.ts'
import { SupplierMaterialCreateDto, SupplierMaterialUpdateDto } from '../dto/index.ts'
import type { SupplierMaterialDto } from '../dto/index.ts'

// ─── Pricing Form (inline for dialog) ───

interface PricingFormValues {
	materialId: string
	unitPrice: string
	uomId: string
	minOrderQty: string
}

interface PricingFormRef {
	getValues: () => PricingFormValues
	validate: (mode: 'create' | 'update', id?: number) => Record<string, string> | null
}

interface PricingFormProps {
	defaultValues?: SupplierMaterialDto
	supplierId: number
	disableMaterial?: boolean
}

const PricingForm = forwardRef<PricingFormRef, PricingFormProps>(
	({ defaultValues, supplierId, disableMaterial }, ref) => {
		const [values, setValues] = useState<PricingFormValues>({
			materialId: defaultValues?.materialId?.toString() ?? '',
			unitPrice: defaultValues?.unitPrice ?? '',
			uomId: defaultValues?.uomId?.toString() ?? '',
			minOrderQty: defaultValues?.minOrderQty ?? '',
		})
		const [errors, setErrors] = useState<Record<string, string>>({})

		const materialsQuery = useQuery(materialResource.list.queryOptions({ page: 1, limit: 200 }))
		const uomQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 100 }))

		const materialOptions: FormSelectOption[] = (materialsQuery.data?.data ?? []).map((m) => ({
			label: `${m.name} (${m.code})`,
			value: m.id.toString(),
		}))

		const uomOptions: FormSelectOption[] = (uomQuery.data?.data ?? []).map((u) => ({
			label: `${u.name} (${u.code})`,
			value: u.id.toString(),
		}))

		const update = (field: keyof PricingFormValues, value: string) => {
			setValues((prev) => ({ ...prev, [field]: value }))
			setErrors((prev) => {
				const next = { ...prev }
				delete next[field]
				return next
			})
		}

		useImperativeHandle(ref, () => ({
			getValues: () => values,
			validate: (mode, id) => {
				const payload =
					mode === 'create'
						? {
								supplierId,
								materialId: values.materialId ? Number(values.materialId) : undefined,
								unitPrice: values.unitPrice,
								uomId: values.uomId ? Number(values.uomId) : undefined,
								minOrderQty: values.minOrderQty || null,
							}
						: {
								id: id!,
								unitPrice: values.unitPrice,
								uomId: values.uomId ? Number(values.uomId) : undefined,
								minOrderQty: values.minOrderQty || null,
							}

				const schema = mode === 'create' ? SupplierMaterialCreateDto : SupplierMaterialUpdateDto
				const result = schema.safeParse(payload)
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
				{!disableMaterial && (
					<FormSelect
						label="Material"
						options={materialOptions}
						value={values.materialId}
						onValueChange={(v) => v && update('materialId', v)}
						error={errors.materialId}
						placeholder="Select material..."
					/>
				)}
				<div className="grid grid-cols-2 gap-4">
					<FormInput
						label="Unit Price"
						value={values.unitPrice}
						onChange={(e) => update('unitPrice', e.target.value)}
						error={errors.unitPrice}
						placeholder="e.g. 15000"
					/>
					<FormSelect
						label="UoM"
						options={uomOptions}
						value={values.uomId}
						onValueChange={(v) => v && update('uomId', v)}
						error={errors.uomId}
						placeholder="Select unit..."
					/>
				</div>
				<FormInput
					label="Min Order Qty"
					value={values.minOrderQty}
					onChange={(e) => update('minOrderQty', e.target.value)}
					error={errors.minOrderQty}
					placeholder="Optional"
				/>
			</div>
		)
	},
)

PricingForm.displayName = 'PricingForm'

// ─── Pricing Table Component ───

const currencyFmt = new Intl.NumberFormat('id-ID', {
	style: 'currency',
	currency: 'IDR',
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
})

function formatCurrency(value: string): string {
	const num = Number.parseFloat(value)
	if (Number.isNaN(num)) return value
	return currencyFmt.format(num)
}

interface PricingTableProps {
	supplierId: number
}

export function PricingTable({ supplierId }: PricingTableProps) {
	const [page, setPage] = useState(1)

	const listQuery = useQuery(pricingResource.list.queryOptions({ supplierId, page, limit: 20 }))
	const materialsQuery = useQuery(materialResource.list.queryOptions({ page: 1, limit: 200 }))
	const uomQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 100 }))

	const createMut = useMutation(pricingResource.create.mutationOptions())
	const updateMut = useMutation(pricingResource.update.mutationOptions())
	const removeMut = useMutation(pricingResource.remove.mutationOptions())

	const items = listQuery.data?.data ?? []
	const totalPages = listQuery.data?.meta?.totalPages ?? 1

	const getMaterialName = useCallback(
		(materialId: number) => {
			const mat = (materialsQuery.data?.data ?? []).find((m) => m.id === materialId)
			return mat ? `${mat.name} (${mat.code})` : `#${materialId}`
		},
		[materialsQuery.data],
	)

	const getUomName = useCallback(
		(uomId: number) => {
			const uom = (uomQuery.data?.data ?? []).find((u) => u.id === uomId)
			return uom ? uom.code : `#${uomId}`
		},
		[uomQuery.data],
	)

	const handleAdd = useCallback(async () => {
		const formRef = { current: null } as React.MutableRefObject<PricingFormRef | null>

		const saved = await formDialog({
			title: 'Add Material Pricing',
			description: 'Set the price for a material from this supplier.',
			submitLabel: 'Add',
			content: (
				<PricingForm
					ref={(el) => {
						formRef.current = el
					}}
					supplierId={supplierId}
				/>
			),
			onSubmit: async () => {
				const errors = formRef.current?.validate('create')
				if (errors) throw new Error('Please fix the validation errors.')
				const v = formRef.current!.getValues()
				await createMut.mutateAsync({
					supplierId,
					materialId: Number(v.materialId),
					unitPrice: v.unitPrice,
					uomId: Number(v.uomId),
					minOrderQty: v.minOrderQty || null,
				})
			},
		})

		if (saved) {
			toast.add({ title: 'Pricing added successfully.', type: 'success' })
		}
	}, [supplierId, createMut])

	const handleEdit = useCallback(
		async (pricing: SupplierMaterialDto) => {
			const formRef = { current: null } as React.MutableRefObject<PricingFormRef | null>

			const saved = await formDialog({
				title: 'Edit Pricing',
				description: `Update pricing for ${getMaterialName(pricing.materialId)}.`,
				submitLabel: 'Save Changes',
				content: (
					<PricingForm
						ref={(el) => {
							formRef.current = el
						}}
						supplierId={supplierId}
						defaultValues={pricing}
						disableMaterial
					/>
				),
				onSubmit: async () => {
					const errors = formRef.current?.validate('update', pricing.id)
					if (errors) throw new Error('Please fix the validation errors.')
					const v = formRef.current!.getValues()
					await updateMut.mutateAsync({
						id: pricing.id,
						unitPrice: v.unitPrice,
						uomId: Number(v.uomId),
						minOrderQty: v.minOrderQty || null,
					})
				},
			})

			if (saved) {
				toast.add({ title: 'Pricing updated successfully.', type: 'success' })
			}
		},
		[supplierId, updateMut, getMaterialName],
	)

	const handleRemove = useCallback(
		async (pricing: SupplierMaterialDto) => {
			await confirm({
				title: 'Remove pricing?',
				description: `This will remove the pricing for ${getMaterialName(pricing.materialId)}. This action cannot be undone.`,
				confirmLabel: 'Remove',
				variant: 'destructive',
				onConfirm: async () => {
					await removeMut.mutateAsync({ id: pricing.id })
					toast.add({ title: 'Pricing removed.', type: 'success' })
				},
			})
		},
		[removeMut, getMaterialName],
	)

	if (items.length === 0 && !listQuery.isLoading) {
		return (
			<EmptyState
				title="No pricing entries"
				description="Add material pricing for this supplier."
				action={
					<Button size="sm" onClick={handleAdd}>
						<PlusIcon className="size-4" />
						Add Pricing
					</Button>
				}
			/>
		)
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h4 className="text-sm font-medium">Material Pricing</h4>
				<Button size="sm" variant="outline" onClick={handleAdd}>
					<PlusIcon className="size-4" />
					Add
				</Button>
			</div>

			<div className="divide-y rounded-md border">
				{items.map((item) => (
					<div key={item.id} className="flex items-center justify-between px-4 py-3">
						<div className="grid gap-0.5">
							<span className="text-sm font-medium">{getMaterialName(item.materialId)}</span>
							<span className="text-xs text-muted-foreground">
								{formatCurrency(item.unitPrice)} / {getUomName(item.uomId)}
								{item.minOrderQty && ` · Min: ${item.minOrderQty}`}
							</span>
						</div>
						<div className="flex gap-1">
							<Button
								size="icon"
								variant="ghost"
								className="size-7"
								onClick={() => handleEdit(item)}
							>
								<EditIcon className="size-3.5" />
							</Button>
							<Button
								size="icon"
								variant="ghost"
								className="size-7"
								onClick={() => handleRemove(item)}
							>
								<TrashIcon className="size-3.5" />
							</Button>
						</div>
					</div>
				))}
			</div>

			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-2">
					<Button
						size="sm"
						variant="outline"
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}
					>
						Previous
					</Button>
					<span className="text-xs text-muted-foreground">
						Page {page} of {totalPages}
					</span>
					<Button
						size="sm"
						variant="outline"
						disabled={page >= totalPages}
						onClick={() => setPage((p) => p + 1)}
					>
						Next
					</Button>
				</div>
			)}
		</div>
	)
}
