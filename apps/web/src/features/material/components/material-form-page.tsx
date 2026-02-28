import { formOptions, useStore } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import z from 'zod'
import { toast } from 'sonner'
import { BoxesIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { materialApi } from '../api'
import type { LinkOptions } from '@tanstack/react-router'
import type { MaterialDto } from '../dto'
import { Page } from '@/components/layout/page'
import {
  FormConfig,
  useAppForm,
  useTypedAppFormContext,
} from '@/components/form'
import { DataCombobox } from '@/components/ui/data-combobox'
import { CardSection } from '@/components/card/card-section'
import { Card } from '@/components/ui/card'
import { Table } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toastLabelMessage } from '@/lib/toast-message'

const MOCK_CATEGORIES = [
  { id: 1, name: 'Food' },
  { id: 2, name: 'Beverage' },
  { id: 3, name: 'Packaging' },
]

const MOCK_UOMS = [
  { id: 1, name: 'Kilogram (kg)' },
  { id: 2, name: 'Gram (g)' },
  { id: 3, name: 'Liter (l)' },
  { id: 4, name: 'Pcs' },
]

const FormDto = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  sku: z.string().min(1),
  type: z.enum(['raw', 'semi']),
  categoryId: z.number().nullable(),
  baseUomId: z.number(),
  conversions: z.array(
    z.object({
      uomId: z.number(),
      conversionFactor: z.string().min(1),
    })
  ),
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
    type: v?.type ?? 'raw',
    categoryId: v?.categoryId ?? null!,
    baseUomId: v?.baseUomId ?? null!,
    conversions: v?.conversions ?? [],
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
            title={mode === 'create' ? 'Tambah Bahan Baku' : 'Edit Bahan Baku'}
            back={backTo}
          />
          <form.Form>
            <Page.Content className='gap-6 flex flex-col'>
              <GeneralInformationCard />
              <UomInformationSection />
              <UomConversionsSection />
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
    <CardSection title='Informasi Bahan Baku'>
      <form.AppField name='name'>
        {field => (
          <field.Base label='Nama Bahan Baku' required>
            <field.Input placeholder='Contoh: Gula, Garam' />
          </field.Base>
        )}
      </form.AppField>
      <form.AppField name='sku'>
        {field => (
          <field.Base label='SKU' required>
            <field.Input placeholder='Contoh: SKU-001' />
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
      <Separator />
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <form.AppField name='categoryId'>
          {field => (
            <field.Base label='Kategori' required>
              <field.Control>
                <DataCombobox
                  value={
                    field.state.value ? String(field.state.value) : undefined
                  }
                  onValueChange={val =>
                    field.handleChange(val ? Number(val) : null)
                  }
                  placeholder='Cari kategori...'
                  emptyText='Kategori tidak ditemukan'
                  queryKey={['categories']}
                  queryFn={async search => {
                    await new Promise(resolve => setTimeout(resolve, 500))
                    if (!search) return MOCK_CATEGORIES
                    return MOCK_CATEGORIES.filter(c =>
                      c.name.toLowerCase().includes(search.toLowerCase())
                    )
                  }}
                  getLabel={item => item.name}
                  getValue={item => String(item.id)}
                />
              </field.Control>
            </field.Base>
          )}
        </form.AppField>
        <form.AppField name='type'>
          {field => (
            <field.Base label='Tipe Bahan Baku' required>
              <field.Select
                placeholder='Pilih tipe'
                options={[
                  { label: 'Bahan Mentah (Raw)', value: 'raw' },
                  { label: 'Bahan Setengah Jadi (Semi)', value: 'semi' },
                ]}
              />
            </field.Base>
          )}
        </form.AppField>
      </div>
    </CardSection>
  )
}

