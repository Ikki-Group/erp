import { ComponentProps } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useFormContext } from './form-hook-context'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { useFormConfig } from './form-config'

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
  const { backTo } = useFormConfig()
  const form = useFormContext()
  const navigate = useNavigate()

  return (
    <Card
      size="sm"
      className="flex-row items-center justify-center p-2! gap-2! bg-muted/50 border"
    >
      <Button
        variant="outline"
        type="button"
        onClick={() => {
          if (backTo) {
            navigate({
              to: backTo.to!,
              search: backTo.search,
              params: backTo.params,
            })
          } else {
            window.history.back()
          }
        }}
      >
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
