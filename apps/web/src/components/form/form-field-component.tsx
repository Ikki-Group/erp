import { useFieldContext } from './form-hook-context'
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from './form-tanstack'
import type { ComponentProps } from 'react'
import type { Option, StringOrNumber } from '@/types/common'
import type { DataComboboxProps } from '@/components/ui/data-combobox'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldContent } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { InputPassword } from '@/components/ui/input-password'
import { DataCombobox } from '@/components/ui/data-combobox'

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

function FieldInput(props: ComponentProps<typeof Input>) {
  const field = useFieldContext<string>()

  return (
    <FieldControl>
      <Input
        value={field.state.value}
        onChange={e => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        {...props}
      />
    </FieldControl>
  )
}

function FieldInputPassword(props: ComponentProps<typeof InputPassword>) {
  const field = useFieldContext<string>()

  return (
    <FieldControl>
      <InputPassword
        value={field.state.value}
        onChange={e => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        {...props}
      />
    </FieldControl>
  )
}

function FieldTextarea(props: ComponentProps<typeof Textarea>) {
  const field = useFieldContext<string>()
  return (
    <FieldControl>
      <Textarea
        value={field.state.value}
        onChange={e => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        {...props}
      />
    </FieldControl>
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
    <Field orientation='horizontal' className={className}>
      <FieldControl>
        <Checkbox
          name={field.name}
          checked={field.state.value}
          onBlur={field.handleBlur}
          onCheckedChange={checked => field.handleChange(checked === true)}
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
    <Field orientation='horizontal' className={className}>
      <FieldContent>
        <FieldLabel required={required}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      <FieldControl>
        <Switch
          onCheckedChange={checked => field.handleChange(checked)}
          checked={field.state.value}
          onBlur={field.handleBlur}
          name={field.name}
          {...props}
        />
      </FieldControl>
    </Field>
  )
}

interface FieldSelectProps<TValue extends StringOrNumber>
  extends
    Omit<ComponentProps<typeof Select>, 'value' | 'onValueChange'>,
    BaseFieldProps {
  placeholder?: string
  options: Array<Option<TValue>>
}

function FieldSelect<TValue extends StringOrNumber = string>({
  placeholder,
  options,
  label,
  description,
  required,
  className,
  ...props
}: FieldSelectProps<TValue>) {
  const field = useFieldContext<TValue | null>()

  return (
    <FieldBase
      label={label}
      description={description}
      required={required}
      className={className}
    >
      <Select
        value={field.state.value}
        onValueChange={val => field.handleChange(val as TValue)}
        items={options}
        {...props}
      >
        <FieldControl>
          <Select.Trigger>
            <Select.Value placeholder={placeholder} />
          </Select.Trigger>
        </FieldControl>
        <Select.Content>
          {options.length === 0 && (
            <Select.Item disabled>Tidak ada opsi</Select.Item>
          )}
          {options.map(option => (
            <Select.Item key={String(option.value)} value={option.value}>
              {option.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </FieldBase>
  )
}

interface FieldComboboxProps<TItem>
  extends
    Omit<DataComboboxProps<TItem>, 'value' | 'onValueChange'>,
    BaseFieldProps {}

function FieldCombobox<TItem>({
  label,
  description,
  required,
  className,
  ...props
}: FieldComboboxProps<TItem>) {
  const field = useFieldContext<string | null>()

  return (
    <FieldBase
      label={label}
      description={description}
      required={required}
      className={className}
    >
      <FieldControl>
        <DataCombobox<TItem>
          value={field.state.value}
          onValueChange={val => field.handleChange(val)}
          {...props}
        />
      </FieldControl>
    </FieldBase>
  )
}

export {
  FieldBase,
  FieldInput,
  FieldInputPassword,
  FieldCheckbox,
  FieldSwitch,
  FieldSelect,
  FieldTextarea,
  FieldCombobox,
}
