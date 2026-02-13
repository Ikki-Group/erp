import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { useFieldContext } from './form-hook-context'

export function useFormField() {
  const itemContext = React.useContext(FormItemContext)
  const fieldContext = useFieldContext()

  if (!fieldContext) {
    throw new Error('useFormField should be used within <field.Container>')
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldContext.state.meta,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
)

export function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn('grid gap-2', className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

export function FieldLabel({
  className,
  required,
  ...props
}: React.ComponentProps<typeof Label> & {
  required?: boolean
}) {
  const { formItemId, isValid } = useFormField()

  return (
    <Label
      data-slot="field-label"
      data-error={!isValid}
      className={cn(
        'data-[error=true]:text-destructive',
        required &&
          "after:text-destructive after:content-['*'] after:-ml-1 after:font-bold",
        className,
      )}
      htmlFor={formItemId}
      aria-required={required}
      {...props}
    />
  )
}

export function FieldControl({
  children = <div />,
}: {
  children?: useRender.RenderProp
}) {
  const { formItemId, isValid, formDescriptionId, formMessageId } =
    useFormField()

  return useRender({
    render: children,
    props: {
      'data-slot': 'field-control',
      id: formItemId,
      'aria-describedby': isValid
        ? `${formDescriptionId}`
        : `${formDescriptionId} ${formMessageId}`,
      'aria-invalid': !isValid,
    },
  })
}

export function FieldDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="field-description"
      id={formDescriptionId}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export function FieldMessage({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  const { formMessageId, isValid, errors } = useFormField()

  if (props.children) return props.children

  const body = isValid
    ? props.children
    : String(errors.map((error) => error.message).join(', ') ?? '')

  if (!body) return null

  return (
    <p
      data-slot="field-message"
      id={formMessageId}
      className={cn('text-destructive text-sm', className)}
      {...props}
    >
      {body}
    </p>
  )
}
