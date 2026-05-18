import { record } from '@elysiajs/opentelemetry'
import { and, count, eq } from 'drizzle-orm'

import { locationPaymentMethodsTable, locationsTable, paymentMethodsTable } from '@/db/schema'

import {
	paginate,
	sortBy,
	stampCreate,
	stampUpdate,
	type DbClient,
	type WithPaginationResult,
} from '@/infra/database'
import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'

import type {
	LocationPaymentMethodCreateDto,
	LocationPaymentMethodDto,
	LocationPaymentMethodFilterDto,
	LocationPaymentMethodUpdateDto,
} from './location-payment-method.dto'

export class LocationPaymentMethodRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<LocationPaymentMethodDto | undefined> {
		return record('LocationPaymentMethodRepo.getById', async () => {
			const result = await this.db
				.select()
				.from(locationPaymentMethodsTable)
				.where(eq(locationPaymentMethodsTable.id, id))
			if (result.length === 0) return undefined
			return LocationPaymentMethodDto.parse(result[0])
		})
	}

	async getByLocation(locationId: number): Promise<LocationPaymentMethodDto[]> {
		return record('LocationPaymentMethodRepo.getByLocation', async () => {
			const rows = await this.db
				.select()
				.from(locationPaymentMethodsTable)
				.where(eq(locationPaymentMethodsTable.locationId, locationId))
				.orderBy(locationPaymentMethodsTable.isDefault, locationPaymentMethodsTable.createdAt)
			return rows.map((r) => LocationPaymentMethodDto.parse(r))
		})
	}

	async getListPaginated(
		filter: LocationPaymentMethodFilterDto,
	): Promise<WithPaginationResult<LocationPaymentMethodDto>> {
		return record('LocationPaymentMethodRepo.getListPaginated', async () => {
			const { page, limit, locationId, paymentMethodId, paymentProviderId, isEnabled } = filter

			const conditions = []
			if (locationId) conditions.push(eq(locationPaymentMethodsTable.locationId, locationId))
			if (paymentMethodId)
				conditions.push(eq(locationPaymentMethodsTable.paymentMethodId, paymentMethodId))
			if (paymentProviderId)
				conditions.push(eq(locationPaymentMethodsTable.paymentProviderId, paymentProviderId))
			if (isEnabled !== undefined)
				conditions.push(eq(locationPaymentMethodsTable.isEnabled, isEnabled))

			const where = conditions.length > 0 ? and(...conditions) : undefined

			return paginate({
				data: async ({ limit: l, offset }) => {
					const rows = await this.db
						.select()
						.from(locationPaymentMethodsTable)
						.where(where)
						.orderBy(sortBy(locationPaymentMethodsTable.createdAt, 'desc'))
						.limit(l)
						.offset(offset)
					return rows.map((r) => LocationPaymentMethodDto.parse(r))
				},
				pq: { page, limit },
				countQuery: this.db
					.select({ count: count() })
					.from(locationPaymentMethodsTable)
					.where(where),
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: LocationPaymentMethodCreateDto, actorId: string): Promise<{ id: number }> {
		return record('LocationPaymentMethodRepo.create', async () => {
			// Validate location exists and is a store
			const location = await this.db
				.select()
				.from(locationsTable)
				.where(eq(locationsTable.id, data.locationId))
			if (location.length === 0) {
				throw new NotFoundError(
					`Location with ID ${data.locationId} not found`,
					'LOCATION_NOT_FOUND',
				)
			}
			if (location[0].type !== 'store') {
				throw new BadRequestError(
					'Payment methods can only be configured for store locations',
					'INVALID_LOCATION_TYPE',
				)
			}

			// Validate payment method exists
			const paymentMethod = await this.db
				.select()
				.from(paymentMethodsTable)
				.where(eq(paymentMethodsTable.id, data.paymentMethodId))
			if (paymentMethod.length === 0) {
				throw new NotFoundError(
					`Payment method with ID ${data.paymentMethodId} not found`,
					'PAYMENT_METHOD_NOT_FOUND',
				)
			}

			// If setting as default, unset other defaults for this location
			if (data.isDefault) {
				await this.db
					.update(locationPaymentMethodsTable)
					.set({ isDefault: false })
					.where(
						and(
							eq(locationPaymentMethodsTable.locationId, data.locationId),
							eq(locationPaymentMethodsTable.isDefault, true),
						),
					)
			}

			const [inserted] = await this.db
				.insert(locationPaymentMethodsTable)
				.values({
					...data,
					enabledAt: data.isEnabled ? new Date() : null,
					...stampCreate(actorId),
				})
				.returning({ id: locationPaymentMethodsTable.id })

			if (!inserted)
				throw new InternalServerError(
					'Location payment method creation failed',
					'LOCATION_PAYMENT_METHOD_CREATE_FAILED',
				)

			return inserted
		})
	}

	async update(
		id: number,
		data: Partial<LocationPaymentMethodUpdateDto>,
		actorId: number,
	): Promise<{ id: number }> {
		return record('LocationPaymentMethodRepo.update', async () => {
			const existing = await this.getById(id)
			if (!existing)
				throw new NotFoundError(
					`Location payment method with ID ${id} not found`,
					'LOCATION_PAYMENT_METHOD_NOT_FOUND',
				)

			// If setting as default, unset other defaults for this location
			if (data.isDefault === true && !existing.isDefault) {
				await this.db
					.update(locationPaymentMethodsTable)
					.set({ isDefault: false })
					.where(
						and(
							eq(locationPaymentMethodsTable.locationId, existing.locationId),
							eq(locationPaymentMethodsTable.isDefault, true),
						),
					)
			}

			// Update enabledAt if toggling isEnabled
			const updateData = { ...data }
			if (data.isEnabled !== undefined && data.isEnabled !== existing.isEnabled) {
				updateData.enabledAt = data.isEnabled ? new Date() : null
			}

			await this.db
				.update(locationPaymentMethodsTable)
				.set({ ...updateData, ...stampUpdate(actorId) })
				.where(eq(locationPaymentMethodsTable.id, id))

			return { id }
		})
	}

	async delete(id: number): Promise<{ id: number }> {
		return record('LocationPaymentMethodRepo.delete', async () => {
			const existing = await this.getById(id)
			if (!existing)
				throw new NotFoundError(
					`Location payment method with ID ${id} not found`,
					'LOCATION_PAYMENT_METHOD_NOT_FOUND',
				)

			await this.db
				.delete(locationPaymentMethodsTable)
				.where(eq(locationPaymentMethodsTable.id, id))

			return { id }
		})
	}

	async deleteByLocation(locationId: number): Promise<number> {
		return record('LocationPaymentMethodRepo.deleteByLocation', async () => {
			const result = await this.db
				.delete(locationPaymentMethodsTable)
				.where(eq(locationPaymentMethodsTable.locationId, locationId))
				.returning({ id: locationPaymentMethodsTable.id })

			return result.length
		})
	}
}
