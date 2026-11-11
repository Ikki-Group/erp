import { z } from 'zod'

import { zp } from '@/shared/schema/index.ts'

import { MenuItemDto } from '../item/item.contract.ts'
import { ModifierGroupWithOptionsDto } from '../modifier/modifier.contract.ts'

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
