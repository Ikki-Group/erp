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
    <Card size="sm" className="px-3 flex items-end ring-0">
      <div className="flex gap-2 max-w-72 w-full">
        <Button
          variant="outline"
          type="button"
          className="flex-1"
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
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="flex-1 "
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </Card>
  )
}

interface FormDialogActionsProps {
  onCancel: () => void
}

function FormDialogActions({ onCancel }: FormDialogActionsProps) {
  const form = useFormContext()
  return (
    <>
      <Button variant="outline" type="button" onClick={onCancel}>
        Batal
      </Button>
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <Button
            type={'button'}
            disabled={!canSubmit || isSubmitting}
            onClick={() => form.handleSubmit()}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        )}
      </form.Subscribe>
    </>
  )
}

export { Form, FormSimpleActions, FormDialogActions }
