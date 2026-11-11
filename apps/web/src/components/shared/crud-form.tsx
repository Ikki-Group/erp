import type { ReactNode } from 'react'

import type { AnyFormApi } from '@tanstack/react-form'

import { FormPage } from './form-page'

export interface CrudFormProps {
	title: string
	description?: string
	form: AnyFormApi
	children: ReactNode
	actions?: ReactNode
	onCancel?: () => void
	submitLabel?: string
	cancelLabel?: string
	className?: string
}

/** Semantic alias for the standard create/edit form page composition. */
export function CrudForm(props: CrudFormProps) {
	return <FormPage {...props} />
}
