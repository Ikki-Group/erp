import { nowIso } from '../now.ts'

import type { LocationDto } from '@/features/location/dto/index.ts'

const now = nowIso()

export const mockLocationSeed: LocationDto[] = [
	{
		id: 1,
		code: 'STR-JKT',
		name: 'Ikki Coffee - Kemang',
		type: 'store',
		address: 'Jl. Kemang Raya No. 10, Jakarta Selatan',
		phone: '021-1234567',
		isActive: true,
		createdAt: now,
		updatedAt: now,
		createdBy: 1,
		updatedBy: 1,
	},
	{
		id: 2,
		code: 'STR-BSD',
		name: 'Ikki Coffee - BSD',
		type: 'store',
		address: 'Jl. BSD Boulevard, Tangerang',
		phone: '021-7654321',
		isActive: true,
		createdAt: now,
		updatedAt: now,
		createdBy: 1,
		updatedBy: 1,
	},
	{
		id: 3,
		code: 'WH-CTR',
		name: 'Central Warehouse',
		type: 'warehouse',
		address: 'Jl. Industri No. 5, Bekasi',
		phone: null,
		isActive: true,
		createdAt: now,
		updatedAt: now,
		createdBy: 1,
		updatedBy: 1,
	},
]
