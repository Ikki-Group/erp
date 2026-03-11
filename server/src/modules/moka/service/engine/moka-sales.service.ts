import type { Logger } from 'pino'

import type { MokaAuthService } from './moka-auth.service'
import type { MokaSalesDetailRaw } from '../../dto/moka-raw.types'

export class MokaSalesService {
  constructor(
    private readonly auth: MokaAuthService,
    private readonly logger: Logger
  ) {}

  async fetchSales(_dateFrom: Date, _dateTo: Date): Promise<MokaSalesDetailRaw[]> {
    this.logger.info({ _dateFrom, _dateTo }, 'Fetching sales from Moka')
    const response = await this.auth.fetch('https://backoffice.mokapos.com/api/v2/reports/sales')
    if (!response.ok) throw new Error('Failed to fetch Moka sales')
    const data: any = await response.json()
    return data.sales || []
  }
}
