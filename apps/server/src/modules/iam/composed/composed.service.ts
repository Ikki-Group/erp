import { NotFoundError } from '@/shared/errors/http-error.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'

import type { ComposedUserFilterDto, UserDetailDto, UserListItemDto } from './composed.contract.ts'
import type { IComposedRepo } from './composed.repo.ts'

// ─── Service ───

export class ComposedService {
	constructor(private readonly repo: IComposedRepo) {}

	async handleUserDetail(id: number): Promise<UserDetailDto> {
		const result = await this.repo.findUserDetail(id)
		if (!result) {
			throw new NotFoundError('User not found', { code: 'USER_NOT_FOUND', context: { id } })
		}
		return result
	}

	async handleUserList(
		filter: ComposedUserFilterDto,
	): Promise<WithPaginationResult<UserListItemDto>> {
		return this.repo.findUserList(filter)
	}
}
