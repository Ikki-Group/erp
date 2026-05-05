import { type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function CardStat({ title, value, icon: Icon }: { title: string; value: string | number; icon: LucideIcon }) {
	return (
		<Card className="p-4 flex items-center gap-3">
			<div className="rounded-full bg-primary/10 p-2">
				<Icon className="h-5 w-5 text-primary" />
			</div>
			<div>
				<div className="text-sm text-muted-foreground">{title}</div>
				<div className="text-lg font-semibold">{value}</div>
			</div>
		</Card>
	)
}
