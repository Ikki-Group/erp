import { eq } from 'drizzle-orm'

import { stampCreate, stampUpdate, takeFirst } from '@/core/database'
import { ConflictError, NotFoundError } from '@/core/http/errors'
import { db } from '@/db'
import { mokaConfigurationsTable } from '@/db/schema'

import {
  MokaConfigurationDto,
  MokaConfigurationOutputDto,
  type MokaConfigurationCreateDto,
  type MokaConfigurationUpdateDto,
} from '../dto/moka-configuration.dto'

const err = {
  notFound: (id: string) => new NotFoundError(`Moka configuration ${id} not found`),
  locationAlreadyHasConfig: (locationId: string) =>
    new ConflictError(`Location ${locationId} already has a Moka configuration`),
}

export class MokaConfigurationService {
  async findByLocationId(locationId: string): Promise<MokaConfigurationDto | null> {
    const result = await db
      .select()
      .from(mokaConfigurationsTable)
      .where(eq(mokaConfigurationsTable.locationId, locationId))
    const first = takeFirst(result)
    return first ? MokaConfigurationDto.parse(first) : null
  }

  async handleDetail(id: string): Promise<MokaConfigurationOutputDto> {
    const result = await db.select().from(mokaConfigurationsTable).where(eq(mokaConfigurationsTable.id, id))
    const first = takeFirst(result)
    if (!first) throw err.notFound(id)
    return MokaConfigurationOutputDto.parse(first)
  }

  async handleCreate(data: MokaConfigurationCreateDto, actorId: string): Promise<{ id: string }> {
    const existing = await this.findByLocationId(data.locationId)
    if (existing) throw err.locationAlreadyHasConfig(data.locationId)

    const [result] = await db
      .insert(mokaConfigurationsTable)
      .values({ ...data, ...stampCreate(actorId) })
      .returning({ id: mokaConfigurationsTable.id })

    if (!result) throw new Error('Failed to create Moka configuration')
    return result
  }

  async handleUpdate(id: string, data: MokaConfigurationUpdateDto, actorId: string): Promise<{ id: string }> {
    const existing = await this.handleDetail(id)

    if (data.locationId && data.locationId !== existing.locationId) {
      const other = await this.findByLocationId(data.locationId)
      if (other) throw err.locationAlreadyHasConfig(data.locationId)
    }

    const [result] = await db
      .update(mokaConfigurationsTable)
      .set({ ...data, ...stampUpdate(actorId) })
      .where(eq(mokaConfigurationsTable.id, id))
      .returning({ id: mokaConfigurationsTable.id })

    if (!result) throw err.notFound(id)
    return result
  }

  async updateAuthData(
    id: string,
    authData: { businessId?: string | null; outletId?: string | null; accessToken?: string | null },
  ) {
    await db
      .update(mokaConfigurationsTable)
      .set({ ...authData, lastSyncedAt: new Date(), updatedAt: new Date() })
      .where(eq(mokaConfigurationsTable.id, id))
  }
}
