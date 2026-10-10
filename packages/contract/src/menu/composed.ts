import { z } from 'zod'

import { zp } from '../schema.ts'

import { MenuItemDto } from './item.ts'
import { ModifierGroupWithOptionsDto } from './modifier.ts'

// ─── Category Reference (lightweight) ───

export const MenuCategoryRefDto = z.object({
	id: zp.id,
	name: zp.str,
})
export type MenuCategoryRefDto = z.infer<typeof MenuCategoryRefDto>

// ─── Menu Item Detail (composed) ───

export const MenuItemDetailDto = z.object({
	...MenuItemDto.shape,
	category: MenuCategoryRefDto.nullable(),
	modifierGroups: z.array(ModifierGroupWithOptionsDto),
})
export type MenuItemDetailDto = z.infer<typeof MenuItemDetailDto>
