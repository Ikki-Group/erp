import type { ConflictField, WithPaginationResult } from '@/core/database'

import { locationsTable } from '@/db/schema'

import * as dto from './location-master.dto'
import type { LocationMasterRepo } from './location-master.repo'

const uniqueFields: ConflictField<'code' | 'name'>[] = [
	{
		field: 'code',
		column: locationsTable.code,
		message: 'Location code already exists',
		code: 'LOCATION_CODE_ALREADY_EXISTS',
	},
	{
		field: 'name',
		column: locationsTable.name,
		message: 'Location name already exists',
		code: 'LOCATION_NAME_ALREADY_EXISTS',
	},
]

export class LocationMasterService {
	constructor(private readonly repo: LocationMasterRepo) {}

	// Public methods

	// Handler layer
	async handleList(filter: dto.LocationFilterDto): Promise<WithPaginationResult<dto.LocationDto>> {}

	async handleDetail(id: number): Promise<dto.LocationDto> {}

	async handleCreate(data: dto.LocationCreateDto, actorId: number): Promise<{ id: number }> {}

	async handleUpdate(
		{ id, ...data }: dto.LocationUpdateDto,
		actorId: number,
	): Promise<{ id: number }> {}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {}

	async handleHardRemove(id: number): Promise<{ id: number }> {}
}
