import type { UomDto } from '@/features/uom/dto/index.ts'

import { nowIso } from '../now.ts'

const now = nowIso()

export const mockUomSeed: UomDto[] = [
	{
		id: 1,
		code: 'kg',
		name: 'Kilogram',
		category: 'weight',
		createdAt: now,
		updatedAt: now,
		createdBy: 1,
		updatedBy: 1,
	},
	{
		id: 2,
		code: 'g',
		name: 'Gram',
		category: 'weight',
		createdAt: now,
		updatedAt: now,
		createdBy: 1,
		updatedBy: 1,
	},
	{
		id: 3,
		code: 'l',
		name: 'Liter',
		category: 'volume',
		createdAt: now,
		updatedAt: now,
		createdBy: 1,
		updatedBy: 1,
	},
	{
		id: 4,
		code: 'ml',
		name: 'Milliliter',
		category: 'volume',
		createdAt: now,
		updatedAt: now,
		createdBy: 1,
		updatedBy: 1,
	},
	{
		id: 5,
		code: 'pcs',
		name: 'Pieces',
		category: 'quantity',
		createdAt: now,
		updatedAt: now,
		createdBy: 1,
		updatedBy: 1,
	},
]
