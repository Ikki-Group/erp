// @vitest-environment jsdom
import { useState } from 'react'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'

import { DetailBoundary } from './detail-boundary'

afterEach(cleanup)

function Editor({ value }: { value: string }) {
	const [draft, setDraft] = useState(value)
	return (
		<input
			aria-label="Draft name"
			value={draft}
			onChange={(event) => setDraft(event.target.value)}
		/>
	)
}

it('retains the mounted editor when a background refresh fails and recovers', () => {
	let retries = 0
	const query = {
		data: { name: 'Original' },
		isLoading: false,
		isError: false,
		error: null,
		refetch: async () => {
			retries++
			return {} as never
		},
	}
	const { rerender } = render(
		<DetailBoundary query={query}>{(data) => <Editor value={data.name} />}</DetailBoundary>,
	)
	fireEvent.change(screen.getByLabelText('Draft name'), { target: { value: 'Unsaved edit' } })
	rerender(
		<DetailBoundary query={{ ...query, isError: true, error: new Error('offline') }}>
			{(data) => <Editor value={data.name} />}
		</DetailBoundary>,
	)
	expect((screen.getByLabelText('Draft name') as HTMLInputElement).value).toBe('Unsaved edit')
	fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
	expect(retries).toBe(1)
	rerender(
		<DetailBoundary query={{ ...query, data: { name: 'Updated elsewhere' } }}>
			{(data) => <Editor value={data.name} />}
		</DetailBoundary>,
	)
	expect((screen.getByLabelText('Draft name') as HTMLInputElement).value).toBe('Unsaved edit')
})
