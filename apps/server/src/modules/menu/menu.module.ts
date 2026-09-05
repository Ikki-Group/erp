import { cache } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { ModuleDescriptor } from '@/shared/module/registry.ts'

import type { LocationApi } from '@/modules/location/index.ts'

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

function createMenuModule(db: DbContext) {
	const categoryService = new CategoryService(new CategoryRepo(db), cache)
	const modifierService = new ModifierService(new ModifierRepo(db), cache)
	const itemService = new ItemService(new ItemRepo(db), cache, categoryService)
	const assignmentService = new AssignmentService(
		new AssignmentRepo(db),
		cache,
		itemService,
		modifierService,
	)
	const composedService = new ComposedService(new ComposedRepo(db), cache)
	return {
		route: createMenuRoute(
			categoryService,
			itemService,
			modifierService,
			assignmentService,
			composedService,
		),
		categoryService,
		itemService,
		modifierService,
		assignmentService,
		composedService,
	}
}

export interface MenuApi extends Record<string, unknown> {
	categoryService: CategoryService
	itemService: ItemService
	modifierService: ModifierService
	assignmentService: AssignmentService
	composedService: ComposedService
	itemDetail: ComposedService['handleDetail']
}

function isLocationApi(api: Record<string, unknown> | undefined): api is LocationApi {
	return Boolean(api?.service && typeof api.service === 'object')
}

export const menuModule: ModuleDescriptor = {
	name: 'menu',
	layer: 1,
	dependsOn: ['location'],
	create(ctx, deps) {
		if (!isLocationApi(deps.location?.api)) throw new Error('Location API dependency is missing')
		const built = createMenuModule(ctx.db)
		const api: MenuApi = {
			categoryService: built.categoryService,
			itemService: built.itemService,
			modifierService: built.modifierService,
			assignmentService: built.assignmentService,
			composedService: built.composedService,
			itemDetail: built.composedService.handleDetail.bind(built.composedService),
		}
		return { route: built.route, api }
	},
}
