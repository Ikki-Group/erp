import type { Infra } from '@/shared/module.ts'

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

export function createMenuModule(infra: Infra) {
	const categoryService = new CategoryService({ ...infra, repo: new CategoryRepo(infra.db) })
	const modifierService = new ModifierService({ ...infra, repo: new ModifierRepo(infra.db) })
	const itemService = new ItemService({
		...infra,
		repo: new ItemRepo(infra.db),
		category: categoryService,
	})
	const assignmentService = new AssignmentService({
		...infra,
		repo: new AssignmentRepo(infra.db),
		item: itemService,
		modifier: modifierService,
	})
	const composedService = new ComposedService({ repo: new ComposedRepo(infra.db) })
	const route = createMenuRoute({
		categoryService,
		itemService,
		modifierService,
		assignmentService,
		composedService,
	})
	return { route, itemService, composedService }
}

export type { ItemService, ComposedService }
export type { MenuItemDto } from './item/item.contract.ts'
export type { MenuItemDetailDto } from './composed/composed.contract.ts'
