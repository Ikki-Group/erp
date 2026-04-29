// oxlint-disable typescript/no-unsafe-call
// oxlint-disable typescript/no-unsafe-return
// oxlint-disable typescript/no-unsafe-assignment
// oxlint-disable typescript/no-unsafe-member-access

import type { MokaCategoryRaw } from '../scrap/scrap-raw.types'
import { MokaCategoryListDto } from '../scrap/scrap.dto'
import { MokaBaseEngine, type IMokaEngine } from './moka-engine'

export class MokaCategoryEngine extends MokaBaseEngine implements IMokaEngine<MokaCategoryRaw> {
	async fetch(): Promise<MokaCategoryRaw[]> {
		this.logger.info('Fetching categories from Moka')
		const api = await this.getApi()

		try {
			const response = await api.get('/api/v2/categories', {
				headers: this.getHeaders('AUTHENTICATED'),
			})

			const parsed = MokaCategoryListDto.parse(response.data)
			return parsed.results
		} catch (error: any) {
			this.logger.error({ err: error.message }, 'Failed to fetch Moka categories')
			throw error
		}
	}
}
