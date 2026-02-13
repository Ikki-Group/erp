import { ComponentProps } from 'react'
import { Input } from '../ui/input'
import { useFieldContext } from './form-hook-context'
import { FieldControl } from './form-tanstack'

interface ItemTemplateProps {
  label: string
}

function ItemTemplate() {
  return (
    <FieldControl>
      <Input />
    </FieldControl>
  )
}

function FieldInput({ ...props }: ComponentProps<typeof Input>) {
  const field = useFieldContext<string>()

  return (
    <FieldControl>
      <Input
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        {...props}
      />
    </FieldControl>
  )
}

export { FieldInput }
