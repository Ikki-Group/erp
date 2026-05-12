/**
 * Material Module — Public API
 *
 * This is the only file other modules should import from.
 */

// Module + Route wiring
export { MaterialModule, initMaterialRoutes } from './material.module'

// Service types (for cross-module dependency injection)
export type { MaterialService } from './service/material.service'
export type { MaterialCategoryService } from './service/material-category.service'
export type { MaterialConversionService } from './service/material-conversion.service'
export type { MaterialLocationService } from './service/material-location.service'
export type { MaterialQueryService } from './service/material-query.service'
export type { UomService } from './service/uom.service'

// DTOs (for external consumers)
export {
	MaterialDto,
	MaterialDetailDto,
	MaterialCreateDto,
	MaterialUpdateDto,
	MaterialFilterDto,
} from './dto/material.dto'

export { MaterialTypeSchema } from './domain/material.entity'
export type { MaterialType } from './domain/material.entity'

export {
	MaterialCategoryDto,
	MaterialCategoryCreateDto,
	MaterialCategoryUpdateDto,
	MaterialCategoryFilterDto,
} from './dto/material-category.dto'

export {
	MaterialConversionCreateDto,
	MaterialConversionDto,
	MaterialConversionDetailDto,
	MaterialConversionFilterDto,
	MaterialConversionUpdateDto,
} from './dto/material-conversion.dto'

export {
	MaterialLocationDto,
	MaterialLocationFilterDto,
	MaterialLocationAssignDto,
	MaterialLocationUnassignDto,
	MaterialLocationConfigDto,
	MaterialLocationWithLocationDto,
	MaterialLocationStockDto,
} from './dto/material-location.dto'

export { MaterialQueryDetailDto } from './dto/material-query.dto'

export { UomDto, UomFilterDto, UomMutationDto } from './dto/uom.dto'
