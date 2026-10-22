import { useRef } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { getActiveLocationId } from '@/lib/api/index.ts'

import { usePermissionCheck } from '@/components/shared/permission-gate'
import { useWorkflowAction } from '@/components/shared/workflow-action'

import { opnameResource } from './api.ts'
import type { OpnameDto } from './dto/index.ts'
import { sameOpnameCounts, toOpnameCountFormValues } from './opname-count-values.ts'
import type { OpnameCountFormValues } from './opname-count-values.ts'

export interface OpnameLocationRef {
	id: number
	name: string
}

export type OpnameCompletionRef = Pick<OpnameDto, 'id' | 'opnameNo' | 'locationId' | 'status'> & {
	expectedCounts: OpnameCountFormValues
}

export interface UseOpnameActionsOptions {
	/** Runs once after a snapshot is created and confirmed; never part of the retryable write. */
	onCreated?: (id: number) => void | Promise<void>
}

interface CreateTicket {
	location: OpnameLocationRef
	/** Filled by the write so the id survives dialog retries without re-running it. */
	id: number | null
}

export interface OpnameActions {
	create: (location: OpnameLocationRef) => Promise<boolean>
	creating: boolean
	complete: (opname: OpnameCompletionRef) => Promise<boolean>
	completing: boolean
}

const CREATE_DENIED = 'Anda tidak memiliki izin untuk membuat stock opname.'
const COMPLETE_DENIED = 'Anda tidak memiliki izin untuk menyelesaikan stock opname ini.'
const NOT_DRAFT = 'Stock opname ini tidak lagi berstatus draft.'
const SCOPE_CHANGED =
	'Lokasi aktif telah berubah. Kembali ke lokasi stock opname ini untuk melanjutkan.'

/**
 * Snapshot creation and completion for stock opname. Both writes are non-idempotent and are only
 * offered, and re-verified after every await, while the opname's own location is the active one.
 */
export function useOpnameActions({ onCreated }: UseOpnameActionsOptions = {}): OpnameActions {
	const canCreate = usePermissionCheck({ permission: 'opname.create' })
	const canComplete = usePermissionCheck({ permission: 'opname.complete' })
	const queryClient = useQueryClient()
	// Dialogs outlive renders; execute must read live permission and callback after awaits.
	const liveRef = useRef({ canCreate, canComplete, onCreated })
	liveRef.current = { canCreate, canComplete, onCreated }

	const createRefusal = (location: OpnameLocationRef): string | undefined => {
		if (!liveRef.current.canCreate) return CREATE_DENIED
		if (getActiveLocationId() !== location.id) return SCOPE_CHANGED
		return undefined
	}

	const completeRefusal = (opname: OpnameCompletionRef): string | undefined => {
		if (!liveRef.current.canComplete) return COMPLETE_DENIED
		if (getActiveLocationId() !== opname.locationId) return SCOPE_CHANGED
		return undefined
	}

	const createAction = useWorkflowAction<CreateTicket>({
		availability: ({ location }) => createRefusal(location) ?? true,
		confirmation: ({ location }) => ({
			title: 'Buat snapshot stock opname?',
			description: `Stok sistem ${location.name} saat ini akan disalin sebagai snapshot untuk dihitung secara fisik. Lanjutkan?`,
			confirmLabel: 'Buat Snapshot',
		}),
		execute: async (ticket) => {
			const { location } = ticket
			const denied = createRefusal(location)
			if (denied) throw new Error(denied)
			const result = await opnameResource.create.fetch({ locationId: location.id })
			ticket.id = result.data.id
		},
		successMessage: 'Snapshot stock opname berhasil dibuat.',
	})

	const completeAction = useWorkflowAction<OpnameCompletionRef>({
		availability: (opname) =>
			completeRefusal(opname) ?? (opname.status === 'draft' ? true : NOT_DRAFT),
		confirmation: (opname) => ({
			title: 'Selesaikan stock opname?',
			description: `Hitungan tersimpan pada ${opname.opnameNo} akan dijadikan penyesuaian stok dan tidak dapat dibatalkan. Pastikan semua hitungan sudah benar. Lanjutkan?`,
			confirmLabel: 'Selesaikan',
		}),
		execute: async (opname) => {
			const denied = completeRefusal(opname)
			if (denied) throw new Error(denied)

			// Authoritative state: a lost response or another session may already have completed it.
			const current = await queryClient.fetchQuery({
				queryKey: opnameResource.keys.detail({ id: opname.id }),
				queryFn: ({ signal }) => opnameResource.detail.fetch({ id: opname.id }, signal),
				staleTime: 0,
				retry: false,
			})

			const deniedAfterRead = completeRefusal(opname)
			if (deniedAfterRead) throw new Error(deniedAfterRead)
			if (current.data.locationId !== opname.locationId) {
				throw new Error('Stock opname ini bukan milik lokasi aktif.')
			}
			if (current.data.status === 'completed') {
				// Never write twice; the skipped complete endpoint would have refreshed these readers.
				await Promise.all(
					opnameResource.invalidationKeys.map((queryKey) =>
						queryClient.invalidateQueries({ queryKey }),
					),
				)
				return
			}
			if (current.data.status !== 'draft') throw new Error(NOT_DRAFT)
			if (!sameOpnameCounts(toOpnameCountFormValues(current.data), opname.expectedCounts)) {
				throw new Error(
					'Hitungan tersimpan telah berubah. Tutup dialog dan muat hitungan terbaru untuk diperiksa sebelum menyelesaikan opname.',
				)
			}

			await opnameResource.complete.fetch({ opnameId: opname.id })
		},
		successMessage: (opname) => `Stock opname ${opname.opnameNo} berhasil diselesaikan.`,
	})

	return {
		create: async (location) => {
			const ticket: CreateTicket = { location, id: null }
			const accepted = await createAction.run(ticket)
			if (accepted && ticket.id !== null) await liveRef.current.onCreated?.(ticket.id)
			return accepted
		},
		creating: createAction.isPending,
		complete: completeAction.run,
		completing: completeAction.isPending,
	}
}
