import { NotFoundError } from '@/shared/errors/http-error.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'

import type { ComposedRepo } from './composed.repo.ts'
import type {
	ComposedUserFilterDto,
	LocationStaffListItemDto,
	UserDetailDto,
	UserListItemDto,
} from '@ikki/contract/iam/composed'

interface Deps {
	repo: ComposedRepo
}

export class ComposedService {
	constructor(private readonly deps: Deps) {}

	async handleUserDetail(id: number): Promise<UserDetailDto> {
		const result = await this.deps.repo.findUserDetail(id)
		if (!result) {
			throw new NotFoundError('User not found', { code: 'USER_NOT_FOUND', context: { id } })
		}
		return result
	}

	async handleUserList(
		filter: ComposedUserFilterDto,
	): Promise<WithPaginationResult<UserListItemDto>> {
		return this.deps.repo.findUserList(filter)
	}

	async handleLocationStaffList(
		filter: ComposedUserFilterDto,
		locationId: number,
	): Promise<WithPaginationResult<LocationStaffListItemDto>> {
		return this.deps.repo.findLocationStaffList(filter, locationId)
	}
}
