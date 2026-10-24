import { useState } from 'react'

import { useStore } from '@tanstack/react-form'

import { CheckIcon, ClipboardCheckIcon } from 'lucide-react'

import { formatFieldError } from '@/lib/form/field-error.tsx'
import { FormRoot } from '@/lib/form/form-root.tsx'
import type { PinnedEditorLocationScope } from '@/lib/form/use-editor-location-scope.ts'
import { useUnsavedChangesGuard } from '@/lib/form/use-unsaved-changes-guard.ts'
import { cn } from '@/lib/utils'

import { confirm } from '@/components/shared/confirm'
import { InlineAlert } from '@/components/shared/inline-alert.tsx'

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

import type { OpnameDetailDto } from '../dto/index.ts'
import {
	changedOpnameCountRows,
	opnameVariance,
	sameOpnameCounts,
	toOpnameCountFormValues,
	toOpnameLineMeta,
} from '../opname-count-values.ts'
import type { OpnameCountFormValues } from '../opname-count-values.ts'
import { useOpnameCountEditor } from '../use-opname-count-editor.ts'

export interface OpnameCountFormProps {
	/** Key this component by `opname.id`: later refetches and status changes never reset a draft. */
	opname: OpnameDetailDto
	scope: PinnedEditorLocationScope
	canUpdate: boolean
	canComplete: boolean
	completing: boolean
	/** Resolves true when the opname was completed. Only persisted counts are completed. */
	onComplete: (expectedCounts: OpnameCountFormValues) => Promise<boolean>
}

export function OpnameCountForm(props: OpnameCountFormProps) {
	const [revision, setRevision] = useState(0)
	return (
		<OpnameCountSession
			key={revision}
			{...props}
			onLoadLatest={() => setRevision((value) => value + 1)}
		/>
	)
}

