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

/**
 * Formats a number to Indonesian standard: 1.234,56
 */
function formatNumber(
  value: number | string | null | undefined,
  allowDecimal: boolean,
  decimalScale: number
): string {
  if (value === null || value === undefined || value === '') return ''

  const num =
    typeof value === 'string' ? Number(value.replace(/[^0-9.-]/g, '')) : value
  if (isNaN(num)) return ''

  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: allowDecimal ? decimalScale : 0,
    useGrouping: true,
  }).format(num)
}

/**
 * Parses Indonesian formatted string to standard number string: "1.234,56" -> "1234.56"
 */
function parseNumber(value: string): string {
  return value
    .replace(/\./g, '') // Remove thousands separator
    .replace(/,/g, '.') // Replace decimal separator
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
  // Local state to track the value being typed
  const [isTyping, setIsTyping] = React.useState(false)
  const [typingValue, setTypingValue] = React.useState('')

  // Determine which value to display
  const displayValue = React.useMemo(() => {
    if (isTyping) return typingValue
    return formatNumber(value, allowDecimal, decimalScale)
  }, [isTyping, typingValue, value, allowDecimal, decimalScale])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value

    // Allow typing leading minus
    if (raw === '-' && (min === undefined || min < 0)) {
      setTypingValue('-')
      setIsTyping(true)
      return
    }

    // Basic cleaning: allow digits, dots (will be removed), and one comma (will be changed to dot)
    const cleanRaw = parseNumber(raw)

    // Only proceed if it looks like a valid partial number
    const regex = allowDecimal ? /^-?\d*\.?\d*$/ : /^-?\d*$/
    if (cleanRaw === '' || regex.test(cleanRaw)) {
      // Check decimal scale
      if (allowDecimal && cleanRaw.includes('.')) {
        const parts = cleanRaw.split('.')
        if (parts[1] && parts[1].length > decimalScale) return
      }

      const numericValue =
        cleanRaw === '' || cleanRaw === '-' ? null : Number(cleanRaw)

      setTypingValue(raw)
      setIsTyping(true)

      if (onChange) {
        onChange(numericValue)
      }
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsTyping(false)
    setTypingValue('')
    props.onBlur?.(e)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsTyping(true)
    setTypingValue(formatNumber(value, allowDecimal, decimalScale))
    props.onFocus?.(e)
  }

  return (
    <Input
      {...props}
      ref={ref}
      type='text'
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      className={cn('tabular-nums', className)}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  )
}

InputNumber.displayName = 'InputNumber'
