import type { ModuleDescriptor } from '@/shared/module/registry.ts'

import { LocationRepo } from './location.repo.ts'
import { createLocationRoute } from './location.route.ts'
import { LocationService } from './location.service.ts'
import type { LocationApi } from './location.service.ts'

export const locationModule: ModuleDescriptor = {
	name: 'location',
	layer: 1,
	dependsOn: [],
	create(ctx) {
		const service = new LocationService({
			repo: new LocationRepo(ctx.db),
			uow: ctx.uow,
			cache: ctx.cache,
			audit: ctx.auditPort,
		})
		const api: LocationApi = {
			service,
			getById: service.getById.bind(service),
			getAll: service.getAll.bind(service),
			handleGetById: service.handleGetById.bind(service),
			handleList: service.handleList.bind(service),
			handleCreate: service.handleCreate.bind(service),
			handleUpdate: service.handleUpdate.bind(service),
			handleDelete: service.handleDelete.bind(service),
		}
		return { route: createLocationRoute(service), api }
	},
}
