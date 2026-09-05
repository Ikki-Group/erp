import type { CacheClient } from '@/infra/cache/index.ts'
import { cache } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { ModuleDescriptor } from '@/shared/module/registry.ts'

import type { LocationApi } from '@/modules/location/index.ts'
import type { UomApi } from '@/modules/uom/index.ts'

import { AssignmentRepo } from './assignment/assignment.repo.ts'
import { AssignmentService } from './assignment/assignment.service.ts'
import { CategoryRepo } from './category/category.repo.ts'
import { CategoryService } from './category/category.service.ts'
import { MaterialRepo } from './material.repo.ts'
import { createMaterialRoute } from './material.route.ts'
import { MaterialService } from './material.service.ts'

interface MaterialModuleDeps {
	uomService: UomApi['service']
	locationService: LocationApi['service']
}

function createMaterialModule(db: DbContext, cacheClient: CacheClient, deps: MaterialModuleDeps) {
	const categoryService = new CategoryService(new CategoryRepo(db), cacheClient)
	const materialService = new MaterialService(
		new MaterialRepo(db),
		cacheClient,
		deps.uomService,
		categoryService,
	)
	const assignmentService = new AssignmentService(
		new AssignmentRepo(db),
		cacheClient,
		materialService,
		deps.locationService,
	)
	const route = createMaterialRoute(materialService, categoryService, assignmentService)
	return { route, service: materialService, categoryService, assignmentService }
}

export interface MaterialApi extends Record<string, unknown> {
	service: MaterialService
	categoryService: CategoryService
	assignmentService: AssignmentService
	getById: MaterialService['getById']
	getByIds: MaterialService['getByIds']
	handleGetById: MaterialService['handleGetById']
	handleList: MaterialService['handleList']
	handleCreate: MaterialService['handleCreate']
	handleUpdate: MaterialService['handleUpdate']
	handleDelete: MaterialService['handleDelete']
	assignment: {
		isAssigned: AssignmentService['isAssigned']
	}
}

function isLocationApi(api: Record<string, unknown> | undefined): api is LocationApi {
	return Boolean(api?.service && typeof api.service === 'object')
}

function isUomApi(api: Record<string, unknown> | undefined): api is UomApi {
	return Boolean(api?.service && typeof api.service === 'object')
}

export const materialModule: ModuleDescriptor = {
	name: 'material',
	layer: 1,
	dependsOn: ['uom', 'location'],
	create(ctx, deps) {
		if (!isUomApi(deps.uom?.api) || !isLocationApi(deps.location?.api)) {
			throw new Error('Material dependencies are missing')
		}
		const built = createMaterialModule(ctx.db, cache, {
			uomService: deps.uom.api.service,
			locationService: deps.location.api.service,
		})
		const api: MaterialApi = {
			service: built.service,
			categoryService: built.categoryService,
			assignmentService: built.assignmentService,
			getById: built.service.getById.bind(built.service),
			getByIds: built.service.getByIds.bind(built.service),
			handleGetById: built.service.handleGetById.bind(built.service),
			handleList: built.service.handleList.bind(built.service),
			handleCreate: built.service.handleCreate.bind(built.service),
			handleUpdate: built.service.handleUpdate.bind(built.service),
			handleDelete: built.service.handleDelete.bind(built.service),
			assignment: { isAssigned: built.assignmentService.isAssigned.bind(built.assignmentService) },
		}
		return { route: built.route, api }
	},
}
