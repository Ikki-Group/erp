import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import type * as React from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import type { DataComboboxProps } from '@/components/ui/data-combobox'
import { DataCombobox } from '@/components/ui/data-combobox'
import { FieldContent } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputCurrency } from '@/components/ui/input-currency'
import { InputNumber } from '@/components/ui/input-number'
import { InputPassword } from '@/components/ui/input-password'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Option, StringOrNumber } from '@/types/common'

import { useFieldContext } from './form-hook-context'
import { Field, FieldControl, FieldDescription, FieldError, FieldLabel } from './form-tanstack'

interface BaseFieldProps {
  label?: string
  description?: string
  required?: boolean
  className?: string
}

interface FieldBaseProps extends BaseFieldProps, Omit<React.ComponentProps<typeof Field>, 'children'> {
  children: React.ReactNode
}

function FieldBase({
  label,
  required,
  description,
  children,
  className,
  orientation,
  ...props
}: FieldBaseProps) {
  return (
    <Field className={className} orientation={orientation} {...props}>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      {children}
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError />
    </Field>
  )
}

function FieldInput({
  label,
  description,
  required,
  orientation,
  className,
  ...props
}: React.ComponentProps<typeof Input> & BaseFieldProps & { orientation?: FieldBaseProps['orientation'] }) {
  const field = useFieldContext<string>()

  return (
    <FieldBase
      label={label}
      description={description}
      required={required}
      orientation={orientation}
      className={className}
    >
      <FieldControl>
        <Input
          value={field.state.value}
          onChange={(e) => {
            field.handleChange(e.target.value)
          }}
          onBlur={field.handleBlur}
          {...props}
        />
      </FieldControl>
    </FieldBase>
  )
}

function FieldInputPassword({
  label,
  description,
  required,
  orientation,
  className,
  ...props
}: React.ComponentProps<typeof InputPassword> & BaseFieldProps & { orientation?: FieldBaseProps['orientation'] }) {
  const field = useFieldContext<string>()

  return (
    <FieldBase
      label={label}
      description={description}
      required={required}
      orientation={orientation}
      className={className}
    >
      <FieldControl>
        <InputPassword
          value={field.state.value}
          onChange={(e) => {
            field.handleChange(e.target.value)
          }}
          onBlur={field.handleBlur}
          {...props}
        />
      </FieldControl>
    </FieldBase>
  )
}

function FieldTextarea({
  label,
  description,
  required,
  orientation,
  className,
  ...props
}: React.ComponentProps<typeof Textarea> & BaseFieldProps & { orientation?: FieldBaseProps['orientation'] }) {
  const field = useFieldContext<string>()
  return (
    <FieldBase
      label={label}
      description={description}
      required={required}
      orientation={orientation}
      className={className}
    >
      <FieldControl>
        <Textarea
          value={field.state.value}
          onChange={(e) => {
            field.handleChange(e.target.value)
          }}
          onBlur={field.handleBlur}
          {...props}
        />
      </FieldControl>
    </FieldBase>
  )
}

interface FieldCheckboxProps extends Omit<React.ComponentProps<typeof Checkbox>, 'className'>, BaseFieldProps {
  orientation?: FieldBaseProps['orientation']
}

