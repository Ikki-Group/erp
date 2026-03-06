import { formOptions, useStore } from '@tanstack/react-form'
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  PackageIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
  Wand2Icon,
} from 'lucide-react'
import z from 'zod'
import { useMemo, useState } from 'react'

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
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toastLabelMessage } from '@/lib/toast-message'
import { cn, toOptions } from '@/lib/utils'
import { generateSku } from '@/lib/sku'

const FormDto = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  description: z.string().nullable(),
  sku: z.string().min(1, 'SKU wajib diisi'),
  basePrice: z.number().min(0),
  locationId: z.number(),
  categoryId: z.string().nullable(),
  status: z.enum(['active', 'inactive', 'archived']),
  hasVariants: z.boolean().default(false),
  hasSalesTypePricing: z.boolean().default(false),
  prices: z
    .array(
      z.object({
        salesTypeId: z.number(),
        price: z.number().min(0),
      })
    )
    .default([]),
  variants: z
    .array(
      z.object({
        _id: z.string(),
        id: z.number().optional(),
        name: z.string().min(1, 'Nama varian wajib diisi'),
        sku: z.string().optional(),
        basePrice: z.number().min(0).default(0),
        isDefault: z.boolean(),
        prices: z.array(
          z.object({
            salesTypeId: z.number(),
            price: z.number().min(0),
          })
        ),
      })
    )
    .default([]),
})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({
  validators: { onSubmit: FormDto as any },
  defaultValues: {} as FormDto,
})

function getDefaultValues(v?: ProductSelectDto): FormDto {
  return {
    name: v?.name ?? '',
    description: v?.description ?? '',
    sku: v?.sku ?? '',
    basePrice: v?.basePrice ? Number(v.basePrice) : 0,
    locationId: v?.locationId ?? 1,
    categoryId: v?.categoryId != null ? String(v.categoryId) : null,
    status: v?.status ?? 'active',
    hasVariants: v?.hasVariants ?? false,
    hasSalesTypePricing: v?.hasSalesTypePricing ?? false,
    prices:
      v?.prices.map(p => ({
        salesTypeId: p.salesTypeId,
        price: Number(p.price),
      })) ?? [],
    variants:
      v?.variants.map(varnt => ({
        _id: String(varnt.id),
        id: varnt.id,
        name: varnt.name,
        sku: varnt.sku ?? undefined,
        basePrice: Number(varnt.basePrice),
        isDefault: varnt.isDefault,
        prices: varnt.prices.map(p => ({
          salesTypeId: p.salesTypeId,
          price: Number(p.price),
        })),
      })) ?? [],
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

  const [isAdvancedPricing, setIsAdvancedPricing] = useState(false)

  useMemo(() => {
    if (selectedProduct.data?.data) {
      const hasPrices = selectedProduct.data.data.variants.some(
        v => v.prices.length > 0
      )
      setIsAdvancedPricing(hasPrices)
    }
  }, [selectedProduct.data])

  const create = useMutation({ mutationFn: productApi.create.mutationFn })
  const update = useMutation({ mutationFn: productApi.update.mutationFn })

  const form = useAppForm({
    ...fopts,
    defaultValues: getDefaultValues(selectedProduct.data?.data),
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        basePrice: String(value.basePrice),
        categoryId: value.categoryId ? Number(value.categoryId) : null,
        hasVariants: value.hasVariants,
        hasSalesTypePricing: value.hasSalesTypePricing,
        prices:
          value.hasSalesTypePricing && !value.hasVariants
            ? value.prices.map(p => ({ ...p, price: String(p.price) }))
            : [],
        variants: value.hasVariants
          ? value.variants.map(
              ({ _id, id: _vId, prices, basePrice, ...v }) => ({
                ...v,
                basePrice: String(basePrice),
                prices: value.hasSalesTypePricing
                  ? prices.map(p => ({ ...p, price: String(p.price) }))
                  : [],
              })
            )
          : [],
      }

      const promise = id
        ? update.mutateAsync({ body: { id, ...payload } })
        : create.mutateAsync({ body: payload })

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
            <Page.Content className='flex flex-col gap-6'>
              <ProductInfoCard />
              <VariantsSection
                isAdvancedPricing={isAdvancedPricing}
                onToggleAdvancedPricing={setIsAdvancedPricing}
              />
              <form.SimpleActions />
            </Page.Content>
          </form.Form>
        </Page>
      </FormConfig>
    </form.AppForm>
  )
}

function ProductInfoCard() {
  const form = useTypedAppContext()
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
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <form.AppField name='name'>
          {field => (
            <field.Base label='Nama Produk' required className='md:col-span-2'>
              <field.Input placeholder='Misal: Cappuccino Gula Aren' />
            </field.Base>
          )}
        </form.AppField>
        <form.AppField name='sku'>
          {field => (
            <field.Base label='SKU' required>
              <div className='flex items-center gap-2'>
                <field.Input placeholder='SKU-001' />
                <Button
                  variant='outline'
                  size='icon'
                  type='button'
                  className='shrink-0'
                  title='Generate SKU otomatis'
                  onClick={() => {
                    const name = form.getFieldValue('name')
                    field.setValue(generateSku('PRD', name))
                  }}
                >
                  <Wand2Icon className='size-4' />
                </Button>
              </div>
            </field.Base>
          )}
        </form.AppField>
      </div>
      <form.AppField name='description'>
        {field => (
          <field.Base label='Deskripsi'>
            <field.Textarea placeholder='Tuliskan deskripsi produk...' />
          </field.Base>
        )}
      </form.AppField>

      <Separator />

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
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
        <form.AppField name='basePrice'>
          {field => (
            <field.Base
              label='Harga Dasar'
              required
              description='Harga default jika harga khusus tidak diaktifkan.'
            >
              <field.Currency placeholder='0' />
            </field.Base>
          )}
        </form.AppField>
      </div>
    </CardSection>
  )
}

