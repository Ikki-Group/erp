import { z } from 'zod'

import {
	SupplierMaterialCreateDto,
	SupplierMaterialUpdateDto,
	type SupplierMaterialDto,
} from './dto/index.ts'

export interface PricingFormValues {
	materialId: number | null
	unitPrice: string
	uomId: number | null
	minOrderQty: string
}

export const PricingFormSchema = z.object({
	materialId: SupplierMaterialCreateDto.shape.materialId
		.nullable()
		.refine((value) => value !== null, { error: 'Material is required' }),
	unitPrice: SupplierMaterialCreateDto.shape.unitPrice,
	uomId: SupplierMaterialCreateDto.shape.uomId
		.nullable()
		.refine((value) => value !== null, { error: 'UoM is required' }),
	minOrderQty: z
		.string()
		.trim()
		.refine(
			(value) =>
				value === '' || SupplierMaterialCreateDto.shape.minOrderQty.safeParse(value).success,
			{ error: 'Use a decimal such as 0.5, or leave blank' },
		),
})

export function toPricingFormValues(pricing?: SupplierMaterialDto): PricingFormValues {
	return {
		materialId: pricing?.materialId ?? null,
		unitPrice: pricing?.unitPrice ?? '',
		uomId: pricing?.uomId ?? null,
		minOrderQty: pricing?.minOrderQty ?? '',
	}
}

export function toPricingCreateInput(
	supplierId: number,
	values: PricingFormValues,
): SupplierMaterialCreateDto {
	return SupplierMaterialCreateDto.parse({
		supplierId,
		...values,
		minOrderQty: values.minOrderQty.trim() || null,
	})
}

/** Supplier and material identity are immutable after creation. */
export function toPricingUpdateInput(
	id: number,
	values: PricingFormValues,
): SupplierMaterialUpdateDto {
	return SupplierMaterialUpdateDto.parse({
		id,
		unitPrice: values.unitPrice,
		uomId: values.uomId,
		minOrderQty: values.minOrderQty.trim() || null,
	})
}
