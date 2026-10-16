import { z } from 'zod'

import { createLineItem } from '@/components/shared/line-item-editor.tsx'
import type { LineItem } from '@/components/shared/line-item-editor.tsx'

import { SelectionTypeEnum } from './dto/index.ts'
import type {
	ModifierGroupCreateDto,
	ModifierGroupUpdateDto,
	ModifierGroupWithOptionsDto,
	ModifierOptionInputDto,
} from './dto/index.ts'

// ─── Values ───

/** `clientKey` is UI identity only; it never reaches a request body. */
export interface ModifierOptionValues extends LineItem {
	name: string
	/** Signed decimal string, passed through unchanged (negative and zero are valid). */
	priceAdjustment: string
	isDefault: boolean
	isActive: boolean
	sortOrder: number | null
}

export interface ModifierGroupFormValues {
	name: string
	selectionType: SelectionTypeEnum
	isRequired: boolean
	minSelect: number | null
	maxSelect: number | null
	options: ModifierOptionValues[]
}

// ─── Schema ───

const ModifierOptionSchema = z.object({
	name: z.string().trim().min(1, 'Nama opsi wajib diisi').max(100),
	priceAdjustment: z
		.string()
		.trim()
		.regex(/^-?\d+(\.\d+)?$/u, 'Harus berupa angka, boleh negatif'),
	isDefault: z.boolean(),
	isActive: z.boolean(),
	sortOrder: z
		.number()
		.int()
		.min(0)
		.nullable()
		.refine((value) => value !== null, { error: 'Urutan wajib diisi' }),
})

/** Form-shape schema mirroring the server contract; no extra policy on min/max. */
export const ModifierGroupFormSchema = z.object({
	name: z.string().trim().min(2, 'Minimal 2 karakter').max(100),
	selectionType: SelectionTypeEnum,
	isRequired: z.boolean(),
	minSelect: z.number().int().min(0).nullable(),
	maxSelect: z.number().int().positive().nullable(),
	options: z.array(ModifierOptionSchema).min(1, 'Tambahkan minimal satu opsi'),
})

// ─── Mapping ───

export function createModifierOption(sortOrder: number): ModifierOptionValues {
	return createLineItem({
		name: '',
		priceAdjustment: '0',
		isDefault: false,
		isActive: true,
		sortOrder,
	})
}

/** The next free position after the highest one in use, so new rows never collide with persisted order. */
export function nextModifierSortOrder(options: readonly ModifierOptionValues[]): number {
	return options.reduce((max, option) => Math.max(max, (option.sortOrder ?? -1) + 1), 0)
}

export function emptyModifierGroupFormValues(): ModifierGroupFormValues {
	return {
		name: '',
		selectionType: 'single',
		isRequired: false,
		minSelect: 0,
		maxSelect: null,
		options: [createModifierOption(0)],
	}
}

/** Keeps every persisted option in the order the server returned, flags and sort order included. */
export function toModifierGroupFormValues(
	group: ModifierGroupWithOptionsDto,
): ModifierGroupFormValues {
	return {
		name: group.name,
		selectionType: group.selectionType,
		isRequired: group.isRequired,
		minSelect: group.minSelect,
		maxSelect: group.maxSelect,
		options: group.options.map((option) =>
			createLineItem({
				name: option.name,
				priceAdjustment: option.priceAdjustment,
				isDefault: option.isDefault,
				isActive: option.isActive,
				sortOrder: option.sortOrder,
			}),
		),
	}
}

function toGroupFields(values: ModifierGroupFormValues) {
	return {
		name: values.name.trim(),
		selectionType: values.selectionType,
		isRequired: values.isRequired,
		minSelect: values.minSelect ?? 0,
		maxSelect: values.maxSelect,
		options: values.options.map(
			(option): ModifierOptionInputDto => ({
				name: option.name.trim(),
				priceAdjustment: option.priceAdjustment.trim(),
				isDefault: option.isDefault,
				isActive: option.isActive,
				sortOrder: option.sortOrder ?? 0,
			}),
		),
	}
}

export function toModifierGroupCreateInput(
	locationId: number,
	values: ModifierGroupFormValues,
): ModifierGroupCreateDto {
	return { locationId, ...toGroupFields(values) }
}

/** Replaces the whole option set; the group's location is never part of an update. */
export function toModifierGroupUpdateInput(
	id: number,
	values: ModifierGroupFormValues,
): ModifierGroupUpdateDto {
	return { id, ...toGroupFields(values) }
}
