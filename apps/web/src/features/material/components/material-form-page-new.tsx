import { useMemo, useState } from 'react'
import { formOptions, useStore } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import z from 'zod'
import { toast } from 'sonner'
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  ArrowRightLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoIcon,
  PackageIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'

import { uomApi } from '../api'
import { Page } from '@/components/layout/page'
import {
  FormConfig,
  useAppForm,
  useTypedAppFormContext,
} from '@/components/form'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InputNumber } from '@/components/ui/input-number'

/* -------------------------------------------------------------------------- */
/*  Domain Constants & Mock Data                                              */
/* -------------------------------------------------------------------------- */

const UOM_CONFIGS = [
  {
    id: '1',
    code: 'gram',
    category: 'weight',
    typicalConversions: { kg: 0.001, mg: 1000 },
  },
  {
    id: '2',
    code: 'kg',
    category: 'weight',
    typicalConversions: { gram: 1000, ton: 0.001 },
  },
  {
    id: '3',
    code: 'mg',
    category: 'weight',
    typicalConversions: { gram: 0.001 },
  },
  {
    id: '4',
    code: 'liter',
    category: 'volume',
    typicalConversions: { ml: 1000 },
  },
  {
    id: '5',
    code: 'ml',
    category: 'volume',
    typicalConversions: { liter: 0.001 },
  },
  { id: '6', code: 'pcs', category: 'piece' },
  { id: '7', code: 'box', category: 'piece' },
]

/* -------------------------------------------------------------------------- */
/*  Schema & Types                                                            */
/* -------------------------------------------------------------------------- */

const ConversionSchema = z.object({
  uom: z.string().min(1, 'Unit is required'),
  toBaseFactor: z.number().positive('Factor must be positive'),
})

const MaterialFormSchema = z.object({
  name: z.string().min(1, 'Material name is required'),
  baseUom: z.string().min(1, 'Base unit is required'),
  conversions: z.array(ConversionSchema),
})

type MaterialFormValues = z.infer<typeof MaterialFormSchema>

const formOpts = formOptions({
  validators: { onSubmit: MaterialFormSchema },
  defaultValues: {
    name: '',
    baseUom: '',
    conversions: [],
  } as MaterialFormValues,
})

/* -------------------------------------------------------------------------- */
/*  Main Page Component                                                        */
/* -------------------------------------------------------------------------- */

