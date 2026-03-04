import { formOptions, useStore } from '@tanstack/react-form'
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { LayersIcon, PackageIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import z from 'zod'

import { productApi, productCategoryApi, salesTypeApi } from '../api'
import type { LinkOptions } from '@tanstack/react-router'
import type { ProductSelectDto } from '../dto'

import { CardSection } from '@/components/card/card-section'
import {
  FormConfig,
  useAppForm,
  useTypedAppFormContext,
} from '@/components/form'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toastLabelMessage } from '@/lib/toast-message'
import { toOptions } from '@/lib/utils'

const FormDto = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  sku: z.string().min(1),
  locationId: z.number(),
  categoryId: z.string().nullable(),
  status: z.enum(['active', 'inactive', 'archived']),
  variants: z.array(
    z.object({
      name: z.string().min(1),
      isDefault: z.boolean(),
      basePrice: z.string().min(1),
      prices: z.array(
        z.object({
          salesTypeId: z.number(),
          price: z.string().min(1),
        })
      ),
    })
  ),
})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({
  validators: { onSubmit: FormDto },
  defaultValues: {} as FormDto,
})

function getDefaultValues(v?: ProductSelectDto): FormDto {
  return {
    name: v?.name ?? '',
    description: v?.description ?? '',
    sku: v?.sku ?? '',
    locationId: v?.locationId ?? 1, // Default location
    categoryId: v?.categoryId != null ? String(v.categoryId) : null,
    status: v?.status ?? 'active',
    variants: v?.variants.map(varnt => ({
      name: varnt.name,
      isDefault: varnt.isDefault,
      basePrice: varnt.basePrice,
      prices: varnt.prices.map(p => ({
        salesTypeId: p.salesTypeId,
        price: p.price,
      })),
    })) ?? [
      {
        name: 'Default',
        isDefault: true,
        basePrice: '0',
        prices: [],
      },
    ],
  }
}

interface ProductFormPageProps {
  mode: 'create' | 'update'
  id?: number
  backTo?: LinkOptions
}

