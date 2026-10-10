import { menuItemModifiers } from '@/db/schema/menu.ts'

import { eq } from '@/infra/database/index.ts'
import type { Db, DbContext } from '@/infra/database/index.ts'

import type { ModifierGroupAssignmentInput } from '@ikki/contract/menu/assignment'

export class AssignmentRepo {
	constructor(readonly db: DbContext) {}

	async replaceForItem(
		menuItemId: number,
		assignments: ModifierGroupAssignmentInput[],
		db: Db = this.db,
	): Promise<void> {
		await db.delete(menuItemModifiers).where(eq(menuItemModifiers.menuItemId, menuItemId))
		if (assignments.length === 0) return
		await db.insert(menuItemModifiers).values(
			assignments.map((a) => ({
				menuItemId,
				modifierGroupId: a.groupId,
				sortOrder: a.sortOrder,
			})),
		)
	}
}
