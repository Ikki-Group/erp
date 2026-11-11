import { getActiveLocationId } from '@/lib/api/index.ts'
import { useEntityEditor } from '@/lib/form/use-entity-editor'
import type { EntityForm } from '@/lib/form/use-entity-form'

import { usePermissionCheck } from '@/components/shared/permission-gate'

import { modifierGroupResource } from './api.ts'
import type { ModifierGroupWithOptionsDto } from './dto/index.ts'
import {
	emptyModifierGroupFormValues,
	ModifierGroupFormSchema,
	toModifierGroupCreateInput,
	toModifierGroupFormValues,
	toModifierGroupUpdateInput,
} from './modifier-group-form-values.ts'
import type { ModifierGroupFormValues } from './modifier-group-form-values.ts'

export type ModifierGroupEditorForm = EntityForm<ModifierGroupFormValues>

interface UseModifierGroupEditorOptions {
	/** Present when editing; key the session by `group.id`. Its `locationId` is the record's scope. */
	group?: ModifierGroupWithOptionsDto
	/** The pinned session location (see `useEditorLocationScope`). */
	location: { id: number; name: string }
	onSaved: () => void | Promise<void>
}

type ModifierGroupSaveInput = { values: ModifierGroupFormValues }

/**
 * Modifier group create/update session. Requests carry the header's ambient location, so a save is
 * refused — keeping every entered value — while the active location differs from the pinned one.
 */
export function useModifierGroupEditor({
	group,
	location,
	onSaved,
}: UseModifierGroupEditorOptions): ModifierGroupEditorForm {
	const canWrite = usePermissionCheck({ permission: group ? 'modifier.update' : 'modifier.create' })
	return useEntityEditor<ModifierGroupFormValues, ModifierGroupSaveInput, unknown>({
		defaultValues: group ? toModifierGroupFormValues(group) : emptyModifierGroupFormValues(),
		schema: ModifierGroupFormSchema,
		mutation: {
			retry: false,
			mutationFn: async ({ values }: ModifierGroupSaveInput) => {
				if (!canWrite)
					throw new Error('Anda tidak memiliki izin untuk menyimpan modifier group ini.')
				if (getActiveLocationId() !== location.id) {
					throw new Error(
						`Lokasi aktif telah berubah. Kembali ke "${location.name}" untuk menyimpan modifier group ini.`,
					)
				}
				return group
					? modifierGroupResource.update.fetch(toModifierGroupUpdateInput(group.id, values))
					: modifierGroupResource.create.fetch(toModifierGroupCreateInput(location.id, values))
			},
		},
		toPayload: (values) => ({ values }),
		successMessage: group
			? 'Modifier group berhasil diperbarui.'
			: 'Modifier group berhasil dibuat.',
		onSaved,
	})
}