function UomInformationSection() {
  const form = useTypedAppFormContext({ ...fopts })

  return (
    <Card size='sm'>
      <Card.Header className='border-b'>
        <Card.Title>Satuan Dasar (Base UOM)</Card.Title>
        <Card.Description>
          Satuan terkecil yang digunakan untuk mengukur bahan baku ini
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form.AppField name='baseUomId'>
          {field => (
            <field.Base label='Satuan Utama' required>
              <field.Select
                placeholder='Pilih satuan utama'
                options={MOCK_UOMS.map(u => ({
                  label: u.name,
                  value: u.id,
                }))}
              />
            </field.Base>
          )}
        </form.AppField>
      </Card.Content>
    </Card>
  )
}

function UomConversionsSection() {
  const form = useTypedAppFormContext({ ...fopts })
  const baseUomId = useStore(form.store, s => s.values.baseUomId)
  const baseUomName =
    MOCK_UOMS.find(u => u.id === Number(baseUomId))?.name || 'Satuan Utama'

  return (
    <Card size='sm'>
      <Card.Header className='border-b'>
        <Card.Title>Konversi Satuan</Card.Title>
        <Card.Description>
          Tambahkan konversi satuan lain yang terkait dengan satuan dasar
        </Card.Description>
      </Card.Header>
      <Card.Content className='flex flex-col gap-4'>
        <div className='border rounded-md overflow-hidden'>
          <Table className='table-fixed'>
            <Table.Header className='bg-muted'>
              <Table.Row>
                <Table.Head>Detail Konversi</Table.Head>
                <Table.Head className='w-16 text-center'>Aksi</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <form.AppField name='conversions' mode='array'>
                {arrayField => {
                  if (arrayField.state.value.length <= 0) {
                    return (
                      <Table.Row>
                        <Table.Cell colSpan={2} className='text-center h-32'>
                          <div className='flex flex-col items-center justify-center gap-2 text-muted-foreground'>
                            <BoxesIcon className='size-8 opacity-50' />
                            <p>Belum ada konversi satuan yang ditambahkan</p>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    )
                  }
                  return arrayField.state.value.map((_, i) => {
                    return (
                      <Table.Row key={i}>
                        <Table.Cell className='align-top pt-4'>
                          <div className='flex items-center gap-3'>
                            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted text-sm font-medium'>
                              1
                            </div>
                            <div className='w-full max-w-[200px]'>
                              <form.AppField name={`conversions[${i}].uomId`}>
                                {field => (
                                  <field.Select
                                    required
                                    placeholder='Pilih satuan...'
                                    options={MOCK_UOMS.map(u => ({
                                      label: u.name,
                                      value: u.id,
                                    }))}
                                  />
                                )}
                              </form.AppField>
                            </div>
                            <div className='text-muted-foreground text-sm font-medium'>
                              =
                            </div>
                            <div className='w-full max-w-[200px]'>
                              <form.AppField
                                name={`conversions[${i}].conversionFactor`}
                              >
                                {field => (
                                  <field.Input
                                    required
                                    type='number'
                                    placeholder='Faktor (Contoh: 1000)'
                                  />
                                )}
                              </form.AppField>
                            </div>
                            <div className='flex h-10 px-3 shrink-0 items-center justify-center rounded-md border bg-muted text-sm font-medium'>
                              {baseUomName}
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell className='align-top pt-4 text-center'>
                          <Button
                            variant='destructive'
                            size='icon-sm'
                            type='button'
                            onClick={() => arrayField.removeValue(i)}
                          >
                            <Trash2Icon />
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    )
                  })
                }}
              </form.AppField>
            </Table.Body>
          </Table>
        </div>
        <Button
          variant='outline'
          size='sm'
          type='button'
          className='w-fit'
          onClick={() => {
            form.pushFieldValue('conversions', {
              uomId: null!,
              conversionFactor: '',
            })
          }}
        >
          <PlusIcon className='mr-2 size-4' />
          Tambah Konversi Satuan
        </Button>
      </Card.Content>
    </Card>
  )
}