export function ProductFormPage({ mode, id, backTo }: ProductFormPageProps) {
  const navigate = useNavigate()
  const selectedProduct = useQuery({
    ...productApi.detail.query({ id: id! }),
    enabled: !!id,
  })

  const create = useMutation({ mutationFn: productApi.create.mutationFn })
  const update = useMutation({ mutationFn: productApi.update.mutationFn })

  const form = useAppForm({
    ...fopts,
    defaultValues: getDefaultValues(selectedProduct.data?.data),
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        categoryId: value.categoryId ? Number(value.categoryId) : null,
      }

      const promise = id
        ? update.mutateAsync({
            body: {
              id,
              ...payload,
            },
          })
        : create.mutateAsync({
            body: payload,
          })

      await toast.promise(promise, toastLabelMessage(mode, 'produk')).unwrap()

      if (backTo) {
        navigate({ ...backTo, replace: true })
      } else {
        navigate({ to: '/products', replace: true })
      }
    },
  })

  return (
    <form.AppForm>
      <FormConfig mode={mode} id={id} backTo={backTo}>
        <Page size='md'>
          <Page.BlockHeader
            title={mode === 'create' ? 'Tambah Produk' : 'Edit Produk'}
            back={backTo ?? { to: '/products' }}
          />
          <form.Form>
            <Page.Content className='gap-6 flex flex-col'>
              <GeneralInformationCard />
              <VariantsSection />
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
    ...productCategoryApi.list.query({ page: 1, limit: 100 }),
    select: ({ data }) =>
      toOptions(
        data,
        i => String(i.id),
        i => i.name
      ),
  })

  return (
    <CardSection title='Informasi Produk'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <form.AppField name='name'>
          {field => (
            <field.Base label='Nama Produk' required>
              <field.Input placeholder='Contoh: Kopi Susu Gula Aren' />
            </field.Base>
          )}
        </form.AppField>
        <form.AppField name='sku'>
          {field => (
            <field.Base label='SKU' required>
              <field.Input placeholder='Contoh: PRD-001' />
            </field.Base>
          )}
        </form.AppField>
      </div>
      <form.AppField name='description'>
        {field => (
          <field.Base label='Deskripsi'>
            <field.Textarea placeholder='Masukkan deskripsi produk' />
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
        <form.AppField name='status'>
          {field => (
            <field.Base label='Status' required>
              <field.Select
                placeholder='Pilih status'
                options={[
                  { label: 'Aktif', value: 'active' },
                  { label: 'Non-Aktif', value: 'inactive' },
                  { label: 'Arsip', value: 'archived' },
                ]}
              />
            </field.Base>
          )}
        </form.AppField>
      </div>
    </CardSection>
  )
}

function VariantsSection() {
  const form = useTypedAppFormContext({ ...fopts })
  const { data: salesTypes } = useSuspenseQuery({
    ...salesTypeApi.list.query({ page: 1, limit: 100 }),
  })

  return (
    <Card size='sm'>
      <Card.Header className='border-b'>
        <Card.Title>Varian & Harga</Card.Title>
        <Card.Description>
          Kelola varian produk dan harga berdasarkan tipe penjualan
        </Card.Description>
      </Card.Header>
      <Card.Content className='flex flex-col gap-4'>
        <form.AppField name='variants' mode='array'>
          {arrayField => {
            if (arrayField.state.value.length <= 0) {
              return (
                <div className='flex flex-col items-center justify-center gap-2 text-muted-foreground border rounded-md h-32'>
                  <PackageIcon className='size-8 opacity-50' />
                  <p>Belum ada varian yang ditambahkan</p>
                </div>
              )
            }

            return (
              <div className='flex flex-col gap-6'>
                {arrayField.state.value.map((variant, i) => (
                  <Card
                    key={`variant-${i}`}
                    className='border border-muted relative'
                  >
                    <Card.Header className='bg-muted/30 pb-3 flex flex-row items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <LayersIcon className='size-4 text-muted-foreground' />
                        <Card.Title className='text-sm font-semibold'>
                          Varian #{i + 1}
                        </Card.Title>
                        {variant.isDefault && (
                          <Badge variant='secondary' className='text-[10px]'>
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className='flex items-center gap-2'>
                        {arrayField.state.value.length > 1 && (
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            type='button'
                            className='text-destructive hover:bg-destructive/10'
                            onClick={() => arrayField.removeValue(i)}
                          >
                            <Trash2Icon className='size-4' />
                          </Button>
                        )}
                      </div>
                    </Card.Header>
                    <Card.Content className='pt-4 flex flex-col gap-4'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <form.AppField name={`variants[${i}].name`}>
                          {field => (
                            <field.Base label='Nama Varian' required>
                              <field.Input placeholder='Contoh: Regular, Large, Hot/Ice' />
                            </field.Base>
                          )}
                        </form.AppField>
                        <form.AppField name={`variants[${i}].basePrice`}>
                          {field => (
                            <field.Base label='Harga Dasar' required>
                              <field.Number placeholder='0' />
                            </field.Base>
                          )}
                        </form.AppField>
                      </div>

                      <div className='bg-muted/20 rounded-md p-4 border border-dashed'>
                        <h4 className='text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground'>
                          Harga Khusus Tipe Penjualan
                        </h4>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                          {salesTypes.data.map(st => {
                            return (
                              <div
                                key={st.id}
                                className='flex flex-col gap-1.5'
                              >
                                <label className='text-[11px] font-medium'>
                                  {st.name}
                                </label>
                                <PriceInput
                                  variantIndex={i}
                                  salesTypeId={st.id}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <form.AppField name={`variants[${i}].isDefault`}>
                        {field => (
                          <div className='flex items-center gap-2 mt-2'>
                            <input
                              type='checkbox'
                              checked={field.state.value}
                              onChange={e => {
                                if (e.target.checked) {
                                  arrayField.state.value.forEach((_, idx) => {
                                    form.setFieldValue(
                                      `variants[${idx}].isDefault`,
                                      false
                                    )
                                  })
                                  field.handleChange(true)
                                } else if (
                                  arrayField.state.value.length === 1
                                ) {
                                  field.handleChange(true)
                                } else {
                                  field.handleChange(false)
                                }
                              }}
                              className='size-4 rounded border-gray-300'
                            />
                            <label className='text-xs text-muted-foreground'>
                              Set sebagai varian utama (default)
                            </label>
                          </div>
                        )}
                      </form.AppField>
                    </Card.Content>
                  </Card>
                ))}
              </div>
            )
          }}
        </form.AppField>

        <Button
          variant='secondary'
          size='sm'
          type='button'
          className='w-full border-dashed border-2 bg-transparent hover:bg-muted/50 h-10'
          onClick={() => {
            const currentVariants = form.getFieldValue('variants')
            form.pushFieldValue('variants', {
              name: '',
              isDefault: currentVariants.length === 0,
              basePrice: '0',
              prices: [],
            })
          }}
        >
          <PlusIcon className='mr-2 size-4' />
          Tambah Varian Baru
        </Button>
      </Card.Content>
    </Card>
  )
}

function PriceInput({
  variantIndex,
  salesTypeId,
}: {
  variantIndex: number
  salesTypeId: number
}) {
  const form = useTypedAppFormContext({ ...fopts })

  const variantPrices = useStore(
    form.store,
    s => s.values.variants[variantIndex].prices
  )
  const priceIndex = variantPrices.findIndex(p => p.salesTypeId === salesTypeId)

  if (priceIndex === -1) {
    return (
      <Button
        variant='outline'
        size='sm'
        className='h-8 text-[10px] border-dashed'
        onClick={() => {
          const currentPrices = [...variantPrices]
          currentPrices.push({ salesTypeId, price: '0' })
          form.setFieldValue(`variants[${variantIndex}].prices`, currentPrices)
        }}
      >
        + Set Harga
      </Button>
    )
  }

  return (
    <div className='flex items-center gap-1'>
      <div className='relative flex-1'>
        <form.AppField
          name={`variants[${variantIndex}].prices[${priceIndex}].price`}
        >
          {field => (
            <field.Number className='h-8 text-xs pr-8' placeholder='0' />
          )}
        </form.AppField>
      </div>
      <Button
        variant='ghost'
        size='icon-sm'
        className='size-8 shrink-0 text-muted-foreground hover:text-destructive'
        onClick={() => {
          const currentPrices = [...variantPrices]
          currentPrices.splice(priceIndex, 1)
          form.setFieldValue(`variants[${variantIndex}].prices`, currentPrices)
        }}
      >
        <Trash2Icon className='size-3' />
      </Button>
    </div>
  )
}
