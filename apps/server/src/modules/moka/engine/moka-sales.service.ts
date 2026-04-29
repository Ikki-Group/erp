import type { MokaSalesDetailRaw, MokaSalesListResponse } from '../scrap/scrap-raw.types'
import { MokaSalesDetailRawDto } from '../scrap/scrap.dto'
import type { MokaAuthEngine } from './moka-auth.service'
import { MokaBaseEngine, type IMokaEngine } from './moka-engine'
import { expandDates } from './moka-utils'
import type { Logger } from 'pino'

export class MokaSalesEngine extends MokaBaseEngine implements IMokaEngine<MokaSalesDetailRaw> {
	private batchSize = 10

	constructor(
		auth: MokaAuthEngine,
		logger: Logger,
		private readonly dateRange: { from: Date; to: Date },
		private readonly cursorDate?: Date | null,
	) {
		super(auth, logger)
	}

	async fetch(): Promise<MokaSalesDetailRaw[]> {
		await this.auth.ensureAuthenticated()

		// Use cursor date for incremental sync if available
		const fromDate = this.cursorDate ?? this.dateRange.from
		const days = expandDates(fromDate, this.dateRange.to)
		this.logger.info({ days }, 'Moka Sales Engine: Starting fetch')

		const tokens = new Set<string>()
		for (const day of days) {
			try {
				const dayTokens = await this.fetchOrderTokensForDay(day)
				dayTokens.forEach((t) => tokens.add(t))
			} catch (error: unknown) {
				const msg = error instanceof Error ? error.message : String(error)
				this.logger.error({ day, err: msg }, 'Moka Sales Engine: Failed to fetch tokens for day')
			}
		}

		const tokensArray = Array.from(tokens)
		this.logger.info({ total: tokensArray.length }, 'Moka Sales Engine: Fetched order tokens')

		const results: MokaSalesDetailRaw[] = []
		for (let i = 0; i < tokensArray.length; i += this.batchSize) {
			const batch = tokensArray.slice(i, i + this.batchSize)
			try {
				const details = await Promise.all(batch.map((token) => this.fetchOrderDetail(token)))
				results.push(...details)
			} catch (error: unknown) {
				const msg = error instanceof Error ? error.message : String(error)
				this.logger.error({ batch, err: msg }, 'Moka Sales Engine: Failed to fetch batch details')
			}
		}

		return results
	}

	private async fetchOrderTokensForDay(day: string): Promise<string[]> {
		const api = await this.getApi()
		const tokens = new Set<string>()
		let cursor: string | undefined = undefined
		let completed = false

		while (!completed) {
			const response = await api.get<MokaSalesListResponse>(
				'/order-reporting/backoffice/v1/orders',
				{
					params: { start_time: `${day}T00:00:00`, end_time: `${day}T23:59:59`, cursor },
					headers: this.getHeaders('OUTLET'),
				},
			)

			const data: MokaSalesListResponse = response.data
			const orders = data.orders
			const nextCursor: string | null = data.next_cursor

			orders.forEach((o: { order_token: string }) => tokens.add(o.order_token))
			cursor = nextCursor ?? undefined
			completed = !nextCursor
		}

		return Array.from(tokens)
	}

	private async fetchOrderDetail(token: string): Promise<MokaSalesDetailRaw> {
		const api = await this.getApi()
		const response = await api.get<unknown>(`/order-reporting/backoffice/v1/orders/${token}`, {
			headers: this.getHeaders('OUTLET'),
		})
		return MokaSalesDetailRawDto.parse(response.data) as unknown as MokaSalesDetailRaw
	}
}
