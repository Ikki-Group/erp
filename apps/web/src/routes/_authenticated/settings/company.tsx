import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { FormInput } from '@/components/form/form-input'
import { FormTextarea } from '@/components/form/form-textarea'
import { LoadingButton } from '@/components/shared/loading-button'
import { PageHeader } from '@/components/shared/page-header'
import { PageSkeleton } from '@/components/shared/page-skeleton'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'

import { companyCreate, companyDetail, companyUpdate } from '@/features/company/api.ts'
import { CompanySettingsCreateDto, CompanySettingsUpdateDto } from '@/features/company/dto/index.ts'

import { useHasPermission } from '@/providers/auth-provider.tsx'

export const Route = createFileRoute('/_authenticated/settings/company')({
	component: CompanySettingsPage,
})

interface FormValues {
	name: string
	address: string
	phone: string
	email: string
	taxId: string
	taxRate: string
	currencyCode: string
	currencySymbol: string
	receiptFooter: string
}

const EMPTY_FORM: FormValues = {
	name: '',
	address: '',
	phone: '',
	email: '',
	taxId: '',
	taxRate: '0',
	currencyCode: 'IDR',
	currencySymbol: 'Rp',
	receiptFooter: '',
}

function toFormValues(data: {
	name: string
	address: string | null
	phone: string | null
	email: string | null
	taxId: string | null
	taxRate: string
	currencyCode: string
	currencySymbol: string
	receiptFooter: string | null
}): FormValues {
	return {
		name: data.name ?? '',
		address: data.address ?? '',
		phone: data.phone ?? '',
		email: data.email ?? '',
		taxId: data.taxId ?? '',
		taxRate: data.taxRate ?? '0',
		currencyCode: data.currencyCode ?? 'IDR',
		currencySymbol: data.currencySymbol ?? 'Rp',
		receiptFooter: data.receiptFooter ?? '',
	}
}

