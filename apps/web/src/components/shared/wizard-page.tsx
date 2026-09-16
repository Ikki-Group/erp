import type { ReactNode } from 'react'
import { useState } from 'react'

import { useStore } from '@tanstack/react-form'
import type { AnyFormApi } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'

import { ArrowLeftIcon, CheckIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import {
	Stepper,
	StepperIndicator,
	StepperItem,
	StepperNav,
	StepperSeparator,
	StepperTitle,
	StepperTrigger,
} from '@/components/reui/stepper'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export interface WizardStep {
	title: string
	/** The step's body. Only the active step's body is mounted. */
	content: ReactNode
	/** Whether the wizard can move past this step. Re-evaluated on every render. */
	isValid: boolean
}

export interface WizardPageProps {
	title: string
	description?: string
	/** The form instance driving the final submit — submitting state read from it automatically. */
	form: AnyFormApi
	steps: WizardStep[]
	onCancel?: () => void
	submitLabel?: string
	cancelLabel?: string
	className?: string
}

/**
 * The standard layout for a full-page multi-step create flow: a `Stepper`
 * nav across the top, one step's body at a time, and Back/Next/Submit
 * controls in a sticky footer. Reach for this instead of `FormPage` when a
 * single dense form would otherwise cram together unrelated concerns (e.g.
 * "which supplier" + "which items" + "review totals") — receiving and
 * transfer documents are the reference case.
 *
 * Each step only gates forward navigation (`isValid`); the underlying
 * `useEntityForm` schema still runs — and is the source of truth — at final
 * submit, so a step can't be gamed by tabbing between steps.
 *
 * ```tsx
 * const form = useReceivingWizard({ onSubmit: ... })
 * <form.AppForm>
 *   <WizardPage
 *     title="Buat Penerimaan"
 *     form={form}
 *     steps={[
 *       { title: 'Supplier', content: <ReceivingStepSupplier form={form} />, isValid: ... },
 *       { title: 'Item', content: <ReceivingStepLines form={form} />, isValid: ... },
 *       { title: 'Review', content: <ReceivingStepReview form={form} />, isValid: true },
 *     ]}
 *     onCancel={() => navigate({ to: '/inventory/receiving' })}
 *   />
 * </form.AppForm>
 * ```
 */
export function WizardPage({
	title,
	description,
	form,
	steps,
	onCancel,
	submitLabel = 'Simpan',
	cancelLabel = 'Batal',
	className,
}: WizardPageProps) {
	const router = useRouter()
	const [activeStep, setActiveStep] = useState(1)
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

	const isLastStep = activeStep === steps.length
	const currentStep = steps[activeStep - 1]
	const canAdvance = currentStep?.isValid ?? false

	const handleCancel = () => {
		if (onCancel) {
			onCancel()
			return
		}
		router.history.back()
	}

	const handleBack = () => {
		if (activeStep === 1) {
			handleCancel()
			return
		}
		setActiveStep((s) => s - 1)
	}

	const handleNext = () => {
		if (!canAdvance) return
		if (isLastStep) {
			void form.handleSubmit()
			return
		}
		setActiveStep((s) => Math.min(s + 1, steps.length))
	}

	return (
		<div className={cn('mx-auto max-w-3xl space-y-6 pb-20', className)}>
			<div className="space-y-1">
				<Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={handleCancel}>
					<ArrowLeftIcon className="size-3.5" />
					{cancelLabel}
				</Button>
				<h1 className="text-lg font-semibold tracking-tight">{title}</h1>
				{description && <p className="text-xs text-muted-foreground">{description}</p>}
			</div>

			<Stepper value={activeStep} onValueChange={setActiveStep}>
				<StepperNav>
					{steps.map((step, i) => (
						<StepperItem key={step.title} step={i + 1} className="relative">
							<StepperTrigger disabled={i + 1 > activeStep && !isStepReachable(steps, i)}>
								<StepperIndicator>
									{i + 1 < activeStep ? <CheckIcon className="size-3.5" /> : i + 1}
								</StepperIndicator>
								<StepperTitle>{step.title}</StepperTitle>
							</StepperTrigger>
							{i < steps.length - 1 && <StepperSeparator />}
						</StepperItem>
					))}
				</StepperNav>
			</Stepper>

			<form
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					if (isLastStep) void form.handleSubmit()
				}}
				className="space-y-6"
			>
				{currentStep?.content}

				<div className="sticky bottom-0 -mx-2 flex items-center justify-end gap-2 border-t bg-background/95 px-2 py-4 backdrop-blur">
					<Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
						{activeStep === 1 ? cancelLabel : 'Kembali'}
					</Button>
					<Button type="button" onClick={handleNext} disabled={isSubmitting || !canAdvance}>
						{isSubmitting && <Spinner className="mr-1.5 size-3.5" />}
						{isLastStep ? submitLabel : 'Lanjut'}
					</Button>
				</div>
			</form>
		</div>
	)
}

/** A step is reachable by clicking its nav trigger once every step before it validates. */
function isStepReachable(steps: WizardStep[], index: number): boolean {
	for (let i = 0; i < index; i++) {
		if (!steps[i]?.isValid) return false
	}
	return true
}
