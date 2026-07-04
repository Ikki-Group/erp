import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

export const JournalEntryDto = z.object({
	id: zp.id,
	date: zp.date,
	reference: zp.str,
	sourceType: zp.str,
	sourceId: zp.id,
	note: zp.strNullable,
	...zc.AuditBasic.shape,
})
export type JournalEntryDto = z.infer<typeof JournalEntryDto>

export const JournalItemDto = z.object({
	id: zp.id,
	journalEntryId: zp.id,
	accountId: zp.id,
	debit: zp.decimal,
	credit: zp.decimal,
	...zc.AuditBasic.shape,
})
export type JournalItemDto = z.infer<typeof JournalItemDto>

export const JournalEntryWithItemsDto = JournalEntryDto.extend({
	items: z.array(JournalItemDto),
})
export type JournalEntryWithItemsDto = z.infer<typeof JournalEntryWithItemsDto>

export const JournalItemInputDto = z.object({
	accountId: zp.id,
	debit: zp.decimal,
	credit: zp.decimal,
})
export type JournalItemInputDto = z.infer<typeof JournalItemInputDto>

const JournalEntryMutationDto = z.object({
	date: zp.date,
	reference: zc.strTrim.min(1).max(100),
	sourceType: zc.strTrim.min(1).max(50),
	sourceId: zp.id,
	note: zc.strTrimNullable,
	items: z.array(JournalItemInputDto).min(1),
})

export const JournalEntryCreateDto = JournalEntryMutationDto
export type JournalEntryCreateDto = z.infer<typeof JournalEntryCreateDto>

export const JournalEntryFilterDto = z.object({
	...zq.pagination.shape,
	sourceType: zp.str.optional(),
	sourceId: zp.id.optional(),
})
export type JournalEntryFilterDto = z.infer<typeof JournalEntryFilterDto>
