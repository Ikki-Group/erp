import { type ReactNode } from 'react'

export function ChartContainer({ children }: { children: ReactNode }) {
	return <div className="w-full h-full">{children}</div>
}
