import { useEffect, useRef, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { getActiveLocationId } from '@/lib/api/index.ts'
import { useEntityEditor } from '@/lib/form/use-entity-editor'
import type { EntityForm } from '@/lib/form/use-entity-form'

import { opnameResource } from './api.ts'
import type { OpnameDetailDto, OpnameUpdateCountsDto } from './dto/index.ts'
import {
	normalizeOpnameCountValues,
	OpnameCountFormSchema,
	toOpnameCountFormValues,
	toOpnameCountsInput,
} from './opname-count-values.ts'
import type { OpnameCountFormValues } from './opname-count-values.ts'

export type OpnameCountEditorForm = EntityForm<OpnameCountFormValues>

interface UseOpnameCountEditorOptions {
	/** The record this session edits; key the session by `opname.id`. Later refetches never reset it. */
	opname: Pick<OpnameDetailDto, 'id' | 'locationId' | 'lines'>
	/** The pinned session location (see `useEditorLocationScope`). */
	location: { id: number; name: string }
	canUpdate: boolean
}

interface CountsSave {
	request: OpnameUpdateCountsDto
}

/**
 * Persists changed count lines and rebases the session baseline in place. Requests carry the
 * header's ambient location, and a stale draft must never be written over a finished document,
 * so each save re-reads the authoritative record and re-checks permission and scope first.
 */
export function useOpnameCountEditor({ opname, location, canUpdate }: UseOpnameCountEditorOptions) {
	const queryClient = useQueryClient()
	const permissionRef = useRef(canUpdate)
	useEffect(() => {
		permissionRef.current = canUpdate
	}, [canUpdate])

	const [baseline, setBaseline] = useState(() => toOpnameCountFormValues(opname))
	const baselineRef = useRef(baseline)

	const refusal = (): string | undefined => {
		if (!permissionRef.current) return 'Anda tidak memiliki izin untuk mengubah hitungan ini.'
		if (getActiveLocationId() !== location.id) {
			return `Lokasi aktif telah berubah. Kembali ke "${location.name}" untuk menyimpan hitungan ini.`
		}
		return undefined
	}

	const form: OpnameCountEditorForm = useEntityEditor<
		OpnameCountFormValues,
		CountsSave,
		OpnameCountFormValues
	>({
		defaultValues: baseline,
		schema: OpnameCountFormSchema,
		mutation: {
			mutationFn: async ({ request }: CountsSave) => {
				const denied = refusal()
				if (denied) throw new Error(denied)
				if (request.lines.length === 0)
					throw new Error('Tidak ada perubahan hitungan untuk disimpan.')

				// Authoritative state: another session may already have completed this opname.
				const detailKey = opnameResource.detail.queryKey({ id: opname.id })
				const current = await queryClient.fetchQuery({
					queryKey: detailKey,
					queryFn: ({ signal }) => opnameResource.detail.fetch({ id: opname.id }, signal),
					staleTime: 0,
					retry: false,
				})

				const deniedAfterRead = refusal()
				if (deniedAfterRead) throw new Error(deniedAfterRead)
				if (current.data.locationId !== location.id) {
					throw new Error('Opname ini bukan milik lokasi aktif.')
				}
				if (current.data.status !== 'draft') {
					throw new Error(
						'Opname ini sudah tidak berstatus draft sehingga hitungan tidak dapat diubah. Draf Anda tetap dipertahankan.',
					)
				}
				const readVersion = queryClient.getQueryState(detailKey)?.dataUpdateCount
				await opnameResource.updateCounts.fetch(request)
				const saved = toOpnameCountFormValues(current.data)
				const changes = new Map(request.lines.map((line) => [line.materialId, line]))
				const detailQuery = queryClient.getQueryCache().find({ queryKey: detailKey, exact: true })
				// The endpoint awaits invalidation. A failed refresh leaves the pre-save record cached;
				// patch only that version, never a successful refresh (even one with identical data).
				if (detailQuery && detailQuery.state.dataUpdateCount === readVersion) {
					const { error, status, isInvalidated, dataUpdatedAt } = detailQuery.state
					queryClient.setQueryData<typeof current>(
						detailKey,
						(cached) =>
							cached && {
								...cached,
								data: {
									...cached.data,
									lines: cached.data.lines.map((line) => {
										const change = changes.get(line.materialId)
										return change
											? { ...line, actualQty: change.countedQty, reason: change.reason ?? null }
											: line
									}),
								},
							},
						{ updatedAt: dataUpdatedAt },
					)
					// A write acknowledgement is not a successful read. Keep refresh recovery visible.
					detailQuery.setState({ error, status, isInvalidated })
				}
				const savedById = new Map(saved.lines.map((line) => [line.lineId, line]))
				return {
					lines: baselineRef.current.lines.map((line) => {
						const change = changes.get(line.materialId)
						return change
							? { ...line, countedQty: change.countedQty, reason: change.reason ?? '' }
							: savedById.get(line.lineId)!
					}),
				}
			},
			retry: false,
		},
		toPayload: (values) => ({
			request: toOpnameCountsInput(opname.id, values, baselineRef.current),
		}),
		successMessage: 'Hitungan berhasil disimpan.',
		baselineAfterSave: (_payload, saved) => {
			const next = normalizeOpnameCountValues(saved)
			baselineRef.current = next
			setBaseline(next)
			return next
		},
	})

	return { form, baseline }
}
