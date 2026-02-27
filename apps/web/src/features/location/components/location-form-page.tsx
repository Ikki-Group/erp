import { formOptions } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import z from 'zod'
import { toast } from 'sonner'
import { locationApi } from '../api'
import type { LinkOptions} from '@tanstack/react-router';
import type { LocationDto } from '../dto'
import { toastLabelMessage } from '@/lib/toast-message'
import { Separator } from '@/components/ui/separator'
import { CardSection } from '@/components/card/card-section'
import { Page } from '@/components/layout/page'
import { FormConfig, useAppForm } from '@/components/form'

const FormDto = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(['store', 'warehouse']),
  description: z.string().min(1),
  isActive: z.boolean(),
})

type FormDto = z.infer<typeof FormDto>

function getDefaultValues(v?: LocationDto): FormDto {
  return {
    name: v?.name ?? '',
    code: v?.code ?? '',
    type: v?.type ?? 'store',
    description: v?.description ?? '',
    isActive: v?.isActive ?? true,
  }
}

const fopts = formOptions({
  validators: { onSubmit: FormDto },
  defaultValues: {} as FormDto,
})

interface LocationFormPageProps {
  mode: 'create' | 'update'
  id?: string
  backTo?: LinkOptions
}

export function LocationFormPage({ mode, id, backTo }: LocationFormPageProps) {
  const isCreate = id === undefined
  const navigate = useNavigate()

  const selectedLocation = useQuery({
    ...locationApi.detail.query({ id: Number(id) }),
    enabled: !!id,
  })

  const create = useMutation({ mutationFn: locationApi.create.mutationFn })
  const update = useMutation({ mutationFn: locationApi.update.mutationFn })

  const form = useAppForm({
    ...fopts,
    defaultValues: getDefaultValues(selectedLocation.data?.data),
    onSubmit: async ({ value }) => {
      const promise = isCreate
        ? create.mutateAsync({ body: value })
        : update.mutateAsync({ body: { id: Number(id), ...value } })

      await toast.promise(promise, toastLabelMessage(mode, 'location')).unwrap()

      if (backTo) {
        navigate({ ...backTo, replace: true })
      }
    },
  })

  return (
    <form.AppForm>
      <FormConfig mode={mode} id={id} backTo={backTo}>
        <Page size="sm">
          <Page.BlockHeader
            title={isCreate ? 'Tambah Lokasi' : 'Edit Lokasi'}
            back={backTo}
          />
          <form.Form>
            <Page.Content className="space-y-6">
              <CardSection title="Informasi Lokasi">
                <form.AppField name="name">
                  {(field) => (
                    <field.Base label="Nama Lokasi" required>
                      <field.Input placeholder="Nama Lokasi" />
                    </field.Base>
                  )}
                </form.AppField>
                <form.AppField name="code">
                  {(field) => (
                    <field.Base label="Kode Lokasi" required>
                      <field.Input placeholder="Kode Lokasi" />
                    </field.Base>
                  )}
                </form.AppField>
                {/* <form.AppField name="type">
                {(field) => (
                  <field.Base label="Tipe Lokasi" required>
                    <field.Select placeholder="Pilih tipe lokasi...">
                      <option value="store">Toko</option>
                      <option value="warehouse">Warehouse</option>
                    </field.Select>
                  </field.Base>
                )}
              </form.AppField> */}
                <form.AppField name="description">
                  {(field) => (
                    <field.Base label="Deskripsi" required>
                      <field.Textarea placeholder="Deskripsi Lokasi..." />
                    </field.Base>
                  )}
                </form.AppField>
                <Separator />
                <form.AppField name="isActive">
                  {(field) => (
                    <field.Switch
                      label="Status Aktif"
                      description="Lokasi dapat diakses oleh pengguna"
                    />
                  )}
                </form.AppField>
              </CardSection>
              <form.SimpleActions />
            </Page.Content>
          </form.Form>
        </Page>
      </FormConfig>
    </form.AppForm>
  )
}
