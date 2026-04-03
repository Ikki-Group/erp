import { logger } from '@/core/logger'

/* eslint-disable eslint-plugin-import/max-dependencies */
import { AuthServiceModule } from './auth'
import { DashboardServiceModule } from './dashboard'
import { IamServiceModule } from './iam'
import { InventoryServiceModule } from './inventory'
import { LocationServiceModule } from './location'
import { MaterialServiceModule } from './material'
import { MokaServiceModule } from './moka'
import { ProductServiceModule } from './product'
import { RecipeServiceModule } from './recipe'
import { SalesServiceModule } from './sales'
import { ToolServiceModule } from './tool'
import { PurchasingServiceModule } from './purchasing'

import { SupplierServiceModule } from './supplier'
import { EmployeeServiceModule } from './employee'

import { FinanceServiceModule } from './finance'
import { ProductionServiceModule } from './production'
import { HRServiceModule } from './hr'

export function createModules() {
  // Layer 0 — Core
  const location = new LocationServiceModule()
  const product = new ProductServiceModule()

  // Layer 1 — Masters
  const iam = new IamServiceModule()
  const material = new MaterialServiceModule(location)
  const supplier = new SupplierServiceModule()
  const employee = new EmployeeServiceModule()
  const finance = new FinanceServiceModule()

  // Layer 1.5 — Auth (Depends on Iam)
  const auth = new AuthServiceModule(iam)

  // Layer 2 — Operations
  const inventory = new InventoryServiceModule(material)
  const recipe = new RecipeServiceModule()
  const sales = new SalesServiceModule()
  const purchasing = new PurchasingServiceModule(inventory)

  const moka = new MokaServiceModule(logger)

  // Layer 3 — Aggregators
  const production = new ProductionServiceModule(recipe.recipe, inventory)
  const hr = new HRServiceModule()
  const dashboard = new DashboardServiceModule(iam, location)
  const tool = new ToolServiceModule(iam, location, product, material)

  return { location, product, iam, material, auth, inventory, recipe, dashboard, tool, moka, sales, supplier, employee, finance, purchasing, production, hr }
}

export type Modules = ReturnType<typeof createModules>
