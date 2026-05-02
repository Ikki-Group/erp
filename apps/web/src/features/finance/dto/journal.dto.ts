import { z } from 'zod'

import { zp, zc } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const JournalItemDto = z.object({
	...zc.RecordId.shape,
	journalEntryId: zp.id,
	accountId: zp.id,
	debit: zp.decimal,
	credit: zp.decimal,
	...zc.AuditBasic.shape,
})

export type JournalItemDto = z.infer<typeof JournalItemDto>

export const JournalEntryDto = z.object({
	...zc.RecordId.shape,
	date: zp.date,
	reference: zp.str,
	sourceType: zp.str,
	sourceId: zp.id,
	note: zp.str.nullable(),
	...zc.AuditBasic.shape,
})

export type JournalEntryDto = z.infer<typeof JournalEntryDto>

/* --------------------------------- RESULT --------------------------------- */

export const JournalEntryWithItemsDto = JournalEntryDto.extend({
	items: JournalItemDto.array(),
})

export type JournalEntryWithItemsDto = z.infer<typeof JournalEntryWithItemsDto>

/* --------------------------------- FILTER --------------------------------- */

export const JournalEntryFilterDto = z.object({
	sourceType: zp.str.optional(),
	sourceId: zp.id.optional(),
})

export type JournalEntryFilterDto = z.infer<typeof JournalEntryFilterDto>
