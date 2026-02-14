import { ComponentProps } from 'react'
import { Input } from '../ui/input'
import { Checkbox } from '../ui/checkbox'
import { Switch } from '../ui/switch'
import { useFieldContext } from './form-hook-context'
import {
  FieldControl,
  FieldDescription,
  Field,
  FieldLabel,
  FieldError,
} from './form-tanstack'
import { Select } from '../ui/select'
import { Option, StringOrNumber } from '@/types/common'

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

function FieldCheckbox({ ...props }: ComponentProps<typeof Checkbox>) {
  const field = useFieldContext<boolean>()

  return (
    <FieldControl>
      <Checkbox
        name={field.name}
        checked={field.state.value}
        onBlur={field.handleBlur}
        onCheckedChange={(checked) => field.handleChange(checked === true)}
        {...props}
      />
    </FieldControl>
  )
}

function FieldSwitch({ ...props }: ComponentProps<typeof Switch>) {
  const field = useFieldContext<boolean>()

  return (
    <FieldControl>
      <Switch
        name={field.name}
        checked={field.state.value}
        onBlur={field.handleBlur}
        onCheckedChange={(checked) => field.handleChange(checked === true)}
        {...props}
      />
    </FieldControl>
  )
}

interface FieldSelectProps<V extends StringOrNumber> {
  placeholder?: string
  options: Option<V>[]
}

function FieldSelect<V extends StringOrNumber = string>({
  placeholder,
  options,
}: FieldSelectProps<V>) {
  const field = useFieldContext<V | null>()

  return (
    <FieldControl>
      <Select
        value={field.state.value}
        onValueChange={(val) => field.handleChange(val)}
      >
        <Select.Trigger className="w-full">
          <Select.Value placeholder={placeholder} />
        </Select.Trigger>
        <Select.Content>
          {options.map((option) => (
            <Select.Item key={String(option.value)} value={option.value}>
              {option.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </FieldControl>
  )
}

export { FieldBase, FieldInput, FieldCheckbox, FieldSwitch, FieldSelect }
