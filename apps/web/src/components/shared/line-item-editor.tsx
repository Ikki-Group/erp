import { useId, useLayoutEffect, useRef, type ReactNode } from 'react'

import { PlusIcon, Trash2Icon } from 'lucide-react'

import { formatFieldError, type FieldErrors } from '@/lib/form/field-error.tsx'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'

export interface LineItem {
	/** Created once with the row; never included in a mutation DTO. */
	clientKey: string
}

export function createLineItem<T extends object>(values: T): T & LineItem {
	return { ...values, clientKey: crypto.randomUUID() }
}

interface LineItemEditorProps<T extends LineItem> {
	label: string
	rows: readonly T[]
	createRow: () => T
	onAdd: (row: T) => void
	onRemove: (index: number) => void
	renderFields: (row: T, index: number) => ReactNode
	fieldCount: 3 | 4
	errors?: FieldErrors
	actions?: ReactNode
	emptyMessage: string
	/** Label of the add button. Defaults to "Tambah Baris". */
	addLabel?: string
	/** Rows that cannot be removed (their remove buttons are disabled). Defaults to 0. */
	minRows?: number
}

/** Owns array interaction and layout; callers keep their fields and business rules. */
export function LineItemEditor<T extends LineItem>({
	label,
	rows,
	createRow,
	onAdd,
	onRemove,
	renderFields,
	fieldCount,
	errors,
	actions,
	emptyMessage,
	addLabel = 'Tambah Baris',
	minRows = 0,
}: LineItemEditorProps<T>) {
	const id = useId()
	const error = formatFieldError(errors)
	const rowElements = useRef(new Map<string, HTMLDivElement>())
	const addButton = useRef<HTMLButtonElement>(null)
	const previousKeys = useRef(new Set(rows.map((row) => row.clientKey)))
	const removalFocus = useRef<string | null | undefined>(undefined)

	useLayoutEffect(() => {
		const addedRow = rows.find((row) => !previousKeys.current.has(row.clientKey))
		const targetKey = removalFocus.current ?? addedRow?.clientKey
		if (targetKey) {
			rowElements.current
				.get(targetKey)
				?.querySelector<HTMLElement>(
					'input:not([disabled]):not([type="hidden"]), button:not([disabled]), select:not([disabled]), textarea:not([disabled])',
				)
				?.focus()
		} else if (removalFocus.current === null) {
			addButton.current?.focus()
		}
		removalFocus.current = undefined
		previousKeys.current = new Set(rows.map((row) => row.clientKey))
	}, [rows])

	return (
		<section
			aria-labelledby={`${id}-label`}
			aria-describedby={error ? `${id}-error` : undefined}
			className="min-w-0 space-y-3"
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h3 id={`${id}-label`} className="text-sm font-medium">
					{label}
				</h3>
				<div className="flex flex-wrap gap-2">
					{actions}
					<Button
						ref={addButton}
						type="button"
						size="sm"
						variant="outline"
						onClick={() => onAdd(createRow())}
					>
						<PlusIcon className="size-3.5" />
						{addLabel}
					</Button>
				</div>
			</div>
			{rows.length === 0 && (
				<p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
					{emptyMessage}
				</p>
			)}
			<div className="space-y-3">
				{rows.map((row, index) => (
					<fieldset key={row.clientKey} className="min-w-0 rounded-md border p-3">
						<legend className="sr-only">Baris {index + 1}</legend>
						<div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
							<div
								ref={(element) => {
									if (element) rowElements.current.set(row.clientKey, element)
									else rowElements.current.delete(row.clientKey)
								}}
								className={cn(
									'grid min-w-0 gap-3 sm:grid-cols-2 [&>*]:min-w-0',
									fieldCount === 4
										? 'lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]'
										: 'lg:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]',
								)}
							>
								{renderFields(row, index)}
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="justify-self-end lg:mt-6"
								aria-label={`Hapus baris ${index + 1}`}
								onClick={() => {
									removalFocus.current =
										rows[index + 1]?.clientKey ?? rows[index - 1]?.clientKey ?? null
									onRemove(index)
								}}
								disabled={rows.length <= minRows}
							>
								<Trash2Icon className="size-4" />
							</Button>
						</div>
					</fieldset>
				))}
			</div>
			{error && (
				<p id={`${id}-error`} role="alert" className="text-sm text-destructive">
					{error}
				</p>
			)}
		</section>
	)
}
