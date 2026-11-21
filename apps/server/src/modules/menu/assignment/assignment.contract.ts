import { z } from 'zod'

import { zp } from '@/shared/schema/index.ts'

// ─── Response ───

export const MenuItemModifierDto = z.object({
	id: zp.id,
	menuItemId: zp.id,
	modifierGroupId: zp.id,
	sortOrder: z.number().int(),
})
export type MenuItemModifierDto = z.infer<typeof MenuItemModifierDto>

// ─── Sync Input ───

export const ModifierGroupAssignmentInput = z.object({
	groupId: zp.id,
	sortOrder: z.number().int().min(0).default(0),
})
export type ModifierGroupAssignmentInput = z.infer<typeof ModifierGroupAssignmentInput>

export const MenuItemModifierSyncDto = z.object({
	menuItemId: zp.id,
	groups: z.array(ModifierGroupAssignmentInput),
})
export type MenuItemModifierSyncDto = z.infer<typeof MenuItemModifierSyncDto>
