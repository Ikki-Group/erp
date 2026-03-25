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

import { productApi, productCategoryApi, salesTypeApi } from '../api'
import type { LinkOptions } from '@tanstack/react-router'
import type { ProductOutputDto } from '../dto'

import { CardSection } from '@/components/card/card-section'
import {
  FormConfig,
  useAppForm,
  useTypedAppFormContext,
} from '@/components/form'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'

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

/**
 * Build a FormDto populated from an optional ProductOutputDto or with sensible defaults.
 *
 * @param v - Optional source product whose fields are used to seed the form
 * @returns A FormDto where:
 * - `name`, `description`, `sku`, and `status` are taken from `v` or set to empty/defaults.
 * - `basePrice` is a numeric value (0 when absent).
 * - `locationId` is taken from `v` or defaults to `1`.
 * - `categoryId` is a string when present in `v`, or `null` when absent.
 * - `hasVariants` and `hasSalesTypePricing` reflect the source flags or default to `false`.
 * - `prices` is an array of `{ salesTypeId, price }` with `price` as numbers.
 * - `variants` is an array of variant objects with `_id` as a string, numeric `basePrice`, `isDefault`, optional `sku`, and `prices` converted to numeric values.
 */
function getDefaultValues(v?: ProductOutputDto): FormDto {
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

/**
 * Render the product create/edit form page that manages basic product data, pricing, and variants.
 *
 * @param mode - Form mode, either create or update, which determines labels and submission behavior
 * @param id - Optional product identifier; when provided the form is populated with the product's data
 * @param backTo - Optional navigation target to go to after a successful submit; falls back to the products list if omitted
 * @returns The React element for the product form page
 */
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
              <PricingAndVariantsSection />
              <form.SimpleActions />
            </Page.Content>
          </form.Form>
        </Page>
      </FormConfig>
    </form.AppForm>
  )
}

/**
 * Render the "Informasi Dasar" card with form controls for basic product fields.
 *
 * Renders inputs for product name, SKU (includes a button to auto-generate an SKU from the product name),
 * category (populated from fetched product categories), status, and description.
 *
 * @returns A JSX element containing the product information form section with labeled inputs and the SKU generator button.
 */
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
    <CardSection
      title='Informasi Dasar'
      description='Detail utama mengenai produk.'
    >
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <form.AppField name='name'>
          {field => (
            <field.Base label='Nama Produk' required>
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

        <form.AppField name='description'>
          {field => (
            <field.Base label='Deskripsi' className='md:col-span-2'>
              <field.Textarea placeholder='Tuliskan deskripsi produk...' />
            </field.Base>
          )}
        </form.AppField>
      </div>
    </CardSection>
  )
}

/**
 * Renders the "Harga & Varian" section of the product form, providing controls to
 * toggle variant mode and per-sales-type pricing and conditionally displaying the
 * base price input, a per-sales-type pricing table, or the variants table.
 *
 * The component also initializes a default variant when variant mode is enabled and
 * no variants exist.
 *
 * @returns A React element containing controls and UI for configuring base price,
 * per-sales-type prices, and product variants.
 */
