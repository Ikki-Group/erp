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
			title: 'Nonaktifkan lokasi?',
			description: `Nonaktifkan "${location.name}" dan keluarkan dari lokasi aktif? Riwayat dan data yang ada tetap disimpan.`,
			confirmLabel: 'Nonaktifkan',
			variant: 'destructive',
		}),
		execute: async (location) => {
			await locationResource.remove.fetch({ id: location.id })
			await onDeleted?.()
		},
		successMessage: 'Lokasi berhasil dinonaktifkan.',
	})

	return { ...action, canDelete }
}
