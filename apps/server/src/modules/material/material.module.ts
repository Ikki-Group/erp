import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { LocationService } from '@/modules/location/location.service.ts'
import type { UomService } from '@/modules/uom/uom.service.ts'

import { AssignmentRepo } from './assignment/assignment.repo.ts'
import { AssignmentService } from './assignment/assignment.service.ts'
import { CategoryRepo } from './category/category.repo.ts'
import { CategoryService } from './category/category.service.ts'
import { MaterialRepo } from './material.repo.ts'
import { createMaterialRoute } from './material.route.ts'
import { MaterialService } from './material.service.ts'

// ─── Dependencies ───

export interface MaterialModuleDeps {
	uomService: UomService
	locationService: LocationService
}

// ─── Module Factory ───

export function createMaterialModule(db: DbContext, cacheClient: CacheClient, deps: MaterialModuleDeps) {
	// Repos
	const categoryRepo = new CategoryRepo(db)
	const materialRepo = new MaterialRepo(db)
	const assignmentRepo = new AssignmentRepo(db)

	// Services
	const categoryService = new CategoryService(categoryRepo, cacheClient)
	const materialService = new MaterialService(materialRepo, cacheClient, deps.uomService, categoryService)
	const assignmentService = new AssignmentService(assignmentRepo, cacheClient, materialService, deps.locationService)

	// Route
	const route = createMaterialRoute(materialService, categoryService, assignmentService)

	return { route, service: materialService, categoryService, assignmentService }
}
