import type { PinnedEditorLocationScope } from '@/lib/form/use-editor-location-scope.ts'

import { InlineAlert } from '@/components/shared/inline-alert.tsx'
import { LineItemEditor } from '@/components/shared/line-item-editor.tsx'

import { Button } from '@/components/ui/button'

import { SELECTION_TYPE_OPTIONS } from '../dto/index.ts'
import { createModifierOption, nextModifierSortOrder } from '../modifier-group-form-values.ts'
import type { ModifierGroupEditorForm } from '../use-modifier-group-editor.ts'

interface ModifierGroupFormFieldsProps {
	form: ModifierGroupEditorForm
	/** Session location the group belongs to. */
	scope: PinnedEditorLocationScope
	readOnly: boolean
}

export function ModifierGroupFormFields({ form, scope, readOnly }: ModifierGroupFormFieldsProps) {
	const { location, isCurrent, restore } = scope

	return (
		<div className="grid gap-4">
			{isCurrent ? (
				<InlineAlert variant="info">
					Modifier group ini dikelola untuk lokasi <strong>{location.name}</strong>.
				</InlineAlert>
			) : (
				<InlineAlert variant="warning" title="Lokasi aktif telah berubah">
					<p>
						Draf ini tetap untuk lokasi <strong>{location.name}</strong> dan tidak dapat disimpan
						sampai lokasi tersebut dipilih kembali.
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
				<form.AppField name="name">
					{(field) => <field.TextField label="Nama Group" placeholder="e.g. Level Gula, Ukuran" />}
				</form.AppField>

				<div className="grid gap-4 sm:grid-cols-2">
					<form.AppField name="selectionType">
						{(field) => (
							<field.SelectField label="Tipe Seleksi" options={[...SELECTION_TYPE_OPTIONS]} />
						)}
					</form.AppField>
					<div className="flex items-end pb-1">
						<form.AppField name="isRequired">
							{(field) => <field.SwitchField label="Wajib dipilih" className="w-full" />}
						</form.AppField>
					</div>
					<form.AppField name="minSelect">
						{(field) => <field.NumberField label="Min Pilih" min={0} />}
					</form.AppField>
					<form.AppField name="maxSelect">
						{(field) => (
							<field.NumberField label="Max Pilih" min={1} description="Kosongkan = tanpa batas" />
						)}
					</form.AppField>
				</div>

				<form.AppField name="options" mode="array">
					{(optionsField) => (
						<LineItemEditor
							label="Opsi"
							addLabel="Tambah Opsi"
							rows={optionsField.state.value}
							createRow={() =>
								createModifierOption(nextModifierSortOrder(optionsField.state.value))
							}
							onAdd={(row) => optionsField.pushValue(row)}
							onRemove={(index) => optionsField.removeValue(index)}
							errors={optionsField.state.meta.errors}
							fieldCount={3}
							minRows={1}
							emptyMessage="Belum ada opsi. Tambahkan minimal satu opsi."
							renderFields={(_, index) => (
								<>
									<form.AppField name={`options[${index}].name`}>
										{(field) => <field.TextField label="Nama" placeholder="e.g. Reguler" />}
									</form.AppField>
									<form.AppField name={`options[${index}].priceAdjustment`}>
										{(field) => (
											<field.TextField
												label="Harga (+/-)"
												placeholder="0"
												inputMode="decimal"
												className="text-right font-mono tabular-nums"
											/>
										)}
									</form.AppField>
									<form.AppField name={`options[${index}].sortOrder`}>
										{(field) => <field.NumberField label="Urutan" min={0} />}
									</form.AppField>
									<div className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2 lg:col-span-3">
										<form.AppField name={`options[${index}].isDefault`}>
											{(field) => <field.SwitchField label="Default" />}
										</form.AppField>
										<form.AppField name={`options[${index}].isActive`}>
											{(field) => <field.SwitchField label="Aktif" />}
										</form.AppField>
									</div>
								</>
							)}
						/>
					)}
				</form.AppField>
			</fieldset>
		</div>
	)
}
