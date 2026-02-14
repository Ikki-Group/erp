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
import { FieldInput } from './form-field-component'
import { Form } from './form-component'

export const { useAppForm } = createFormHook({
  fieldComponents: {
    Field: Field,
    Label: FieldLabel,
    Control: FieldControl,
    Description: FieldDescription,
    Error: FieldError,

    // Custom components
    Input: FieldInput,
  },
  formComponents: {
    Form: Form,
    Item: FormItem,
  },
  fieldContext,
  formContext,
})
