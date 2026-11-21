// @vitest-environment jsdom
import { useForm } from '@tanstack/react-form'

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { createLineItem, LineItemEditor, type LineItem } from './line-item-editor.tsx'

afterEach(cleanup)

interface TestLine extends LineItem {
	material: string
	qty: string
}

const createRow = (): TestLine => createLineItem({ material: '', qty: '' })
const EMPTY_ROWS: TestLine[] = []

function Harness({
	initialRows = EMPTY_ROWS,
	minRows,
	addLabel,
}: {
	initialRows?: TestLine[]
	minRows?: number
	addLabel?: string
}) {
	const form = useForm({ defaultValues: { lines: initialRows } })
	return (
		<form.Field
			name="lines"
			mode="array"
			validators={{
				onChange: ({ value }) => (value.length === 0 ? 'At least one line is required' : undefined),
			}}
		>
			{(field) => (
				<>
					<LineItemEditor
						label="Items"
						rows={field.state.value}
						createRow={createRow}
						onAdd={(row) => field.pushValue(row)}
						onRemove={(index) => field.removeValue(index)}
						errors={field.state.meta.errors}
						fieldCount={3}
						emptyMessage="No items"
						minRows={minRows}
						addLabel={addLabel}
						actions={
							<button
								type="button"
								onClick={() => {
									field.pushValue(createLineItem({ material: 'Imported A', qty: '2' }))
									field.pushValue(createLineItem({ material: 'Imported B', qty: '3' }))
								}}
							>
								Import
							</button>
						}
						renderFields={(_, index) => (
							<>
								<form.Field name={`lines[${index}].material`}>
									{(material) => (
										<label>
											Material
											<input
												value={material.state.value}
												onBlur={material.handleBlur}
												onChange={(event) => material.handleChange(event.target.value)}
											/>
										</label>
									)}
								</form.Field>
								<form.Field name={`lines[${index}].qty`}>
									{(qty) => (
										<label>
											Quantity
											<input
												value={qty.state.value}
												onBlur={qty.handleBlur}
												onChange={(event) => qty.handleChange(event.target.value)}
											/>
										</label>
									)}
								</form.Field>
							</>
						)}
					/>
					<form.Subscribe selector={(state) => state.values.lines}>
						{(lines) => <output aria-label="Values">{JSON.stringify(lines)}</output>}
					</form.Subscribe>
				</>
			)}
		</form.Field>
	)
}

function values(): TestLine[] {
	return JSON.parse(screen.getByLabelText('Values').textContent!)
}

describe('LineItemEditor', () => {
	it('keeps row identity and edited values when deleting the middle row, then focuses the next row', async () => {
		const rows = [
			createLineItem({ material: 'Coffee', qty: '1' }),
			createLineItem({ material: 'Milk', qty: '2' }),
			createLineItem({ material: 'Sugar', qty: '3' }),
		]
		render(<Harness initialRows={rows} />)
		const originalLastRow = screen.getByRole('group', { name: 'Baris 3' })
		const material = within(originalLastRow).getByLabelText('Material')
		fireEvent.change(within(originalLastRow).getByLabelText('Quantity'), {
			target: { value: '3.75' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'Hapus baris 2' }))

		await waitFor(() => expect(screen.getAllByRole('group')).toHaveLength(2))
		expect(screen.getByRole('group', { name: 'Baris 2' })).toBe(originalLastRow)
		expect(document.activeElement).toBe(material)
		expect(values()).toEqual([rows[0], { ...rows[2], qty: '3.75' }])

		fireEvent.change(within(originalLastRow).getByLabelText('Quantity'), {
			target: { value: '4.5' },
		})
		expect(values()).toEqual([rows[0], { ...rows[2], qty: '4.5' }])
	})

	it('focuses new rows and returns focus to the previous row or add button on removal', async () => {
		render(<Harness />)
		const add = screen.getByRole('button', { name: 'Tambah Baris' })
		fireEvent.click(add)
		const firstRow = screen.getByRole('group', { name: 'Baris 1' })
		expect(document.activeElement).toBe(within(firstRow).getByLabelText('Material'))
		fireEvent.change(within(firstRow).getByLabelText('Material'), { target: { value: 'Coffee' } })
		fireEvent.click(add)
		const secondRow = screen.getByRole('group', { name: 'Baris 2' })
		expect(document.activeElement).toBe(within(secondRow).getByLabelText('Material'))
		expect(values()[0]?.clientKey).not.toBe(values()[1]?.clientKey)

		fireEvent.click(screen.getByRole('button', { name: 'Hapus baris 2' }))
		await waitFor(() =>
			expect(document.activeElement).toBe(within(firstRow).getByLabelText('Material')),
		)
		expect(values()[0]?.material).toBe('Coffee')
		fireEvent.click(screen.getByRole('button', { name: 'Hapus baris 1' }))
		await waitFor(() => expect(document.activeElement).toBe(add))
		expect(screen.getByText('No items')).toBeTruthy()
		expect(screen.getByRole('alert').textContent).toBe('At least one line is required')
	})

	it('focuses the first imported row and preserves imported values and independent keys', () => {
		render(<Harness />)
		fireEvent.click(screen.getByRole('button', { name: 'Import' }))
		const firstRow = screen.getByRole('group', { name: 'Baris 1' })
		expect(document.activeElement).toBe(within(firstRow).getByLabelText('Material'))
		expect(values().map(({ material, qty }) => ({ material, qty }))).toEqual([
			{ material: 'Imported A', qty: '2' },
			{ material: 'Imported B', qty: '3' },
		])
		expect(values()[0]?.clientKey).not.toBe(values()[1]?.clientKey)
	})

	it('keeps the required minimum rows removable only while more remain, with a custom add label', async () => {
		render(
			<Harness
				initialRows={[createLineItem({ material: 'Coffee', qty: '1' })]}
				minRows={1}
				addLabel="Tambah Bahan"
			/>,
		)
		const remove = screen.getByRole('button', { name: 'Hapus baris 1' }) as HTMLButtonElement
		expect(remove.disabled).toBe(true)
		fireEvent.click(screen.getByRole('button', { name: 'Tambah Bahan' }))
		await waitFor(() => expect(screen.getAllByRole('group')).toHaveLength(2))
		expect(
			(screen.getByRole('button', { name: 'Hapus baris 1' }) as HTMLButtonElement).disabled,
		).toBe(false)
		fireEvent.click(screen.getByRole('button', { name: 'Hapus baris 2' }))
		await waitFor(() => expect(screen.getAllByRole('group')).toHaveLength(1))
		expect(
			(screen.getByRole('button', { name: 'Hapus baris 1' }) as HTMLButtonElement).disabled,
		).toBe(true)
	})
})
