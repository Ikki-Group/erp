import { useCallback } from 'react'

import { useSearch } from '@tanstack/react-router'

/**
 * Hook to sync PageTabs activeTab with URL search params.
 * Works on any route — no search schema required.
 *
 * @param tabKey - The search param key to use (default: "tab")
 * @param defaultTab - Fallback tab ID when param is missing/invalid
 * @param validTabs - Optional array of valid tab IDs; if provided, invalid values fall back to defaultTab
 *
 * @returns [activeTab, setActiveTab] — compatible with PageTabs onTabChange signature
 *
 * @example
 * ```tsx
 * const [activeTab, setActiveTab] = usePageTabs('tab', 'info', ['info', 'stock', 'history', 'pricing'])
 * return <PageTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
 * ```
 */
export function usePageTabs<T extends string>(
	tabKey: string = 'tab',
	defaultTab: T = 'info' as T,
	validTabs?: readonly T[],
): [T, (tabId: T) => void] {
	const { search, navigate } = useSearch()

	const activeTab = (search[tabKey] as T | undefined) ?? defaultTab

	const setActiveTab = useCallback(
		(tabId: T) => {
			if (validTabs && !validTabs.includes(tabId)) return
			navigate({
				search: (prev) => ({ ...prev, [tabKey]: tabId }),
			})
		},
		[navigate, tabKey, validTabs],
	)

	return [activeTab, setActiveTab]
}
