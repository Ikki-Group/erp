/* -------------------------------------------------------------------------- */
/*  ApiError — normalized HTTP / network failure                              */
/* -------------------------------------------------------------------------- */

/** Structured error payload shape returned by the server on failures. */
export interface ApiErrorPayload<T = unknown> {
	code: string | number
	message: string
	data?: T
	trace?: unknown
}

export interface ApiErrorOptions<T = unknown> {
	status?: number
	code?: string | number
	data?: T
	trace?: unknown
	cause?: unknown
}

/**
 * Normalized error thrown for any failed HTTP call — HTTP error responses,
 * network failures, and timeouts alike.
 */
export class ApiError<TData = unknown> extends Error {
	readonly status?: number
	readonly code?: string | number
	readonly data?: TData
	readonly trace?: unknown

	constructor(message: string, options: ApiErrorOptions<TData> = {}) {
		super(message, options.cause === undefined ? undefined : { cause: options.cause })
		this.name = 'ApiError'
		this.status = options.status
		this.code = options.code
		this.data = options.data
		this.trace = options.trace

		Object.setPrototypeOf(this, ApiError.prototype)
	}

	/** Builds an `ApiError` from the server's structured error envelope. */
	static fromPayload(payload: ApiErrorPayload, status?: number): ApiError {
		return new ApiError(payload.message, {
			status,
			code: payload.code,
			data: payload.data,
			trace: payload.trace,
		})
	}

	/** `true` when the request never reached the server (offline, DNS, CORS, timeout). */
	get isNetworkError(): boolean {
		return this.status === undefined
	}

	get isAuthError(): boolean {
		return this.status === 401 || this.status === 403
	}

	get isNotFound(): boolean {
		return this.status === 404
	}

	get isClientError(): boolean {
		return (this.status ?? 0) >= 400 && (this.status ?? 0) < 500
	}

	get isServerError(): boolean {
		return (this.status ?? 0) >= 500
	}

	/** `true` when the server rejected the request body (422 — semantic validation). */
	get isValidationError(): boolean {
		return this.status === 422
	}

	/** Localized, user-safe message — never throws, always has a sensible fallback. */
	get friendlyMessage(): string {
		switch (this.status) {
			case 400:
				return 'Permintaan tidak valid.'
			case 401:
				return 'Sesi telah berakhir, silakan login kembali.'
			case 403:
				return 'Anda tidak memiliki izin untuk akses ini.'
			case 404:
				return 'Data atau halaman tidak ditemukan.'
			case 409:
				return 'Data mengalami konflik, silakan muat ulang halaman.'
			case 422:
				return 'Data yang Anda masukkan tidak sesuai validasi.'
			case 429:
				return 'Terlalu banyak permintaan, silakan coba lagi sebentar.'
			case 500:
			case 502:
			case 503:
			case 504:
				return 'Terjadi kesalahan pada server kami.'
			case undefined:
				return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
			default:
				return this.message || 'Terjadi kesalahan yang tidak terduga.'
		}
	}
}

export function isApiError(error: unknown): error is ApiError {
	return error instanceof ApiError
}
