import { record } from '@elysiajs/opentelemetry'

import type { WithPaginationResult } from '@/core/database/pagination'
import type { LocationMasterService } from '@/modules/location'

import type { MaterialLocation } from '../domain/material-location.entity'
import type { MaterialConversion } from '../domain/material-conversion.entity'
import type { MaterialListFilter } from '../domain/ports'
import type { MaterialQueryDetailDto } from '../dto/material-query.dto'
import type { MaterialCategoryService } from './material-category.service'
import type { MaterialConversionService } from './material-conversion.service'
import type { MaterialLocationService } from './material-location.service'
import type { MaterialService } from './material.service'

export class MaterialQueryService {
	constructor(
		private readonly deps: {
			master: MaterialService
			category: MaterialCategoryService
			location: LocationMasterService
			conversion: MaterialConversionService
			materialLocation: MaterialLocationService
		},
	) {}

	async list(filter: MaterialListFilter): Promise<WithPaginationResult<MaterialQueryDetailDto>> {
		return record('MaterialQueryService.list', async () => {
			const { data, meta } = await this.deps.master.list(filter)

			const [categoriesMap, locationsMap] = await Promise.all([
				this.deps.category.getRelationMap(),
				this.deps.location.getRelationMap(),
			])

			const results: MaterialQueryDetailDto[] = await Promise.all(
				data.map(async (m) => {
					const [conversions, materialLocations]: [MaterialConversion[], MaterialLocation[]] =
						await Promise.all([
							this.deps.conversion.findAll(m.id),
							this.deps.materialLocation.findByMaterialId(m.id),
						])

					const locationIds: number[] = materialLocations.map((ml: MaterialLocation) => ml.locationId)

					return {
						...m,
						category: m.categoryId ? (categoriesMap.get(m.categoryId) ?? null) : null,
						conversions,
						locations: locationIds
							.map((lid: number) => locationsMap.get(lid))
							.filter((l): l is NonNullable<typeof l> => l !== undefined),
					}
				}),
			)

			return { data: results, meta }
		})
	}

	async detail(id: number): Promise<MaterialQueryDetailDto | undefined> {
		return record('MaterialQueryService.detail', async () => {
			const material = await this.deps.master.findById(id)
			if (!material) return undefined

			const [categoriesMap, locationsMap, conversions, materialLocations]: [
				Awaited<ReturnType<typeof this.deps.category.getRelationMap>>,
				Awaited<ReturnType<typeof this.deps.location.getRelationMap>>,
				MaterialConversion[],
				MaterialLocation[],
			] = await Promise.all([
				this.deps.category.getRelationMap(),
				this.deps.location.getRelationMap(),
				this.deps.conversion.findAll(id),
				this.deps.materialLocation.findByMaterialId(id),
			])

			const locationIds: number[] = materialLocations.map((ml: MaterialLocation) => ml.locationId)

			return {
				...material,
				category: material.categoryId ? (categoriesMap.get(material.categoryId) ?? null) : null,
				conversions,
				locations: locationIds
					.map((locId: number) => locationsMap.get(locId))
					.filter((l): l is NonNullable<typeof l> => l !== undefined),
			}
		})
	}
}
