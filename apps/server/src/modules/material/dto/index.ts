/**
 * DTO layer barrel export
 */

export {
	MaterialDto,
	MaterialDetailDto,
	MaterialCreateDto,
	MaterialUpdateDto,
	MaterialFilterDto,
} from './material.dto'

export { MaterialTypeSchema } from '../domain/material.entity'
export type { MaterialType } from '../domain/material.entity'

export {
	MaterialCategoryDto,
	MaterialCategoryFilterDto,
	MaterialCategoryMutationDto,
	MaterialCategoryCreateDto,
	MaterialCategoryUpdateDto,
} from './material-category.dto'

export {
	MaterialConversionDto,
	MaterialConversionDetailDto,
	MaterialConversionCreateDto,
	MaterialConversionUpdateDto,
	MaterialConversionFilterDto,
} from './material-conversion.dto'

export {
	MaterialLocationDto,
	MaterialLocationWithLocationDto,
	MaterialLocationStockDto,
	MaterialLocationFilterDto,
	MaterialLocationAssignDto,
	MaterialLocationUnassignDto,
	MaterialLocationConfigDto,
} from './material-location.dto'

export { MaterialQueryDetailDto, MaterialQueryFilterDto } from './material-query.dto'
