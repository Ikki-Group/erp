import { useCallback, useState } from 'react'

import { CheckIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

import type { OpnameLineDto } from '../dto/index.ts'

// ─── Types ───

export interface CountLine {
	materialId: number
	countedQty: string
	reason?: string | null
}

interface OpnameCountFormProps {
	lines: OpnameLineDto[]
	isEditable: boolean
	onSubmitCounts: (lines: CountLine[]) => void
	isSubmitting?: boolean
}

// ─── Component ───

export function OpnameCountForm({
	lines,
	isEditable,
	onSubmitCounts,
	isSubmitting,
}: OpnameCountFormProps) {
	const [counts, setCounts] = useState<Record<number, string>>(() => {
		const initial: Record<number, string> = {}
		for (const line of lines) {
			if (line.actualQty && line.actualQty !== '0') {
				initial[line.materialId] = line.actualQty
			}
		}
		return initial
	})

	const handleCountChange = useCallback((materialId: number, value: string) => {
		setCounts((prev) => ({ ...prev, [materialId]: value }))
	}, [])

	const handleSubmit = useCallback(() => {
		const countLines: CountLine[] = lines
			.filter((line) => counts[line.materialId] !== undefined && counts[line.materialId] !== '')
			.map((line) => ({
				materialId: line.materialId,
				countedQty: counts[line.materialId]!,
			}))
		onSubmitCounts(countLines)
	}, [counts, lines, onSubmitCounts])

	const filledCount = Object.values(counts).filter((v) => v !== '' && v !== undefined).length

	return (
		<div className="space-y-4">
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-12">#</TableHead>
							<TableHead className="w-24">Kode</TableHead>
							<TableHead>Material</TableHead>
							<TableHead className="w-28 text-right">Stok Sistem</TableHead>
							<TableHead className="w-32 text-right">Stok Aktual</TableHead>
							<TableHead className="w-28 text-right">Selisih</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{lines.map((line, idx) => {
							const systemQty = Number(line.systemQty)
							const actualQty = counts[line.materialId]
								? Number(counts[line.materialId])
								: line.actualQty && line.actualQty !== '0'
									? Number(line.actualQty)
									: null
							const diff = actualQty !== null ? actualQty - systemQty : null

							return (
								<TableRow key={line.id}>
									<TableCell className="text-muted-foreground">{idx + 1}</TableCell>
									<TableCell className="font-mono text-xs text-muted-foreground">
										{line.materialCode}
									</TableCell>
									<TableCell className="font-medium">{line.materialName}</TableCell>
									<TableCell className="text-right tabular-nums">{line.systemQty}</TableCell>
									<TableCell className="text-right">
										{isEditable ? (
											<Input
												type="number"
												min="0"
												step="any"
												placeholder="0"
												aria-label={`Jumlah aktual ${line.materialName}`}
												value={counts[line.materialId] ?? ''}
												onChange={(e) => handleCountChange(line.materialId, e.target.value)}
												className="ml-auto w-24 text-right"
											/>
										) : (
											<span className="tabular-nums">{line.actualQty}</span>
										)}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{diff !== null ? (
											<span
												className={cn(
													'font-medium',
													diff > 0 && 'text-emerald-600',
													diff < 0 && 'text-red-600',
													diff === 0 && 'text-muted-foreground',
												)}
											>
												{diff > 0 ? '+' : ''}
												{diff}
											</span>
										) : (
											<span className="text-muted-foreground">—</span>
										)}
									</TableCell>
								</TableRow>
							)
						})}
					</TableBody>
				</Table>
			</div>

			{isEditable && (
				<div className="flex items-center justify-between">
					<p className="text-xs text-muted-foreground">
						{filledCount} / {lines.length} material dihitung
					</p>
					<Button size="sm" onClick={handleSubmit} disabled={filledCount === 0 || isSubmitting}>
						<CheckIcon className="size-4" />
						Simpan Hitungan
					</Button>
				</div>
			)}
		</div>
	)
}
