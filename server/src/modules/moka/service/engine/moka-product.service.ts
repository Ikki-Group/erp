import type { Logger } from 'pino'

import type { MokaAuthService } from './moka-auth.service'

export interface MokaProductRaw {
  id: number
  name: string
  item_variants: Array<{
    id: number
    name: string
    price: number
    sku: string
  }>
}

export class MokaProductService {
  constructor(
    private readonly auth: MokaAuthService,
    private readonly logger: Logger
  ) {}

  async fetchProducts(): Promise<MokaProductRaw[]> {
    this.logger.info('Fetching products from Moka')
    const response = await this.auth.fetch('https://backoffice.mokapos.com/api/v2/items')
    if (!response.ok) throw new Error('Failed to fetch Moka products')
    const data: any = await response.json()
    return data.items || []
  }
}
