import { record } from '@elysiajs/opentelemetry'

import { bento } from '@/core/cache'
import { RelationMap } from '@/core/utils/relation-map'

import { IAM_CACHE_KEYS, SYSTEM_ROLES } from '../constants'
import * as dto from '../dto/role.dto'
import { RoleErrors } from '../errors'
import { RoleRepo } from '../repo/role.repo'

const cache = bento.namespace('role')

// Role Service (Layer 1)
// Handles authorization role definitions and permission sets
// Pure Domain Service
export class RoleService {
	constructor(public repo = new RoleRepo()) {}

	/* ========================================================================== */
	/*                              QUERY OPERATIONS                             */
	/* ========================================================================== */

	public async clearCache(id?: number) {
		const keys = [IAM_CACHE_KEYS.ROLE_LIST, IAM_CACHE_KEYS.ROLE_COUNT]
		if (id) keys.push(IAM_CACHE_KEYS.ROLE_DETAIL(id))
		await cache.deleteMany({ keys })
	}

	async getList(): Promise<dto.RoleDto[]> {
		return record('RoleService.getList', async () => {
			return cache.getOrSet({
				key: IAM_CACHE_KEYS.ROLE_LIST,
				factory: async () => this.repo.getList(),
			})
		})
	}

	async getRelationMap(): Promise<RelationMap<number, dto.RoleDto>> {
		return record('RoleService.getRelationMap', async () => {
			const roles = await this.getList()
			return RelationMap.fromArray(roles, (r) => r.id)
		})
	}

	async getById(id: number): Promise<dto.RoleDto | undefined> {
		return record('RoleService.getById', async () => {
			return cache.getOrSet({
				key: IAM_CACHE_KEYS.ROLE_DETAIL(id),
				factory: async ({ skip }) => {
					const result = await this.repo.getById(id)
					return result ?? skip()
				},
			})
		})
	}

	async getSuperadmin(): Promise<dto.RoleDto> {
		return record('RoleService.getSuperadmin', async () => {
			const result = await this.getById(SYSTEM_ROLES.SUPERADMIN_ID)
			if (!result) throw RoleErrors.notFound(SYSTEM_ROLES.SUPERADMIN_ID)
			return result
		})
	}

	async count(): Promise<number> {
		return record('RoleService.count', async () => {
			return cache.getOrSet({
				key: IAM_CACHE_KEYS.ROLE_COUNT,
				factory: async () => this.repo.count(),
			})
		})
	}

	/* ========================================================================== */
	/*                              COMMAND OPERATIONS                           */
	/* ========================================================================== */

	async seed(data: (dto.RoleCreateDto & { createdBy: number })[]): Promise<void> {
		return record('RoleService.seed', async () => {
			await this.repo.seed(data)
			await this.clearCache()
		})
	}
}
