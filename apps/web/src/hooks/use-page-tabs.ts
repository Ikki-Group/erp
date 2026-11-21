import { useCallback } from 'react'

/**
 * Hook to sync PageTabs activeTab with URL search params.
 * Accepts a search object from Route.useSearch() and a navigate function.
 *
 * @param search - The search object from Route.useSearch()
 * @param navigate - The navigate function from Route.useNavigate() or useNavigate()
 * @param tabKey - The search param key to use (default: "tab")
 * @param defaultTab - Fallback tab ID when param is missing/invalid
 * @param validTabs - Optional array of valid tab IDs; if provided, invalid values fall back to defaultTab
 *
 * @returns [activeTab, setActiveTab] — compatible with PageTabs onTabChange signature
 *
 * @example
 * ```tsx
 * const search = Route.useSearch()
 * const navigate = Route.useNavigate()
 * const [activeTab, setActiveTab] = usePageTabs(search, navigate, 'tab', 'info', ['info', 'stock', 'history', 'pricing'])
 * return <PageTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
 * ```
 */
export function usePageTabs<T extends string>(
	search: Record<string, unknown>,
	navigate: (options: {
		search: (prev: Record<string, unknown>) => Record<string, unknown>
	}) => void,
	tabKey: string = 'tab',
	defaultTab: T = 'info' as T,
	validTabs?: readonly T[],
): [T, (tabId: T) => void] {
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
