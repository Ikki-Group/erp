/**
 * Domain layer barrel export
 */

// Entities
export {
	MaterialEntity,
	MaterialTypeDto,
	type Material,
	type MaterialType,
} from './material.entity'
export { MaterialCategoryEntity, type MaterialCategory } from './material-category.entity'
export { MaterialConversionEntity, type MaterialConversion } from './material-conversion.entity'
export { MaterialLocationEntity, type MaterialLocation } from './material-location.entity'

// Ports
export type {
	IMaterialRepo,
	IMaterialCategoryRepo,
	IMaterialConversionRepo,
	IMaterialLocationRepo,
	IMaterialQueryRepo,
	MaterialListFilter,
	MaterialInsertData,
	MaterialUpdateData,
	CategoryFilter,
	CategoryInsertData,
	CategoryUpdateData,
	ConversionFilter,
	ConversionInsertData,
	ConversionUpdateData,
	LocationStockFilter,
	MaterialLocationWithLocation,
	MaterialLocationStock,
} from './ports'
