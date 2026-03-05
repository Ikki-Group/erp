import * as React from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'

export interface InputNumberProps extends Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange'
> {
  value?: number | null
  onChange?: (value: number | null) => void
  /**
   * Whether to allow decimal values.
   * @default true
   */
  allowDecimal?: boolean
  /**
   * Number of decimal places allowed.
   * @default 2
   */
  decimalScale?: number
  /**
   * Maximum value allowed.
   */
  max?: number
  /**
   * Minimum value allowed.
   */
  min?: number
  ref?: React.Ref<HTMLInputElement>
}

export function InputNumber({
  className,
  value,
  onChange,
  allowDecimal = true,
  decimalScale = 2,
  max,
  min,
  ref,
  ...props
}: InputNumberProps) {
  const [inputValue, setInputValue] = React.useState<string>(
    value?.toString() ?? ''
  )
  const prevValueRef = React.useRef(value)

  if (value !== prevValueRef.current) {
    const stringValue = value?.toString() ?? ''
    if (stringValue !== inputValue) {
      setInputValue(stringValue)
    }
    prevValueRef.current = value
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value

    // Replace comma with dot for decimal separator consistency
    val = val.replace(',', '.')

    // Allow only numbers and one decimal point
    const regex = allowDecimal ? /^-?\d*\.?\d*$/ : /^-?\d*$/

    if (
      val === '' ||
      (val === '-' && (min === undefined || min < 0)) ||
      regex.test(val)
    ) {
      // Limit decimal places
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (allowDecimal && val.includes('.') && decimalScale !== undefined) {
        const parts = val.split('.')
        const decimalPart = parts[1]
        if (decimalPart && decimalPart.length > decimalScale) return
      }

      setInputValue(val)

      const numericValue = val === '' || val === '-' ? null : Number(val)

      if (onChange) {
        onChange(numericValue)
      }
    }
  }

  return (
    <Input
      {...props}
      ref={ref}
      type='text'
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      className={cn('tabular-nums', className)}
      value={inputValue}
      onChange={handleChange}
    />
  )
}

InputNumber.displayName = 'InputNumber'
