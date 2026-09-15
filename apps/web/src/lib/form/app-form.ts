import { createFormHook } from '@tanstack/react-form'

import { ComboboxField } from './fields/combobox-field.tsx'
import { DatePickerField } from './fields/date-picker-field.tsx'
import { IdSelectField } from './fields/id-select-field.tsx'
import { NumberField } from './fields/number-field.tsx'
import { SelectField } from './fields/select-field.tsx'
import { SwitchField } from './fields/switch-field.tsx'
import { TextField } from './fields/text-field.tsx'
import { TextareaField } from './fields/textarea-field.tsx'
import { FormError } from './form-error.tsx'
import { fieldContext, formContext } from './contexts.ts'

/**
 * The app's one form hook. Every field component here is pre-bound to
 * `fieldContext`/`formContext`, so a form body is just JSX — no prop
 * plumbing for `value`/`onChange`/`error` anywhere:
 *
 * ```tsx
 * const form = useAppForm({ defaultValues, validators: { onChange: Dto }, onSubmit })
 * <form.AppField name="name">{(field) => <field.TextField label="Name" />}</form.AppField>
 * ```
 *
 * Prefer `useEntityForm` (`@/lib/form/use-entity-form`) for the common
 * create/update-against-a-mutation case — it wraps this hook with the
 * submit/error contract every entity form needs. Reach for `useAppForm`
 * directly only for forms with no backing mutation (e.g. multi-step local
 * state, POS cart lines).
 */
export const { useAppForm, withForm } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		TextField,
		TextareaField,
		SelectField,
		IdSelectField,
		ComboboxField,
		NumberField,
		SwitchField,
		DatePickerField,
	},
	formComponents: {
		FormError,
	},
})
