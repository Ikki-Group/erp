import { useEffect } from 'react'

import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

export function ThemeListener() {
	useEffect(() => {
		const isIphone = /iPhone/i.test(navigator.userAgent)
		if (isIphone) {
			document
				.querySelector('meta[name="viewport"]')
				?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1')
		}
	}, [])

	return null
}

export function ThemeSwitcher() {
	const { setTheme } = useTheme()

	const onClick = () => {
		setTheme((t) => (t === 'light' ? 'dark' : 'light'))
	}

	return (
		<Button variant="outline" onClick={onClick} className="size-8 rounded-full">
			<SunIcon className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
			<MoonIcon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	)
}
