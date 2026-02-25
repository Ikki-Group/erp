import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createCallable } from 'react-call'
import z from 'zod'
import { formOptions } from '@tanstack/react-form'
import { useAppForm } from '@/components/form'

const FormDto = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({
  validators: { onSubmit: FormDto },
  defaultValues: {} as FormDto,
})

export const RoleFormDialog = createCallable((props) => {
  const { call } = props

  const form = useAppForm({
    ...fopts,
    defaultValues: {
      name: '',
      code: '',
    },
    onSubmit: async ({ value }) => {
      console.log(value)
    },
  })

  return (
    <Dialog open={!call.ended} onOpenChange={() => call.end()}>
      <form.AppForm>
        <DialogContent>
          <DialogHeader className="border-b pb-4">
            <DialogTitle>Scrollable Content</DialogTitle>
          </DialogHeader>
          <div className="no-scrollbar max-h-[70vh] overflow-y-auto space-y-4">
            <form.AppField name="name">
              {(field) => (
                <field.Base label="Role" required>
                  <field.Input placeholder="Masukkan nama role" />
                </field.Base>
              )}
            </form.AppField>
            <form.AppField name="code">
              {(field) => (
                <field.Base label="Kode" required>
                  <field.Input placeholder="Masukkan kode role" />
                </field.Base>
              )}
            </form.AppField>
          </div>
          <DialogFooter>
            <form.DialogActions onCancel={call.end} />
          </DialogFooter>
        </DialogContent>
      </form.AppForm>
    </Dialog>
  )
}, 200)
