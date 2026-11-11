import { usePermissionCheck } from '@/components/shared/permission-gate'
import { useWorkflowAction } from '@/components/shared/workflow-action'

import { locationResource } from './api'
import type { LocationDto } from './dto'

export function useLocationDelete({
	onDeleted,
}: {
	onDeleted?: () => void | Promise<void>
} = {}) {
	const canDelete = usePermissionCheck({ permission: 'location.delete' })
	const action = useWorkflowAction<LocationDto>({
		availability: (location) => canDelete && location.isActive,
		confirmation: (location) => ({
			title: 'Deactivate location?',
			description: `Deactivate "${location.name}" and remove it from active locations? Its history and existing records are retained.`,
			confirmLabel: 'Deactivate',
			variant: 'destructive',
		}),
		execute: async (location) => {
			await locationResource.remove.fetch({ id: location.id })
			await onDeleted?.()
		},
		successMessage: 'Location deactivated successfully.',
	})

	return { ...action, canDelete }
}
