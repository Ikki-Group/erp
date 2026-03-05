import { formOptions, useStore } from '@tanstack/react-form'
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  BarChart3Icon,
  DollarSignIcon,
  InfoIcon,
  LayersIcon,
  PackageIcon,
  PlusIcon,
  Settings2Icon,
  StarIcon,
  Trash2Icon,
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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

const FormDto = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  description: z.string().nullable(),
  sku: z.string().min(1, 'SKU wajib diisi'),
  basePrice: z.number().min(0),
  locationId: z.number(),
  categoryId: z.string().nullable(),
  status: z.enum(['active', 'inactive', 'archived']),
  variants: z.array(
    z.object({
      _id: z.string(),
      id: z.number().optional(),
      name: z.string().min(1, 'Nama varian wajib diisi'),
      isDefault: z.boolean(),
      prices: z.array(
        z.object({
          salesTypeId: z.number(),
          price: z.number().min(0),
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
    basePrice: v?.basePrice ? Number(v.basePrice) : 0,
    locationId: v?.locationId ?? 1,
    categoryId: v?.categoryId != null ? String(v.categoryId) : null,
    status: v?.status ?? 'active',
    variants: v?.variants.map(varnt => ({
      _id: String(varnt.id),
      id: varnt.id,
      name: varnt.name,
      isDefault: varnt.isDefault,
      prices: varnt.prices.map(p => ({
        salesTypeId: p.salesTypeId,
        price: Number(p.price),
      })),
    })) ?? [
      {
        _id: 'default',
        name: 'Default',
        isDefault: true,
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

  // State to manage whether advanced pricing is active
  const [isAdvancedPricing, setIsAdvancedPricing] = useState(false)

  // Use useMemo to sync state with loaded data once
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
        variants: value.variants.map(({ _id, id: _vId, prices, ...v }) => ({
          ...v,
          // If advanced pricing is off, we clear specific prices
          prices: isAdvancedPricing
            ? prices.map(p => ({ ...p, price: String(p.price) }))
            : [],
        })),
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
        <Page size='lg'>
          <Page.BlockHeader
            title={mode === 'create' ? 'Tambah Produk' : 'Edit Produk'}
            description='Kelola data produk, varian, dan harga dalam satu interface terpadu.'
            back={backTo ?? { to: '/products' }}
          />
          <form.Form>
            <Page.Content className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
              {/* Main Column */}
              <div className='lg:col-span-8 flex flex-col gap-6'>
                <MainInfoCard />
                <VariantsTableCard
                  isAdvancedPricing={isAdvancedPricing}
                  onToggleAdvancedPricing={setIsAdvancedPricing}
                />
              </div>

              {/* Sidebar */}
              <div className='lg:col-span-4 flex flex-col gap-6'>
                <SidebarCard />
                <form.SimpleActions />
              </div>
            </Page.Content>
          </form.Form>
        </Page>
      </FormConfig>
    </form.AppForm>
  )
}

function MainInfoCard() {
  const form = useTypedAppContext()
  return (
    <CardSection title='Informasi Utama'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
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
              <field.Input placeholder='SKU-001' />
            </field.Base>
          )}
        </form.AppField>
      </div>
      <form.AppField name='description'>
        {field => (
          <field.Base label='Deskripsi'>
            <field.Textarea
              placeholder='Tuliskan deskripsi produk...'
              className='min-h-[100px]'
            />
          </field.Base>
        )}
      </form.AppField>
    </CardSection>
  )
}

function SidebarCard() {
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
    <div className='flex flex-col gap-6 text-sm'>
      <CardSection title='Atribut Produk'>
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

        <form.AppField name='categoryId'>
          {field => (
            <field.Base label='Kategori'>
              <field.Select placeholder='Pilih kategori' options={categories} />
            </field.Base>
          )}
        </form.AppField>

        <form.AppField name='basePrice'>
          {field => (
            <field.Base
              label='Harga Dasar (Fallback)'
              required
              description='Harga default jika harga khusus tidak diaktifkan.'
            >
              <field.Currency placeholder='0' />
            </field.Base>
          )}
        </form.AppField>
      </CardSection>

      <Card className='bg-primary/5 border-primary/20'>
        <Card.Content className='p-4 flex gap-3'>
          <InfoIcon className='size-5 text-primary shrink-0' />
          <p className='text-xs leading-relaxed'>
            <strong>Tips:</strong> Gunakan tabel varian untuk mengelola
            perbedaan tipe produk (misal: Ukuran S/M/L). Aktifkan "Harga Khusus"
            jika ingin membedakan harga Gofood/Takeaway.
          </p>
        </Card.Content>
      </Card>
    </div>
  )
}

function VariantsTableCard({
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
    <Card className='overflow-hidden shadow-sm border-muted-foreground/10'>
      <Card.Header className='bg-muted/30 px-6 py-4 border-b flex flex-row items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='bg-background p-2 rounded-lg border shadow-xs'>
            <LayersIcon className='size-4 text-primary' />
          </div>
          <div>
            <Card.Title className='text-base'>Manajemen Varian</Card.Title>
            <Card.Description className='text-xs'>
              Kelola variasi dan matriks harga produk.
            </Card.Description>
          </div>
        </div>

        <div className='flex items-center gap-6'>
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
          <Button
            size='sm'
            type='button'
            className='h-8 px-3'
            onClick={() => {
              const currentVariants = form.getFieldValue('variants')
              form.pushFieldValue('variants', {
                _id: `new-${Date.now()}`,
                name: '',
                isDefault: currentVariants.length === 0,
                prices: [],
              })
            }}
          >
            <PlusIcon className='mr-1.5 size-3.5' />
            Tambah Varian
          </Button>
        </div>
      </Card.Header>

      <Card.Content className='p-0'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader className='bg-muted/10'>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='w-[60px] text-center'>Def.</TableHead>
                <TableHead className='min-w-[200px]'>Nama Varian</TableHead>
                {isAdvancedPricing ? (
                  salesTypes.data.map(st => (
                    <TableHead key={st.id} className='min-w-[140px] text-right'>
                      {st.name}
                    </TableHead>
                  ))
                ) : (
                  <TableHead className='text-right'>Informasi Harga</TableHead>
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
                            form.setFieldValue(`variants[${i}].isDefault`, true)
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
                              onChange={e => field.handleChange(e.target.value)}
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
