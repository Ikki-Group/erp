// IAM Factories
export { createUser, createRole } from './iam'

// Location Factories
export { createLocation } from './location'

// Material Factories
export { createMaterialCategory, createUom, createMaterial } from './material'

// Product Factories
export { createProductCategory, createProduct } from './product'

// Unified Factory Object (for backward compatibility)
import { createUser, createRole } from './iam'
import { createLocation } from './location'
import { createMaterialCategory, createUom, createMaterial } from './material'
import { createProductCategory, createProduct } from './product'

export const Factory = {
	user: createUser,
	role: createRole,
	location: createLocation,
	materialCategory: createMaterialCategory,
	uom: createUom,
	material: createMaterial,
	productCategory: createProductCategory,
	product: createProduct,
}

export default Factory
