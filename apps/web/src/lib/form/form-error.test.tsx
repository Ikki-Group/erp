// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { z } from 'zod'

import { useEntityForm } from './use-entity-form'

function FailedSave() {
	const form = useEntityForm({
		defaultValues: { name: 'Coffee' },
		schema: z.object({ name: z.string().min(1) }),
		onSubmit: async () => {
			throw new Error('This code is already used.')
		},
	})
	return (
		<form.AppForm>
			<form.AppField name="name">{(field) => <field.TextField label="Name" />}</form.AppField>
			<form.FormError />
			<button type="button" onClick={() => void form.handleSubmit()}>
				Save
			</button>
		</form.AppForm>
	)
}

afterEach(cleanup)

it('announces the normalized submission error and keeps entered values editable', async () => {
	render(<FailedSave />)
	fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Coffee beans' } })
	fireEvent.click(screen.getByRole('button', { name: 'Save' }))
	expect((await screen.findByRole('alert')).textContent).toBe('This code is already used.')
	expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Coffee beans')
	fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New code' } })
	expect(screen.queryByRole('alert')).toBeNull()
})
