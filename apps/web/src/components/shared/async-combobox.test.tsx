// @vitest-environment jsdom

import { useState } from 'react'

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AsyncCombobox } from './async-combobox'
import type { AsyncComboboxOption } from './async-combobox'

const first = { label: 'First material', value: '1' }
const second = { label: 'Second material', value: '2' }

afterEach(cleanup)

describe('AsyncCombobox', () => {
	it('hides the previous search immediately while debouncing and only selects current results', async () => {
		const selected = vi.fn<(value: AsyncComboboxOption | null) => void>()
		function Harness() {
			const [options, setOptions] = useState<AsyncComboboxOption[]>([first])
			return (
				<>
					<label htmlFor="lookup">Material</label>
					<AsyncCombobox
						id="lookup"
						aria-label="Material"
						options={options}
						onValueChange={selected}
						onSearchChange={(query) => setOptions(query ? [second] : [first])}
					/>
				</>
			)
		}
		render(<Harness />)
		const input = screen.getByRole('combobox', { name: 'Material' })
		fireEvent.mouseDown(input, { button: 0 })
		await screen.findByRole('option', { name: 'First material' })
		expect(screen.getByRole('listbox', { name: 'Material' })).toBeTruthy()
		expect(screen.getByRole('combobox', { name: 'Material' })).toBe(input)
		fireEvent.change(input, { target: { value: 'Second' } })
		expect(screen.queryByRole('option', { name: 'First material' })).toBeNull()
		expect(screen.getByRole('status').textContent).toBe('Searching...')
		fireEvent.keyDown(input, { key: 'Enter' })
		expect(selected).not.toHaveBeenCalled()

		const option = await screen.findByRole('option', { name: 'Second material' })
		fireEvent.click(option)
		expect(selected).toHaveBeenCalledWith(second)
	})

	it('shows a recoverable failure instead of empty results and preserves input accessibility', async () => {
		const retry = vi.fn<() => void>()
		const blur = vi.fn<() => void>()
		render(
			<>
				<label htmlFor="lookup">Material</label>
				<p id="lookup-hint">Choose a material.</p>
				<AsyncCombobox
					id="lookup"
					aria-label="Material"
					aria-describedby="lookup-hint"
					aria-invalid
					onBlur={blur}
					options={[]}
					onSearchChange={() => {}}
					onValueChange={() => {}}
					errorMessage="Could not load results. Try again."
					onRetry={retry}
				/>
			</>,
		)
		const input = screen.getByRole('combobox', { name: 'Material' })
		expect(input.getAttribute('aria-describedby')).toBe('lookup-hint')
		expect(input.getAttribute('aria-invalid')).toBe('true')
		fireEvent.mouseDown(input, { button: 0 })
		await screen.findByRole('alert')
		expect(screen.queryByText('No results found.')).toBeNull()
		fireEvent.click(screen.getByRole('button', { name: 'Retry search' }))
		expect(retry).toHaveBeenCalledOnce()
		fireEvent.blur(input)
		await waitFor(() => expect(blur).toHaveBeenCalled())
	})
})
