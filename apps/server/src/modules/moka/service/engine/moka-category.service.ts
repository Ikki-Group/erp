/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MokaCategoryRaw } from '../../dto/moka-raw.types'
import { MokaCategoryRawSchema } from '../../dto/moka.dto'
import { MokaBaseEngine, type IMokaEngine } from './moka-engine'

export class MokaCategoryEngine extends MokaBaseEngine implements IMokaEngine<MokaCategoryRaw> {
  async fetch(): Promise<MokaCategoryRaw[]> {
    this.logger.info('Fetching categories from Moka')
    const api = await this.getApi()

    try {
      const response = await api.get('/api/v2/categories', { headers: this.getHeaders('AUTHENTICATED') })

      const categories = response.data.categories || []
      return categories.map((cat: any) => MokaCategoryRawSchema.parse(cat))
    } catch (error: any) {
      this.logger.error({ err: error.message }, 'Failed to fetch Moka categories')
      throw error
    }
  }
}
