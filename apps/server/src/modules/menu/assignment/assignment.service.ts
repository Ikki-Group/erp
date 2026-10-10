import type { Actor } from '@/shared/auth/actor.ts'
import type { Infra } from '@/shared/module.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { ItemService } from '../item/item.service.ts'
import type { ModifierService } from '../modifier/modifier.service.ts'
import { AssignmentError } from './assignment.internal.ts'
import type { AssignmentRepo } from './assignment.repo.ts'
import type { MenuItemModifierSyncDto } from '@ikki/contract/menu/assignment'

interface Deps extends Infra {
	repo: AssignmentRepo
	item: Pick<ItemService, 'handleGetById'>
	modifier: Pick<ModifierService, 'handleGetById'>
}

export class AssignmentService {
	constructor(private readonly deps: Deps) {}

	handleSync(data: MenuItemModifierSyncDto, actor: Actor): Promise<EntityRef> {
		const { menuItemId, groups } = data
		const { repo, uow, audit, item: items, modifier } = this.deps
		return uow.run(async (tx) => {
			const item = await items.handleGetById(menuItemId, tx)
			actor.assertCan(item.locationId)
			for (const { groupId } of groups) {
				const group = await modifier.handleGetById(groupId, actor, tx)
				if (group.locationId !== item.locationId) throw AssignmentError.locationMismatch(groupId)
			}
			await repo.replaceForItem(menuItemId, groups, tx)
			await audit.record(tx, actor, {
				module: 'menu',
				entity: 'menu_item_modifier',
				entityId: menuItemId,
				action: 'update',
				summary: `Synced ${groups.length} modifier group(s) to menu item "${item.name}"`,
				newValues: { menuItemId, groupIds: groups.map((g) => g.groupId) },
				locationId: item.locationId,
			})
			return { id: menuItemId }
		})
	}
}
