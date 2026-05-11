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

			const materialIds = data.map((m) => m.id)
			const [relationsMap, categoriesMap, locationsMap] = await Promise.all([
				this.masterSvc.getMaterialsBatchWithRelations(materialIds),
				this.categorySvc.getRelationMap(),
				this.locationSvc.getRelationMap(),
			])

			const results: MaterialDetailDto[] = data.map((m) => {
				const relations = relationsMap.get(m.id)!
				return {
					...m,
					category: m.categoryId ? (categoriesMap.get(m.categoryId) ?? null) : null,
					conversions: relations.conversions.map((c) => ({
						...c,
						uom: c.uom!,
					})),
					locations: relations.locationIds
						.map((id) => locationsMap.get(id))
						.filter((l): l is NonNullable<typeof l> => l !== undefined),
				}
			})

			return { data: results, meta }
		})
	}

	async handleDetail(id: number): Promise<MaterialDetailDto | undefined> {
		return record('MaterialQueryService.handleDetail', async () => {
			const material = await this.masterSvc.getById(id)
			if (!material) return undefined

			const [relationsMap, categoriesMap, locationsMap] = await Promise.all([
				this.masterSvc.getMaterialsBatchWithRelations([id]),
				this.categorySvc.getRelationMap(),
				this.locationSvc.getRelationMap(),
			])

			const relations = relationsMap.get(id)!
			return {
				...material,
				category: material.categoryId ? (categoriesMap.get(material.categoryId) ?? null) : null,
				conversions: relations.conversions.map((c) => ({
					...c,
					uom: c.uom!,
				})),
				locations: relations.locationIds
					.map((locId) => locationsMap.get(locId))
					.filter((l): l is NonNullable<typeof l> => l !== undefined),
			}
		})
	}
}
