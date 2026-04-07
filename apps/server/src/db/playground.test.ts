import { test } from 'bun:test'

import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { locationsTable, materialLocationsTable, materialsTable } from '@/db/schema'

test('query playground', async () => {
  const res = await db
    .select({ material: materialsTable, location: locationsTable })
    .from(materialsTable)
    .leftJoin(materialLocationsTable, eq(materialsTable.id, materialLocationsTable.materialId))
    .leftJoin(locationsTable, eq(materialLocationsTable.locationId, locationsTable.id))

  console.log(res)
})
