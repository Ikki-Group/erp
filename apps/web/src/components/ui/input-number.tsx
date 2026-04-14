import * as React from 'react'

import { cn } from '@/lib/utils'

import { Input } from './input'

export interface InputNumberProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
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
 * Format a numeric value using Indonesian number formatting (e.g., "1.234,56").
 *
 * Converts string inputs by removing non-numeric characters except leading `-` and the decimal separator, then formats the resulting number. For `null`, `undefined`, empty string, or unparseable input, returns an empty string.
 *
 * @param value - The number or numeric string to format. Strings are sanitized before parsing.
 * @param allowDecimal - Whether to allow fractional digits in the output.
 * @param decimalScale - Maximum number of fraction digits to include when decimals are allowed.
 * @returns The formatted number string in `id-ID` locale, or an empty string for absent or invalid input.
 */
function formatNumber(value: number | string | null | undefined, allowDecimal: boolean, decimalScale: number): string {
  if (value === null || value === undefined || value === '') return ''

  const num = typeof value === 'string' ? Number(value.replaceAll(/[^0-9.-]/g, '')) : value
  if (isNaN(num)) return ''

  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: allowDecimal ? decimalScale : 0,
    useGrouping: true,
  }).format(num)
}

/**
 * Convert an Indonesian-formatted numeric string (e.g., "1.234,56") into a dot-decimal numeric string ("1234.56").
 *
 * @param value - Numeric string using dots as thousands separators and a comma as the decimal separator
 * @returns The normalized numeric string with thousands separators removed and the decimal comma replaced by a dot
 */
function parseNumber(value: string): string {
  return value
    .replaceAll('.', '') // Remove thousands separator
    .replaceAll(',', '.') // Replace decimal separator
}

/**
 * A controlled numeric text input that displays values formatted for the Indonesian locale while allowing natural in-progress typing.
 *
 * The component accepts a numeric `value` and emits parsed numeric values (or `null`) via `onChange`; while the field is focused it preserves the raw typed string to avoid disruptive reformatting, and when not focused it shows the localized formatted number.
 *
 * @param value - The current numeric value to display; use `null` for an empty field.
 * @param onChange - Callback invoked with the parsed number or `null` when the input changes.
 * @param allowDecimal - Whether decimals are permitted (defaults to `true`).
 * @param decimalScale - Maximum number of decimal places allowed when typing (defaults to `2`).
 * @param max - Optional upper bound for allowed values; used only to determine whether negative input is permitted indirectly.
 * @param min - Optional lower bound for allowed values; used only to determine whether negative input is permitted indirectly.
 * @param ref - Ref forwarded to the underlying input element.
 * @returns The rendered Input element configured for numeric entry with localized formatting and typing-aware behavior.
 */
export function InputNumber({
  className,
  value,
  onChange,
  allowDecimal = true,
  decimalScale = 2,
  // oxlint-disable-next-line no-unused-vars
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

      const numericValue = cleanRaw === '' || cleanRaw === '-' ? null : Number(cleanRaw)

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
      type="text"
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
