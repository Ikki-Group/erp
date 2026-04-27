import type { ComponentProps } from 'react'

import { useNavigate } from '@tanstack/react-router'

import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { useFormConfig } from './form-config'
import { useFormContext } from './form-hook-context'

function Form(props: ComponentProps<'form'>) {
	const form = useFormContext()

	return (
		<form
			onSubmit={(e) => {
				e.stopPropagation()
				e.preventDefault()
				form.handleSubmit()
			}}
			{...props}
		/>
	)
}

function FormSimpleActions() {
	const { backTo } = useFormConfig()
	const form = useFormContext()
	const navigate = useNavigate()

	return (
		<Card size="sm" className="px-3 flex items-end ring-0">
			<div className="flex gap-2 max-w-72 w-full">
				<Button
					variant="outline"
					type="button"
					className="flex-1"
					onClick={() => {
						if (backTo) {
							navigate({ to: backTo.to!, search: backTo.search, params: backTo.params })
						} else {
							window.history.back()
						}
					}}
				>
					Batal
				</Button>
				<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
					{([canSubmit, isSubmitting]) => (
						<Button type="submit" disabled={!canSubmit || isSubmitting} className="flex-1 ">
							{isSubmitting ? 'Menyimpan...' : 'Simpan'}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</Card>
	)
}

interface FormDialogActionsProps {
	onCancel: () => void
	disabled?: boolean
}

function FormDialogActions({ onCancel, disabled }: FormDialogActionsProps) {
	const form = useFormContext()
	return (
		<>
			<Button variant="outline" type="button" onClick={onCancel} disabled={disabled}>
				Batal
			</Button>
			<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
				{([canSubmit, isSubmitting]) => (
					<Button
						type="submit"
						disabled={!canSubmit || isSubmitting || disabled}
					>
						{isSubmitting ? 'Menyimpan...' : 'Simpan'}
					</Button>
				)}
			</form.Subscribe>
		</>
	)
}

export { Form, FormSimpleActions, FormDialogActions }
