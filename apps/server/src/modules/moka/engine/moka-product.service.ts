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
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : String(error)
			this.logger.error({ err: msg }, 'Failed to fetch Moka products')
			throw error
		}
	}
}
