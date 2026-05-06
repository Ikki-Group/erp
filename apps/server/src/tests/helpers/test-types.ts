/** Common API response types for tests */

export interface ApiResponse<T = unknown> {
	success: boolean
	data: T
	meta?: {
		page: number
		limit: number
		total: number
	}
}

export interface AuthLoginResponse {
	token: string
	user: {
		id: number
		email: string
	}
}

export interface LocationData {
	id: number
	code: string | null
	name: string
	type: string
	description: string | null
	address: string | null
	phone: string | null
	isActive: boolean
}
