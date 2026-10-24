import { menuCategories } from '@/db/schema/menu.ts'

import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { checkConflict } from '@/infra/database/conflict.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { mutate } from '@/shared/service/mutate.ts'
import type { MutationScope } from '@/shared/service/mutate.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type {
	MenuCategoryCreateDto,
	MenuCategoryDto,
	MenuCategoryFilterDto,
	MenuCategoryUpdateDto,
} from './category.contract.ts'
import { CategoryError, uniqueFields } from './category.internal.ts'
import type { ICategoryRepo } from './category.repo.ts'

// ─── Service ───

export class CategoryService {
	private readonly cache: CacheService
	private readonly mutation: MutationScope

	constructor(
		private readonly repo: ICategoryRepo,
		cacheClient: CacheClient,
		uow: UnitOfWork,
		audit: AuditPort,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'menu-category')
		this.mutation = { uow, audit, module: 'menu', entity: 'menu_category', invalidate: this.cache }
	}

	// ─── Cached Reads ───

	async getById(id: number): Promise<MenuCategoryDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	async getByLocation(locationId: number): Promise<MenuCategoryDto[]> {
		return this.cache.getOrSet({
			key: `${this.cache.namespace}:location:${locationId}`,
			factory: () => this.repo.findByLocation(locationId),
		})
	}

	// ─── Handlers ───

	async handleGetById(id: number, actor: Actor): Promise<MenuCategoryDto> {
		const category = assertFound(await this.getById(id), () => CategoryError.notFound(id))
		actor.assertCan(category.locationId)
		return category
	}

	async handleList(filter: MenuCategoryFilterDto): Promise<WithPaginationResult<MenuCategoryDto>> {
		return this.repo.findPage(filter)
	}

	async handleCreate(data: MenuCategoryCreateDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate parentId belongs to same location
		if (data.parentId) {
			await this.#validateParentLocation(data.parentId, data.locationId)
		}

		// 2. Create and audit in one transaction
		return mutate(this.mutation, actor, async (tx) => {
			await checkConflict({
				db: tx,
				table: menuCategories,
				pkColumn: menuCategories.id,
				fields: uniqueFields,
				input: data,
			})

			const written = await this.repo.insert({ ...data, ...stampCreate(actor.id) }, tx)
			if (!written) throw CategoryError.createFailed()

			return {
				result: written,
				audit: {
					action: 'create',
					summary: `Created menu category "${data.name}"`,
					newValues: { name: data.name, locationId: data.locationId },
				},
			}
		})
	}

	async handleUpdate(data: MenuCategoryUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...updateData } = data

		// 1. Verify exists
		const existing = await this.handleGetById(id, actor)

		// 2. Validate parentId belongs to same location
		if (updateData.parentId) {
			await this.#validateParentLocation(updateData.parentId, existing.locationId)
		}

		// 3. Update and audit in one transaction
		return mutate(this.mutation, actor, async (tx) => {
			await checkConflict({
				db: tx,
				table: menuCategories,
				pkColumn: menuCategories.id,
				fields: uniqueFields,
				input: updateData,
				excludeId: id,
			})

			const written = await this.repo.update(id, { ...updateData, ...stampUpdate(actor.id) }, tx)
			if (!written) throw CategoryError.updateFailed(id)

			return {
				result: written,
				audit: {
					action: 'update',
					summary: `Updated menu category "${updateData.name ?? existing.name}"`,
					newValues: updateData,
				},
			}
		})
	}

	async handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		// 1. Verify exists
		const existing = await this.handleGetById(id, actor)

		// 2. Delete and audit in one transaction
		return mutate(this.mutation, actor, async (tx) => {
			const written = await this.repo.remove(id, tx)
			if (!written) throw CategoryError.deleteFailed(id)

			return {
				result: written,
				audit: { action: 'delete', summary: `Deleted menu category "${existing.name}"` },
			}
		})
	}

	// ─── Private ───

	async #validateParentLocation(parentId: number, locationId: number): Promise<void> {
		const parent = await this.repo.findById(parentId)
		if (!parent || parent.locationId !== locationId) {
			throw CategoryError.invalidParent()
		}
	}
}
