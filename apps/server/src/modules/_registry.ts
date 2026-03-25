import { logger } from '@/core/logger'

import { AuthServiceModule } from './auth'
import { DashboardServiceModule } from './dashboard'
import { IamServiceModule } from './iam'
import { InventoryServiceModule } from './inventory'
import { LocationServiceModule } from './location'
import { MaterialServiceModule } from './materials'
import { MokaServiceModule } from './moka'
import { ProductServiceModule } from './product'
import { RecipeServiceModule } from './recipe'
import { SalesServiceModule } from './sales'
import { ToolServiceModule } from './tool'

export function createModules() {
  // Layer 0 — Core
  const location = new LocationServiceModule()
  const product = new ProductServiceModule()

  // Layer 1 — Masters
  const iam = new IamServiceModule(location)
  const material = new MaterialServiceModule(location)

  // Layer 1.5 — Auth (Depends on Iam)
  const auth = new AuthServiceModule(iam)

  // Layer 2 — Operations
  const inventory = new InventoryServiceModule(material)
  const recipe = new RecipeServiceModule()
  const sales = new SalesServiceModule()

  // Layer 3 — Aggregators
  const dashboard = new DashboardServiceModule(iam, location)
  const tool = new ToolServiceModule(iam, location, product, material)
  const moka = new MokaServiceModule(logger)

  return {
    location,
    product,
    iam,
    material,
    auth,
    inventory,
    recipe,
    dashboard,
    tool,
    moka,
    sales,
  }
}

export type Modules = ReturnType<typeof createModules>
