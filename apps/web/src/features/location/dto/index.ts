// Value + type of each name are re-exported together (contract declares both).
export {
	LocationCreateDto,
	LocationDto,
	LocationFilterDto,
	LocationTypeEnum,
	LocationUpdateDto,
} from '@ikki/contract/location'

export const LOCATION_TYPE_OPTIONS = [
	{ label: 'Store', value: 'store' },
	{ label: 'Warehouse', value: 'warehouse' },
] as const
