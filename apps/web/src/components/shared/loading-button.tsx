import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface LoadingButtonProps extends ComponentProps<typeof Button> {
	loading?: boolean
}

export function LoadingButton({ loading, disabled, children, ...props }: LoadingButtonProps) {
	return (
		<Button disabled={loading || disabled} {...props}>
			{loading && <Spinner className="mr-1.5 size-3.5" />}
			{children}
		</Button>
	)
}
