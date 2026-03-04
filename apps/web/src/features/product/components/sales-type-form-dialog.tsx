import { createCallable } from 'react-call'
import z from 'zod'
import { formOptions } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { salesTypeApi } from '../api'
import type { SalesTypeDto } from '../dto'
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
  code: z.string().min(1),
  name: z.string().min(1),
})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({
  validators: { onSubmit: FormDto },
  defaultValues: {} as FormDto,
})

function getDefaultValues(v?: SalesTypeDto): FormDto {
  return {
    code: v?.code ?? '',
    name: v?.name ?? '',
  }
}

interface SalesTypeFormDialogProps {
  id?: number
}

export const SalesTypeFormDialog = createCallable<SalesTypeFormDialogProps>(
  props => {
    const { call, id } = props
    const isCreate = id === undefined

    const selectedCategory = useQuery({
      ...salesTypeApi.detail.query({ id: id! }),
      enabled: !!props.id,
      refetchOnMount: true,
    })

    const create = useMutation({
      mutationFn: salesTypeApi.create.mutationFn,
    })
    const update = useMutation({
      mutationFn: salesTypeApi.update.mutationFn,
    })

    const form = useAppForm({
      ...fopts,
      defaultValues: getDefaultValues(selectedCategory.data?.data),
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
            toastLabelMessage(isCreate ? 'create' : 'update', 'tipe penjualan')
          )
          .unwrap()

        call.end()
      },
    })

    const disabled = selectedCategory.isLoading

    return (
      <form.AppForm>
        <Dialog open={!call.ended} onOpenChange={() => call.end()}>
          <DialogContent>
            <DialogHeader className='border-b pb-4'>
              <DialogTitle>Tipe Penjualan</DialogTitle>
            </DialogHeader>
            <form.AppField name='code'>
              {field => (
                <field.Base label='Kode Tipe' required>
                  <field.Input
                    placeholder='Masukkan kode tipe penjualan'
                    disabled={disabled}
                    required
                  />
                </field.Base>
              )}
            </form.AppField>
            <form.AppField name='name'>
              {field => (
                <field.Base label='Nama Tipe' required>
                  <field.Input
                    placeholder='Masukkan nama tipe penjualan'
                    disabled={disabled}
                    required
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
  },
  200
)
