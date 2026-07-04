import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { ProductCategoryRepo } from './category.repo'
import { ProductCategoryService } from './category.service'
import { ProductRepo } from './product.repo'
import { ProductService } from './product.service'

export type ProductModule = {
	category: ProductCategoryService
	product: ProductService
}

export function createProductModule(db: DbContext, cacheClient: CacheClient): ProductModule {
	const categoryRepo = new ProductCategoryRepo(db)
	const category = new ProductCategoryService(categoryRepo, cacheClient)

	const productRepo = new ProductRepo(db)
	const product = new ProductService(categoryRepo, productRepo, cacheClient)

	return { category, product }
}
