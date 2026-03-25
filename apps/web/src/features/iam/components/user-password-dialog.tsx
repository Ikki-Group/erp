import { createCallable } from 'react-call'
import z from 'zod'
import { formOptions } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { userApi } from '../api'
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

const FormDto = z.object({
  password: z.string().min(8),
})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({
  validators: { onSubmit: FormDto },
  defaultValues: { password: '' } as FormDto,
})

interface UserPasswordDialogProps {
  id: number
  username: string
}

export const UserPasswordDialog = createCallable<UserPasswordDialogProps>(
  props => {
    const { call, id, username } = props

    const updatePassword = useMutation({
      mutationFn: userApi.adminUpdatePassword.mutationFn,
    })

    const form = useAppForm({
      ...fopts,
      onSubmit: async ({ value }) => {
        const promise = updatePassword.mutateAsync({
          body: {
            id,
            password: value.password,
          },
        })

        await toast
          .promise(promise, toastLabelMessage('update', 'password pengguna'))
          .unwrap()

        call.end()
      },
    })

    const disabled = updatePassword.isPending

    return (
      <form.AppForm>
        <Dialog open={!call.ended} onOpenChange={() => call.end()}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader className='border-b pb-4'>
              <DialogTitle>Ubah Password @{username}</DialogTitle>
              <DialogDescription>
                Masukkan password baru untuk pengguna{' '}
                <span className='font-medium text-foreground'>@{username}</span>
                .
              </DialogDescription>
            </DialogHeader>
            <div className='py-4'>
              <form.AppField name='password'>
                {field => (
                  <field.Base label='Password Baru' required>
                    <field.InputPassword
                      placeholder='Masukkan password baru'
                      disabled={disabled}
                    />
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
  },
  200
)
