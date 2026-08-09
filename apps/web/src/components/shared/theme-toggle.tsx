import { MoonIcon, SunIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { useTheme } from '@/providers/theme-provider'

export function ThemeToggle() {
	const { setTheme } = useTheme()

	const onClick = () => {
		setTheme((t: string) => (t === 'light' ? 'dark' : 'light'))
	}

	return (
		<Button variant="ghost" size="icon-sm" onClick={onClick} aria-label="Toggle theme">
			<SunIcon className="size-4 scale-100 rotate-0 text-foreground opacity-100 transition-all duration-200 dark:scale-0 dark:-rotate-90 dark:opacity-0" />
			<MoonIcon className="absolute size-4 scale-0 rotate-90 text-foreground opacity-0 transition-all duration-200 dark:scale-100 dark:rotate-0 dark:opacity-100" />
		</Button>
	)
}
