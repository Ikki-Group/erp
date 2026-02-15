import { ComponentProps } from 'react'
import { useFormContext } from './form-hook-context'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

function Form(props: ComponentProps<'form'>) {
  const form = useFormContext()

  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation()
        e.preventDefault()
        form.handleSubmit()
      }}
      {...props}
    />
  )
}

function FormSimpleActions() {
  const form = useFormContext()

  return (
    <Card
      size="sm"
      className="flex-row items-center justify-center p-2! gap-2! bg-muted/50 border"
    >
      <Button variant="outline" type="button">
        Batal
      </Button>
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        )}
      </form.Subscribe>
    </Card>
  )
}

export { Form, FormSimpleActions }
