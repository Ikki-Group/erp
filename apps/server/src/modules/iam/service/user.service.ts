import { record } from '@elysiajs/opentelemetry'

import { bento } from '@/core/cache'

import { IAM_CACHE_KEYS } from '../constants'
import * as dto from '../dto/user.dto'
import { UserRepo } from '../repo/user.repo'

const cache = bento.namespace('user')

// User Service (Layer 1)
// Handles identity, profile. Pure Domain Service.
export class UserService {
	constructor(public repo: UserRepo = new UserRepo()) {}

	/* ========================================================================== */
	/*                              QUERY OPERATIONS                             */
	/* ========================================================================== */

	public async clearCache(id?: number) {
		const keys = [IAM_CACHE_KEYS.USER_LIST, IAM_CACHE_KEYS.USER_COUNT]
		if (id) keys.push(IAM_CACHE_KEYS.USER_DETAIL(id))
		await cache.deleteMany({ keys })
	}

	async getList(): Promise<dto.UserDto[]> {
		return record('UserService.getList', async () => {
			return cache.getOrSet({
				key: IAM_CACHE_KEYS.USER_LIST,
				factory: async () => this.repo.getList(),
			})
		})
	}

	async getById(id: number): Promise<dto.UserDto | undefined> {
		return record('UserService.getById', async () => {
			return cache.getOrSet({
				key: IAM_CACHE_KEYS.USER_DETAIL(id),
				factory: async ({ skip }) => {
					const row = await this.repo.getById(id)
					return row ?? skip()
				},
			})
		})
	}

	async getByIdentifier(
		identifier: string,
	): Promise<(dto.UserDto & { passwordHash: string }) | null> {
		return this.repo.findByIdentifier(identifier)
	}

	async count(): Promise<number> {
		return record('UserService.count', async () => {
			return cache.getOrSet({
				key: IAM_CACHE_KEYS.USER_COUNT,
				factory: () => this.repo.count(),
			})
		})
	}

	/* ========================================================================== */
	/*                              COMMAND OPERATIONS                           */
	/* ========================================================================== */

	async seed(
		data: (dto.UserCreateDto & { passwordHash: string; createdBy: number; isRoot?: boolean })[],
	): Promise<void> {
		await record('UserService.seed', async () => {
			await this.repo.seed(data)
			await this.clearCache()
		})
	}
}
