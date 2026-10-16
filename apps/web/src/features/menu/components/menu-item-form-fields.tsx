import type { PinnedEditorLocationScope } from '@/lib/form/use-editor-location-scope.ts'

import { InlineAlert } from '@/components/shared/inline-alert.tsx'

import { Button } from '@/components/ui/button'

import type { MenuCategoryRefDto } from '../dto/index.ts'
import { MENU_ITEM_STATUS_FIELD_OPTIONS } from '../menu-item-form-values.ts'
import type { MenuItemEditorForm } from '../use-menu-item-editor.ts'
import { MenuCategoryLookupField } from './menu-category-lookup-field.tsx'

interface MenuItemFormFieldsProps {
	form: MenuItemEditorForm
	/** Session location; its categories are the only eligible choices. */
	scope: PinnedEditorLocationScope
	/** The category the record already has (edit only), resolved by the item detail. */
	knownCategory?: MenuCategoryRefDto | null
	canReadCategories: boolean
	readOnly: boolean
}

export function MenuItemFormFields({
	form,
	scope,
	knownCategory,
	canReadCategories,
	readOnly,
}: MenuItemFormFieldsProps) {
	const { location, isCurrent, restore } = scope
	// While the header shows another location, choices are frozen (not cleared) so the draft survives.
	const frozen = !isCurrent

	return (
		<div className="grid gap-4">
			{isCurrent ? (
				<InlineAlert variant="info">
					Menu item ini dikelola untuk lokasi <strong>{location.name}</strong>. Kategori yang dapat
					dipilih mengikuti lokasi tersebut.
				</InlineAlert>
			) : (
				<InlineAlert variant="warning" title="Lokasi aktif telah berubah">
					<p>
						Draf ini tetap untuk lokasi <strong>{location.name}</strong>. Pilihan kategori dikunci
						dan menu item tidak dapat disimpan sampai lokasi tersebut dipilih kembali.
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
				<div className="grid gap-4 sm:grid-cols-2">
					<form.AppField name="sku">
						{(field) => <field.TextField label="SKU" placeholder="e.g. MNU-001" />}
					</form.AppField>
					<form.AppField name="status">
						{(field) => (
							<field.SelectField label="Status" options={MENU_ITEM_STATUS_FIELD_OPTIONS} />
						)}
					</form.AppField>
				</div>

				<form.AppField name="name">
					{(field) => <field.TextField label="Nama" placeholder="e.g. Es Kopi Susu" />}
				</form.AppField>

				<div className="grid gap-4 sm:grid-cols-2">
					<form.AppField name="basePrice">
						{(field) => <field.CurrencyField label="Harga Dasar" />}
					</form.AppField>
					<form.AppField name="categoryId">
						{() => (
							<MenuCategoryLookupField
								label="Kategori"
								locationId={location.id}
								known={knownCategory}
								disabled={frozen || !canReadCategories}
								description={
									canReadCategories
										? 'Kosongkan untuk menu item tanpa kategori.'
										: 'Anda tidak memiliki izin melihat kategori; kategori saat ini dipertahankan.'
								}
							/>
						)}
					</form.AppField>
				</div>
			</fieldset>
		</div>
	)
}
