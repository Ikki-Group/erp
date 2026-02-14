import { ComponentProps } from 'react'
import { Input } from '../ui/input'
import { useFieldContext } from './form-hook-context'
import {
  FieldControl,
  FieldDescription,
  Field,
  FieldLabel,
  FieldError,
} from './form-tanstack'

interface FieldBaseProps extends Omit<
  ComponentProps<typeof Field>,
  'label' | 'description'
> {
  label: string
  required?: boolean
  description?: string
}

function FieldBase({ label, required, description, children }: FieldBaseProps) {
  return (
    <Field>
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError />
    </Field>
  )
}

function FieldInput({ ...props }: ComponentProps<typeof Input>) {
  const field = useFieldContext<string>()

  return (
    <FieldControl>
      <Input
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        {...props}
      />
    </FieldControl>
  )
}

export { FieldBase, FieldInput }
