import { z } from 'zod'

import { zp, zq } from '@/shared/schema'

export const StockAlertFilterDto = z.object({
	...zq.pagination.shape,
	locationId: zp.id.optional(),
	type: z.enum(['all', 'below_min', 'below_reorder']).default('all'),
})

export type StockAlertFilterDto = z.infer<typeof StockAlertFilterDto>

export const StockAlertCountFilterDto = z.object({
	locationId: zp.id.optional(),
	type: z.enum(['all', 'below_min', 'below_reorder']).default('all'),
})

export type StockAlertCountFilterDto = z.infer<typeof StockAlertCountFilterDto>

export const StockAlertSelectDto = z.object({
	materialId: zp.id,
	materialName: zp.str,
	materialSku: zp.strNullable,
	locationId: zp.id,
	locationName: zp.str,
	uomCode: zp.strNullable,
	currentQty: zp.num,
	minStock: zp.num,
	reorderPoint: zp.num,
})

export type StockAlertSelectDto = z.infer<typeof StockAlertSelectDto>
