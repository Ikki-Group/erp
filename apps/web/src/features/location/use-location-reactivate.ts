import { usePermissionCheck } from '@/components/shared/permission-gate'
import { useWorkflowAction } from '@/components/shared/workflow-action'

import { locationResource } from './api'
import { toLocationFormValues, toLocationInput } from './components/location-form'
import type { LocationDto } from './dto'

export function useLocationReactivate({
	onReactivated,
}: {
	onReactivated?: () => void | Promise<void>
} = {}) {
	const canUpdate = usePermissionCheck({ permission: 'location.update' })
	const action = useWorkflowAction<LocationDto>({
		availability: (location) => canUpdate && !location.isActive,
		confirmation: (location) => ({
			title: 'Aktifkan kembali lokasi?',
			description: `Aktifkan "${location.name}" dan masukkan kembali ke pilihan lokasi?`,
			confirmLabel: 'Aktifkan kembali',
		}),
		execute: async (location) => {
			await locationResource.update.fetch({
				...toLocationInput({ ...toLocationFormValues(location), isActive: true }),
				id: location.id,
			})
			await onReactivated?.()
		},
		successMessage: 'Lokasi berhasil diaktifkan kembali.',
	})

	return { ...action, canUpdate }
}