function VariantsSection({
  isAdvancedPricing,
  onToggleAdvancedPricing,
}: {
  isAdvancedPricing: boolean
  onToggleAdvancedPricing: (v: boolean) => void
}) {
  const form = useTypedAppContext()
  const { data: salesTypes } = useSuspenseQuery({
    ...salesTypeApi.list.query({ page: 1, limit: 100 }),
  })

  return (
    <Card size='sm'>
      <Card.Header className='border-b'>
        <Card.Title>Manajemen Varian</Card.Title>
        <Card.Description>
          Kelola variasi dan matriks harga produk.
        </Card.Description>
      </Card.Header>

      <Card.Content className='flex flex-col gap-4'>
        <div className='border rounded-md overflow-hidden'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader className='bg-muted'>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='w-[60px] text-center'>Def.</TableHead>
                  <TableHead className='min-w-[200px]'>Nama Varian</TableHead>
                  {isAdvancedPricing ? (
                    salesTypes.data.map(st => (
                      <TableHead
                        key={st.id}
                        className='min-w-[140px] text-right'
                      >
                        {st.name}
                      </TableHead>
                    ))
                  ) : (
                    <TableHead className='text-right'>
                      Informasi Harga
                    </TableHead>
                  )}
                  <TableHead className='w-[50px]'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <form.AppField name='variants' mode='array'>
                  {arrayField => {
                    if (arrayField.state.value.length === 0) {
                      return (
                        <TableRow>
                          <TableCell
                            colSpan={
                              isAdvancedPricing ? 3 + salesTypes.data.length : 4
                            }
                            className='h-32 text-center text-muted-foreground'
                          >
                            <div className='flex flex-col items-center gap-2'>
                              <PackageIcon className='size-8 opacity-20' />
                              <span className='text-xs'>
                                Belum ada varian. Klik "Tambah Varian" untuk
                                memulai.
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    }

                    return arrayField.state.value.map((variant, i) => (
                      <TableRow
                        key={variant._id}
                        className={cn(variant.isDefault && 'bg-primary/5')}
                      >
                        <TableCell className='text-center'>
                          <button
                            type='button'
                            onClick={() => {
                              arrayField.state.value.forEach((_, idx) => {
                                form.setFieldValue(
                                  `variants[${idx}].isDefault`,
                                  false
                                )
                              })
                              form.setFieldValue(
                                `variants[${i}].isDefault`,
                                true
                              )
                            }}
                            className={cn(
                              'size-8 rounded-full flex items-center justify-center transition-all border outline-none',
                              variant.isDefault
                                ? 'bg-orange-500 border-orange-600 text-white shadow-sm'
                                : 'bg-background border-muted text-muted-foreground hover:border-primary/50'
                            )}
                          >
                            <StarIcon
                              className={cn(
                                'size-4',
                                variant.isDefault && 'fill-current'
                              )}
                            />
                          </button>
                        </TableCell>
                        <TableCell>
                          <form.AppField name={`variants[${i}].name`}>
                            {field => (
                              <input
                                value={field.state.value}
                                onChange={e =>
                                  field.handleChange(e.target.value)
                                }
                                placeholder='Nama varian (e.g. Regular)'
                                className='w-full bg-transparent border-none focus:ring-0 text-sm font-medium placeholder:text-muted-foreground/50 outline-none'
                              />
                            )}
                          </form.AppField>
                        </TableCell>

                        {isAdvancedPricing ? (
                          salesTypes.data.map(st => (
                            <TableCell key={st.id} className='text-right'>
                              <VariantPriceCell
                                variantIndex={i}
                                salesTypeId={st.id}
                              />
                            </TableCell>
                          ))
                        ) : (
                          <TableCell className='text-right'>
                            <span className='text-xs text-muted-foreground italic'>
                              Mengikuti Harga Dasar
                            </span>
                          </TableCell>
                        )}

                        <TableCell>
                          {arrayField.state.value.length > 1 && (
                            <Button
                              variant='ghost'
                              size='icon-sm'
                              className='text-muted-foreground hover:text-destructive'
                              onClick={() => arrayField.removeValue(i)}
                            >
                              <Trash2Icon className='size-4' />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  }}
                </form.AppField>
              </TableBody>
            </Table>
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <Button
            variant='outline'
            size='sm'
            type='button'
            className='w-fit'
            onClick={() => {
              const currentVariants = form.getFieldValue('variants')
              form.pushFieldValue('variants', {
                _id: `new-${Date.now()}`,
                name: '',
                basePrice: 0,
                isDefault: currentVariants.length === 0,
                prices: [],
              })
            }}
          >
            <PlusIcon className='mr-2 size-4' />
            Tambah Varian
          </Button>

          <div className='flex items-center gap-2'>
            <Switch
              id='advanced-pricing'
              checked={isAdvancedPricing}
              onCheckedChange={onToggleAdvancedPricing}
            />
            <Label
              htmlFor='advanced-pricing'
              className='text-xs font-semibold cursor-pointer select-none'
            >
              Harga Khusus Penjualan
            </Label>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

function VariantPriceCell({
  variantIndex,
  salesTypeId,
}: {
  variantIndex: number
  salesTypeId: number
}) {
  const form = useTypedAppContext()
  const variantPrices = useStore(
    form.store,
    s => s.values.variants[variantIndex].prices
  )
  const priceIndex = variantPrices.findIndex(p => p.salesTypeId === salesTypeId)
  const isSet = priceIndex !== -1

  if (!isSet) {
    return (
      <button
        type='button'
        onClick={() => {
          const currentPrices = [...variantPrices]
          currentPrices.push({ salesTypeId, price: 0 })
          form.setFieldValue(`variants[${variantIndex}].prices`, currentPrices)
        }}
        className='text-[10px] font-bold text-muted-foreground hover:text-primary uppercase tracking-tighter'
      >
        + Atur Harga
      </button>
    )
  }

  return (
    <div className='flex items-center justify-end gap-1 group'>
      <form.AppField
        name={`variants[${variantIndex}].prices[${priceIndex}].price`}
      >
        {field => (
          <field.Currency
            className='h-7 text-xs w-28 text-right bg-muted/20 border-transparent focus:border-primary/30 transition-all'
            placeholder='0'
          />
        )}
      </form.AppField>
      <button
        type='button'
        onClick={() => {
          const currentPrices = [...variantPrices]
          currentPrices.splice(priceIndex, 1)
          form.setFieldValue(`variants[${variantIndex}].prices`, currentPrices)
        }}
        className='opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1'
      >
        <Trash2Icon className='size-3' />
      </button>
    </div>
  )
}

function useTypedAppContext() {
  return useTypedAppFormContext({ ...fopts })
}
