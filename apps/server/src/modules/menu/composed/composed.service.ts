import type { Db } from '@/infra/database/index.ts'

import { ItemError } from '../item/item.internal.ts'
import type { MenuItemDetailDto } from '@ikki/contract/menu/composed'
import type { ComposedRepo } from './composed.repo.ts'

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
}
