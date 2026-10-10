import { useState } from 'react'

import { CheckCircleIcon, SaveIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import type { OpnameLineDto } from '../dto/index.ts'
import { formatQty } from './document-shared.tsx'

export interface CountLine {
	materialId: number
	countedQty: string
}

const QTY_PATTERN = /^\d+(\.\d+)?$/u

/** Lines whose saved count differs from the snapshot; an empty input means "matches system". */
function savedCounts(lines: OpnameLineDto[]): Record<number, string> {
	const out: Record<number, string> = {}
	for (const l of lines) {
		if (Number(l.actualQty) !== Number(l.systemQty)) out[l.materialId] = String(Number(l.actualQty))
	}
	return out
}

interface OpnameCountFormProps {
	lines: OpnameLineDto[]
	isEditable: boolean
	isSaving?: boolean
	/** Persist changed lines. */
	onSave: (lines: CountLine[]) => Promise<void>
	/** Shown only when editable; receives unsaved lines so the caller can save before completing. */
	onComplete?: (unsaved: CountLine[]) => Promise<void>
}

export function OpnameCountForm({
	lines,
	isEditable,
	isSaving,
	onSave,
	onComplete,
}: OpnameCountFormProps) {
	const [saved, setSaved] = useState(() => savedCounts(lines))
	const [counts, setCounts] = useState(saved)
	// Re-sync when the server copy changes (after save/refetch).
	const [prevLines, setPrevLines] = useState(lines)
	if (prevLines !== lines) {
		const next = savedCounts(lines)
		setPrevLines(lines)
		setSaved(next)
		setCounts(next)
	}

	const changed: CountLine[] = lines
		.filter((l) => (counts[l.materialId] ?? '') !== (saved[l.materialId] ?? ''))
		.map((l) => ({
			materialId: l.materialId,
			// Clearing a saved count reverts it to the snapshot.
			countedQty: counts[l.materialId] || l.systemQty,
		}))
	const invalid = changed.some((l) => !QTY_PATTERN.test(l.countedQty.trim()))
	const varianceCount = lines.filter((l) => {
		const v = counts[l.materialId]
		return v !== undefined && v !== '' && Number(v) !== Number(l.systemQty)
	}).length

	return (
		// Sticky bar offsets match the app shell's <main> padding (p-4 / sm:p-6).
		<div>
			<div className="divide-y rounded-lg border bg-card">
				<div className="hidden grid-cols-[2rem_minmax(0,1fr)_7rem_8rem_7rem] items-center gap-4 px-4 py-2 text-xs text-muted-foreground md:grid">
					<span>#</span>
					<span>Material</span>
					<span className="text-right">Stok sistem</span>
					<span className="text-right">Stok aktual</span>
					<span className="text-right">Selisih</span>
				</div>
				{lines.map((line, idx) => {
					const raw = counts[line.materialId] ?? ''
					const actual = raw === '' ? Number(line.actualQty) : Number(raw)
					const diff = Number.isNaN(actual) ? null : actual - Number(line.systemQty)
					const diffNode = <Diff value={diff} />
					return (
						<div
							key={line.id}
							className="grid grid-cols-[minmax(0,1fr)_8rem] items-center gap-x-3 gap-y-1 px-4 py-3 md:grid-cols-[2rem_minmax(0,1fr)_7rem_8rem_7rem] md:gap-x-4 md:py-2"
						>
							<span className="hidden font-mono text-xs text-muted-foreground tabular-nums md:block">
								{idx + 1}
							</span>
							<span className="flex min-w-0 flex-col">
								<span className="truncate text-sm font-medium">{line.materialName}</span>
								<span className="font-mono text-xs text-muted-foreground">{line.materialCode}</span>
							</span>
							<span className="hidden text-right font-mono text-sm tabular-nums md:block">
								{formatQty(line.systemQty)}
							</span>
							<span className="row-span-2 md:row-span-1">
								{isEditable ? (
									<Input
										type="number"
										inputMode="decimal"
										min="0"
										step="any"
										placeholder={formatQty(line.systemQty)}
										aria-label={`Stok aktual ${line.materialName}`}
										value={raw}
										onChange={(e) =>
											setCounts((prev) => ({ ...prev, [line.materialId]: e.target.value }))
										}
										className="h-11 text-right font-mono text-base tabular-nums md:h-7 md:text-sm"
									/>
								) : (
									<span className="block text-right font-mono text-sm tabular-nums">
										{formatQty(line.actualQty)}
									</span>
								)}
							</span>
							<span className="hidden text-right text-sm md:block">{diffNode}</span>
							<span className="text-xs text-muted-foreground md:hidden">
								Sistem <span className="font-mono tabular-nums">{formatQty(line.systemQty)}</span>
								{' · '}
								Selisih {diffNode}
							</span>
						</div>
					)
				})}
			</div>

			{(isEditable || onComplete) && (
				<div className="sticky -bottom-4 z-10 -mx-4 mt-4 flex flex-wrap items-center justify-between gap-2 border-t bg-background px-4 pt-3 pb-7 sm:-bottom-6 sm:-mx-6 sm:px-6 sm:pb-9">
					<p className="text-xs text-muted-foreground">
						<span className="font-mono tabular-nums">{varianceCount}</span> selisih ·{' '}
						<span className="font-mono tabular-nums">{lines.length}</span> material
						{changed.length > 0 && (
							<>
								{' · '}
								<span className="text-warning">{changed.length} belum disimpan</span>
							</>
						)}
					</p>
					<div className="flex gap-2 max-md:w-full">
						{isEditable && (
							<Button
								variant="outline"
								className="pointer-coarse:h-10 max-md:flex-1"
								onClick={() => void onSave(changed)}
								disabled={changed.length === 0 || invalid || isSaving}
							>
								<SaveIcon className="size-3.5" />
								Simpan
							</Button>
						)}
						{onComplete && (
							<Button
								className="pointer-coarse:h-10 max-md:flex-1"
								onClick={() => void onComplete(changed)}
								disabled={invalid || isSaving}
							>
								<CheckCircleIcon className="size-3.5" />
								Selesaikan opname
							</Button>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

function Diff({ value }: { value: number | null }) {
	if (value === null) return <span className="text-muted-foreground">—</span>
	const rounded = Math.round(value * 1e6) / 1e6
	return (
		<span
			className={cn(
				'font-mono tabular-nums',
				rounded > 0 && 'text-success',
				rounded < 0 && 'text-destructive',
				rounded === 0 && 'text-muted-foreground',
			)}
		>
			{rounded > 0 ? '+' : rounded < 0 ? '−' : ''}
			{formatQty(Math.abs(rounded))}
		</span>
	)
}
