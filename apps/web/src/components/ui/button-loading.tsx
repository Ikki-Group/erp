import * as React from 'react'

import { Loader2Icon } from 'lucide-react'

import { Button } from './button'

interface ButtonLoadingProps extends React.ComponentProps<typeof Button> {
	loading?: boolean
}

/**
 * A Button wrapper that handles loading state with a spinner.
 * Standardizes the loading UI across the application.
 */
export function ButtonLoading({
	loading = false,
	disabled,
	children,
	...props
}: ButtonLoadingProps) {
	return (
		<Button {...props} disabled={loading || disabled}>
			{loading && <Loader2Icon className="mr-2 size-4 animate-spin" />}
			{children}
		</Button>
	)
}
