import type { Db } from '@/infra/database/index.ts'
import type { Actor } from '@/shared/auth/actor.ts'

import { ItemError } from '../item/item.internal.ts'
import type { ComposedRepo } from './composed.repo.ts'
import type { MenuItemDetailDto } from '@ikki/contract/menu/composed'

interface Deps {
	repo: ComposedRepo
}

export class ComposedService {
	constructor(private readonly deps: Deps) {}

	/** Item + category + modifier groups with options (POS price snapshot source). */
	async handleDetail(id: number, db?: Db): Promise<MenuItemDetailDto> {
		const detail = await this.deps.repo.findDetailById(id, db)
		if (!detail) throw ItemError.notFound(id)
		return detail
	}

	/** Route entry: the item detail, 403 outside the actor's locations. */
	async handleItemDetail(id: number, actor: Actor): Promise<MenuItemDetailDto> {
		const detail = await this.handleDetail(id)
		actor.assertCan(detail.locationId)
		return detail
	}
}
