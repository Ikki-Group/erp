import { record } from '@elysiajs/opentelemetry'

import type { WithPaginationResult } from '@/shared/types/pagination'

import type { LocationModule } from '@/modules/location'

import type { MaterialCategoryService } from '../category/category.service'
import type { MaterialConversion } from '../conversion/conversion.contract'
import type { MaterialConversionService } from '../conversion/conversion.service'
import type { MaterialLocation } from '../location/location.contract'
import type { MaterialLocationService } from '../location/location.service'
import type { MaterialListFilter } from '../material.repo'
import type { MaterialService } from '../material.service'
import type { MaterialQueryDetailDto } from './query.contract'

export class MaterialQueryService {
	constructor(
		private readonly deps: {
			master: MaterialService
			category: MaterialCategoryService
			location: LocationModule
			conversion: MaterialConversionService
			materialLocation: MaterialLocationService
		},
	) {}

	async list(filter: MaterialListFilter): Promise<WithPaginationResult<MaterialQueryDetailDto>> {
		return record('MaterialQueryService.list', async () => {
			const { data, meta } = await this.deps.master.list(filter)

			const [categoriesMap, locations] = await Promise.all([
				this.deps.category.getRelationMap(),
				this.deps.location.getListAll(),
			])

			const locationsMap = this.deps.location.toRelationMap(locations)

			const results: MaterialQueryDetailDto[] = await Promise.all(
				data.map(async (m) => {
					const [conversions, materialLocations]: [MaterialConversion[], MaterialLocation[]] =
						await Promise.all([
							this.deps.conversion.findAll(m.id),
							this.deps.materialLocation.findByMaterialId(m.id),
						])

					const locationIds: number[] = materialLocations.map(
						(ml: MaterialLocation) => ml.locationId,
					)

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

			const [categoriesMap, locations, conversions, materialLocations] = await Promise.all([
				this.deps.category.getRelationMap(),
				this.deps.location.getListAll(),
				this.deps.conversion.findAll(id),
				this.deps.materialLocation.findByMaterialId(id),
			])

			const locationsMap = this.deps.location.toRelationMap(locations)

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
