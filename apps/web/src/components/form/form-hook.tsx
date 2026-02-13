import { createFormHook } from '@tanstack/react-form'
import { fieldContext, formContext } from './form-hook-context'
import {
  FieldLabel,
  FieldControl,
  FieldDescription,
  FieldMessage,
  FormItem,
} from './form-tanstack'
import { FieldInput } from './form-field-component'

export const { useAppForm } = createFormHook({
  fieldComponents: {
    Label: FieldLabel,
    Control: FieldControl,
    Description: FieldDescription,
    Message: FieldMessage,

    // Custom components
    Input: FieldInput,
  },
  formComponents: {
    Item: FormItem,
  },
  fieldContext,
  formContext,
})
