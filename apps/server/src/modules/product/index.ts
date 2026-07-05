export * from './category/category.contract'
export type { IProductCategoryRepo } from './category/category.repo'
export type { ProductCategoryService } from './category/category.service'

export * from './product.contract'
export type { IProductRepo } from './product.repo'
export type { ProductService } from './product.service'

export type { ProductModule } from './product.module'
export { createProductModule } from './product.module'
export { createProductRoute } from './product.route'
