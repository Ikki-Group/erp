import { toast as toastManager } from '@/components/ui/toast'

/**
 * Toast utility with typed helpers for common patterns.
 * The `toast` object from ui/toast handles rendering — these are convenience wrappers.
 *
 * @example
 * ```tsx
 * import { showToast } from '@/lib/toast'
 *
 * showToast.success('Material created', 'Coffee Beans has been added.')
 * showToast.error('Failed to save', 'Network error. Please try again.')
 * showToast.info('Transfer sent', 'Warehouse will review your request.')
 * showToast.warning('Low stock', 'Only 3 items remaining.')
 * showToast.loading('Saving...', 'Please wait while we process your request.')
 * ```
 */
export const showToast = {
	success(title: string, description?: string) {
		return toastManager.add({ title, description, type: 'success' })
	},

	error(title: string, description?: string) {
		return toastManager.add({ title, description, type: 'error' })
	},

	info(title: string, description?: string) {
		return toastManager.add({ title, description, type: 'info' })
	},

	warning(title: string, description?: string) {
		return toastManager.add({ title, description, type: 'warning' })
	},

	loading(title: string, description?: string) {
		return toastManager.add({ title, description, type: 'loading' })
	},

	/**
	 * Show a toast and return the ID for later update/dismiss.
	 * Useful for async operations where you want to update the toast on completion.
	 *
	 * @example
	 * ```tsx
	 * const id = showToast.loading('Saving...')
	 * try {
	 *   await save()
	 *   showToast.dismiss(id)
	 *   showToast.success('Saved!')
	 * } catch {
	 *   showToast.dismiss(id)
	 *   showToast.error('Failed to save')
	 * }
	 * ```
	 */
	dismiss(id?: string) {
		toastManager.close(id)
	},
}
