import { createCallable } from 'react-call'
import z from 'zod'
import { formOptions } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Wand2Icon } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { toCodeCase } from '@/lib/formatter'
import { toastLabelMessage } from '@/lib/toast-message'

const FormDto = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({
  validators: { onSubmit: FormDto as any },
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

    const selected = useQuery({
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
      defaultValues: getDefaultValues(selected.data?.data),
      onSubmit: async ({ value }) => {
        const promise = isCreate
          ? create.mutateAsync({
              body: value as any,
            })
          : update.mutateAsync({
              body: {
                id,
                ...value,
              } as any,
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

    const disabled = selected.isLoading

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
                  <div className='flex items-center gap-2'>
                    <field.Input
                      placeholder='Masukkan kode tipe penjualan'
                      disabled={disabled}
                      required
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='icon-sm'
                      className='size-8 shrink-0'
                      disabled={disabled}
                      onClick={() => {
                        const name = form.getFieldValue('name')
                        field.handleChange(toCodeCase(name))
                      }}
                    >
                      <Wand2Icon className='size-4' />
                    </Button>
                  </div>
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
