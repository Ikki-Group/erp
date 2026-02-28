import { formOptions } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import z from 'zod'
import { toast } from 'sonner'
import { materialApi } from '../api'
import type { LinkOptions } from '@tanstack/react-router'
import type { MaterialDto } from '../dto'
import { Page } from '@/components/layout/page'
import {
  FormConfig,
  useAppForm,
  useTypedAppFormContext,
} from '@/components/form'
import { CardSection } from '@/components/card/card-section'
import { toastLabelMessage } from '@/lib/toast-message'

const FormDto = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  sku: z.string().min(1),
  categoryId: z.number(),
  baseUomId: z.number(),
  isActive: z.boolean(),
})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({
  validators: { onSubmit: FormDto },
  defaultValues: {} as FormDto,
})

function getDefaultValues(v?: MaterialDto): FormDto {
  return {
    name: v?.name ?? '',
    description: v?.description ?? '',
    sku: v?.sku ?? '',
    categoryId: v?.categoryId ?? null!,
    baseUomId: v?.baseUomId ?? null!,
    isActive: v?.isActive ?? true,
  }
}

interface MaterialFormPageProps {
  mode: 'create' | 'update'
  id?: string
  backTo?: LinkOptions
}

export function MaterialFormPage({ mode, id, backTo }: MaterialFormPageProps) {
  const navigate = useNavigate()
  const selectedMaterial = useQuery({
    ...materialApi.detail.query({ id: Number(id) }),
    enabled: !!id,
  })

  const create = useMutation({ mutationFn: materialApi.create.mutationFn })
  const update = useMutation({ mutationFn: materialApi.update.mutationFn })

  const form = useAppForm({
    ...fopts,
    defaultValues: getDefaultValues(selectedMaterial.data?.data),
    onSubmit: async ({ value }) => {
      const promise = selectedMaterial.data?.data
        ? update.mutateAsync({
            body: {
              id: selectedMaterial.data.data.id,
              ...value,
            },
          })
        : create.mutateAsync({
            body: {
              ...value,
            },
          })

      await toast
        .promise(promise, toastLabelMessage(mode, 'bahan baku'))
        .unwrap()

      if (backTo) {
        navigate({ ...backTo, replace: true })
      }
    },
  })

  return (
    <form.AppForm>
      <FormConfig mode={mode} id={id} backTo={backTo}>
        <Page size='sm'>
          <Page.BlockHeader
            title={mode === 'create' ? 'Tambah Pengguna' : 'Edit Pengguna'}
            back={backTo}
          />
          <form.Form>
            <Page.Content className='gap-6 flex flex-col'>
              <GeneralInformationCard />
              <form.SimpleActions />
            </Page.Content>
          </form.Form>
        </Page>
      </FormConfig>
    </form.AppForm>
  )
}

function GeneralInformationCard() {
  const form = useTypedAppFormContext({ ...fopts })

  return (
    <CardSection title='Informasi Akun'>
      <form.AppField name='name'>
        {field => (
          <field.Base label='Nama Bahan Baku' required>
            <field.Input placeholder='Contoh: gula, garam' />
          </field.Base>
        )}
      </form.AppField>
      <form.AppField name='description'>
        {field => (
          <field.Base label='Deskripsi' required>
            <field.Textarea placeholder='Masukkan deskripsi bahan baku' />
          </field.Base>
        )}
      </form.AppField>
      <form.AppField name='sku'>
        {field => (
          <field.Base label='SKU' required>
            <field.Input placeholder='Contoh: SK-001' />
          </field.Base>
        )}
      </form.AppField>
    </CardSection>
  )
}
