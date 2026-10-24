import { useStore } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'

import { useEditorLocationScope } from '@/lib/form/use-editor-location-scope.ts'
import type { PinnedEditorLocationScope } from '@/lib/form/use-editor-location-scope.ts'

import { EntityEditorPage } from '@/components/shared/entity-editor-page.tsx'
import { LocationRequiredPage } from '@/components/shared/location-required-page.tsx'
import { usePermissionCheck } from '@/components/shared/permission-gate.tsx'

import { Button } from '@/components/ui/button'

import type { MenuItemDetailDto } from '../dto/index.ts'
import { useMenuItemEditor } from '../use-menu-item-editor.ts'
import { MenuItemFormFields } from './menu-item-form-fields.tsx'

/**
 * Edits pin the record's own location (never the header); creates pin the selected location.
 * Mount edits only after detail resolves, keyed by item id.
 */
export function MenuItemEditorPage({ item }: { item?: MenuItemDetailDto }) {
	const scope = useEditorLocationScope(item?.locationId)
	if (!scope.location) {
		return (
			<LocationRequiredPage
				title="Tambah Menu Item"
				description="Buat item menu baru untuk lokasi ini."
				message="Pilih lokasi terlebih dahulu untuk mengelola menu."
			/>
		)
	}
	return <MenuItemEditor item={item} scope={{ ...scope, location: scope.location }} />
}

function MenuItemEditor({
	item,
	scope,
}: {
	item?: MenuItemDetailDto
	scope: PinnedEditorLocationScope
}) {
	const navigate = useNavigate()
	const canWrite = usePermissionCheck({ permission: item ? 'item.update' : 'item.create' })
	const canReadCategories = usePermissionCheck({ permission: 'category.read' })
	const onDone = () => navigate({ to: '/master/menu' })
	const form = useMenuItemEditor({ item, location: scope.location, onSaved: onDone })
	const saveFailed = useStore(form.store, (state) => state.errorMap.onSubmit !== undefined)
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

	return (
		<EntityEditorPage
			title={item ? 'Edit Menu Item' : 'Tambah Menu Item'}
			description={item ? `Edit "${item.name}".` : 'Buat item menu baru untuk lokasi ini.'}
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
					Anda tidak memiliki izin untuk menyimpan menu item ini.
				</p>
			)}
			<MenuItemFormFields
				form={form}
				scope={scope}
				knownCategory={item?.category}
				canReadCategories={canReadCategories}
				readOnly={!canWrite}
			/>
		</EntityEditorPage>
	)
}
