import { createCallable } from 'react-call'
import z from 'zod'
import { formOptions } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { roleApi } from '../api'
import type { RoleDto } from '../dto'
import { useAppForm } from '@/components/form'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toastLabelMessage } from '@/lib/toast-message'

const FormDto = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({
  validators: { onSubmit: FormDto },
  defaultValues: {} as FormDto,
})

function getDefaultValues(v?: RoleDto): FormDto {
  return {
    code: v?.code ?? '',
    name: v?.name ?? '',
  }
}

interface RoleFormDialogProps {
  id?: number
}

export const RoleFormDialog = createCallable<RoleFormDialogProps>((props) => {
  const { call, id } = props
  const isCreate = id === undefined

  const selectedRole = useQuery({
    ...roleApi.detail.query({ id: Number(id) }),
    enabled: !!props.id,
    refetchOnMount: true,
  })

  const create = useMutation({ mutationFn: roleApi.create.mutationFn })
  const update = useMutation({ mutationFn: roleApi.update.mutationFn })

  const form = useAppForm({
    ...fopts,
    defaultValues: getDefaultValues(selectedRole.data?.data),
    onSubmit: async ({ value }) => {
      const promise = isCreate
        ? create.mutateAsync({
            body: {
              ...value,
            },
          })
        : update.mutateAsync({
            body: {
              id,
              ...value,
            },
          })

      await toast
        .promise(
          promise,
          toastLabelMessage(isCreate ? 'create' : 'update', 'role'),
        )
        .unwrap()

      call.end()
    },
  })

  const disabled = selectedRole.isLoading

  return (
    <form.AppForm>
      <Dialog open={!call.ended} onOpenChange={() => call.end()}>
        <DialogContent>
          <DialogHeader className="border-b pb-4">
            <DialogTitle>Scrollable Content</DialogTitle>
          </DialogHeader>
          <form.AppField name="name">
            {(field) => (
              <field.Base label="Role" required>
                <field.Input
                  placeholder="Masukkan nama role"
                  disabled={disabled}
                />
              </field.Base>
            )}
          </form.AppField>
          <form.AppField name="code">
            {(field) => (
              <field.Base label="Kode" required>
                <field.Input
                  placeholder="Masukkan kode role"
                  disabled={disabled}
                />
              </field.Base>
            )}
          </form.AppField>
          <DialogFooter>
            <form.DialogActions onCancel={call.end} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form.AppForm>
  )
}, 200)
