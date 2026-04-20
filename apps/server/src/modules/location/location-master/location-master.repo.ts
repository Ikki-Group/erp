import { record } from '@elysiajs/opentelemetry'

import type { WithPaginationResult } from '@/core/database'

import { db } from '@/db'
import { locationsTable } from '@/db/schema'

import * as dto from './location-master.dto'

export class LocationMasterRepo {
	private base() {
		return db.select().from(locationsTable).$dynamic()
	}

	async getList(): Promise<dto.LocationDto[]> {
		return record('LocationMasterRepo.getList', async () => this.base().execute())
	}

	async getListPaginated(
		filter: dto.LocationFilterDto,
	): Promise<WithPaginationResult<dto.LocationDto>> {
		return record('LocationMasterRepo.getListPaginated', async () => {
			const { q, page, limit, type } = filter

			return db.query.locationsTable.findMany({
				where: {
					type: type,
				},
				with: {
					materialLocations: {
						where: {},
					},
				},
			})
		})
	}

	async getById() {}

	async count() {}

	async seed(data: (dto.LocationCreateDto & { createdBy: number })[]) {}

	async create() {}

	async update() {}

	async remove() {}

	async hardRemove() {}
}
