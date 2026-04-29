import axios, {
	type AxiosError,
	type AxiosInstance,
	type InternalAxiosRequestConfig,
	type RawAxiosRequestHeaders,
} from 'axios'

import type { MokaLoginResponse } from '../scrap/scrap-raw.types'
import type { Logger } from 'pino'

const BASE_URL = 'https://backoffice.mokapos.com'
const AUTH_URL = 'https://service-goauth.mokapos.com'

const BASE_HEADERS: RawAxiosRequestHeaders = {
	accept: 'application/json, text/plain, */*',
	'accept-language': 'en-US,en;q=0.5',
	'content-type': 'application/json',
	'sec-fetch-dest': 'empty',
	'sec-fetch-mode': 'cors',
	'sec-fetch-site': 'same-site',
}

interface MokaAxiosConfig extends InternalAxiosRequestConfig {
	_retry?: boolean
}

export class MokaAuthEngine {
	private api: AxiosInstance
	public token: string | null = null
	public mokaOutletId: string | null = null

	constructor(
		private readonly logger: Logger,
		private readonly credentials: { email: string; password: string },
	) {
		this.api = axios.create({ baseURL: BASE_URL })

		// Add 401 interceptor for auto-relogin
		this.api.interceptors.response.use(
			(response) => response,
			async (error: AxiosError) => {
				const config = error.config as MokaAxiosConfig | undefined
				if (error.response?.status === 401 && config && !config._retry) {
					config._retry = true
					await this.login()
					if (config.headers) {
						config.headers['Authorization'] = `${this.token}`
					}
					return this.api.request(config)
				}
				throw error
			},
		)
	}

	buildHeaders(mode: 'AUTHENTICATED' | 'OUTLET' | 'GUEST' = 'GUEST'): RawAxiosRequestHeaders {
		const headers = { ...BASE_HEADERS }
		if (mode === 'AUTHENTICATED' || mode === 'OUTLET') {
			if (!this.token) throw new Error('Not authenticated')
			headers['Authorization'] = `${this.token}`
			if (mode === 'OUTLET' && this.mokaOutletId) {
				headers['Outlet_id'] = `${this.mokaOutletId}`
			}
		}
		return headers
	}

	async login(): Promise<MokaLoginResponse> {
		this.logger.info({ email: this.credentials.email }, 'Logging into Moka')

		try {
			const response = await axios.post<MokaLoginResponse>(
				`${AUTH_URL}/account/v2/login`,
				{ session: this.credentials },
				{ headers: BASE_HEADERS },
			)

			const result = response.data
			this.token = result.access_token
			this.mokaOutletId = result.outlets[0]?.id?.toString() ?? null

			this.logger.info({ outletId: this.mokaOutletId }, 'Moka login successful')
			return result
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : String(error)
			this.logger.error({ err: msg }, 'Moka login failed')
			throw new Error(`Moka login failed: ${msg}`, { cause: error })
		}
	}

	async ensureAuthenticated() {
		if (!this.token) {
			await this.login()
		}
	}

	async getApi(): Promise<AxiosInstance> {
		await this.ensureAuthenticated()
		return this.api
	}
}
