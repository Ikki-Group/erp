import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { ModuleDescriptor } from '@/shared/module/registry.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

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

function createMenuModule(
	db: DbContext,
	cacheClient: CacheClient,
	uow: UnitOfWork,
	audit: AuditPort,
) {
	const categoryService = new CategoryService(new CategoryRepo(db), cacheClient, uow, audit)
	const modifierService = new ModifierService(new ModifierRepo(db), cacheClient, uow, audit)
	const itemService = new ItemService(new ItemRepo(db), cacheClient, categoryService, uow, audit)
	const assignmentService = new AssignmentService(
		new AssignmentRepo(db),
		cacheClient,
		itemService,
		modifierService,
		uow,
		audit,
	)
	const composedService = new ComposedService(new ComposedRepo(db), cacheClient)
	return {
		route: createMenuRoute(
			categoryService,
			itemService,
			modifierService,
			assignmentService,
			composedService,
		),
		itemGetById: itemService.handleGetById.bind(itemService),
		itemDetail: composedService.handleDetail.bind(composedService),
		itemService,
		composedService,
	}
}

export interface MenuApi extends Record<string, unknown> {
	itemGetById: ItemService['handleGetById']
	itemDetail: ComposedService['handleDetail']
}

export const menuModule: ModuleDescriptor = {
	name: 'menu',
	layer: 1,
	dependsOn: [],
	create(ctx) {
		const built = createMenuModule(ctx.db, ctx.cacheClient, ctx.uow, ctx.auditPort)
		const api: MenuApi = {
			itemGetById: built.itemGetById,
			itemDetail: built.itemDetail,
		}
		return { route: built.route, api }
	},
}
