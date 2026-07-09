/**
 * Structured error payload shape returned by the server on failures.
 */
export interface ApiErrorDetails<T = unknown> {
	code: string | number
	message: string
	data: T
	trace: unknown
}

/**
 * Normalized error thrown by apiv2's `request()` helper for any
 * failed HTTP call (HTTP error responses, network failures, timeouts).
 *
 * Fixes two issues found in the legacy `lib/api/api-error.ts`:
 *   - `friendlyMessage` no longer throws when `status` is `undefined`
 *     (e.g. network/timeout errors) — it now returns a sensible fallback.
 *   - Adds `isNetworkError` to let consumers distinguish "no response
 *     at all" from a real HTTP status code.
 */
export class ApiError<TData = unknown> extends Error {
	public status?: number
	public details?: ApiErrorDetails<TData>

	constructor(message: string, status?: number, details?: ApiErrorDetails<TData>) {
		super(message)
		this.name = 'ApiError'
		this.status = status
		this.details = details

		// Ensure correct prototype chain for custom errors in TypeScript
		Object.setPrototypeOf(this, ApiError.prototype)
	}

	get isNetworkError(): boolean {
		return this.status === undefined
	}

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
			case 422:
				return 'Data yang Anda masukkan tidak sesuai validasi.'
			case 500:
				return 'Terjadi kesalahan pada server kami.'
			case undefined:
				return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
			default:
				return this.message || 'Terjadi kesalahan yang tidak terduga.'
		}
	}

	get isAuthError(): boolean {
		return this.status === 401 || this.status === 403
	}

	get isClientError(): boolean {
		return (this.status ?? 0) >= 400 && (this.status ?? 0) < 500
	}

	get isValidationError(): boolean {
		return this.status === 422
	}
}
