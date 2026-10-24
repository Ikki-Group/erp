import * as React from 'react'

import { cn } from '@/lib/utils'

import { InputGroup, InputGroupAddon } from './input-group'
import type { InputNumberProps } from './input-number'
import { InputNumber } from './input-number'

export interface InputCurrencyProps extends InputNumberProps {
	/**
	 * Currency symbol to display.
	 * @default "Rp"
	 */
	currency?: string
	ref?: React.Ref<HTMLInputElement>
}

export function InputCurrency({
	className,
	currency = 'Rp',
	allowDecimal = false,
	ref,
	...props
}: InputCurrencyProps) {
	return (
		<InputGroup className={cn('focus-within:ring-3', className)}>
			<InputGroupAddon className="bg-muted/50 border-r px-3 select-none font-semibold text-xs text-muted-foreground/80">
				{currency}
			</InputGroupAddon>
			<InputNumber
				{...props}
				ref={ref}
				allowDecimal={allowDecimal}
				className="rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0"
			/>
		</InputGroup>
	)
}

InputCurrency.displayName = 'InputCurrency'