function FieldCheckbox({
  label,
  description,
  required,
  className,
  orientation = 'horizontal',
  ...props
}: FieldCheckboxProps) {
  const field = useFieldContext<boolean>()

  return (
    <Field orientation={orientation} className={className}>
      <FieldControl>
        <Checkbox
          name={field.name}
          checked={field.state.value}
          onBlur={field.handleBlur}
          onCheckedChange={(checked) => {
            field.handleChange(!!checked)
          }}
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

interface FieldSwitchProps extends Omit<React.ComponentProps<typeof Switch>, 'className'>, BaseFieldProps {
  orientation?: FieldBaseProps['orientation']
}

function FieldSwitch({
  label,
  description,
  required,
  className,
  orientation = 'horizontal',
  ...props
}: FieldSwitchProps) {
  const field = useFieldContext<boolean>()

  return (
    <Field orientation={orientation} className={className}>
      <FieldContent>
        <FieldLabel required={required}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      <FieldControl>
        <Switch
          onCheckedChange={(checked) => {
            field.handleChange(checked)
          }}
          checked={field.state.value}
          onBlur={field.handleBlur}
          name={field.name}
          {...props}
        />
      </FieldControl>
      <FieldError />
    </Field>
  )
}

interface FieldSelectProps<TValue extends StringOrNumber>
  extends Omit<React.ComponentProps<typeof Select>, 'value' | 'onValueChange' | 'children'>,
    BaseFieldProps {
  placeholder?: string
  options: Array<Option<TValue>>
  orientation?: FieldBaseProps['orientation']
}

/**
 * Renders a select field connected to the current form field context.
 */
function FieldSelect<TValue extends StringOrNumber = string>({
  placeholder,
  options,
  label,
  description,
  required,
  className,
  orientation,
  ...props
}: FieldSelectProps<TValue>) {
  const field = useFieldContext<TValue | null>()

  return (
    <FieldBase
      label={label}
      description={description}
      required={required}
      orientation={orientation}
      className={className}
    >
      <Select
        value={field.state.value}
        onValueChange={(val) => {
          field.handleChange(val as TValue)
        }}
        items={options}
        {...props}
      >
        <FieldControl>
          <Select.Trigger>
            <Select.Value placeholder={placeholder} />
          </Select.Trigger>
        </FieldControl>
        <Select.Content alignItemWithTrigger={false}>
          {options.length === 0 && <Select.Item disabled>Tidak ada opsi</Select.Item>}
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

interface FieldComboboxProps<TItem>
  extends Omit<DataComboboxProps<TItem>, 'value' | 'onValueChange'>,
    BaseFieldProps {
  orientation?: FieldBaseProps['orientation']
}

function FieldCombobox<TItem>({
  label,
  description,
  required,
  className,
  onItemSelect,
  orientation,
  ...props
}: FieldComboboxProps<TItem>) {
  const field = useFieldContext<string | null>()

  return (
    <FieldBase
      label={label}
      description={description}
      required={required}
      orientation={orientation}
      className={className}
    >
      <FieldControl>
        <DataCombobox<TItem>
          value={field.state.value}
          onValueChange={(val) => {
            field.handleChange(val)
          }}
          onItemSelect={onItemSelect}
          {...props}
        />
      </FieldControl>
    </FieldBase>
  )
}

/* -------------------------------------------------------------------------- */
/*  FieldNumber                                                               */
/* -------------------------------------------------------------------------- */

interface FieldNumberProps extends React.ComponentProps<typeof InputNumber>, BaseFieldProps {
  orientation?: FieldBaseProps['orientation']
}

function FieldNumber({ label, description, required, className, orientation, ...props }: FieldNumberProps) {
  const field = useFieldContext<number | null>()

  return (
    <FieldBase
      label={label}
      description={description}
      required={required}
      orientation={orientation}
      className={className}
    >
      <FieldControl>
        <InputNumber
          value={field.state.value}
          onChange={(val) => {
            field.handleChange(val)
          }}
          onBlur={field.handleBlur}
          {...props}
        />
      </FieldControl>
    </FieldBase>
  )
}

/* -------------------------------------------------------------------------- */
/*  FieldCurrency                                                             */
/* -------------------------------------------------------------------------- */

interface FieldCurrencyProps extends React.ComponentProps<typeof InputCurrency>, BaseFieldProps {
  orientation?: FieldBaseProps['orientation']
}

function FieldCurrency({ label, description, required, className, orientation, ...props }: FieldCurrencyProps) {
  const field = useFieldContext<number | null>()

  return (
    <FieldBase
      label={label}
      description={description}
      required={required}
      orientation={orientation}
      className={className}
    >
      <FieldControl>
        <InputCurrency
          value={field.state.value}
          onChange={(val) => {
            field.handleChange(val)
          }}
          onBlur={field.handleBlur}
          {...props}
        />
      </FieldControl>
    </FieldBase>
  )
}

/* -------------------------------------------------------------------------- */
/*  FieldDatePicker                                                           */
/* -------------------------------------------------------------------------- */

interface FieldDatePickerProps extends BaseFieldProps {
  placeholder?: string
  disabled?: boolean
  /** Date format string (date-fns) */
  dateFormat?: string
  orientation?: FieldBaseProps['orientation']
}

function FieldDatePicker({
  label,
  description,
  required,
  className,
  orientation,
  placeholder = 'Pilih tanggal',
  disabled,
  dateFormat = 'dd-MM-yyyy',
}: FieldDatePickerProps) {
  const field = useFieldContext<Date | null>()

  return (
    <FieldBase
      label={label}
      description={description}
      required={required}
      orientation={orientation}
      className={className}
    >
      <Popover>
        <FieldControl>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !field.state.value && 'text-muted-foreground',
                )}
                disabled={disabled}
              />
            }
          >
            <CalendarIcon className="mr-2 size-4" />
            {field.state.value ? format(field.state.value, dateFormat) : placeholder}
          </PopoverTrigger>
        </FieldControl>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={field.state.value ?? undefined}
            onSelect={(date) => {
              field.handleChange(date ?? null)
            }}
          />
        </PopoverContent>
      </Popover>
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
  FieldNumber,
  FieldCurrency,
  FieldDatePicker,
}
