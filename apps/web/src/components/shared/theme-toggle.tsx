import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useTheme } from '@/providers/theme-provider'

const OPTIONS = [
	{ value: 'light', label: 'Light', icon: SunIcon },
	{ value: 'dark', label: 'Dark', icon: MoonIcon },
	{ value: 'system', label: 'System', icon: MonitorIcon },
] as const

export function ThemeToggle() {
	const { theme = 'system', setTheme } = useTheme()
	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Theme" />}>
				<SunIcon className="size-4 dark:hidden" />
				<MoonIcon className="hidden size-4 dark:block" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-32">
				<DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(String(value))}>
					{OPTIONS.map(({ value, label, icon: Icon }) => (
						<DropdownMenuRadioItem key={value} value={value}>
							<Icon />
							{label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
