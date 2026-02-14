import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import * as scn from '@/components/ui/field'

import { cn } from '@/lib/utils'
import { useFieldContext } from './form-hook-context'
import { useStore } from '@tanstack/react-form'

function useFormField() {
  const itemContext = React.useContext(FormItemContext)
  const field = useFieldContext()

  const { id } = itemContext

  const errors = useStore(field.store, (state) => state.meta.errors)
  const isTouched = useStore(field.store, (state) => state.meta.isTouched)
  const submissionAttempts = useStore(
    field.form.store,
    (state) => state.submissionAttempts,
  )

  const fieldComponent = React.useMemo(() => {
    const showError = isTouched || submissionAttempts > 0

    let errorMessage: string | null = null
    if (showError && errors.length > 0) {
      const error = errors[0]

      if (typeof error === 'string') {
        errorMessage = error
      } else if (typeof error === 'object' && error !== null) {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message
        }
      } else if (error !== null && error !== undefined) {
        errorMessage = String(error)
      }
    }

    return {
      formControlId: `${id}-form-item`,
      formDescriptionId: `${id}-form-item-description`,
      formMessageId: `${id}-form-item-message`,
      error: errorMessage,
      hasError: showError && errorMessage !== null,
    }
  }, [id, isTouched, submissionAttempts, errors])

  return fieldComponent
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
)

function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  const id = React.useId()
  const field = useFieldContext()
  const errors = useStore(field.store, (state) => state.meta.errors)
  const isTouched = useStore(field.store, (state) => state.meta.isTouched)
  const submissionAttempts = useStore(
    field.form.store,
    (state) => state.submissionAttempts,
  )
  const showError = isTouched || submissionAttempts > 0
  const hasError = showError && errors.length > 0

  return (
    <FormItemContext.Provider value={{ id }}>
      <scn.Field
        data-slot="form-item"
        data-invalid={hasError ? 'true' : undefined}
        className={className}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

function FieldLabel({
  className,
  required,
  ...props
}: React.ComponentProps<typeof scn.FieldLabel> & {
  required?: boolean
}) {
  const { formControlId, hasError } = useFormField()

  return (
    <scn.FieldLabel
      data-error={hasError ? 'true' : undefined}
      htmlFor={formControlId}
      aria-required={required}
      className={cn(
        'data-[error=true]:text-destructive',
        required &&
          "after:text-destructive after:content-['*'] after:-ml-1 after:font-bold",
        className,
      )}
      {...props}
    />
  )
}

function FieldControl({
  children = <div />,
}: {
  children?: useRender.RenderProp
}) {
  const { formControlId, formDescriptionId, formMessageId, hasError } =
    useFormField()
  const describedBy = [formDescriptionId, hasError ? formMessageId : null]
    .filter(Boolean)
    .join(' ')

  return useRender({
    render: children,
    props: {
      'data-slot': 'field-control',
      id: formControlId,
      'aria-describedby': describedBy || undefined,
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

function FieldError({
  className,
  ...props
}: React.ComponentProps<typeof scn.FieldError>) {
  const { error, formMessageId } = useFormField()
  const body = error ?? props.children

  if (!body) {
    return null
  }

  return (
    <scn.FieldError
      data-slot="form-message"
      id={formMessageId}
      className={className}
      {...props}
    >
      {body}
    </scn.FieldError>
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
