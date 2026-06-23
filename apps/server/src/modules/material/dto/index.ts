/**
 * DTO layer barrel export
 */

export {
	MaterialDto,
	MaterialDetailDto,
	MaterialCreateDto,
	MaterialUpdateDto,
	MaterialFilterDto,
} from './material.contract'

export { MaterialTypeSchema } from '../domain/material.entity'
export type { MaterialType } from '../domain/material.entity'

export {
	MaterialCategoryDto,
	MaterialCategoryFilterDto,
	MaterialCategoryMutationDto,
	MaterialCategoryCreateDto,
	MaterialCategoryUpdateDto,
} from './material-category.contract'

export {
	MaterialConversionDto,
	MaterialConversionDetailDto,
	MaterialConversionCreateDto,
	MaterialConversionUpdateDto,
	MaterialConversionFilterDto,
} from './material-conversion.contract'

export {
	MaterialLocationDto,
	MaterialLocationWithLocationDto,
	MaterialLocationStockDto,
	MaterialLocationFilterDto,
	MaterialLocationAssignDto,
	MaterialLocationUnassignDto,
	MaterialLocationConfigDto,
} from './material-location.contract'

export { MaterialQueryDetailDto, MaterialQueryFilterDto } from './material-query.contract'
