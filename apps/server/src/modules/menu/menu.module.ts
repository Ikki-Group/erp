import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { LocationService } from '@/modules/location/location.service.ts'

import { AssignmentRepo } from './assignment/assignment.repo.ts'
import { AssignmentService } from './assignment/assignment.service.ts'
import { CategoryRepo } from './category/category.repo.ts'
import { CategoryService } from './category/category.service.ts'
import { ComposedRepo } from './composed/composed.repo.ts'
import { ComposedService } from './composed/composed.service.ts'
import { ItemRepo } from './item/item.repo.ts'
import { ItemService } from './item/item.service.ts'
import { createMenuRoute } from './menu.route.ts'
import { ModifierRepo } from './modifier/modifier.repo.ts'
import { ModifierService } from './modifier/modifier.service.ts'

// ─── Dependencies ───

export interface MenuModuleDeps {
	locationService: LocationService
}

// ─── Module Factory ───

export function createMenuModule(db: DbContext, cacheClient: CacheClient, _deps: MenuModuleDeps) {
	// Repos
	const categoryRepo = new CategoryRepo(db)
	const modifierRepo = new ModifierRepo(db)
	const itemRepo = new ItemRepo(db)
	const assignmentRepo = new AssignmentRepo(db)
	const composedRepo = new ComposedRepo(db)

	// Services
	const categoryService = new CategoryService(categoryRepo, cacheClient)
	const modifierService = new ModifierService(modifierRepo, cacheClient)
	const itemService = new ItemService(itemRepo, cacheClient, categoryService)
	const assignmentService = new AssignmentService(assignmentRepo, cacheClient, itemService, modifierService)
	const composedService = new ComposedService(composedRepo, cacheClient)

	// Route
	const route = createMenuRoute(categoryService, itemService, modifierService, assignmentService, composedService)

	return { route, categoryService, itemService, modifierService, assignmentService, composedService }
}
