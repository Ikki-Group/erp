import { cn } from '@/lib/utils'

interface LogoProps {
	className?: string
	showText?: boolean
	variant?: 'transparent' | 'themed'
}

export function Logo({ className, showText = true, variant = 'themed' }: LogoProps) {
	return (
		<div className={cn('flex items-center gap-2', className)}>
			{variant === 'themed' ? (
				<>
					<img
						src="/logo-light.png"
						alt="Ikki ERP"
						className="size-8 rounded-lg object-contain dark:hidden"
						draggable={false}
					/>
					<img
						src="/logo-dark.png"
						alt="Ikki ERP"
						className="size-8 rounded-lg object-contain hidden dark:block"
						draggable={false}
					/>
					{showText && <span className="truncate text-sm font-semibold">Ikki ERP</span>}
					</>
				) : (
					<>
						<img
							src="/logo.png"
							alt="Ikki ERP"
							className="size-8 rounded-lg object-contain"
							draggable={false}
						/>
						{showText && <span className="truncate text-sm font-semibold">Ikki ERP</span>}
					</>
					)}
		</div>
	)
}
