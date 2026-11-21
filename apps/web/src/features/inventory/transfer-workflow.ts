import type { WorkflowActionOptions } from '@/components/shared/workflow-action'

import type { TransferDetailDto, TransferDto, TransferLineDto } from './dto/index.ts'

interface DecimalQty {
	units: bigint
	scale: number
}

function parseQty(value: string, label: string): DecimalQty {
	const canonical = value.trim()
	if (!/^\d+(\.\d+)?$/u.test(canonical)) throw new Error(`Jumlah ${label} tidak valid: "${value}".`)
	const [whole, fraction = ''] = canonical.split('.')
	return { units: BigInt(`${whole}${fraction}`), scale: fraction.length }
}

function serializeQty({ units, scale }: DecimalQty): string {
	if (scale === 0) return units.toString()
	const digits = units.toString().padStart(scale + 1, '0')
	const fraction = digits.slice(-scale).replace(/0+$/u, '')
	const whole = digits.slice(0, -scale)
	return fraction ? `${whole}.${fraction}` : whole
}

/** `requested - received` as an exact non-negative decimal; a missing receipt counts as zero. */
export function remainingTransferQty(requestedQty: string, receivedQty: string | null): string {
	const requested = parseQty(requestedQty, 'diminta')
	const received =
		receivedQty === null ? { units: 0n, scale: 0 } : parseQty(receivedQty, 'diterima')
	const scale = Math.max(requested.scale, received.scale)
	const remaining =
		requested.units * 10n ** BigInt(scale - requested.scale) -
		received.units * 10n ** BigInt(scale - received.scale)
	return serializeQty({ units: remaining > 0n ? remaining : 0n, scale })
}

/**
 * The receive endpoint takes DELTAS and rejects cumulative totals above the requested quantity,
 * so completing a transfer sends only what is still outstanding on each line.
 */
export function calculateRemainingReceiptLines(
	lines: readonly Pick<TransferLineDto, 'materialId' | 'requestedQty' | 'receivedQty'>[],
): { materialId: number; receivedQty: string }[] {
	return lines.flatMap((line) => {
		const receivedQty = remainingTransferQty(line.requestedQty, line.receivedQty)
		return parseQty(receivedQty, 'sisa').units > 0n
			? [{ materialId: line.materialId, receivedQty }]
			: []
	})
}

export interface TransferWorkflowDeps {
	/** Live reads: the confirmation dialog outlives renders, so these are re-evaluated after awaits. */
	canShip: () => boolean
	canReceive: () => boolean
	getActiveLocationId: () => number | null
	/** Must bypass cache freshness and write the canonical record back to the cache. */
	fetchDetail: (id: number) => Promise<{ data: TransferDetailDto }>
	ship: (input: { transferId: number }) => Promise<unknown>
	receive: (input: {
		transferId: number
		lines: { materialId: number; receivedQty: string }[]
	}) => Promise<unknown>
	/** Reconcile document, stock, movement and audit readers after an uncertain successful write. */
	refreshReaders: () => Promise<unknown>
}

export type TransferRef = Pick<
	TransferDto,
	'id' | 'transferNo' | 'status' | 'fromLocationId' | 'toLocationId'
>

export interface TransferWorkflows {
	ship: WorkflowActionOptions<TransferRef>
	receive: WorkflowActionOptions<TransferRef>
}

/** Ship leaves from the source location; receive lands at the destination. */
export function createTransferWorkflows(deps: TransferWorkflowDeps): TransferWorkflows {
	const scopeRefusal = (
		direction: 'ship' | 'receive',
		transfer: Pick<TransferRef, 'fromLocationId' | 'toLocationId'>,
	): string | undefined => {
		if (direction === 'ship') {
			if (!deps.canShip()) return 'Anda tidak memiliki izin untuk mengirim transfer ini.'
			if (deps.getActiveLocationId() !== transfer.fromLocationId) {
				return 'Transfer hanya dapat dikirim dari lokasi asal. Pindah ke lokasi asal terlebih dahulu.'
			}
			return undefined
		}
		if (!deps.canReceive()) return 'Anda tidak memiliki izin untuk menerima transfer ini.'
		if (deps.getActiveLocationId() !== transfer.toLocationId) {
			return 'Transfer hanya dapat diterima di lokasi tujuan. Pindah ke lokasi tujuan terlebih dahulu.'
		}
		return undefined
	}

	return {
		ship: {
			availability: (transfer) =>
				scopeRefusal('ship', transfer) ??
				(transfer.status === 'requested' ? true : 'Transfer ini tidak lagi berstatus diajukan.'),
			confirmation: (transfer) => ({
				title: 'Kirim transfer?',
				description: `Transfer ${transfer.transferNo} akan ditandai sebagai "Dalam Perjalanan" dan stok lokasi asal akan berkurang. Lanjutkan?`,
				confirmLabel: 'Kirim',
			}),
			execute: async (transfer) => {
				// Authoritative state: a lost response or another session may already have shipped it.
				const current = (await deps.fetchDetail(transfer.id)).data
				const refusal = scopeRefusal('ship', current)
				if (refusal) throw new Error(refusal)
				if (current.status === 'in_transit' || current.status === 'received') {
					await deps.refreshReaders()
					return
				}
				if (current.status !== 'requested') {
					throw new Error('Transfer ini tidak dapat dikirim pada status saat ini.')
				}
				await deps.ship({ transferId: current.id })
			},
			successMessage: 'Transfer berhasil dikirim.',
		},
		receive: {
			availability: (transfer) =>
				scopeRefusal('receive', transfer) ??
				(transfer.status === 'in_transit' ? true : 'Transfer ini tidak sedang dalam perjalanan.'),
			confirmation: (transfer) => ({
				title: 'Terima transfer?',
				description: `Sisa jumlah yang belum diterima pada setiap item ${transfer.transferNo} akan dicatat sebagai diterima dan stok lokasi ini akan bertambah. Lanjutkan?`,
				confirmLabel: 'Terima',
			}),
			execute: async (transfer) => {
				const current = (await deps.fetchDetail(transfer.id)).data
				const refusal = scopeRefusal('receive', current)
				if (refusal) throw new Error(refusal)
				if (current.status === 'received') {
					await deps.refreshReaders()
					return
				}
				if (current.status !== 'in_transit') {
					throw new Error('Transfer ini tidak sedang dalam perjalanan.')
				}
				const lines = calculateRemainingReceiptLines(current.lines)
				if (lines.length === 0) {
					await deps.refreshReaders()
					return
				}
				await deps.receive({ transferId: current.id, lines })
			},
			successMessage: 'Transfer berhasil diterima.',
		},
	}
}
