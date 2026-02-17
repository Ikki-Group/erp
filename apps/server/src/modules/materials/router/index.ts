import { Elysia } from 'elysia'

import { LocationMaterialsService } from '../service/location-materials.service'
import { MaterialCategoriesService } from '../service/material-categories.service'
import { MaterialUnitsService } from '../service/material-units.service'
import { MaterialsService } from '../service/materials.service'
import { buildLocationMaterialsRoute } from './location-materials.route'
import { buildMaterialCategoriesRoute } from './material-categories.route'
import { buildMaterialUnitsRoute } from './material-units.route'
import { buildMaterialsRoute } from './materials.route'

export function buildMaterialsRouter() {
  // Initialize services
  const categoriesService = new MaterialCategoriesService()
  const materialsService = new MaterialsService()
  const materialUnitsService = new MaterialUnitsService()
  const locationMaterialsService = new LocationMaterialsService()

  // Build routers
  const categoriesRouter = buildMaterialCategoriesRoute(categoriesService)
  const materialsRouter = buildMaterialsRoute(materialsService)
  const materialUnitsRouter = buildMaterialUnitsRoute(materialUnitsService)
  const locationMaterialsRouter = buildLocationMaterialsRoute(locationMaterialsService)

  return new Elysia({ prefix: '/materials', tags: ['Materials'] })
    .use(categoriesRouter)
    .use(materialsRouter)
    .use(materialUnitsRouter)
    .use(locationMaterialsRouter)
}
