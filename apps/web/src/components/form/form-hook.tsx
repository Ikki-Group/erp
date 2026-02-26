import { createFormHook } from '@tanstack/react-form'
import { fieldContext, formContext } from './form-hook-context'
import {
  FieldLabel,
  FieldControl,
  FieldDescription,
  FieldError,
  FormItem,
  Field,
} from './form-tanstack'
import {
  FieldBase,
  FieldInput,
  FieldCheckbox,
  FieldSwitch,
  FieldSelect,
  FieldTextarea,
  FieldInputPassword,
} from './form-field-component'
import { Form, FormSimpleActions, FormDialogActions } from './form-component'
import { FieldSet, FieldLegend, FieldGroup } from '../ui/field'

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
