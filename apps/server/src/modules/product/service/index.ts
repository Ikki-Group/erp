import { ProductCategoryService } from './product-category.service'
import { ProductService } from './product.service'
import { SalesTypeService } from './sales-type.service'

export class ProductServiceModule {
  public readonly category: ProductCategoryService
  public readonly salesType: SalesTypeService
  public readonly product: ProductService

  constructor() {
    this.category = new ProductCategoryService()
    this.salesType = new SalesTypeService()
    this.product = new ProductService(this.category)
  }
}
