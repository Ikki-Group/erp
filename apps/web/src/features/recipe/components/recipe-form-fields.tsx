import type { PinnedEditorLocationScope } from '@/lib/form/use-editor-location-scope.ts'

import { InlineAlert } from '@/components/shared/inline-alert.tsx'
import { LineItemEditor } from '@/components/shared/line-item-editor.tsx'

import { Button } from '@/components/ui/button'

import { MaterialLookupField } from '@/features/material/components/material-lookup-field.tsx'
import { MenuItemLookupField } from '@/features/menu/components/menu-item-lookup-field.tsx'
import { UomLookupField } from '@/features/uom/components/uom-lookup-field.tsx'

import { createRecipeLine } from '../recipe-form-values.ts'
import type { RecipeEditorForm } from '../use-recipe-editor.ts'

interface RecipeFormFieldsProps {
	form: RecipeEditorForm
	/** Session location; its materials and menu items are the only eligible choices. */
	scope: PinnedEditorLocationScope
	/** The menu item cannot change once a recipe exists. */
	menuItemLocked: boolean
	readOnly: boolean
}

export function RecipeFormFields({ form, scope, menuItemLocked, readOnly }: RecipeFormFieldsProps) {
	const { location, isCurrent, restore } = scope
	// While the header shows another location, choices are frozen (not cleared) so the draft survives.
	const frozen = !isCurrent

	return (
		<div className="grid gap-4">
			{isCurrent ? (
				<InlineAlert variant="info">
					Resep ini dikelola untuk lokasi <strong>{location.name}</strong>. Menu item dan bahan yang
					dapat dipilih mengikuti lokasi tersebut.
				</InlineAlert>
			) : (
				<InlineAlert variant="warning" title="Lokasi aktif telah berubah">
					<p>
						Draf ini tetap untuk lokasi <strong>{location.name}</strong>. Pilihan dikunci dan resep
						tidak dapat disimpan sampai lokasi tersebut dipilih kembali.
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={!scope.canRestore}
						onClick={restore}
					>
						Kembali ke {location.name}
					</Button>
				</InlineAlert>
			)}
			<fieldset disabled={readOnly} className="contents">
				<form.AppField name="menuItemId">
					{() => (
						<MenuItemLookupField
							label="Menu Item"
							placeholder="Pilih menu item..."
							locationId={location.id}
							disabled={menuItemLocked || frozen}
							description={
								menuItemLocked ? 'Menu item tidak dapat diubah setelah resep dibuat.' : undefined
							}
						/>
					)}
				</form.AppField>

				<div className="grid gap-4 sm:grid-cols-2">
					<form.AppField name="name">
						{(field) => (
							<field.TextField label="Nama Resep" placeholder="e.g. Es Kopi Susu Standard" />
						)}
					</form.AppField>
					<form.AppField name="yieldQty">
						{(field) => (
							<field.TextField
								label="Yield Qty"
								placeholder="e.g. 1"
								inputMode="decimal"
								className="text-right font-mono tabular-nums"
							/>
						)}
					</form.AppField>
				</div>

				<form.AppField name="lines" mode="array">
					{(linesField) => (
						<LineItemEditor
							label="Bahan (Ingredients)"
							addLabel="Tambah Bahan"
							rows={linesField.state.value}
							createRow={createRecipeLine}
							onAdd={(row) => linesField.pushValue(row)}
							onRemove={(index) => linesField.removeValue(index)}
							errors={linesField.state.meta.errors}
							fieldCount={3}
							minRows={1}
							emptyMessage="Belum ada bahan. Tambahkan minimal satu bahan."
							renderFields={(_, index) => (
								<>
									<form.AppField name={`lines[${index}].materialId`}>
										{() => (
											<MaterialLookupField
												label="Material"
												placeholder="Pilih material..."
												locationId={location.id}
												disabled={frozen}
											/>
										)}
									</form.AppField>
									<form.AppField name={`lines[${index}].quantity`}>
										{(field) => (
											<field.TextField
												label="Qty"
												placeholder="0.5"
												inputMode="decimal"
												className="text-right font-mono tabular-nums"
											/>
										)}
									</form.AppField>
									<form.AppField name={`lines[${index}].uomId`}>
										{() => <UomLookupField label="UoM" placeholder="Satuan..." disabled={frozen} />}
									</form.AppField>
								</>
							)}
						/>
					)}
				</form.AppField>
			</fieldset>
		</div>
	)
}
