import { useStore } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'

import { useEditorLocationScope } from '@/lib/form/use-editor-location-scope.ts'
import type { PinnedEditorLocationScope } from '@/lib/form/use-editor-location-scope.ts'

import { EntityEditorPage } from '@/components/shared/entity-editor-page.tsx'
import { LocationRequiredPage } from '@/components/shared/location-required-page.tsx'
import { usePermissionCheck } from '@/components/shared/permission-gate.tsx'

import { Button } from '@/components/ui/button'

import type { ModifierGroupWithOptionsDto } from '../dto/index.ts'
import { useModifierGroupEditor } from '../use-modifier-group-editor.ts'
import { ModifierGroupFormFields } from './modifier-group-form-fields.tsx'

/**
 * Edits pin the record's own location (never the header); creates pin the selected location.
 * Mount edits only after detail resolves, keyed by group id.
 */
export function ModifierGroupEditorPage({ group }: { group?: ModifierGroupWithOptionsDto }) {
	const scope = useEditorLocationScope(group?.locationId)
	if (!scope.location) {
		return (
			<LocationRequiredPage
				title="Tambah Modifier Group"
				description="Buat modifier group baru untuk lokasi ini."
				message="Pilih lokasi terlebih dahulu untuk mengelola menu."
			/>
		)
	}
	return <ModifierGroupEditor group={group} scope={{ ...scope, location: scope.location }} />
}

function ModifierGroupEditor({
	group,
	scope,
}: {
	group?: ModifierGroupWithOptionsDto
	scope: PinnedEditorLocationScope
}) {
	const navigate = useNavigate()
	const canWrite = usePermissionCheck({ permission: group ? 'modifier.update' : 'modifier.create' })
	const onDone = () => navigate({ to: '/master/menu', search: { tab: 'modifiers' } })
	const form = useModifierGroupEditor({ group, location: scope.location, onSaved: onDone })
	const saveFailed = useStore(form.store, (state) => state.errorMap.onSubmit !== undefined)
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

	return (
		<EntityEditorPage
			title={group ? 'Edit Modifier Group' : 'Tambah Modifier Group'}
			description={group ? `Edit "${group.name}".` : 'Buat modifier group baru untuk lokasi ini.'}
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
					Anda tidak memiliki izin untuk menyimpan modifier group ini.
				</p>
			)}
			<ModifierGroupFormFields form={form} scope={scope} readOnly={!canWrite} />
		</EntityEditorPage>
	)
}
