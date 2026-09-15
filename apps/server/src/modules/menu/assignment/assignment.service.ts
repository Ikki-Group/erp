import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { BadRequestError } from '@/shared/errors/http-error.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import type { ItemService } from '../item/item.service.ts'
import type { ModifierService } from '../modifier/modifier.service.ts'
import type { MenuItemModifierSyncDto } from './assignment.contract.ts'
import type { IAssignmentRepo } from './assignment.repo.ts'

// ─── Error Factories ───

const AssignmentError = {
	locationMismatch: (groupId: number) =>
		new BadRequestError('Modifier group does not belong to the same location as the menu item', {
			code: 'MENU_ITEM_MODIFIER_LOCATION_MISMATCH',
			context: { groupId },
		}),
}

// ─── Service ───

export class AssignmentService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IAssignmentRepo,
		cacheClient: CacheClient,
		private readonly itemService: ItemService,
		private readonly modifierService: ModifierService,
		private readonly uow: UnitOfWork,
		private readonly audit: AuditPort,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'menu-item-modifier')
	}

	// ─── Handlers ───

	async handleSync(data: MenuItemModifierSyncDto, actor: Actor): Promise<EntityRef> {
		const { menuItemId, groups } = data

		// 1. Validate menu item exists
		const item = await this.itemService.handleGetById(menuItemId)

		// 2. Validate all modifier groups belong to the same location
		for (const assignment of groups) {
			const group = await this.modifierService.handleGetById(assignment.groupId)
			if (group.locationId !== item.locationId) {
				throw AssignmentError.locationMismatch(assignment.groupId)
			}
		}

		// 3. Replace assignments and audit in one transaction
		await this.uow.run(async (tx) => {
			await this.repo.replaceForItem(menuItemId, groups, tx)
			await this.audit.record(
				auditEntryOf(actor, {
					module: 'menu',
					entity: 'menu_item_modifier',
					entityId: menuItemId,
					action: 'update',
					summary: `Synced ${groups.length} modifier group(s) to menu item "${item.name}"`,
					newValues: { menuItemId, groupIds: groups.map((g) => g.groupId) },
				}),
				tx,
			)
		})

		// 4. Invalidate cache after commit
		await this.cache.invalidateStandard(menuItemId)
		return { id: menuItemId }
	}
}
