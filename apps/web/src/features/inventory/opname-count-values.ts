import { z } from 'zod'

import type { OpnameDetailDto, OpnameUpdateCountsDto } from './dto/index.ts'

// ─── Values ───

/** One persisted opname line as an editable row. Quantities stay exact decimal strings. */
export interface OpnameCountRowValues {
	/** Identity of the persisted line; never sent. */
	lineId: number
	materialId: number
	/** Decimal string, passed through unchanged ('0' is a real value). */
	countedQty: string
	/** Free text; blank means no reason. */
	reason: string
}

export interface OpnameCountFormValues {
	lines: OpnameCountRowValues[]
}

/** Read-only facts about a line that the count form never edits. */
export interface OpnameLineMeta {
	lineId: number
	materialId: number
	materialCode: string
	materialName: string
	systemQty: string
}

// ─── Schema ───

const COUNT_PATTERN = /^\d+(\.\d+)?$/u

export const OpnameCountFormSchema = z.object({
	lines: z.array(
		z.object({
			countedQty: z
				.string()
				.trim()
				.regex(COUNT_PATTERN, 'Jumlah harus angka tidak negatif, mis. 12.5'),
			reason: z.string(),
		}),
	),
})

// ─── Mapping ───

export function toOpnameCountFormValues(
	opname: Pick<OpnameDetailDto, 'lines'>,
): OpnameCountFormValues {
	return {
		lines: opname.lines.map((line) => ({
			lineId: line.id,
			materialId: line.materialId,
			countedQty: line.actualQty,
			reason: line.reason ?? '',
		})),
	}
}

export function toOpnameLineMeta(opname: Pick<OpnameDetailDto, 'lines'>): OpnameLineMeta[] {
	return opname.lines.map((line) => ({
		lineId: line.id,
		materialId: line.materialId,
		materialCode: line.materialCode,
		materialName: line.materialName,
		systemQty: line.systemQty,
	}))
}

/** What the server would store for a row: trimmed quantity, blank reason as null. */
function normalizeRow(row: OpnameCountRowValues): OpnameUpdateCountsDto['lines'][number] {
	const reason = row.reason.trim()
	return {
		materialId: row.materialId,
		countedQty: row.countedQty.trim(),
		reason: reason === '' ? null : reason,
	}
}

/** Baseline equivalent of a saved draft: every row normalized exactly as it was sent. */
export function normalizeOpnameCountValues(values: OpnameCountFormValues): OpnameCountFormValues {
	return {
		lines: values.lines.map((row) => {
			const normalized = normalizeRow(row)
			return {
				lineId: row.lineId,
				materialId: row.materialId,
				countedQty: normalized.countedQty,
				reason: normalized.reason ?? '',
			}
		}),
	}
}

/** Rows whose normalized quantity or reason differs from the session baseline, in line order. */
export function changedOpnameCountRows(
	values: OpnameCountFormValues,
	baseline: OpnameCountFormValues,
): OpnameCountRowValues[] {
	return values.lines.filter((row, index) => {
		const saved = baseline.lines[index]
		if (!saved || saved.lineId !== row.lineId) return true
		const draft = normalizeRow(row)
		const persisted = normalizeRow(saved)
		return draft.countedQty !== persisted.countedQty || draft.reason !== persisted.reason
	})
}

/** Request body carrying only the changed lines; reasons are preserved on untouched rows by omission. */
export function toOpnameCountsInput(
	opnameId: number,
	values: OpnameCountFormValues,
	baseline: OpnameCountFormValues,
): OpnameUpdateCountsDto {
	return { opnameId, lines: changedOpnameCountRows(values, baseline).map(normalizeRow) }
}

/** Compare by persisted identity and numeric value, not decimal padding or server row order. */
export function sameOpnameCounts(a: OpnameCountFormValues, b: OpnameCountFormValues): boolean {
	if (a.lines.length !== b.lines.length) return false
	const byId = new Map(b.lines.map((row) => [row.lineId, row]))
	return a.lines.every((row) => {
		const other = byId.get(row.lineId)
		return (
			other !== undefined &&
			row.materialId === other.materialId &&
			opnameVariance(row.countedQty, other.countedQty) === '0' &&
			row.reason === other.reason
		)
	})
}

// ─── Exact variance ───

interface Decimal {
	units: bigint
	scale: number
}

function parseDecimal(value: string): Decimal | undefined {
	const match = /^(-?)(\d+)(?:\.(\d+))?$/u.exec(value.trim())
	if (!match) return undefined
	const fraction = match[3] ?? ''
	const units = BigInt(`${match[2]}${fraction}`)
	return { units: match[1] ? -units : units, scale: fraction.length }
}

/**
 * Exact `counted - system` as a canonical signed decimal string ('0' when equal), without
 * floating point. Undefined when either side is not a plain decimal.
 */
export function opnameVariance(counted: string, system: string): string | undefined {
	const a = parseDecimal(counted)
	const b = parseDecimal(system)
	if (!a || !b) return undefined
	const scale = Math.max(a.scale, b.scale)
	const diff = a.units * 10n ** BigInt(scale - a.scale) - b.units * 10n ** BigInt(scale - b.scale)
	const negative = diff < 0n
	const digits = (negative ? -diff : diff).toString().padStart(scale + 1, '0')
	const fraction = digits.slice(digits.length - scale).replace(/0+$/u, '')
	const whole = digits.slice(0, digits.length - scale)
	const magnitude = fraction ? `${whole}.${fraction}` : whole
	return negative ? `-${magnitude}` : magnitude
}
