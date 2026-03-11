import type { Logger } from 'pino'

import type { MokaAuthService } from './moka-auth.service'

export interface MokaCategoryRaw {
  id: number
  name: string
  // ... other fields
}

export class MokaCategoryService {
  constructor(
    private readonly auth: MokaAuthService,
    private readonly logger: Logger
  ) {}

  async fetchCategories(): Promise<MokaCategoryRaw[]> {
    this.logger.info('Fetching categories from Moka')
    const response = await this.auth.fetch('https://backoffice.mokapos.com/api/v2/categories')
    if (!response.ok) throw new Error('Failed to fetch Moka categories')
    const data: any = await response.json()
    return data.categories || []
  }
}
