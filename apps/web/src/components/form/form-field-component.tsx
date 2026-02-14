import { ComponentProps } from 'react'
import { Checkbox } from '../ui/checkbox'
import { FieldContent } from '../ui/field'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { Switch } from '../ui/switch'
import { Textarea } from '../ui/textarea'
import { Option, StringOrNumber } from '@/types/common'
import { useFieldContext } from './form-hook-context'
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from './form-tanstack'

interface BaseFieldProps {
  label?: string
  description?: string
  required?: boolean
  className?: string
}

interface FieldBaseProps
  extends BaseFieldProps, Omit<ComponentProps<typeof Field>, 'children'> {
  children: React.ReactNode
}

function FieldBase({
  label,
  required,
  description,
  children,
  className,
  ...props
}: FieldBaseProps) {
  return (
    <Field className={className} {...props}>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      {children}
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError />
    </Field>
  )
}

interface FieldInputProps
  extends ComponentProps<typeof Input>, BaseFieldProps {}

function FieldInput({
  label,
  description,
  required,
  className,
  ...props
}: FieldInputProps) {
  const field = useFieldContext<string>()

  return (
    <FieldBase
      label={label}
      description={description}
      required={required}
      className={className}
    >
      <FieldControl>
        <Input
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          {...props}
        />
      </FieldControl>
    </FieldBase>
  )
}

interface FieldTextareaProps
  extends ComponentProps<typeof Textarea>, BaseFieldProps {}

function FieldTextarea({
  label,
  description,
  required,
  className,
  ...props
}: FieldTextareaProps) {
  const field = useFieldContext<string>()

  return (
    <FieldBase
      label={label}
      description={description}
      required={required}
      className={className}
    >
      <FieldControl>
        <Textarea
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          {...props}
        />
      </FieldControl>
    </FieldBase>
  )
}

interface FieldCheckboxProps
  extends Omit<ComponentProps<typeof Checkbox>, 'className'>, BaseFieldProps {}

function FieldCheckbox({
  label,
  description,
  required,
  className,
  ...props
}: FieldCheckboxProps) {
  const field = useFieldContext<boolean>()

  return (
    <Field orientation="horizontal" className={className}>
      <FieldControl>
        <Checkbox
          name={field.name}
          checked={field.state.value}
          onBlur={field.handleBlur}
          onCheckedChange={(checked) => field.handleChange(checked === true)}
          {...props}
        />
      </FieldControl>
      <FieldContent>
        {label && <FieldLabel required={required}>{label}</FieldLabel>}
        {description && <FieldDescription>{description}</FieldDescription>}
        <FieldError />
      </FieldContent>
    </Field>
  )
}

interface FieldSwitchProps
  extends Omit<ComponentProps<typeof Switch>, 'className'>, BaseFieldProps {}

function FieldSwitch({
  label,
  description,
  required,
  className,
  ...props
}: FieldSwitchProps) {
  const field = useFieldContext<boolean>()

  return (
    <Field orientation="horizontal" className={className}>
      <FieldContent>
        <FieldLabel required={required}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      <FieldControl>
        <Switch
          onCheckedChange={(checked) => field.handleChange(checked)}
          checked={field.state.value}
          onBlur={field.handleBlur}
          name={field.name}
          {...props}
        />
      </FieldControl>
    </Field>
  )
}

interface FieldSelectProps<V extends StringOrNumber>
  extends
    Omit<ComponentProps<typeof Select>, 'value' | 'onValueChange'>,
    BaseFieldProps {
  placeholder?: string
  options: Option<V>[]
}

function FieldSelect<V extends StringOrNumber = string>({
  placeholder,
  options,
  label,
  description,
  required,
  className,
  ...props
}: FieldSelectProps<V>) {
  const field = useFieldContext<V | null>()

  return (
    <FieldBase
      label={label}
      description={description}
      required={required}
      className={className}
    >
      <Select
        value={field.state.value}
        onValueChange={(val) => field.handleChange(val as any)}
        {...props}
      >
        <FieldControl>
          <Select.Trigger>
            <Select.Value placeholder={placeholder} />
          </Select.Trigger>
        </FieldControl>
        <Select.Content>
          {options.map((option) => (
            <Select.Item key={String(option.value)} value={option.value}>
              {option.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </FieldBase>
  )
}

export {
  FieldBase,
  FieldInput,
  FieldCheckbox,
  FieldSwitch,
  FieldSelect,
  FieldTextarea,
}