export function MaterialFormPageNew() {
  const [step, setStep] = useState(1)
  const navigate = useNavigate()

  const form = useAppForm({
    ...formOpts,
    onSubmit: async ({ value }) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Final Payload:', value)
      toast.success('Material saved successfully (Mock API)')
      navigate({ to: '/materials' })
    },
  })

  // We'll use the mock data for better demonstration of categories
  const { data: _uomsData } = useQuery({
    ...uomApi.list.query({ page: 1, limit: 100 }),
  })

  const uoms = useMemo(() => {
    return UOM_CONFIGS.map(u => ({
      label: u.code,
      value: u.code,
      category: u.category,
    }))
  }, [])

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3))
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

  return (
    <form.AppForm>
      <FormConfig mode='create'>
        <Page size='md'>
          <Page.BlockHeader
            title='Create New Material'
            description='Set up your material with base unit and conversions.'
          />

          <div className='mb-8'>
            <nav className='flex items-center justify-center space-x-4'>
              {[1, 2, 3].map(s => (
                <div key={s} className='flex items-center'>
                  <div
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full border-2 font-semibold transition-colors',
                      step === s
                        ? 'border-primary bg-primary text-primary-foreground shadow-md'
                        : step > s
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {s}
                  </div>
                  <span
                    className={cn(
                      'ml-2 text-sm font-medium hidden sm:inline',
                      step === s ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {s === 1
                      ? 'Basic Info'
                      : s === 2
                        ? 'Conversions'
                        : 'Preview'}
                  </span>
                  {s < 3 && <div className='mx-4 h-px w-8 bg-muted sm:w-12' />}
                </div>
              ))}
            </nav>
          </div>

          <form.Form>
            <Page.Content className='flex flex-col gap-6'>
              {step === 1 && <Step1BasicInfo uoms={uoms} />}
              {step === 2 && <Step2Conversions uoms={uoms} />}
              {step === 3 && <Step3Preview uoms={uoms} />}

              <div className='flex items-center justify-between pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={prevStep}
                  disabled={step === 1}
                  className='w-28'
                >
                  <ChevronLeftIcon className='mr-2 size-4' />
                  Back
                </Button>

                {step < 3 ? (
                  <Button type='button' onClick={nextStep} className='w-28'>
                    Next
                    <ChevronRightIcon className='ml-2 size-4' />
                  </Button>
                ) : (
                  <form.SimpleActions />
                )}
              </div>
            </Page.Content>
          </form.Form>
        </Page>
      </FormConfig>
    </form.AppForm>
  )
}

/* -------------------------------------------------------------------------- */
/*  Step Components                                                           */
/* -------------------------------------------------------------------------- */

function Step1BasicInfo({ uoms }: { uoms: Array<any> }) {
  const form = useTypedAppFormContext({ ...formOpts })

  return (
    <Card className='overflow-hidden border-none shadow-lg'>
      <div className='bg-primary/5 px-6 py-4 border-b'>
        <h3 className='text-lg font-semibold flex items-center gap-2 text-primary'>
          <PackageIcon className='size-5' />
          Material Identity
        </h3>
      </div>
      <div className='p-6 space-y-6'>
        <form.AppField name='name'>
          {field => (
            <field.Base
              label='Material Name'
              required
              description='Enter the common name of the material.'
            >
              <field.Input
                placeholder='e.g. Sugar, Flour, Coffee Beans'
                className='text-lg'
              />
            </field.Base>
          )}
        </form.AppField>

        <form.AppField name='baseUom'>
          {field => (
            <field.Base
              label='Base Unit'
              required
              description='The base unit is the unit used internally to calculate stock. All other units will be converted into this unit.'
            >
              <field.Select
                placeholder='Pilih satuan dasar...'
                options={uoms}
              />
            </field.Base>
          )}
        </form.AppField>

        <Alert className='bg-blue-50/50 border-blue-200'>
          <InfoIcon className='size-4 text-blue-600' />
          <AlertTitle className='text-blue-800'>Pro Tip</AlertTitle>
          <AlertDescription className='text-blue-700'>
            Choose the smallest unit of measurement as your base unit for
            maximum precision in inventory tracking.
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  )
}

function Step2Conversions({ uoms }: { uoms: Array<any> }) {
  const form = useTypedAppFormContext({ ...formOpts })
  const baseUom = useStore(form.store, s => s.values.baseUom)

  const selectedBaseUom = useMemo(
    () => uoms.find(u => u.value === baseUom),
    [baseUom, uoms]
  )

  return (
    <Card className='overflow-hidden border-none shadow-lg'>
      <div className='bg-primary/5 px-6 py-4 border-b'>
        <h3 className='text-lg font-semibold flex items-center gap-2 text-primary'>
          <ArrowRightLeftIcon className='size-5' />
          Unit Conversions
        </h3>
      </div>
      <div className='p-6'>
        {!baseUom ? (
          <div className='text-center py-12 text-muted-foreground'>
            <PackageIcon className='size-12 mx-auto mb-4 opacity-20' />
            <p>Please select a base unit in the first step.</p>
          </div>
        ) : (
          <div className='space-y-6'>
            <div className='rounded-lg bg-muted/40 p-4 flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground uppercase tracking-wider'>
                  Internal Storage Unit
                </p>
                <p className='text-xl font-bold'>{selectedBaseUom?.label}</p>
              </div>
              <Badge variant='outline' className='bg-background'>
                Base Unit
              </Badge>
            </div>

            <Separator />

            <UomConversionEditor uoms={uoms} baseUom={selectedBaseUom} />
          </div>
        )}
      </div>
    </Card>
  )
}

function Step3Preview({ uoms }: { uoms: Array<any> }) {
  const form = useTypedAppFormContext({ ...formOpts })
  const values = useStore(form.store, s => s.values)

  const baseUom = useMemo(
    () => uoms.find(u => u.value === values.baseUom),
    [values.baseUom, uoms]
  )

  return (
    <Card className='overflow-hidden border-none shadow-lg'>
      <div className='bg-primary/5 px-6 py-4 border-b'>
        <h3 className='text-lg font-semibold flex items-center gap-2 text-primary'>
          <ChevronRightIcon className='size-5' />
          Review & Preview
        </h3>
      </div>
      <div className='p-6 space-y-8'>
        <div>
          <h4 className='text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider'>
            Summary
          </h4>
          <div className='grid grid-cols-2 gap-4'>
            <div className='p-3 rounded-md border bg-slate-50/50'>
              <p className='text-xs text-muted-foreground'>Material Name</p>
              <p className='font-semibold'>{values.name || '-'}</p>
            </div>
            <div className='p-3 rounded-md border bg-slate-50/50'>
              <p className='text-xs text-muted-foreground'>Base Unit</p>
              <p className='font-semibold'>{baseUom?.label || '-'}</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className='text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider'>
            Conversion Logic
          </h4>
          <ConversionPreview values={values} uoms={uoms} />
        </div>

        <div className='pt-4'>
          <h4 className='text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider'>
            Transaction Demo
          </h4>
          <QuantityWithUomInput values={values} />
        </div>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  UI Components                                                             */
/* -------------------------------------------------------------------------- */

function UomConversionEditor({
  uoms,
  baseUom,
}: {
  uoms: Array<any>
  baseUom: any
}) {
  const form = useTypedAppFormContext({ ...formOpts })

  // Filter UOMs that are in the same category as base unit and not the base unit itself
  const availableUoms = useMemo(() => {
    return uoms.filter(
      u => u.category === baseUom.category && u.value !== baseUom.value
    )
  }, [uoms, baseUom])

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <label className='text-sm font-medium'>Additional Units</label>
        <Button
          type='button'
          size='sm'
          variant='outline'
          className='h-8 border-dashed'
          onClick={() => {
            form.pushFieldValue('conversions', {
              uom: '',
              toBaseFactor: 1,
            })
          }}
        >
          <PlusIcon className='mr-1 size-3' />
          Add Unit
        </Button>
      </div>

      <form.AppField name='conversions' mode='array'>
        {arrayField => (
          <div className='space-y-3'>
            {arrayField.state.value.length === 0 ? (
              <div className='text-center py-8 border rounded-lg border-dashed bg-muted/20 text-muted-foreground text-sm'>
                No additional units defined yet.
              </div>
            ) : (
              arrayField.state.value.map((fieldValue, i) => (
                <div
                  key={fieldValue.uom || i}
                  className='group relative flex items-center gap-3 p-3 rounded-lg border bg-background hover:border-primary/50 transition-colors'
                >
                  <div className='flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-sm font-bold'>
                    1
                  </div>

                  <div className='w-32'>
                    <form.AppField name={`conversions[${i}].uom`}>
                      {field => (
                        <field.Select
                          options={availableUoms}
                          placeholder='Select...'
                        />
                      )}
                    </form.AppField>
                  </div>

                  <div className='text-lg font-bold text-muted-foreground'>
                    =
                  </div>

                  <div className='flex-1 min-w-[100px]'>
                    <form.AppField name={`conversions[${i}].toBaseFactor`}>
                      {field => (
                        <div className='relative'>
                          <InputNumber
                            value={field.state.value}
                            onChange={val => field.handleChange(val ?? 0)}
                            className='pr-12 text-right font-mono'
                          />
                          <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs text-muted-foreground font-medium'>
                            {baseUom.label}
                          </div>
                        </div>
                      )}
                    </form.AppField>
                  </div>

                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-8 text-muted-foreground hover:text-destructive group-hover:opacity-100'
                    onClick={() => arrayField.removeValue(i)}
                  >
                    <Trash2Icon className='size-4' />
                  </Button>

                  {/* Safeguard Warning */}
                  <ConversionSafeguard index={i} baseUom={baseUom} />
                </div>
              ))
            )}
          </div>
        )}
      </form.AppField>
    </div>
  )
}

function ConversionSafeguard({
  index,
  baseUom,
}: {
  index: number
  baseUom: any
}) {
  const form = useTypedAppFormContext({ ...formOpts })
  const conversion = useStore(form.store, s => s.values.conversions[index])

  const warning = useMemo(() => {
    if (!conversion?.uom || !conversion?.toBaseFactor) return null

    // Check against typical conversions in mock data
    const config = UOM_CONFIGS.find(u => u.code === conversion.uom)
    if (!config || !config.typicalConversions) return null

    const typical = (config.typicalConversions as any)[baseUom.value]
    if (typical && typical !== conversion.toBaseFactor) {
      return `Typical conversion is 1 ${conversion.uom} = ${typical} ${baseUom.label}`
    }
    return null
  }, [conversion, baseUom])

  if (!warning) return null

  return (
    <div className='absolute -bottom-1 left-3 transform translate-y-full z-10'>
      <div className='flex items-center gap-1.5 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-b border-x border-b border-amber-200 shadow-sm animate-in fade-in slide-in-from-top-2'>
        <AlertTriangleIcon className='size-3' />
        {warning}
      </div>
    </div>
  )
}

function ConversionPreview({
  values,
  uoms,
}: {
  values: MaterialFormValues
  uoms: Array<any>
}) {
  const baseUom = uoms.find(u => u.value === values.baseUom)

  return (
    <div className='space-y-3'>
      {values.conversions.length === 0 ? (
        <div className='text-sm text-muted-foreground italic'>
          No additional units defined.
        </div>
      ) : (
        values.conversions.map((c, i) => (
          <div
            key={c.uom || i}
            className='flex flex-col gap-2 p-4 rounded-lg border bg-background shadow-sm'
          >
            <div className='flex items-center justify-between text-sm font-medium'>
              <span className='flex items-center gap-2'>
                <Badge variant='secondary'>1 {c.uom}</Badge>
                <ArrowRightIcon className='size-3 text-muted-foreground' />
                <Badge variant='default'>
                  {c.toBaseFactor} {baseUom?.label}
                </Badge>
              </span>
              <span className='text-muted-foreground font-mono'>
                Factor: {c.toBaseFactor}x
              </span>
            </div>
            <div className='grid grid-cols-3 gap-2 mt-2'>
              {[2, 5, 0.5].map(val => (
                <div
                  key={val}
                  className='text-[11px] bg-muted/30 p-2 rounded flex flex-col items-center'
                >
                  <span className='text-muted-foreground'>
                    {val} {c.uom}
                  </span>
                  <span className='font-bold text-primary'>
                    {val * c.toBaseFactor} {baseUom?.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function QuantityWithUomInput({ values }: { values: MaterialFormValues }) {
  const [qty, setQty] = useState<number>(1)
  const [selectedUom, setSelectedUom] = useState<string>(values.baseUom || '')

  const currentUom = useMemo(() => {
    if (selectedUom === values.baseUom)
      return { label: values.baseUom, factor: 1 }
    const conv = values.conversions.find(c => c.uom === selectedUom)
    return conv ? { label: conv.uom, factor: conv.toBaseFactor } : null
  }, [selectedUom, values])

  const internalQty = (qty || 0) * (currentUom?.factor || 0)

  const uomOptions = useMemo(() => {
    const opts = []
    if (values.baseUom)
      opts.push({ label: values.baseUom, value: values.baseUom })
    values.conversions.forEach(c => {
      opts.push({ label: c.uom, value: c.uom })
    })
    return opts
  }, [values])

  useMemo(() => {
    if (values.baseUom && !uomOptions.find(o => o.value === selectedUom)) {
      setSelectedUom(values.baseUom)
    }
  }, [values.baseUom, uomOptions, selectedUom])

  const handleUomChange = (val: string) => {
    setSelectedUom(val)
  }

  return (
    <div className='p-5 rounded-2xl border-2 border-primary/10 bg-linear-to-br from-primary/5 to-transparent space-y-5 shadow-inner'>
      <div className='flex items-center justify-between'>
        <p className='text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded'>
          Transaction Playground
        </p>
        <Badge variant='outline' className='text-[10px] font-mono'>
          Live Simulation
        </Badge>
      </div>

      <div className='flex items-end gap-3'>
        <div className='flex-1'>
          <label className='text-[10px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-tighter'>
            Enter Amount
          </label>
          <InputNumber
            value={qty}
            onChange={v => setQty(v ?? 0)}
            className='text-xl font-bold h-12 shadow-sm'
            placeholder='0.00'
          />
        </div>
        <div className='w-40'>
          <label className='text-[10px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-tighter'>
            Select Unit
          </label>
          <Select value={selectedUom} onValueChange={handleUomChange}>
            <SelectTrigger className='h-12 font-medium bg-background'>
              <SelectValue placeholder='Unit' />
            </SelectTrigger>
            <SelectContent>
              {uomOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='bg-background rounded-xl p-4 border border-primary/20 shadow-lg flex items-center justify-between transition-all duration-300 transform'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-1.5'>
            <div className='size-2 rounded-full bg-green-500 animate-pulse' />
            <span className='text-xs font-bold text-muted-foreground uppercase tracking-tight'>
              Stock Conversion Result
            </span>
          </div>
          <p className='text-[10px] text-muted-foreground leading-none italic'>
            Internally stored as {values.baseUom}
          </p>
        </div>
        <div className='text-right'>
          <p className='text-2xl font-black text-primary tabular-nums'>
            {internalQty.toLocaleString()}{' '}
            <span className='text-sm font-bold text-muted-foreground ml-1'>
              {values.baseUom}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
