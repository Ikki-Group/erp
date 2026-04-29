// oxlint-disable typescript/no-unsafe-member-access
// oxlint-disable typescript/no-unsafe-call
// oxlint-disable typescript/no-unsafe-return
// oxlint-disable typescript/no-unsafe-assignment

import type { MokaProductRaw } from '../scrap/scrap-raw.types'
import { MokaProductListDto } from '../scrap/scrap.dto'
import { MokaBaseEngine, type IMokaEngine } from './moka-engine'

export class MokaProductEngine extends MokaBaseEngine implements IMokaEngine<MokaProductRaw> {
	async fetch(): Promise<MokaProductRaw[]> {
		this.logger.info('Fetching products from Moka')
		const api = await this.getApi()

		try {
			const response = await api.get('/api/v2/items', { headers: this.getHeaders('AUTHENTICATED') })

			const parsed = MokaProductListDto.parse(response.data)
			return parsed.products
		} catch (error: any) {
			this.logger.error({ err: error.message }, 'Failed to fetch Moka products')
			throw error
		}
	}
}
