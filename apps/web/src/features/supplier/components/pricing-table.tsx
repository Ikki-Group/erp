import { useCallback, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'

import { EditIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { z } from 'zod'

import { FormDialogFooter, useEntityForm } from '@/lib/form/index.ts'

import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/empty-state'
import { formDialog } from '@/components/shared/form-dialog'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { materialResource } from '@/features/material/api.ts'
import { uomResource } from '@/features/uom/api.ts'

import { pricingResource } from '../api.ts'
import type { SupplierMaterialDto } from '../dto/index.ts'

// ─── Pricing Form (inline for dialog) ───

interface PricingFormValues {
	materialId: number | null
	unitPrice: string
	uomId: number | null
	minOrderQty: string
}

const PricingFormSchema = z.object({
	materialId: z
		.number()
		.int()
		.positive()
		.nullable()
		.refine((v) => v !== null, { error: 'Material is required' }),
	unitPrice: z
		.string()
		.trim()
		.regex(/^\d+(\.\d+)?$/u, 'Must be a positive decimal'),
	uomId: z
		.number()
		.int()
		.positive()
		.nullable()
		.refine((v) => v !== null, { error: 'UoM is required' }),
	minOrderQty: z
		.string()
		.trim()
		.regex(/^\d*(\.\d+)?$/u, 'Must be a positive decimal')
		.default(''),
})

interface PricingFormBodyProps {
	defaultValues?: SupplierMaterialDto
	supplierId: number
	disableMaterial?: boolean
	onSaved: () => void
	onCancel: () => void
}

function PricingFormBody({
	defaultValues,
	supplierId,
	disableMaterial,
	onSaved,
	onCancel,
}: PricingFormBodyProps) {
	const createMut = useMutation(pricingResource.create.mutationOptions())
	const updateMut = useMutation(pricingResource.update.mutationOptions())

	const materialsQuery = useQuery(materialResource.list.queryOptions({ page: 1, limit: 200 }))
	const uomQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 100 }))

	const materialOptions = (materialsQuery.data?.data ?? []).map((m) => ({
		label: `${m.name} (${m.code})`,
		value: m.id,
	}))
	const uomOptions = (uomQuery.data?.data ?? []).map((u) => ({
		label: `${u.name} (${u.code})`,
		value: u.id,
	}))

	const form = useEntityForm<PricingFormValues>({
		defaultValues: {
			materialId: defaultValues?.materialId ?? null,
			unitPrice: defaultValues?.unitPrice ?? '',
			uomId: defaultValues?.uomId ?? null,
			minOrderQty: defaultValues?.minOrderQty ?? '',
		},
		schema: PricingFormSchema,
		onSubmit: async (values) => {
			if (defaultValues) {
				await updateMut.mutateAsync({
					id: defaultValues.id,
					unitPrice: values.unitPrice,
					uomId: values.uomId!,
					minOrderQty: values.minOrderQty || null,
				})
			} else {
				await createMut.mutateAsync({
					supplierId,
					materialId: values.materialId!,
					unitPrice: values.unitPrice,
					uomId: values.uomId!,
					minOrderQty: values.minOrderQty || null,
				})
			}
			onSaved()
		},
	})

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
				{!disableMaterial && (
					<form.AppField name="materialId">
						{(field) => (
							<field.IdSelectField
								label="Material"
								options={materialOptions}
								placeholder="Select material..."
							/>
						)}
					</form.AppField>
				)}
				<div className="grid grid-cols-2 gap-4">
					<form.AppField name="unitPrice">
						{(field) => <field.CurrencyField label="Unit Price" />}
					</form.AppField>
					<form.AppField name="uomId">
						{(field) => (
							<field.IdSelectField label="UoM" options={uomOptions} placeholder="Select unit..." />
						)}
					</form.AppField>
				</div>
				<form.AppField name="minOrderQty">
					{(field) => <field.TextField label="Min Order Qty" placeholder="Optional" />}
				</form.AppField>
				<form.FormError />
				<FormDialogFooter
					onCancel={onCancel}
					submitLabel={defaultValues ? 'Save Changes' : 'Add'}
				/>
			</form>
		</form.AppForm>
	)
}

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
		const saved = await formDialog({
			title: 'Add Material Pricing',
			description: 'Set the price for a material from this supplier.',
			// oxlint-disable-next-line react/no-unstable-nested-components
			content: ({ close }) => (
				<PricingFormBody
					supplierId={supplierId}
					onSaved={() => close(true)}
					onCancel={() => close(false)}
				/>
			),
		})

		if (saved) {
			toast.add({ title: 'Pricing added successfully.', type: 'success' })
		}
	}, [supplierId])

	const handleEdit = useCallback(
		async (pricing: SupplierMaterialDto) => {
			const saved = await formDialog({
				title: 'Edit Pricing',
				description: `Update pricing for ${getMaterialName(pricing.materialId)}.`,
				// oxlint-disable-next-line react/no-unstable-nested-components
				content: ({ close }) => (
					<PricingFormBody
						supplierId={supplierId}
						defaultValues={pricing}
						disableMaterial
						onSaved={() => close(true)}
						onCancel={() => close(false)}
					/>
				),
			})

			if (saved) {
				toast.add({ title: 'Pricing updated successfully.', type: 'success' })
			}
		},
		[supplierId, getMaterialName],
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