function CompanySettingsPage() {
	const canWrite = useHasPermission('company:write')

	const detailQuery = useQuery(companyDetail.queryOptions(undefined, { retry: false }))
	const createMut = useMutation(companyCreate.mutationOptions())
	const updateMut = useMutation(companyUpdate.mutationOptions())

	const [values, setValues] = useState<FormValues>(EMPTY_FORM)
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [initialized, setInitialized] = useState(false)
	const baselineRef = useRef<FormValues>(EMPTY_FORM)

	const existing = detailQuery.data?.data
	const isCreate = !existing

	useEffect(() => {
		if (existing && !initialized) {
			const initial = toFormValues(existing)
			setValues(initial)
			baselineRef.current = initial
			setInitialized(true)
		}
	}, [existing, initialized])

	const isDirty = useMemo(() => {
		const baseline = baselineRef.current
		return (Object.keys(values) as Array<keyof FormValues>).some(
			(key) => values[key] !== baseline[key],
		)
	}, [values])

	useEffect(() => {
		if (!isDirty) return

		const handler = (e: BeforeUnloadEvent) => {
			e.preventDefault()
		}
		window.addEventListener('beforeunload', handler)
		return () => window.removeEventListener('beforeunload', handler)
	}, [isDirty])

	const update = useCallback((field: keyof FormValues, value: string) => {
		setValues((prev) => ({ ...prev, [field]: value }))
		setErrors((prev) => {
			const next = { ...prev }
			delete next[field]
			return next
		})
	}, [])

	const validate = useCallback((): boolean => {
		const payload = {
			...values,
			address: values.address || null,
			phone: values.phone || null,
			email: values.email || null,
			taxId: values.taxId || null,
			receiptFooter: values.receiptFooter || null,
		}

		const schema = isCreate ? CompanySettingsCreateDto : CompanySettingsUpdateDto
		const data = isCreate ? payload : { ...payload, id: existing!.id }
		const result = schema.safeParse(data)

		if (result.success) {
			setErrors({})
			return true
		}

		const fieldErrors: Record<string, string> = {}
		for (const issue of result.error.issues) {
			const path = issue.path[0]
			if (path && !fieldErrors[String(path)]) {
				fieldErrors[String(path)] = issue.message
			}
		}
		setErrors(fieldErrors)
		return false
	}, [values, isCreate, existing])

	const handleSubmit = useCallback(async () => {
		if (!validate()) return

		const payload = {
			...values,
			address: values.address || null,
			phone: values.phone || null,
			email: values.email || null,
			taxId: values.taxId || null,
			receiptFooter: values.receiptFooter || null,
		}

		try {
			if (isCreate) {
				await createMut.mutateAsync(payload)
				toast.add({ title: 'Company settings created.', type: 'success' })
			} else {
				await updateMut.mutateAsync({ ...payload, id: existing!.id })
				toast.add({ title: 'Company settings updated.', type: 'success' })
			}
			baselineRef.current = values
		} catch {
			toast.add({ title: 'Failed to save company settings.', type: 'error' })
		}
	}, [validate, values, isCreate, createMut, updateMut, existing])

	if (detailQuery.isLoading) {
		return <PageSkeleton />
	}

	const isSaving = createMut.isPending || updateMut.isPending

	return (
		<div className="space-y-6">
			<PageHeader
				title="Company Settings"
				description="Manage your company profile and tax configuration."
				actions={
					canWrite ? (
						<LoadingButton size="sm" loading={isSaving} disabled={!isDirty} onClick={handleSubmit}>
							Save Changes
						</LoadingButton>
					) : undefined
				}
			/>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Company Info</CardTitle>
						<CardDescription>Basic company identification details.</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4">
						<FormInput
							label="Company Name"
							value={values.name}
							onChange={(e) => update('name', e.target.value)}
							error={errors.name}
							placeholder="PT. Example"
							disabled={!canWrite}
						/>
						<FormInput
							label="Email"
							value={values.email}
							onChange={(e) => update('email', e.target.value)}
							error={errors.email}
							placeholder="info@company.com"
							disabled={!canWrite}
						/>
						<FormInput
							label="Phone"
							value={values.phone}
							onChange={(e) => update('phone', e.target.value)}
							error={errors.phone}
							placeholder="+62 812 3456 7890"
							disabled={!canWrite}
						/>
						<FormTextarea
							label="Address"
							value={values.address}
							onChange={(e) => update('address', e.target.value)}
							error={errors.address}
							placeholder="Jl. Example No. 1, Jakarta"
							disabled={!canWrite}
							rows={3}
						/>
					</CardContent>
				</Card>

				<div className="grid gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Tax & Currency</CardTitle>
							<CardDescription>Tax rate and currency settings.</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4">
							<FormInput
								label="Tax ID (NPWP)"
								value={values.taxId}
								onChange={(e) => update('taxId', e.target.value)}
								error={errors.taxId}
								placeholder="00.000.000.0-000.000"
								disabled={!canWrite}
							/>
							<FormInput
								label="Tax Rate (%)"
								value={values.taxRate}
								onChange={(e) => update('taxRate', e.target.value)}
								error={errors.taxRate}
								placeholder="11"
								description="Default tax rate applied to transactions"
								disabled={!canWrite}
							/>
							<div className="grid grid-cols-2 gap-4">
								<FormInput
									label="Currency Code"
									value={values.currencyCode}
									onChange={(e) => update('currencyCode', e.target.value)}
									error={errors.currencyCode}
									placeholder="IDR"
									disabled={!canWrite}
								/>
								<FormInput
									label="Currency Symbol"
									value={values.currencySymbol}
									onChange={(e) => update('currencySymbol', e.target.value)}
									error={errors.currencySymbol}
									placeholder="Rp"
									disabled={!canWrite}
								/>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Receipt</CardTitle>
							<CardDescription>Text displayed on printed receipts.</CardDescription>
						</CardHeader>
						<CardContent>
							<FormTextarea
								label="Receipt Footer"
								value={values.receiptFooter}
								onChange={(e) => update('receiptFooter', e.target.value)}
								error={errors.receiptFooter}
								placeholder="Thank you for your purchase!"
								disabled={!canWrite}
								rows={3}
							/>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
