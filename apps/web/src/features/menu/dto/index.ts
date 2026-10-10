export {
	MenuItemCreateDto,
	MenuItemDto,
	MenuItemFilterDto,
	MenuItemStatusEnum,
	MenuItemUpdateDto,
} from '@ikki/contract/menu/item'
export {
	MenuCategoryCreateDto,
	MenuCategoryDto,
	MenuCategoryFilterDto,
	MenuCategoryUpdateDto,
} from '@ikki/contract/menu/category'
export {
	ModifierGroupCreateDto,
	ModifierGroupDto,
	ModifierGroupFilterDto,
	ModifierGroupUpdateDto,
	ModifierGroupWithOptionsDto,
	ModifierOptionDto,
	ModifierOptionInputDto,
	SelectionTypeEnum,
} from '@ikki/contract/menu/modifier'
export { MenuItemDetailDto } from '@ikki/contract/menu/composed'
export { MenuItemModifierSyncDto } from '@ikki/contract/menu/assignment'

// ─── UI labels (web-only) ───
export const MENU_ITEM_STATUS_OPTIONS = [
	{ label: 'Active', value: 'active' },
	{ label: 'Inactive', value: 'inactive' },
] as const

export const SELECTION_TYPE_OPTIONS = [
	{ label: 'Single', value: 'single' },
	{ label: 'Multiple', value: 'multiple' },
] as const
