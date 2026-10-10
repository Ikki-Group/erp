import { BadRequestError } from '@/shared/errors/http-error.ts'

export const AssignmentError = {
	locationMismatch: (groupId: number) =>
		new BadRequestError('Modifier group does not belong to the same location as the menu item', {
			code: 'MENU_ITEM_MODIFIER_LOCATION_MISMATCH',
			context: { groupId },
		}),
}
