import { z } from 'zod'

import { zId, zStr, zStrNullable } from '@/lib/zod'

export const stockAlertFilterSchema = z.object({
	locationId: zId.optional(),
	type: z.enum(['all', 'below_min', 'below_reorder']).default('all'),
})

export type StockAlertFilterDto = z.infer<typeof stockAlertFilterSchema>

export const stockAlertSelectSchema = z.object({
	materialId: zId,
	materialName: zStr,
	materialSku: zStrNullable,
	locationId: zId,
	locationName: zStr,
	uomCode: zStrNullable,
	currentQty: z.number(),
	minStock: z.number(),
	reorderPoint: z.number(),
})

export type StockAlertSelectDto = z.infer<typeof stockAlertSelectSchema>
