import { formOptions } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { createCallable } from 'react-call'
import { toast } from 'sonner'
import z from 'zod'

import { useAppForm } from '@/components/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toastLabelMessage } from '@/lib/toast-message'

import { userApi } from '../api'

const FormDto = z.object({ oldPassword: z.string().min(8), newPassword: z.string().min(8) })

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({
  validators: { onSubmit: FormDto },
  defaultValues: { oldPassword: '', newPassword: '' } as FormDto,
})

export const UserProfilePasswordDialog = createCallable((props) => {
  const { call } = props

  const changePassword = useMutation({ mutationFn: userApi.changePassword.mutationFn })

  const form = useAppForm({
    ...fopts,
    onSubmit: async ({ value }) => {
      const promise = changePassword.mutateAsync({
        body: { oldPassword: value.oldPassword, newPassword: value.newPassword },
      })

      await toast.promise(promise, toastLabelMessage('update', 'password')).unwrap()

      call.end()
    },
  })

  const disabled = changePassword.isPending

  return (
    <form.AppForm>
      <Dialog open={!call.ended} onOpenChange={() => call.end()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="border-b pb-4">
            <DialogTitle>Ubah Password</DialogTitle>
            <DialogDescription>Pastikan gunakan password yang kuat dengan perpaduan huruf dan angka.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <form.AppField name="oldPassword">
              {(field) => (
                <field.Base label="Password Saat Ini" required>
                  <field.InputPassword placeholder="Masukkan password saat ini" disabled={disabled} />
                </field.Base>
              )}
            </form.AppField>
            <form.AppField name="newPassword">
              {(field) => (
                <field.Base label="Password Baru" required>
                  <field.InputPassword placeholder="Masukkan password baru" disabled={disabled} />
                </field.Base>
              )}
            </form.AppField>
          </div>
          <DialogFooter>
            <form.DialogActions onCancel={call.end} disabled={disabled} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form.AppForm>
  )
})
