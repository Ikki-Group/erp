import { CacheService } from '@/infra/cache/index.ts'
import type { CacheClient } from '@/infra/cache/index.ts'
import { NotFoundError } from '@/shared/errors/http-error.ts'
import { assertFound } from '@/shared/utils/index.ts'

import type { MenuItemDetailDto } from './composed.contract.ts'
import type { IComposedRepo } from './composed.repo.ts'

// ─── Error Factories ───

const ComposedError = {
	notFound: (id: number) =>
		new NotFoundError('Menu item not found', {
			code: 'MENU_ITEM_NOT_FOUND',
			context: { id },
		}),
}

// ─── Service ───

export class ComposedService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IComposedRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'menu-item-detail')
	}

	// ─── Handlers ───

	async handleDetail(id: number): Promise<MenuItemDetailDto> {
		const result = await this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findDetailById(id),
		})
		return assertFound(result, () => ComposedError.notFound(id))
	}
}
