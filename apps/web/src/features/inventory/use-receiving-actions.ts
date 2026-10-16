import { useRef } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { getActiveLocationId } from '@/lib/api/index.ts'

import { usePermissionCheck } from '@/components/shared/permission-gate'
import { useWorkflowAction } from '@/components/shared/workflow-action'

import { receivingResource } from './api.ts'
import type { ReceivingDto } from './dto/index.ts'

type ReceivingRef = Pick<ReceivingDto, 'id' | 'receivingNo' | 'locationId' | 'status'>

const DENIED = 'Anda tidak memiliki izin untuk mengonfirmasi penerimaan ini.'
const NOT_DRAFT = 'Penerimaan ini tidak lagi berstatus draft.'

/**
 * Draft receiving confirmation. The write adds stock at the receiving's own location, so it is
 * only offered, and re-verified after every await, while that location is the active one.
 */
export function useReceivingConfirmation() {
	const canConfirm = usePermissionCheck({ permission: 'receiving.confirm' })
	const queryClient = useQueryClient()
	// The confirmation dialog outlives renders; execute must read live permission after awaits.
	const permissionRef = useRef(canConfirm)
	permissionRef.current = canConfirm

	const refusal = (receiving: ReceivingRef): string | undefined => {
		if (!permissionRef.current) return DENIED
		if (getActiveLocationId() !== receiving.locationId) {
			return 'Lokasi aktif telah berubah. Kembali ke lokasi penerimaan ini untuk mengonfirmasinya.'
		}
		return undefined
	}

	const action = useWorkflowAction<ReceivingRef>({
		availability: (receiving) =>
			refusal(receiving) ?? (receiving.status === 'draft' ? true : NOT_DRAFT),
		confirmation: (receiving) => ({
			title: 'Konfirmasi penerimaan?',
			description: `Penerimaan ${receiving.receivingNo} akan dikonfirmasi dan stok akan diperbarui. Lanjutkan?`,
			confirmLabel: 'Konfirmasi',
		}),
		execute: async (receiving) => {
			const denied = refusal(receiving)
			if (denied) throw new Error(denied)

			// Authoritative state: a lost response or another session may already have confirmed it.
			const current = await queryClient.fetchQuery({
				queryKey: receivingResource.detail.queryKey({ id: receiving.id }),
				queryFn: ({ signal }) => receivingResource.detail.fetch({ id: receiving.id }, signal),
				staleTime: 0,
				retry: false,
			})

			const deniedAfterRead = refusal(receiving)
			if (deniedAfterRead) throw new Error(deniedAfterRead)
			if (current.data.locationId !== receiving.locationId) {
				throw new Error('Penerimaan ini bukan milik lokasi aktif.')
			}
			if (current.data.status === 'confirmed') {
				// Never write twice; the skipped confirm endpoint would have refreshed these readers.
				await Promise.all(
					receivingResource.invalidationKeys.map((queryKey) =>
						queryClient.invalidateQueries({ queryKey }),
					),
				)
				return
			}

			await receivingResource.confirm.fetch({ receivingId: receiving.id })
		},
		successMessage: 'Penerimaan berhasil dikonfirmasi.',
	})

	return { ...action, canConfirm }
}
