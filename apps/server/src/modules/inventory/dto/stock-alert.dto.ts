import { z } from 'zod'

import { zp } from '@/core/validation'

export const StockAlertFilterDto = z.object({
	locationId: zp.id.optional(),
	type: z.enum(['all', 'below_min', 'below_reorder']).default('all'),
})

export type StockAlertFilterDto = z.infer<typeof StockAlertFilterDto>

export const StockAlertSelectDto = z.object({
	materialId: zp.id,
	materialName: zp.str,
	materialSku: zp.strNullable,
	locationId: zp.id,
	locationName: zp.str,
	uomCode: zp.strNullable,
	currentQty: zp.decimal,
	minStock: zp.decimal,
	reorderPoint: zp.decimal,
})

export type StockAlertSelectDto = z.infer<typeof StockAlertSelectDto>
