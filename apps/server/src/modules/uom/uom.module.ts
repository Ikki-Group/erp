import { cache } from '@/infra/cache/index.ts'
import type { ModuleDescriptor } from '@/shared/module/registry.ts'

import { resolveConversion } from './domain/uom.resolver.ts'
import { UomRepo } from './uom.repo.ts'
import { createUomRoute } from './uom.route.ts'
import { UomService } from './uom.service.ts'

export interface UomApi extends Record<string, unknown> {
	service: UomService
	getById: UomService['getById']
	getAll: UomService['getAll']
	handleGetById: UomService['handleGetById']
	handleList: UomService['handleList']
	handleCreate: UomService['handleCreate']
	handleUpdate: UomService['handleUpdate']
	handleDelete: UomService['handleDelete']
	getAllConversions: UomService['getAllConversions']
	handleConversionList: UomService['handleConversionList']
	handleConvert: UomService['handleConvert']
	resolveConversion: typeof resolveConversion
}

export const uomModule: ModuleDescriptor = {
	name: 'uom',
	layer: 1,
	dependsOn: [],
	create(ctx) {
		const service = new UomService(new UomRepo(ctx.db), cache)
		const api: UomApi = {
			service,
			getById: service.getById.bind(service),
			getAll: service.getAll.bind(service),
			handleGetById: service.handleGetById.bind(service),
			handleList: service.handleList.bind(service),
			handleCreate: service.handleCreate.bind(service),
			handleUpdate: service.handleUpdate.bind(service),
			handleDelete: service.handleDelete.bind(service),
			getAllConversions: service.getAllConversions.bind(service),
			handleConversionList: service.handleConversionList.bind(service),
			handleConvert: service.handleConvert.bind(service),
			resolveConversion,
		}
		return { route: createUomRoute(service), api }
	},
}
