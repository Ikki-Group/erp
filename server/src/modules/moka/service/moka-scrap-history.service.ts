/* eslint-disable @typescript-eslint/no-explicit-any */
import { desc, eq } from 'drizzle-orm'

import { mokaScrapHistoriesTable } from '@/db/schema'

import { stampCreate } from '@/core/database'
import { db } from '@/db'

import { MokaScrapHistoryDto, type MokaScrapStatus, type MokaScrapType } from '../dto/moka-scrap-history.dto'

export class MokaScrapHistoryService {
  async create(
    data: {
      mokaConfigurationId: number
      type: MokaScrapType
      dateFrom: Date
      dateTo: Date
      status?: MokaScrapStatus
    },
    actorId: number
  ): Promise<{ id: number }> {
    const [result] = await db
      .insert(mokaScrapHistoriesTable)
      .values({
        ...data,
        ...stampCreate(actorId),
      })
      .returning({ id: mokaScrapHistoriesTable.id })

    if (!result) throw new Error('Failed to create scrap history')
    return result
  }

  async updateStatus(
    id: number,
    status: MokaScrapStatus,
    extra?: { rawPath?: string; errorMessage?: string; metadata?: any }
  ) {
    await db
      .update(mokaScrapHistoriesTable)
      .set({
        status,
        ...extra,
        updatedAt: new Date(),
      })
      .where(eq(mokaScrapHistoriesTable.id, id))
  }

  async handleList(configId?: number) {
    const query = db.select().from(mokaScrapHistoriesTable)

    if (configId) {
      query.where(eq(mokaScrapHistoriesTable.mokaConfigurationId, configId))
    }

    const results = await query.orderBy(desc(mokaScrapHistoriesTable.createdAt)).limit(50)
    return results.map((r) => MokaScrapHistoryDto.parse(r))
  }
}
