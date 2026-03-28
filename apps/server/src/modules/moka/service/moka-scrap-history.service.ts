/* eslint-disable @typescript-eslint/no-explicit-any */
import { desc, eq } from 'drizzle-orm'

import { stampCreate } from '@/core/database'
import { db } from '@/db'
import { mokaScrapHistoriesTable } from '@/db/schema'

import { MokaScrapHistoryDto, type MokaScrapStatus, type MokaScrapType } from '../dto/moka-scrap-history.dto'

export class MokaScrapHistoryService {
  async create(
    data: { mokaConfigurationId: string; type: MokaScrapType; dateFrom: Date; dateTo: Date; status?: MokaScrapStatus },
    actorId: string,
  ): Promise<{ id: string }> {
    const [result] = await db
      .insert(mokaScrapHistoriesTable)
      .values({ ...data, ...stampCreate(actorId) })
      .returning({ id: mokaScrapHistoriesTable.id })

    if (!result) throw new Error('Failed to create scrap history')
    return result
  }

  async updateStatus(
    id: string,
    status: MokaScrapStatus,
    extra?: { rawPath?: string; errorMessage?: string; metadata?: any },
  ) {
    await db
      .update(mokaScrapHistoriesTable)
      .set({ status, ...extra, updatedAt: new Date() })
      .where(eq(mokaScrapHistoriesTable.id, id))
  }

  async handleList(configId?: string) {
    const query = db.select().from(mokaScrapHistoriesTable)

    if (configId) {
      query.where(eq(mokaScrapHistoriesTable.mokaConfigurationId, configId))
    }

    const results = await query.orderBy(desc(mokaScrapHistoriesTable.createdAt)).limit(50)
    return results.map((r) => MokaScrapHistoryDto.parse(r))
  }
}
