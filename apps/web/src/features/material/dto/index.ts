export {
	MaterialCreateDto,
	MaterialDto,
	MaterialFilterDto,
	MaterialTypeEnum,
	MaterialUpdateDto,
} from '@ikki/contract/material'
export { MaterialAssignDto, MaterialLocationDto } from '@ikki/contract/material/assignment'
export {
	MaterialCategoryCreateDto,
	MaterialCategoryDto,
	MaterialCategoryFilterDto,
	MaterialCategoryUpdateDto,
} from '@ikki/contract/material/category'

// ─── UI labels (web-only) ───
export const MATERIAL_TYPE_OPTIONS = [
	{ label: 'Raw', value: 'raw' },
	{ label: 'Semi Finished', value: 'semi_finished' },
] as const
