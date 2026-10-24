import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { mutate } from '@/shared/service/mutate.ts'
import type { MutationScope } from '@/shared/service/mutate.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import type { ItemService } from '../item/item.service.ts'
import type { ModifierService } from '../modifier/modifier.service.ts'
import type { MenuItemModifierSyncDto } from './assignment.contract.ts'
import { AssignmentError } from './assignment.internal.ts'
import type { IAssignmentRepo } from './assignment.repo.ts'

// ─── Service ───

export class AssignmentService {
	private readonly mutation: MutationScope

	constructor(
		private readonly repo: IAssignmentRepo,
		cacheClient: CacheClient,
		private readonly itemService: ItemService,
		private readonly modifierService: ModifierService,
		uow: UnitOfWork,
		audit: AuditPort,
	) {
		this.mutation = {
			uow,
			audit,
			module: 'menu',
			entity: 'menu_item_modifier',
			invalidate: CacheService.createWithDefaultKeys(cacheClient, 'menu-item-modifier'),
		}
	}

	// ─── Handlers ───

	async handleSync(data: MenuItemModifierSyncDto, actor: Actor): Promise<EntityRef> {
		const { menuItemId, groups } = data

		// 1. Validate menu item exists
		const item = await this.itemService.handleGetById(menuItemId, actor)

		// 2. Validate all modifier groups belong to the same location
		for (const assignment of groups) {
			const group = await this.modifierService.handleGetById(assignment.groupId, actor)
			if (group.locationId !== item.locationId) {
				throw AssignmentError.locationMismatch(assignment.groupId)
			}
		}

		// 3. Replace assignments and audit in one transaction, invalidate after commit
		return mutate(this.mutation, actor, async (tx) => {
			await this.repo.replaceForItem(menuItemId, groups, tx)
			return {
				result: { id: menuItemId },
				audit: {
					action: 'update',
					summary: `Synced ${groups.length} modifier group(s) to menu item "${item.name}"`,
					newValues: { menuItemId, groupIds: groups.map((g) => g.groupId) },
				},
			}
		})
	}
}
