/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MokaProductRaw } from '../../dto/moka-raw.types'
import { MokaProductRawSchema } from '../../dto/moka.dto'

import { MokaBaseEngine, type IMokaEngine } from './moka-engine'

export class MokaProductEngine extends MokaBaseEngine implements IMokaEngine<MokaProductRaw> {
  async fetch(): Promise<MokaProductRaw[]> {
    this.logger.info('Fetching products from Moka')
    const api = await this.getApi()

    try {
      const response = await api.get('/api/v2/items', {
        headers: this.getHeaders('AUTHENTICATED'),
      })

      const items = response.data.items || []
      return items.map((item: any) => MokaProductRawSchema.parse(item))
    } catch (error: any) {
      this.logger.error({ err: error.message }, 'Failed to fetch Moka products')
      throw error
    }
  }
}
