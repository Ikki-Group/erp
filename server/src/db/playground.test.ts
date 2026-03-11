/* eslint-disable no-console */

import { test } from 'bun:test'
import { eq } from 'drizzle-orm'

import { locationsTable, materialLocationsTable, materialsTable } from '@/db/schema'

import { db } from '@/db'

test('query playground', async () => {
  // const res = await db
  //   .select()
  //   .from(usersTable)
  //   .leftJoin(userAssignmentsTable, eq(usersTable.id, userAssignmentsTable.userId))

  const res = await db
    .select({
      material: materialsTable,
      location: locationsTable,
    })
    .from(materialsTable)
    .leftJoin(materialLocationsTable, eq(materialsTable.id, materialLocationsTable.materialId))
    .leftJoin(locationsTable, eq(materialLocationsTable.locationId, locationsTable.id))

  console.log(res)
})
