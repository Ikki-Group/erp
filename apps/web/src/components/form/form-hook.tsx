import { createFormHook } from '@tanstack/react-form'

import { FieldGroup, FieldLegend, FieldSet } from '../ui/field'
import { Form, FormDialogActions, FormSimpleActions } from './form-component'
import {
	FieldBase,
	FieldCheckbox,
	FieldCombobox,
	FieldCurrency,
	FieldDatePicker,
	FieldInput,
	FieldInputPassword,
	FieldNumber,
	FieldSelect,
	FieldSwitch,
	FieldTextarea,
	FieldDateRangePicker,
} from './form-field-component'
import { fieldContext, formContext } from './form-hook-context'
import {
	Field,
	FieldControl,
	FieldDescription,
	FieldError,
	FieldLabel,
	FormItem,
} from './form-tanstack'

export const { useAppForm, withFieldGroup, withForm, useTypedAppFormContext } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		// Primitive
		FieldSet,
		FieldLegend,
		FieldGroup,

		// Enhanced
		Field,
		Label: FieldLabel,
		Control: FieldControl,
		Description: FieldDescription,
		Error: FieldError,

		// Custom components
		Base: FieldBase,
		Input: FieldInput,
		InputPassword: FieldInputPassword,
		Number: FieldNumber,
		Currency: FieldCurrency,
		DatePicker: FieldDatePicker,
		DateRangePicker: FieldDateRangePicker,
		Checkbox: FieldCheckbox,
		Switch: FieldSwitch,
		Select: FieldSelect,
		Textarea: FieldTextarea,
		Combobox: FieldCombobox,

		// Templates
		FieldBase: FieldBase,
		FieldInput: FieldInput,
		FieldSelect: FieldSelect,
		FieldCheckbox: FieldCheckbox,
		FieldSwitch: FieldSwitch,
		FieldDatePicker: FieldDatePicker,
		FieldDateRangePicker: FieldDateRangePicker,
	},
	formComponents: {
		Form: Form,
		Item: FormItem,
		SimpleActions: FormSimpleActions,
		DialogActions: FormDialogActions,
	},
})
