import { getActiveLocationId } from '@/lib/api/index.ts'
import { useEntityEditor } from '@/lib/form/use-entity-editor'
import type { EntityForm } from '@/lib/form/use-entity-form'

import { usePermissionCheck } from '@/components/shared/permission-gate'

import { menuItemResource } from './api.ts'
import type { MenuItemDetailDto } from './dto/index.ts'
import {
	emptyMenuItemFormValues,
	MenuItemFormSchema,
	toMenuItemCreateInput,
	toMenuItemFormValues,
	toMenuItemUpdateInput,
} from './menu-item-form-values.ts'
import type { MenuItemFormValues } from './menu-item-form-values.ts'

export type MenuItemEditorForm = EntityForm<MenuItemFormValues>

interface UseMenuItemEditorOptions {
	/** Present when editing; key the session by `item.id`. Its `locationId` is the record's scope. */
	item?: MenuItemDetailDto
	/** The pinned session location (see `useEditorLocationScope`). */
	location: { id: number; name: string }
	onSaved: () => void | Promise<void>
}

type MenuItemSaveInput = { values: MenuItemFormValues }

/**
 * Menu item create/update session. Requests carry the header's ambient location, so a save is
 * refused — keeping every entered value — while the active location differs from the pinned one.
 */
export function useMenuItemEditor({
	item,
	location,
	onSaved,
}: UseMenuItemEditorOptions): MenuItemEditorForm {
	const canWrite = usePermissionCheck({ permission: item ? 'item.update' : 'item.create' })
	return useEntityEditor<MenuItemFormValues, MenuItemSaveInput, unknown>({
		defaultValues: item ? toMenuItemFormValues(item) : emptyMenuItemFormValues(),
		schema: MenuItemFormSchema,
		mutation: {
			mutationFn: async ({ values }: MenuItemSaveInput) => {
				if (!canWrite) throw new Error('Anda tidak memiliki izin untuk menyimpan menu item ini.')
				if (getActiveLocationId() !== location.id) {
					throw new Error(
						`Lokasi aktif telah berubah. Kembali ke "${location.name}" untuk menyimpan menu item ini.`,
					)
				}
				return item
					? menuItemResource.update.fetch(toMenuItemUpdateInput(item.id, values))
					: menuItemResource.create.fetch(toMenuItemCreateInput(location.id, values))
			},
		},
		toPayload: (values) => ({ values }),
		successMessage: item ? 'Menu item berhasil diperbarui.' : 'Menu item berhasil dibuat.',
		onSaved,
	})
}
