import { formOptions, useStore } from '@tanstack/react-form'
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import z from 'zod'
import { toast } from 'sonner'
import { BoxesIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useMemo } from 'react'
import { materialApi, materialCategoryApi, uomApi } from '../api'
import type { LinkOptions } from '@tanstack/react-router'
import type { MaterialSelectDto } from '../dto'
import { Page } from '@/components/layout/page'
import {
  FormConfig,
  useAppForm,
  useTypedAppFormContext,
} from '@/components/form'
import { CardSection } from '@/components/card/card-section'
import { Card } from '@/components/ui/card'
import { Table } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toastLabelMessage } from '@/lib/toast-message'
import { toOptions } from '@/lib/utils'

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

function getDefaultValues(v?: MaterialSelectDto): FormDto {
  const conversions: FormDto['conversions'] = []

  if (v?.conversions.length) {
    const [_, ...others] = v.conversions
    conversions.push(
      ...others.map(i => ({
        uomId: i.uomId,
        conversionFactor: i.conversionFactor,
      }))
    )
  }
  return {
    name: v?.name ?? '',
    description: v?.description ?? '',
    sku: v?.sku ?? '',
    type: v?.type ?? 'raw',
    categoryId: v?.categoryId ?? null!,
    baseUomId: v?.baseUomId ?? null!,
    conversions,
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
      value.conversions = [
        { uomId: value.baseUomId, conversionFactor: '1' },
        ...value.conversions,
      ]

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
        <Page size='md'>
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
  const { data: categories } = useSuspenseQuery({
    ...materialCategoryApi.list.query({ page: 1, limit: 100 }),
    select: ({ data }) =>
      toOptions(
        data,
        i => i.id,
        i => i.name
      ),
  })

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
            <field.Base label='Kategori'>
              <field.Select placeholder='Pilih kategori' options={categories} />
            </field.Base>
          )}
        </form.AppField>
        <form.AppField name='type'>
          {field => (
            <field.Base label='Tipe Bahan Baku' required>
              <field.Select
                placeholder='Pilih tipe'
                options={[
                  { label: 'Bahan Mentah', value: 'raw' },
                  { label: 'Bahan Setengah Jadi', value: 'semi' },
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
  const { data: uoms } = useSuspenseQuery({
    ...uomApi.list.query({ page: 1, limit: 100 }),
    select: ({ data }) =>
      toOptions(
        data,
        i => i.id,
        i => i.code
      ),
  })

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
              <field.Select placeholder='Pilih satuan utama' options={uoms} />
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
  const { data: uoms } = useSuspenseQuery({
    ...uomApi.list.query({ page: 1, limit: 100 }),
    select: ({ data }) =>
      toOptions(
        data,
        i => i.id,
        i => i.code
      ),
  })

  const baseUom = useMemo(() => {
    return uoms.find(u => u.value === baseUomId)
  }, [baseUomId, uoms])

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
                <Table.Head className='w-[400px]'>Detail Konversi</Table.Head>
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
                      // eslint-disable-next-line @eslint-react/no-array-index-key
                      <Table.Row key={i}>
                        <Table.Cell>
                          <div className='flex items-center gap-1.5'>
                            <div className='flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-sm font-medium'>
                              1
                            </div>
                            <div className='w-52'>
                              <form.AppField name={`conversions[${i}].uomId`}>
                                {field => (
                                  <field.Select
                                    required
                                    placeholder='Pilih satuan...'
                                    options={uoms}
                                  />
                                )}
                              </form.AppField>
                            </div>
                            <div className='text-muted-foreground text-sm font-medium shrink-0'>
                              =
                            </div>
                            <div className='w-52'>
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
                            <div className='flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-sm font-medium'>
                              {baseUom?.label || '-'}
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell className='text-center'>
                          <Button
                            variant='destructive'
                            size='icon'
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
