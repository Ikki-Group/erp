// oxlint-disable no-unused-vars

import { test } from 'bun:test'

import { eq, getColumns } from 'drizzle-orm'

import { db } from '@/db'
import {
	locationsTable,
	materialLocationsTable,
	materialsTable,
	rolesTable,
	userAssignmentsTable,
	usersTable,
} from '@/db/schema'

test('query playground', async () => {
	// const res = await db
	// 	.select({ material: materialsTable, location: locationsTable })
	// 	.from(materialsTable)
	// 	.leftJoin(materialLocationsTable, eq(materialsTable.id, materialLocationsTable.materialId))
	// 	.leftJoin(locationsTable, eq(materialLocationsTable.locationId, locationsTable.id))
	const res = await db
		.select({
			...getColumns(userAssignmentsTable),
			role: rolesTable,
			location: locationsTable,
		})
		.from(userAssignmentsTable)
		.innerJoin(rolesTable, eq(userAssignmentsTable.roleId, rolesTable.id))
		.innerJoin(locationsTable, eq(userAssignmentsTable.locationId, locationsTable.id))

	// console.log(res)

	const res2 = await db
		.select()
		.from(usersTable)
		.leftJoin(userAssignmentsTable, eq(usersTable.id, userAssignmentsTable.userId))
		.leftJoin(rolesTable, eq(userAssignmentsTable.roleId, rolesTable.id))
		.leftJoin(locationsTable, eq(userAssignmentsTable.locationId, locationsTable.id))
		.where(eq(usersTable.isRoot, false))

	console.log(res2)
})
