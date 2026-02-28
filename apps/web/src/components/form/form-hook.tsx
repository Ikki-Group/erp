import { createFormHook } from '@tanstack/react-form'
import { FieldGroup, FieldLegend, FieldSet } from '../ui/field'
import { fieldContext, formContext } from './form-hook-context'
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FormItem,
} from './form-tanstack'
import {
  FieldBase,
  FieldCheckbox,
  FieldCombobox,
  FieldInput,
  FieldInputPassword,
  FieldSelect,
  FieldSwitch,
  FieldTextarea,
} from './form-field-component'
import { Form, FormDialogActions, FormSimpleActions } from './form-component'

export const { useAppForm, withFieldGroup, withForm, useTypedAppFormContext } =
  createFormHook({
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
      Checkbox: FieldCheckbox,
      Switch: FieldSwitch,
      Select: FieldSelect,
      Textarea: FieldTextarea,
      Combobox: FieldCombobox,

      // Templates
      FieldBase: FieldBase,
    },
    formComponents: {
      Form: Form,
      Item: FormItem,
      SimpleActions: FormSimpleActions,
      DialogActions: FormDialogActions,
    },
    fieldContext,
    formContext,
  })