function PricingAndVariantsSection() {
  const form = useTypedAppContext()
  const hasVariants = useStore(form.store, s => s.values.hasVariants)
  const hasSalesTypePricing = useStore(
    form.store,
    s => s.values.hasSalesTypePricing
  )

  const { data: salesTypes } = useSuspenseQuery({
    ...salesTypeApi.list.query({ page: 1, limit: 100 }),
  })

  return (
    <CardSection
      title='Harga & Varian'
      description='Atur struktur harga dasar, harga tipe penjualan, dan varian produk.'
    >
      <div className='flex flex-col md:flex-row gap-8 p-5 border rounded-lg bg-card/50'>
        <form.AppField name='hasVariants'>
          {field => (
            <div className='flex items-start gap-4 max-w-sm'>
              <Switch
                id='toggle-variants'
                checked={field.state.value}
                onCheckedChange={val => {
                  field.handleChange(val)
                  if (val && form.getFieldValue('variants').length === 0) {
                    form.pushFieldValue('variants', {
                      _id: `v-${Date.now()}`,
                      name: 'Regular',
                      sku: '',
                      basePrice: 0,
                      isDefault: true,
                      prices: [],
                    })
                  }
                }}
              />
              <div className='grid gap-1.5 leading-none'>
                <Label
                  htmlFor='toggle-variants'
                  className='text-base font-semibold cursor-pointer'
                >
                  Produk Memiliki Varian
                </Label>
                <p className='text-sm text-muted-foreground'>
                  Aktifkan jika produk memiliki pilihan ukuran atau jenis yang
                  berbeda (misal: Large, Hot).
                </p>
              </div>
            </div>
          )}
        </form.AppField>

        <form.AppField name='hasSalesTypePricing'>
          {field => (
            <div className='flex items-start gap-4 max-w-sm'>
              <Switch
                id='toggle-sales-pricing'
                checked={field.state.value}
                onCheckedChange={field.handleChange}
              />
              <div className='grid gap-1.5 leading-none'>
                <Label
                  htmlFor='toggle-sales-pricing'
                  className='text-base font-semibold cursor-pointer'
                >
                  Harga Khusus Penjualan
                </Label>
                <p className='text-sm text-muted-foreground'>
                  Aktifkan jika harga produk dibedakan berdasarkan platform /
                  tipe pesanan (misal: Dine In vs GrabFood).
                </p>
              </div>
            </div>
          )}
        </form.AppField>
      </div>

      <div className='mt-2'>
        {!hasVariants ? (
          <div className='flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200'>
            <form.AppField name='basePrice'>
              {field => (
                <field.Base
                  label='Harga Dasar Produk'
                  required
                  className='max-w-xs'
                >
                  <field.Currency placeholder='0' />
                </field.Base>
              )}
            </form.AppField>

            {hasSalesTypePricing && (
              <div className='max-w-2xl'>
                <Label className='mb-3 block font-semibold'>
                  Harga Tipe Penjualan
                </Label>
                <div className='border rounded-md overflow-hidden'>
                  <Table>
                    <TableHeader className='bg-muted/50'>
                      <TableRow>
                        <TableHead>Tipe Penjualan</TableHead>
                        <TableHead className='text-right w-64'>
                          Harga Khusus
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesTypes.data.map(st => (
                        <TableRow key={st.id}>
                          <TableCell className='font-medium'>
                            {st.name}
                          </TableCell>
                          <TableCell className='text-right'>
                            <ProductPriceInput salesTypeId={st.id} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className='animate-in fade-in zoom-in-95 duration-200'>
            <Label className='mb-3 block font-semibold'>Daftar Varian</Label>
            <VariantsTable
              salesTypes={salesTypes.data}
              hasSalesTypePricing={hasSalesTypePricing}
            />
          </div>
        )}
      </div>
    </CardSection>
  )
}

/**
 * Render the per-sales-type price control for a specific sales type.
 *
 * Renders a "+ Atur Harga" button that appends a new price entry when no price exists for the given sales type, or a currency input with a delete button for editing/removing the existing price entry.
 *
 * @param salesTypeId - The sales type identifier whose price entry this control manages.
 * @returns A React element that provides add/edit/remove UI for the sales type's price.
 */
function ProductPriceInput({ salesTypeId }: { salesTypeId: number }) {
  const form = useTypedAppContext()
  const prices = useStore(form.store, s => s.values.prices)
  const priceIndex = prices.findIndex(p => p.salesTypeId === salesTypeId)

  if (priceIndex === -1) {
    return (
      <Button
        variant='outline'
        size='sm'
        className='text-xs h-8 border-dashed'
        onClick={() => {
          const current = [...prices]
          current.push({ salesTypeId, price: 0 })
          form.setFieldValue('prices', current)
        }}
      >
        + Atur Harga
      </Button>
    )
  }

  return (
    <div className='flex items-center justify-end gap-2 group'>
      <form.AppField name={`prices[${priceIndex}].price`}>
        {field => (
          <field.Currency className='w-40 text-right h-8' placeholder='0' />
        )}
      </form.AppField>
      <Button
        variant='ghost'
        size='icon-sm'
        className='opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0'
        onClick={() => {
          const current = [...prices]
          current.splice(priceIndex, 1)
          form.setFieldValue('prices', current)
        }}
      >
        <Trash2Icon className='size-4' />
      </Button>
    </div>
  )
}

/**
 * Render the variants table allowing editing of SKU, name, base price, per-sales-type prices, and default selection.
 *
 * Shows an empty-state when no variants exist, lets the user add or remove variants, and highlights the default variant.
 *
 * @param salesTypes - Array of sales type descriptors ({ id, name }) used to render per-sales-type price columns.
 * @param hasSalesTypePricing - If `true`, include a price column and inputs for each sales type for every variant.
 * @returns The JSX element for the variants table component.
 */
function VariantsTable({
  salesTypes,
  hasSalesTypePricing,
}: {
  salesTypes: Array<{ id: number; name: string }>
  hasSalesTypePricing: boolean
}) {
  const form = useTypedAppContext()

  return (
    <div className='border rounded-md overflow-hidden'>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow className='hover:bg-transparent'>
              <TableHead className='w-[60px] text-center'>Def.</TableHead>
              <TableHead className='min-w-[160px]'>SKU Varian</TableHead>
              <TableHead className='min-w-[200px]'>Nama Varian</TableHead>
              <TableHead className='min-w-[160px] text-right'>
                Harga Dasar
              </TableHead>
              {hasSalesTypePricing &&
                salesTypes.map(st => (
                  <TableHead key={st.id} className='min-w-[150px] text-right'>
                    {st.name}
                  </TableHead>
                ))}
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
                          hasSalesTypePricing ? 5 + salesTypes.length : 5
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
                          'size-7 rounded-full flex items-center justify-center transition-all border outline-none',
                          variant.isDefault
                            ? 'bg-orange-500 border-orange-600 text-white shadow-sm'
                            : 'bg-background border-muted text-muted-foreground hover:border-primary/50'
                        )}
                      >
                        <StarIcon
                          className={cn(
                            'size-3.5',
                            variant.isDefault && 'fill-current'
                          )}
                        />
                      </button>
                    </TableCell>
                    <TableCell>
                      <form.AppField name={`variants[${i}].sku`}>
                        {field => (
                          <input
                            value={field.state.value || ''}
                            onChange={e => field.handleChange(e.target.value)}
                            placeholder='Opsional...'
                            className='w-full bg-transparent border-none focus:ring-0 text-sm font-medium placeholder:text-muted-foreground/50 outline-none'
                          />
                        )}
                      </form.AppField>
                    </TableCell>
                    <TableCell>
                      <form.AppField name={`variants[${i}].name`}>
                        {field => (
                          <input
                            value={field.state.value}
                            onChange={e => field.handleChange(e.target.value)}
                            placeholder='Nama varian (e.g. Regular)'
                            className='w-full bg-transparent border-none focus:ring-0 text-sm font-medium placeholder:text-destructive outline-none'
                          />
                        )}
                      </form.AppField>
                    </TableCell>
                    <TableCell>
                      <form.AppField name={`variants[${i}].basePrice`}>
                        {field => (
                          <field.Currency
                            className='w-full h-8 text-right bg-background/50 border-input'
                            placeholder='0'
                          />
                        )}
                      </form.AppField>
                    </TableCell>

                    {hasSalesTypePricing &&
                      salesTypes.map(st => (
                        <TableCell key={st.id} className='text-right'>
                          <VariantPriceCell
                            variantIndex={i}
                            salesTypeId={st.id}
                          />
                        </TableCell>
                      ))}

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
      <div className='p-3 border-t bg-muted/20'>
        <form.AppField name='variants' mode='array'>
          {arrayField => (
            <Button
              variant='outline'
              size='sm'
              type='button'
              onClick={() => {
                arrayField.pushValue({
                  _id: `new-${Date.now()}`,
                  name: '',
                  sku: '',
                  basePrice: 0,
                  isDefault: arrayField.state.value.length === 0,
                  prices: [],
                })
              }}
            >
              <PlusIcon className='mr-2 size-4' />
              Tambah Varian Terpisah
            </Button>
          )}
        </form.AppField>
      </div>
    </div>
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
