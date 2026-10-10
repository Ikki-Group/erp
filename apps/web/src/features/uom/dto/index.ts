export {
	UomCategoryEnum,
	UomConversionCreateDto,
	UomConversionDto,
	UomCreateDto,
	UomDto,
	UomFilterDto,
	UomUpdateDto,
} from '@ikki/contract/uom'

export const UOM_CATEGORY_OPTIONS = [
	{ label: 'Weight', value: 'weight' },
	{ label: 'Volume', value: 'volume' },
	{ label: 'Quantity', value: 'quantity' },
	{ label: 'Length', value: 'length' },
] as const
