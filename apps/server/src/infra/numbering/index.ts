import { sql } from 'drizzle-orm'

import { documentSequences } from '@/db/schema/numbering.ts'

import { db } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

// ─── Types ───

export interface GenerateNumberInput {
	/** Document type prefix (e.g. 'ORD', 'TRF', 'OPN') */
	prefix: string
	/** Location code for display (e.g. 'COFFEE', 'WHA') */
	locationCode: string
	/** Location ID (FK) for the sequence row */
	locationId: number
	/** Override date (defaults to today in Asia/Jakarta) */
	date?: Date
	/** Optional DB context (for transactional use) */
	database?: DbContext
}

// ─── Helpers ───

/** Format date as YYYYMMDD in Asia/Jakarta timezone. */
function formatDateWIB(date: Date): string {
	const formatter = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Jakarta',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	})
	// en-CA gives YYYY-MM-DD format
	return formatter.format(date).replace(/-/gu, '')
}

/** Zero-pad sequence number (3 digits min, extends beyond 999). */
function padSeq(seq: number): string {
	return seq.toString().padStart(3, '0')
}

// ─── Number Generator ───

/**
 * Generates a unique document number with daily-reset sequence.
 *
 * Format: `{PREFIX}-{LOCATION_CODE}-{YYYYMMDD}-{SEQ}`
 * Example: `ORD-COFFEE-20260806-001`
 *
 * Uses atomic upsert (INSERT ... ON CONFLICT DO UPDATE) to handle concurrency safely.
 */
export async function generateNumber(input: GenerateNumberInput): Promise<string> {
	const { prefix, locationCode, locationId, date, database = db } = input
	const dateStr = formatDateWIB(date ?? new Date())

	// Atomic upsert: insert with last_seq=1, or increment existing
	const result = await database
		.insert(documentSequences)
		.values({
			prefix,
			locationId,
			date: dateStr,
			lastSeq: 1,
		})
		.onConflictDoUpdate({
			target: [documentSequences.prefix, documentSequences.locationId, documentSequences.date],
			set: {
				lastSeq: sql`${documentSequences.lastSeq} + 1`,
			},
		})
		.returning({ lastSeq: documentSequences.lastSeq })

	const seq = result[0]?.lastSeq ?? 1

	return `${prefix}-${locationCode}-${dateStr}-${padSeq(seq)}`
}

/**
 * Generate a monthly-format number (for payroll).
 *
 * Format: `{PREFIX}-{LOCATION_CODE}-{YYYYMM}-{SEQ}`
 * Example: `PAY-COFFEE-202608-001`
 */
export async function generateMonthlyNumber(input: GenerateNumberInput): Promise<string> {
	const { prefix, locationCode, locationId, date, database = db } = input
	const dateStr = formatDateWIB(date ?? new Date()).slice(0, 6) // YYYYMM

	const result = await database
		.insert(documentSequences)
		.values({
			prefix,
			locationId,
			date: dateStr,
			lastSeq: 1,
		})
		.onConflictDoUpdate({
			target: [documentSequences.prefix, documentSequences.locationId, documentSequences.date],
			set: {
				lastSeq: sql`${documentSequences.lastSeq} + 1`,
			},
		})
		.returning({ lastSeq: documentSequences.lastSeq })

	const seq = result[0]?.lastSeq ?? 1

	return `${prefix}-${locationCode}-${dateStr}-${padSeq(seq)}`
}
