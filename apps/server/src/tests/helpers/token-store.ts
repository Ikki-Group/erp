import type { AuthLoginResponse } from './test-types'

export class TokenStore {
	private readonly store = new Map<string, AuthLoginResponse>()

	register(label: string, data: AuthLoginResponse): void {
		this.store.set(label, data)
	}

	get(label: string): AuthLoginResponse | undefined {
		return this.store.get(label)
	}

	has(label: string): boolean {
		return this.store.has(label)
	}

	clear(): void {
		this.store.clear()
	}
}
