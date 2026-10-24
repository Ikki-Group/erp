import { useStore } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'

import { useEditorLocationScope } from '@/lib/form/use-editor-location-scope.ts'
import type { PinnedEditorLocationScope } from '@/lib/form/use-editor-location-scope.ts'

import { EntityEditorPage } from '@/components/shared/entity-editor-page.tsx'
import { LocationRequiredPage } from '@/components/shared/location-required-page.tsx'
import { usePermissionCheck } from '@/components/shared/permission-gate.tsx'

import { Button } from '@/components/ui/button'

import type { RecipeDetailDto } from '../dto/index.ts'
import { useRecipeEditor } from '../use-recipe-editor.ts'
import { RecipeFormFields } from './recipe-form-fields.tsx'

/** Resolves the session location (or asks for one) once, then mounts the editor. Key edits by recipe id. */
export function RecipeEditorPage({ recipe }: { recipe?: RecipeDetailDto }) {
	const scope = useEditorLocationScope()
	if (!scope.location) {
		return (
			<LocationRequiredPage
				title={recipe ? 'Edit Resep' : 'Tambah Resep'}
				description="Definisikan resep (BOM) untuk menu item."
				message="Pilih lokasi terlebih dahulu untuk mengelola resep."
			/>
		)
	}
	return <RecipeEditor recipe={recipe} scope={{ ...scope, location: scope.location }} />
}

function RecipeEditor({
	recipe,
	scope,
}: {
	recipe?: RecipeDetailDto
	scope: PinnedEditorLocationScope
}) {
	const navigate = useNavigate()
	const canWrite = usePermissionCheck({ permission: recipe ? 'recipe.update' : 'recipe.create' })
	const onDone = () => navigate({ to: '/master/recipes' })
	const form = useRecipeEditor({ recipe, location: scope.location, onSaved: onDone })
	const saveFailed = useStore(form.store, (state) => state.errorMap.onSubmit !== undefined)
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

	return (
		<EntityEditorPage
			title={recipe ? 'Edit Resep' : 'Tambah Resep'}
			description={recipe ? `Edit "${recipe.name}".` : 'Definisikan resep (BOM) untuk menu item.'}
			form={form}
			submitLabel="Simpan"
			cancelLabel="Batal"
			onCancel={onDone}
			readOnly={!canWrite || !scope.isCurrent}
			actions={
				saveFailed && scope.isCurrent && canWrite ? (
					<Button
						type="button"
						variant="outline"
						disabled={isSubmitting}
						onClick={() => {
							form.setErrorMap({ onSubmit: undefined })
							void form.handleSubmit()
						}}
					>
						Coba simpan lagi
					</Button>
				) : undefined
			}
		>
			{!canWrite && (
				<p role="status" className="text-sm text-muted-foreground">
					Anda tidak memiliki izin untuk menyimpan resep ini.
				</p>
			)}
			<RecipeFormFields
				form={form}
				scope={scope}
				menuItemLocked={recipe !== undefined}
				readOnly={!canWrite}
			/>
		</EntityEditorPage>
	)
}
