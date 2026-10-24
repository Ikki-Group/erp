import { getActiveLocationId } from '@/lib/api/index.ts'
import { useEntityEditor } from '@/lib/form/use-entity-editor'
import type { EntityForm } from '@/lib/form/use-entity-form'

import { usePermissionCheck } from '@/components/shared/permission-gate'

import { recipeResource } from './api.ts'
import type { RecipeCreateDto, RecipeDetailDto } from './dto/index.ts'
import {
	emptyRecipeFormValues,
	RecipeFormSchema,
	toRecipeFormValues,
	toRecipeInput,
	toRecipeUpdateInput,
} from './recipe-form-values.ts'
import type { RecipeFormValues } from './recipe-form-values.ts'

interface UseRecipeEditorOptions {
	/** Present when editing; the editing session must be keyed by the recipe's id. */
	recipe?: RecipeDetailDto
	/** The pinned session location (see `useEditorLocationScope`). */
	location: { id: number; name: string }
	onSaved: () => void | Promise<void>
}

/**
 * Recipe create/update session. Requests carry the header's ambient location, so a save is
 * refused — keeping every entered value — while the active location differs from the pinned one.
 */
export function useRecipeEditor({
	recipe,
	location,
	onSaved,
}: UseRecipeEditorOptions): RecipeEditorForm {
	const canWrite = usePermissionCheck({ permission: recipe ? 'recipe.update' : 'recipe.create' })
	return useEntityEditor({
		defaultValues: recipe ? toRecipeFormValues(recipe) : emptyRecipeFormValues(),
		schema: RecipeFormSchema,
		mutation: {
			mutationFn: async (input: RecipeCreateDto) => {
				if (!canWrite) throw new Error('Anda tidak memiliki izin untuk menyimpan resep ini.')
				if (getActiveLocationId() !== location.id) {
					throw new Error(
						`Lokasi aktif telah berubah. Kembali ke "${location.name}" untuk menyimpan resep ini.`,
					)
				}
				return recipe
					? recipeResource.update.fetch(toRecipeUpdateInput(recipe.id, input))
					: recipeResource.create.fetch(input)
			},
		},
		toPayload: toRecipeInput,
		successMessage: recipe ? 'Resep berhasil diperbarui.' : 'Resep berhasil dibuat.',
		onSaved,
	})
}

export type RecipeEditorForm = EntityForm<RecipeFormValues>