function OpnameCountSession({
	opname,
	scope,
	canUpdate,
	canComplete,
	completing,
	onComplete,
	onLoadLatest,
}: OpnameCountFormProps & { onLoadLatest: () => void }) {
	const { form, baseline } = useOpnameCountEditor({
		opname,
		location: scope.location,
		canUpdate,
	})
	useUnsavedChangesGuard(form)
	// Material identity and system stock never change in a session; refetches don't replace them.
	const [meta] = useState(() => toOpnameLineMeta(opname))

	const values = useStore(form.store, (state) => state.values)
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
	const saveFailed = useStore(form.store, (state) => state.errorMap.onSubmit !== undefined)

	const isDraft = opname.status === 'draft'
	const editable = isDraft && canUpdate
	const changedIds = new Set(changedOpnameCountRows(values, baseline).map((row) => row.lineId))
	const hasUnsaved = changedIds.size > 0
	const serverChanged = !sameOpnameCounts(toOpnameCountFormValues(opname), baseline)
	const [loadingLatest, setLoadingLatest] = useState(false)
	const inputsLocked = isSubmitting || completing || loadingLatest || !scope.isCurrent
	const canSave =
		editable && scope.isCurrent && !isSubmitting && !completing && !loadingLatest && hasUnsaved
	const canFinish =
		isDraft &&
		canComplete &&
		scope.isCurrent &&
		!isSubmitting &&
		!completing &&
		!hasUnsaved &&
		!serverChanged

	const { location, restore } = scope

	return (
		<div className="space-y-4">
			{scope.isCurrent ? (
				<InlineAlert variant="info">
					Opname ini dihitung untuk lokasi <strong>{location.name}</strong>.
				</InlineAlert>
			) : (
				<InlineAlert variant="warning" title="Lokasi aktif telah berubah">
					<p>
						Hitungan tetap untuk lokasi <strong>{location.name}</strong>. Draf Anda dipertahankan,
						tetapi tidak dapat disimpan atau diselesaikan sampai lokasi tersebut dipilih kembali.
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={!scope.canRestore}
						onClick={restore}
					>
						Kembali ke {location.name}
					</Button>
				</InlineAlert>
			)}

			{isDraft && (
				<p className="text-xs text-muted-foreground">
					Jumlah awal diambil dari stok sistem saat opname dibuat. Periksa setiap material dan ubah
					sesuai hasil hitung fisik.
				</p>
			)}
			{isDraft && !canUpdate && (
				<p role="status" className="text-sm text-muted-foreground">
					Anda tidak memiliki izin untuk mengubah hitungan ini.
				</p>
			)}
			{serverChanged && !isSubmitting && (
				<InlineAlert variant="warning" title="Hitungan tersimpan telah berubah">
					<p>
						{hasUnsaved
							? 'Draf Anda tetap dipertahankan. Memuat hitungan terbaru akan membuang perubahan yang belum disimpan.'
							: 'Muat dan periksa hitungan terbaru sebelum menyelesaikan opname.'}
					</p>
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={completing || loadingLatest}
						onClick={async () => {
							setLoadingLatest(true)
							try {
								if (
									hasUnsaved &&
									!(await confirm({
										title: 'Buang perubahan hitungan?',
										description:
											'Perubahan yang belum disimpan akan diganti dengan hitungan tersimpan terbaru.',
										confirmLabel: 'Buang dan muat',
										variant: 'destructive',
									}))
								)
									return
								onLoadLatest()
							} finally {
								setLoadingLatest(false)
							}
						}}
					>
						Muat hitungan terbaru
					</Button>
				</InlineAlert>
			)}

			<FormRoot form={form} className="space-y-4">
				<div
					role="region"
					aria-label="Hitungan material"
					tabIndex={0}
					className="data-table-horizontal-scroll max-w-full overflow-x-auto rounded-md border focus-visible:outline-2 focus-visible:outline-ring [&>div]:overflow-visible"
				>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-12">#</TableHead>
								<TableHead>Material</TableHead>
								<TableHead className="w-28 text-right">Stok Sistem</TableHead>
								<TableHead className="w-36 text-right">Jumlah Aktual</TableHead>
								<TableHead className="w-28 text-right">Selisih</TableHead>
								<TableHead className="min-w-48">Alasan</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{baseline.lines.map((saved, index) => {
								const line = meta[index]!
								const variance = opnameVariance(saved.countedQty, line.systemQty)
								const unsaved = changedIds.has(saved.lineId)
								return (
									<TableRow key={line.lineId}>
										<TableCell className="text-muted-foreground">{index + 1}</TableCell>
										<TableCell>
											<div className="font-medium">{line.materialName}</div>
											<div className="font-mono text-xs text-muted-foreground">
												{line.materialCode}
											</div>
										</TableCell>
										<TableCell className="text-right font-mono tabular-nums">
											{line.systemQty}
										</TableCell>
										<TableCell className="text-right">
											{editable ? (
												<form.AppField name={`lines[${index}].countedQty`}>
													{(field) => {
														const error = formatFieldError(field.state.meta.errors)
														return (
															<div className="space-y-1">
																<Input
																	type="text"
																	inputMode="decimal"
																	autoComplete="off"
																	aria-label={`Jumlah aktual ${line.materialName}`}
																	aria-invalid={!!error}
																	aria-describedby={
																		error ? `opname-count-error-${line.lineId}` : undefined
																	}
																	disabled={inputsLocked}
																	name={field.name}
																	value={field.state.value}
																	onBlur={field.handleBlur}
																	onChange={(e) => field.handleChange(e.target.value)}
																	className="ml-auto w-56 text-right font-mono tabular-nums"
																/>
																{error && (
																	<p
																		id={`opname-count-error-${line.lineId}`}
																		className="text-xs text-destructive"
																	>
																		{error}
																	</p>
																)}
															</div>
														)
													}}
												</form.AppField>
											) : (
												<span className="font-mono tabular-nums">{saved.countedQty}</span>
											)}
											{unsaved && (
												<p className="mt-1 text-xs text-muted-foreground">Belum disimpan</p>
											)}
										</TableCell>
										<TableCell className="text-right font-mono tabular-nums">
											{variance === undefined ? (
												<span className="text-muted-foreground">—</span>
											) : (
												<span
													className={cn(
														'font-medium',
														variance === '0' && 'text-muted-foreground',
														variance.startsWith('-') && 'text-destructive',
														variance !== '0' && !variance.startsWith('-') && 'text-success',
													)}
												>
													{variance !== '0' && !variance.startsWith('-') ? '+' : ''}
													{variance}
												</span>
											)}
										</TableCell>
										<TableCell>
											{editable ? (
												<form.AppField name={`lines[${index}].reason`}>
													{(field) => (
														<Input
															type="text"
															autoComplete="off"
															placeholder="Opsional"
															aria-label={`Alasan ${line.materialName}`}
															disabled={inputsLocked}
															name={field.name}
															value={field.state.value}
															onBlur={field.handleBlur}
															onChange={(e) => field.handleChange(e.target.value)}
														/>
													)}
												</form.AppField>
											) : (
												<span className="text-muted-foreground">{saved.reason || '—'}</span>
											)}
										</TableCell>
									</TableRow>
								)
							})}
						</TableBody>
					</Table>
				</div>
				{editable && (
					<p className="text-xs text-muted-foreground">
						Selisih dihitung dari hitungan yang sudah tersimpan terhadap stok sistem.
					</p>
				)}

				<form.AppForm>
					<form.FormError />
				</form.AppForm>

				{isDraft && (
					<div className="flex flex-wrap items-center justify-between gap-3">
						<p id="opname-complete-hint" className="text-xs text-muted-foreground">
							{hasUnsaved
								? 'Simpan perubahan hitungan terlebih dahulu. Opname hanya dapat diselesaikan dengan hitungan yang sudah tersimpan.'
								: 'Menyelesaikan opname memakai hitungan yang sudah tersimpan.'}
						</p>
						<div className="flex items-center gap-2">
							{editable && (
								<Button
									type={saveFailed ? 'button' : 'submit'}
									variant="outline"
									disabled={!canSave}
									onClick={
										saveFailed
											? () => {
													form.setErrorMap({ onSubmit: undefined })
													void form.handleSubmit()
												}
											: undefined
									}
								>
									<CheckIcon className="size-4" />
									{saveFailed ? 'Coba simpan lagi' : 'Simpan Hitungan'}
								</Button>
							)}
							{canComplete && (
								<Button
									type="button"
									aria-describedby="opname-complete-hint"
									disabled={!canFinish}
									onClick={() => {
										void onComplete(baseline)
									}}
								>
									<ClipboardCheckIcon className="size-4" />
									Selesaikan Opname
								</Button>
							)}
						</div>
					</div>
				)}
			</FormRoot>
		</div>
	)
}
