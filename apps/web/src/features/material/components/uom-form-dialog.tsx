import { createCallable } from 'react-call'
import z from 'zod'
import { formOptions } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { uomApi } from '../api'
import type { UomDto } from '../dto'
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
})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({
  validators: { onSubmit: FormDto },
  defaultValues: {} as FormDto,
})

function getDefaultValues(v?: UomDto): FormDto {
  return {
    code: v?.code ?? '',
  }
}

interface UomFormDialogProps {
  code?: string
}

export const UomFormDialog = createCallable<UomFormDialogProps>(props => {
  const { call, code } = props
  const isCreate = code === undefined

  const selectedUom = useQuery({
    ...uomApi.detail.query({ code: code ?? '' }),
    enabled: !!props.code,
    refetchOnMount: true,
  })

  const create = useMutation({
    mutationFn: uomApi.create.mutationFn,
  })
  const update = useMutation({
    mutationFn: uomApi.update.mutationFn,
  })

  const form = useAppForm({
    ...fopts,
    defaultValues: getDefaultValues(selectedUom.data?.data),
    onSubmit: async ({ value }) => {
      const promise = isCreate
        ? create.mutateAsync({
            body: {
              ...value,
            },
          })
        : update.mutateAsync({
            body: {
              ...value,
            },
          })

      await toast
        .promise(
          promise,
          toastLabelMessage(isCreate ? 'create' : 'update', 'satuan unit')
        )
        .unwrap()

      call.end()
    },
  })

  const disabled = selectedUom.isLoading

  return (
    <form.AppForm>
      <Dialog open={!call.ended} onOpenChange={() => call.end()}>
        <DialogContent>
          <DialogHeader className='border-b pb-4'>
            <DialogTitle>Kategori Bahan Baku</DialogTitle>
          </DialogHeader>
          <form.AppField name='code'>
            {field => (
              <field.Base label='Satuan' required>
                <field.Input
                  placeholder='Masukkan satuan'
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
}, 200)
