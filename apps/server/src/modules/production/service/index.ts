import type { InventoryServiceModule } from '@/modules/inventory'
import type { RecipeService } from '@/modules/recipe/service/recipe.service'

import { WorkOrderService } from './work-order.service'

export class ProductionServiceModule {
	public readonly workOrder: WorkOrderService

	constructor(recipeSvc: RecipeService, inventorySvc: InventoryServiceModule) {
		this.workOrder = new WorkOrderService(recipeSvc, inventorySvc)
	}
}
