import { useMemo, useRef } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { getActiveLocationId } from '@/lib/api/index.ts'

import { usePermissionCheck } from '@/components/shared/permission-gate'
import { useWorkflowAction } from '@/components/shared/workflow-action'

import { transferResource } from './api.ts'
import { createTransferWorkflows, type TransferRef } from './transfer-workflow.ts'

/**
 * Ship (source location) and receive (destination location) confirmations. Every write is a
 * single, non-retried request preceded by a fresh canonical read inside the retryable dialog.
 */
export function useTransferActions() {
	const canShip = usePermissionCheck({ permission: 'transfer.ship' })
	const canReceive = usePermissionCheck({ permission: 'transfer.receive' })
	const queryClient = useQueryClient()
	// The confirmation dialog outlives renders; execute must read live permissions after awaits.
	const permissionRef = useRef({ canShip, canReceive })
	permissionRef.current = { canShip, canReceive }

	const workflows = useMemo(
		() =>
			createTransferWorkflows({
				canShip: () => permissionRef.current.canShip,
				canReceive: () => permissionRef.current.canReceive,
				getActiveLocationId,
				fetchDetail: (id) =>
					queryClient.fetchQuery({
						queryKey: transferResource.detail.queryKey({ id }),
						queryFn: ({ signal }) => transferResource.detail.fetch({ id }, signal),
						staleTime: 0,
						retry: false,
					}),
				ship: (input) => transferResource.ship.fetch(input),
				receive: (input) => transferResource.receive.fetch(input),
				refreshReaders: () =>
					Promise.all(
						transferResource.invalidationKeys.map((queryKey) =>
							queryClient.invalidateQueries({ queryKey }),
						),
					),
			}),
		[queryClient],
	)

	const ship = useWorkflowAction(workflows.ship)
	const receive = useWorkflowAction(workflows.receive)

	return {
		ship: ship.run,
		receive: receive.run,
		canShipTransfer: (transfer: TransferRef) => workflows.ship.availability(transfer) === true,
		canReceiveTransfer: (transfer: TransferRef) =>
			workflows.receive.availability(transfer) === true,
		isPending: ship.isPending || receive.isPending,
	}
}
