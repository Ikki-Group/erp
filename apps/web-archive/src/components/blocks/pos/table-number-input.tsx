import { Input } from '@/components/ui/input'

interface TableNumberInputProps {
	value: string | null
	onChange: (value: string) => void
}

export function TableNumberInput({ value, onChange }: TableNumberInputProps) {
	return (
		<div className="flex items-center gap-2">
			<span className="text-sm text-muted-foreground">No. Meja:</span>
			<Input
				type="text"
				placeholder="Nomor meja"
				value={value ?? ''}
				onChange={(e) => onChange(e.target.value)}
				className="w-[150px]"
			/>
		</div>
	)
}
