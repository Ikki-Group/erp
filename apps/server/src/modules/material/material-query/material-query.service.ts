import { record } from '@elysiajs/opentelemetry'

import type { WithPaginationResult } from '@/core/database/pagination'

import { LocationMasterService } from '@/modules/location'

import { MaterialCategoryService } from '../material-category/material-category.service'
import type { MaterialService } from '../material-master/material.service'
import type { MaterialDetailDto, MaterialListFilterDto } from '../material-query/material-query.dto'
import type { MaterialQueryRepo } from '../material-query/material-query.repo'
import { UomService } from '../uom/uom.service'

export class MaterialQueryService {
	constructor(
		private readonly masterSvc: MaterialService,
		private readonly categorySvc: MaterialCategoryService,
		private readonly uomSvc: UomService,
		private readonly locationSvc: LocationMasterService,
		private readonly repo: MaterialQueryRepo,
	) {}

	async handleList(
		filter: MaterialListFilterDto,
	): Promise<WithPaginationResult<MaterialDetailDto>> {
		return record('MaterialQueryService.handleList', async () => {
			const { data, meta } = await this.repo.getListPaginated(filter)

			const [categoriesMap, uomsMap, locationsMap] = await Promise.all([
				this.categorySvc.getRelationMap(),
				this.uomSvc.getRelationMap(),
				this.locationSvc.getRelationMap(),
			])

			const results: MaterialDetailDto[] = []

			for (const m of data) {
				results.push({
					...m,
					category: m.categoryId ? (categoriesMap.get(m.categoryId) ?? null) : null,
				})
			}

			return { data: results, meta }
		})
	}
}
