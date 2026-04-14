import * as React from 'react'

import { useStore } from '@tanstack/react-form'

import { cn } from '@/lib/utils'

import * as scn from '@/components/ui/field'

import { useFieldContext } from './form-hook-context'

import { useRender } from '@base-ui/react/use-render'

function useFormField() {
	const itemContext = React.use(FormItemContext)
	const fieldContext = useFieldContext()

	if (!fieldContext) {
		throw new Error('useFormField should be used within <field.Container>')
	}

	const { id } = itemContext

	// Subscribe to field and form state
	const meta = useStore(fieldContext.store, (state) => state.meta)
	const submissionAttempts = useStore(fieldContext.form.store, (state) => state.submissionAttempts)

	const showError = meta.isTouched || submissionAttempts > 0
	const hasError = showError && meta.errors.length > 0

	return {
		id,
		name: fieldContext.name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		showError,
		hasError,
		...meta,
	}
}

type FormItemContextValue = { id: string }

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue)

function FormItem({ className, ...props }: React.ComponentProps<typeof scn.Field>) {
	const id = React.useId()
	const field = useFieldContext()

	const meta = useStore(field.store, (state) => state.meta)
	const submissionAttempts = useStore(field.form.store, (state) => state.submissionAttempts)

	const showError = meta.isTouched || submissionAttempts > 0
	const hasError = showError && meta.errors.length > 0

	return (
		<FormItemContext value={{ id }}>
			<scn.Field
				data-slot="form-item"
				data-invalid={hasError ? 'true' : undefined}
				className={className}
				{...props}
			/>
		</FormItemContext>
	)
}

function FieldLabel({
	className,
	required,
	...props
}: React.ComponentProps<typeof scn.FieldLabel> & { required?: boolean }) {
	const { formItemId, hasError } = useFormField()

	return (
		<scn.FieldLabel
			data-error={hasError}
			htmlFor={formItemId}
			aria-required={required}
			className={cn(
				'data-[error=true]:text-destructive',
				required && "after:text-destructive after:content-['*'] after:-ml-1 after:font-bold",
				className,
			)}
			{...props}
		/>
	)
}

function FieldControl({ children = <div /> }: { children?: useRender.RenderProp }) {
	const { formItemId, hasError, formDescriptionId, formMessageId } = useFormField()

	return useRender({
		render: children,
		props: {
			'data-slot': 'field-control',
			id: formItemId,
			'aria-describedby': hasError
				? `${formDescriptionId} ${formMessageId}`
				: `${formDescriptionId}`,
			'aria-invalid': hasError,
		},
	})
}

function FieldDescription({ className, ...props }: React.ComponentProps<'p'>) {
	const { formDescriptionId } = useFormField()

	return (
		<scn.FieldDescription
			data-slot="form-description"
			id={formDescriptionId}
			className={className}
			{...props}
		/>
	)
}

function FieldError({ className, ...props }: React.ComponentProps<typeof scn.FieldError>) {
	const { formMessageId, hasError, errors } = useFormField()

	if (props.children) return props.children
	if (!hasError || errors.length === 0) return null

	const formattedErrors = errors.map((error) => ({
		message: typeof error === 'string' ? error : (error as { message?: string })?.message,
	}))

	return (
		<scn.FieldError
			data-slot="form-message"
			id={formMessageId}
			className={className}
			errors={formattedErrors}
			{...props}
		/>
	)
}

export {
	useFieldContext,
	FormItem,
	FormItem as Field,
	FieldLabel,
	FieldControl,
	FieldDescription,
	FieldError,
	useFormField,
}
